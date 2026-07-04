/**
 * Cephy 认证服务
 * 管理 Apple 登录、Token 存储和自动刷新
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { AppleAuthCredential, AuthTokens } from '../types';
import { login, loginWithApple } from './api';

// ==================== 存储键名 ====================

const KEYS = {
  ACCESS_TOKEN: '@cephy:accessToken',
  REFRESH_TOKEN: '@cephy:refreshToken',
  TOKEN_EXPIRES: '@cephy:tokenExpires',
  USER_ID: '@cephy:userId',
  USER_EMAIL: '@cephy:userEmail',
  APPLE_USER: '@cephy:appleUser',
} as const;

// ==================== Token 管理 ====================

/** 保存认证 token */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS_TOKEN, tokens.accessToken],
    [KEYS.REFRESH_TOKEN, tokens.refreshToken],
    [KEYS.TOKEN_EXPIRES, tokens.expiresAt.toString()],
  ]);
}

/** 读取 access token */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

/** 清除所有认证数据 */
export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.ACCESS_TOKEN,
    KEYS.REFRESH_TOKEN,
    KEYS.TOKEN_EXPIRES,
    KEYS.USER_ID,
    KEYS.USER_EMAIL,
  ]);
}

/** 检查是否已登录（token 是否存在且未过期） */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const [token, expiresAtStr] = await AsyncStorage.multiGet([
      KEYS.ACCESS_TOKEN,
      KEYS.TOKEN_EXPIRES,
    ]);

    if (!token[1]) return false;

    if (expiresAtStr[1]) {
      const expiresAt = parseInt(expiresAtStr[1], 10);
      if (Date.now() >= expiresAt) {
        // Token 已过期，尝试刷新
        return await refreshTokens();
      }
    }

    return true;
  } catch {
    return false;
  }
}

/** 自动刷新 token */
async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    const response = await fetch(
      `${require('./api').API_BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
    );

    if (!response.ok) return false;

    const result = await response.json();
    if (result.ok && result.data) {
      await saveTokens(result.data);
      return true;
    }

    await clearAuth();
    return false;
  } catch {
    await clearAuth();
    return false;
  }
}

// ==================== Apple 登录 ====================

/**
 * 执行 Apple 登录
 * 返回认证后的 token
 */
export async function signInWithApple(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 检查 Apple 登录是否可用
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Apple 登录在当前设备上不可用',
      };
    }

    // 发起 Apple 登录请求
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // 构建 Apple 凭证
    const appleCredential: AppleAuthCredential = {
      user: credential.user,
      email: credential.email ?? undefined,
      fullName: credential.fullName
        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
        : undefined,
      identityToken: credential.identityToken ?? '',
      authorizationCode: credential.authorizationCode ?? '',
    };

    if (!appleCredential.identityToken) {
      return {
        success: false,
        error: 'Apple 登录失败：未获取到 identity token',
      };
    }

    // 将 Apple 凭证发送到后端验证
    const result = await loginWithApple(
      appleCredential.identityToken,
      appleCredential.authorizationCode,
    );

    if (result.ok && result.data) {
      // 保存用户信息
      await AsyncStorage.setItem(KEYS.APPLE_USER, appleCredential.user);
      if (appleCredential.email) {
        await AsyncStorage.setItem(KEYS.USER_EMAIL, appleCredential.email);
      }
      return { success: true };
    }

    return {
      success: false,
      error: result.error ?? '登录验证失败',
    };
  } catch (error: unknown) {
    // 用户取消登录不算错误
    if (error instanceof Error && error.message.includes('cancel')) {
      return { success: false, error: '用户取消了登录' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Apple 登录失败',
    };
  }
}

// ==================== 邮箱密码登录 ====================

/**
 * 使用邮箱和密码登录
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await login({ email, password });

    if (result.ok && result.data) {
      await AsyncStorage.setItem(KEYS.USER_EMAIL, email);
      return { success: true };
    }

    return {
      success: false,
      error: result.error ?? '登录失败，请检查邮箱和密码',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '登录失败',
    };
  }
}

/**
 * 退出登录
 */
export async function signOut(): Promise<void> {
  await clearAuth();
}
