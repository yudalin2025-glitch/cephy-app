/**
 * Cephy API 服务
 * 处理所有后端接口调用、认证 token 管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ApiResponse,
  AttackRecord,
  AuthTokens,
  LoginParams,
  MonthlyStats,
  Report,
  RiskScore,
} from '../types';

/** API 基础 URL，iOS 模拟器用 localhost，真机需替换为实际域名 */
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.cephy.app/api/v1';

/** AsyncStorage 存储键名 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@cephy:accessToken',
  REFRESH_TOKEN: '@cephy:refreshToken',
  TOKEN_EXPIRES: '@cephy:tokenExpires',
} as const;

/** 通用请求头 */
async function getHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // 读取失败则不带 token
  }

  return headers;
}

/** 检查 token 是否过期并尝试刷新 */
async function ensureValidToken(): Promise<boolean> {
  try {
    const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);
    if (!expiresAtStr) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    // 提前 5 分钟刷新
    if (Date.now() < expiresAt - 5 * 60 * 1000) {
      return true; // token 仍然有效
    }

    // token 即将过期，尝试刷新
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const result: ApiResponse<AuthTokens> = await response.json();
    if (result.ok && result.data) {
      await saveTokens(result.data);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/** 保存 token 到本地存储 */
async function saveTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
    [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken],
    [STORAGE_KEYS.TOKEN_EXPIRES, tokens.expiresAt.toString()],
  ]);
}

/** 清除本地存储的 token */
async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRES,
  ]);
}

/** 通用 API 请求封装 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    await ensureValidToken();
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    const data: ApiResponse<T> = await response.json();

    // 401 未授权，清除 token
    if (response.status === 401) {
      await clearTokens();
    }

    return data;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

// ==================== 公开 API 函数 ====================

/**
 * 使用邮箱密码登录
 */
export async function login(params: LoginParams): Promise<ApiResponse<AuthTokens>> {
  const result = await apiRequest<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (result.ok && result.data) {
    await saveTokens(result.data);
  }

  return result;
}

/**
 * 使用 Apple 登录凭证登录
 */
export async function loginWithApple(
  identityToken: string,
  authorizationCode: string,
): Promise<ApiResponse<AuthTokens>> {
  const result = await apiRequest<AuthTokens>('/auth/apple', {
    method: 'POST',
    body: JSON.stringify({ identityToken, authorizationCode }),
  });

  if (result.ok && result.data) {
    await saveTokens(result.data);
  }

  return result;
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  await clearTokens();
}

/**
 * 获取攻击记录列表（分页）
 * @param page 页码（从1开始）
 * @param days 往前查多少天
 */
export async function getAttacks(
  page: number = 1,
  days: number = 30,
): Promise<ApiResponse<AttackRecord[]>> {
  return apiRequest<AttackRecord[]>(
    `/attacks?page=${page}&days=${days}`,
  );
}

/**
 * 创建新的攻击记录
 */
export async function createAttack(
  data: Omit<AttackRecord, 'id' | 'synced'>,
): Promise<ApiResponse<AttackRecord>> {
  return apiRequest<AttackRecord>('/attacks', {
    method: 'POST',
    body: JSON.stringify({ ...data, synced: false }),
  });
}

/**
 * 更新攻击记录
 */
export async function updateAttack(
  id: string,
  data: Partial<AttackRecord>,
): Promise<ApiResponse<AttackRecord>> {
  return apiRequest<AttackRecord>(`/attacks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * 删除攻击记录
 */
export async function deleteAttack(id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/attacks/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 上传语音文件用于 AI 分析
 */
export async function uploadVoice(
  audioFileUri: string,
): Promise<ApiResponse<Omit<AttackRecord, 'id' | 'synced'>>> {
  // 使用 FormData 上传文件
  const formData = new FormData();
  formData.append('audio', {
    uri: audioFileUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);

  await ensureValidToken();
  const headers = await getHeaders();
  // 去掉 Content-Type，让 fetch 自动设置 multipart boundary
  delete headers['Content-Type'];

  try {
    const response = await fetch(`${API_BASE_URL}/attacks/voice`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result: ApiResponse<Omit<AttackRecord, 'id' | 'synced'>> =
      await response.json();
    return result;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '语音上传失败',
    };
  }
}

/**
 * 获取天气数据
 */
export async function getWeather(): Promise<
  ApiResponse<{
    temperature: number;
    pressure: number;
    humidity: number;
    description: string;
  }>
> {
  return apiRequest('/weather');
}

/**
 * 获取今日风险评分
 */
export async function getRiskToday(): Promise<ApiResponse<RiskScore>> {
  return apiRequest<RiskScore>('/risk/today');
}

/**
 * 获取月统计
 */
export async function getMonthlyStats(): Promise<ApiResponse<MonthlyStats>> {
  return apiRequest<MonthlyStats>('/stats/monthly');
}

/**
 * 生成医生报告
 */
export async function generateReport(
  startDate: string,
  endDate: string,
): Promise<ApiResponse<Report>> {
  return apiRequest<Report>(
    `/reports?startDate=${startDate}&endDate=${endDate}`,
  );
}

/**
 * 获取订阅状态
 */
export async function getSubscriptionStatus(): Promise<
  ApiResponse<{
    active: boolean;
    plan: 'free' | 'premium' | 'family';
    expiresAt: string | null;
  }>
> {
  return apiRequest('/subscription');
}

export { API_BASE_URL, clearTokens, saveTokens };
