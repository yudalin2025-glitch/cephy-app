/**
 * Cephy 主题配置
 * 暗色模式优先、偏头痛患者友好的视觉系统
 */

export const theme = {
  // 基础色
  colors: {
    /** 深色背景 */
    background: '#1A1A2E',
    /** 卡片背景 */
    card: '#16213E',
    /** 主色调（紫色） */
    primary: '#6C63FF',
    /** 主色调浅色变体 */
    primaryLight: '#8B83FF',
    /** 主色调暗色变体 */
    primaryDark: '#4A43CC',
    /** 主文字颜色（浅灰） */
    text: '#E0E0E0',
    /** 辅助文字颜色 */
    textSecondary: '#9E9E9E',
    /** 深色文字（用于浅色背景上） */
    textDark: '#1A1A2E',
    /** 高风险红色 */
    riskHigh: '#FF4757',
    /** 中风险橙色 */
    riskMedium: '#FFA502',
    /** 低风险绿色 */
    riskLow: '#2ED573',
    /** 白色 */
    white: '#FFFFFF',
    /** 纯黑色（用于语音记录页） */
    black: '#000000',
    /** 边框色 */
    border: '#2A2A4A',
    /** 输入框背景 */
    inputBackground: '#1E1E3A',
    /** 分割线 */
    divider: '#2A2A4A',
  },

  /** 字体大小（大字、偏头痛患者友好） */
  fontSize: {
    /** 超大数字（风险评分用） */
    hero: 64,
    /** 大标题 */
    title: 28,
    /** 中等标题 */
    subtitle: 22,
    /** 正文字体 */
    body: 18,
    /** 标准文字 */
    standard: 16,
    /** 小文字 */
    small: 14,
    /** 辅助文字 */
    caption: 12,
  },

  /** 间距 */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /** 圆角 */
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },

  /** 触摸目标最小尺寸 */
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },

  /** 阴影（暗色模式下更明显） */
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    button: {
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
