/**
 * VoiceRecordScreen — 语音记录界面
 * 纯黑色背景（光敏感友好）、按住录音、AI 解析
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../theme';
import type { AttackRecord, Severity } from '../types';

interface VoiceRecordScreenProps {
  navigation: any;
}

type RecordState = 'idle' | 'listening' | 'analyzing' | 'complete' | 'error';

/** 模拟语音解析结果 */
const MOCK_PARSED_RESULT: Omit<AttackRecord, 'id' | 'synced'> = {
  timestamp: new Date().toISOString(),
  location: 'temple_left',
  severity: 6,
  durationHours: 3,
  symptoms: ['nausea', 'photophobia', 'phonophobia'],
  triggers: ['weather', 'stress'],
  source: 'voice',
};

/** 位置中文名映射 */
const LOCATION_LABELS: Record<string, string> = {
  temple_left: '左太阳穴',
  front_right: '前额偏右',
  entire_head: '整个头部',
  front_left: '前额偏左',
  front_center: '前额正中',
  temple_right: '右太阳穴',
  behind_eye_left: '左眼后',
  behind_eye_right: '右眼后',
  top: '头顶',
  side_left: '左侧头部',
  side_right: '右侧头部',
  back_left: '左后脑',
  back_right: '右后脑',
  back_lower_left: '左后下',
  back_lower_right: '右后下',
  neck: '脖子',
};

/** 症状中文名映射 */
const SYMPTOM_LABELS: Record<string, string> = {
  nausea: '恶心',
  photophobia: '畏光',
  phonophobia: '畏声',
  dizziness: '头晕',
  vomiting: '呕吐',
  aura_visual: '视觉先兆',
  aura_sensory: '感觉先兆',
  numbness: '麻木',
  fatigue: '疲劳',
};

/** 触发因素中文名映射 */
const TRIGGER_LABELS: Record<string, string> = {
  weather: '天气',
  stress: '压力',
  sleep: '睡眠',
  hormones: '激素',
  food: '食物',
  caffeine: '咖啡因',
  alcohol: '酒精',
  exercise: '运动',
  light: '光线',
  noise: '噪音',
  skipped_meal: '没吃饭',
  dehydration: '脱水',
  medication: '药物',
  other: '其他',
};

/** 严重度中文描述 */
function getSeverityLabel(s: Severity): string {
  if (s <= 3) return '轻度';
  if (s <= 6) return '中度';
  return '重度';
}

export default function VoiceRecordScreen({
  navigation,
}: VoiceRecordScreenProps) {
  const [state, setState] = useState<RecordState>('idle');
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [parsedResult, setParsedResult] = useState<Omit<AttackRecord, 'id' | 'synced'> | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const longPressThreshold = useRef(300);
  const hasCompleted = useRef(false);

  /** 模拟发送录音并获取 AI 解析结果 */
  const simulateRecord = () => {
    setState('listening');

    // 模拟录音 2 秒后开始分析
    setTimeout(() => {
      if (hasCompleted.current) return;
      setState('analyzing');

      // 模拟分析 1.5 秒后完成
      setTimeout(() => {
        if (hasCompleted.current) return;
        setState('complete');
        setParsedResult(MOCK_PARSED_RESULT);
      }, 1500);
    }, 2000);
  };

  /** 开始录音 */
  const handlePressIn = () => {
    setIsPressed(true);
    hasCompleted.current = false;

    const timer = setTimeout(() => {
      // 长按触发录音
      simulateRecord();
    }, longPressThreshold.current);

    setPressTimer(timer);
  };

  /** 松手完成录音 */
  const handlePressOut = () => {
    setIsPressed(false);

    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }

    // 如果还在 idle 状态（按的时间不够长），不变
    if (state === 'idle') {
      // 短暂提示要求长按
      setState('idle');
    }
  };

  /** 确认结果 */
  const handleConfirm = () => {
    Alert.alert('已记录', '发作记录已保存');
    navigation.goBack();
  };

  /** 进入修改模式 */
  const handleEdit = () => {
    // 实际应用中跳转到手动编辑页，携带解析数据
    navigation.navigate('ManualRecord', { parsedData: parsedResult });
  };

  /** 重新录音 */
  const handleRetry = () => {
    hasCompleted.current = true;
    setState('idle');
    setParsedResult(null);
  };

  /** 获取当前状态显示文字和图标 */
  const getStateDisplay = () => {
    switch (state) {
      case 'idle':
        return {
          icon: '🎤',
          title: '按住录音',
          subtitle: '描述你的偏头痛情况',
        };
      case 'listening':
        return {
          icon: '🔴',
          title: '正在听...',
          subtitle: '请描述你的症状',
        };
      case 'analyzing':
        return {
          icon: '🤖',
          title: '分析中...',
          subtitle: 'AI 正在解析你的描述',
        };
      case 'complete':
        return {
          icon: '✅',
          title: '已记录',
          subtitle: '解析完成，请确认',
        };
      case 'error':
        return {
          icon: '⚠️',
          title: '识别失败',
          subtitle: '请重试或手动记录',
        };
    }
  };

  const display = getStateDisplay();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 顶部关闭按钮 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="关闭"
          accessibilityRole="button"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* 状态指示 */}
        <View style={styles.statusSection}>
          <Text style={styles.stateIcon}>{display.icon}</Text>
          <Text style={styles.stateTitle}>{display.title}</Text>
          <Text style={styles.stateSubtitle}>{display.subtitle}</Text>
        </View>

        {/* 录音按钮 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isPressed && styles.recordButtonPressed,
              state === 'listening' && styles.recordButtonActive,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            accessibilityLabel="按住录音"
            accessibilityRole="button"
            accessibilityState={{ pressed: isPressed }}
          >
            <View style={styles.recordButtonInner}>
              <Text style={styles.recordIcon}>
                {state === 'listening' ? '⬤' : '🎤'}
              </Text>
            </View>
          </TouchableOpacity>
          {state === 'idle' && (
            <Text style={styles.hintText}>按住录音，松手完成</Text>
          )}
        </View>

        {/* 解析结果确认卡片 */}
        {state === 'complete' && parsedResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>AI 解析结果</Text>

            {/* 位置 */}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>疼痛位置</Text>
              <Text style={styles.resultValue}>
                {LOCATION_LABELS[parsedResult.location] || parsedResult.location}
              </Text>
            </View>

            {/* 严重度 */}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>严重程度</Text>
              <Text style={styles.resultValue}>
                {parsedResult.severity}/10 · {getSeverityLabel(parsedResult.severity)}
              </Text>
            </View>

            {/* 持续时间 */}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>持续时间</Text>
              <Text style={styles.resultValue}>
                {parsedResult.durationHours ?? '?'} 小时
              </Text>
            </View>

            {/* 症状 */}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>症状</Text>
              <View style={styles.tagRow}>
                {parsedResult.symptoms.map((s) => (
                  <View key={s} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {SYMPTOM_LABELS[s] || s}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 触发因素 */}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>触发因素</Text>
              <View style={styles.tagRow}>
                {parsedResult.triggers.map((t) => (
                  <View key={t} style={[styles.tag, styles.tagTrigger]}>
                    <Text style={[styles.tagText, styles.tagTriggerText]}>
                      {TRIGGER_LABELS[t] || t}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
                accessibilityLabel="确认结果正确"
                accessibilityRole="button"
              >
                <Text style={styles.confirmText}>✓ 正确</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.8}
                accessibilityLabel="修改结果"
                accessibilityRole="button"
              >
                <Text style={styles.editText}>✗ 修改</Text>
              </TouchableOpacity>
            </View>

            {/* 重录 */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>重新录音</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 错误状态 */}
        {state === 'error' && (
          <View style={styles.errorSection}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              accessibilityLabel="重试"
            >
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualFallbackButton}
              onPress={() => navigation.navigate('ManualRecord')}
            >
              <Text style={styles.manualFallbackText}>改用手动记录</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  closeText: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: '300',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.xl,
  },
  stateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  stateTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  stateSubtitle: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  recordButtonPressed: {
    backgroundColor: '#6C63FF30',
    transform: [{ scale: 1.05 }],
  },
  recordButtonActive: {
    borderColor: theme.colors.riskHigh,
    backgroundColor: '#FF475730',
  },
  recordButtonInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 40,
    color: theme.colors.white,
  },
  hintText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  resultCard: {
    backgroundColor: '#FFFFFF10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
  },
  resultTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF10',
  },
  resultLabel: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  resultValue: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  tagRow: {
    flex: 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  tag: {
    backgroundColor: theme.colors.primary + '25',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.primaryLight,
  },
  tagTrigger: {
    backgroundColor: '#FFA50220',
  },
  tagTriggerText: {
    color: theme.colors.riskMedium,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  confirmButton: {
    flex: 1,
    height: 52,
    backgroundColor: theme.colors.riskLow,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: theme.fontSize.standard,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  editButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF15',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  editText: {
    fontSize: theme.fontSize.standard,
    fontWeight: '600',
    color: theme.colors.text,
  },
  retryButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  retryText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  errorSection: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  manualFallbackButton: {
    height: 52,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  manualFallbackText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
