/**
 * Cephy 类型定义
 * 偏头痛追踪应用的 TypeScript 类型
 */

/** 疼痛位置 — 头部16区枚举 */
export type PainLocation =
  | 'front_left'
  | 'front_right'
  | 'front_center'
  | 'temple_left'
  | 'temple_right'
  | 'behind_eye_left'
  | 'behind_eye_right'
  | 'top'
  | 'side_left'
  | 'side_right'
  | 'back_left'
  | 'back_right'
  | 'back_lower_left'
  | 'back_lower_right'
  | 'neck'
  | 'entire_head';

export type Symptom =
  | 'nausea'
  | 'photophobia'
  | 'phonophobia'
  | 'dizziness'
  | 'vomiting'
  | 'aura_visual'
  | 'aura_sensory'
  | 'numbness'
  | 'fatigue';

export type Trigger =
  | 'weather'
  | 'stress'
  | 'sleep'
  | 'hormones'
  | 'food'
  | 'caffeine'
  | 'alcohol'
  | 'exercise'
  | 'light'
  | 'noise'
  | 'skipped_meal'
  | 'dehydration'
  | 'medication'
  | 'other';

export type Severity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** 偏头痛攻击记录 */
export interface AttackRecord {
  id: string;
  /** ISO 时间戳 */
  timestamp: string;
  /** 疼痛位置 */
  location: PainLocation;
  /** 严重度 1-10 */
  severity: Severity;
  /** 持续时间（小时） */
  durationHours?: number;
  /** 症状列表 */
  symptoms: Symptom[];
  /** 触发因素列表 */
  triggers: Trigger[];
  /** 自定义备注 */
  notes?: string;
  /** 记录来源：voice/manual */
  source: 'voice' | 'manual';
  /** 数据同步状态 */
  synced: boolean;
}

/** 日风险评分 */
export interface RiskScore {
  score: number;   // 0-100
  reason: string;
  date: string;
}

/** 医生报告 */
export interface Report {
  startDate: string;
  endDate: string;
  totalAttacks: number;
  averageSeverity: number;
  midasScore: number;
  severityTrend: number[];
  triggerDistribution: { trigger: Trigger; count: number }[];
}

/** 月统计摘要 */
export interface MonthlyStats {
  attacksCount: number;
  averageSeverity: number;
  changeFromLastMonth: number;  // 百分比变化（正=增加）
}

/** API 响应包装 */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** 登录参数 */
export interface LoginParams {
  email: string;
  password: string;
}

/** 认证 token 信息 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Apple 登录凭证 */
export interface AppleAuthCredential {
  user: string;
  email?: string;
  fullName?: string;
  identityToken: string;
  authorizationCode: string;
}
