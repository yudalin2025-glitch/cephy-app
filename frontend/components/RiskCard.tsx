/**
 * RiskCard — 风险评分卡片组件
 * 大号数字显示今日偏头痛风险评分（0-100）
 * 根据不同风险等级显示不同背景色
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface RiskCardProps {
  /** 风险评分 0-100 */
  score: number;
  /** 风险原因说明 */
  reason: string;
}

/**
 * 根据评分返回对应的颜色和文字标签
 */
function getRiskLevel(score: number): {
  color: string;
  label: string;
  backgroundColor: string;
} {
  if (score >= 70) {
    return {
      color: theme.colors.riskHigh,
      label: '高风险',
      backgroundColor: '#FF475720',
    };
  }
  if (score >= 40) {
    return {
      color: theme.colors.riskMedium,
      label: '中等风险',
      backgroundColor: '#FFA50215',
    };
  }
  return {
    color: theme.colors.riskLow,
    label: '低风险',
    backgroundColor: '#2ED57315',
  };
}

export default function RiskCard({ score, reason }: RiskCardProps) {
  const level = getRiskLevel(score);

  return (
    <View style={[styles.card, { backgroundColor: level.backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>今日风险</Text>
        <View style={[styles.badge, { backgroundColor: level.color + '30' }]}>
          <Text style={[styles.badgeText, { color: level.color }]}>
            {level.label}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: level.color }]}>
          {score}
        </Text>
        <Text style={[styles.scoreUnit, { color: level.color }]}>
          /100
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.reasonRow}>
        <Text style={styles.reasonIcon}>🌤️</Text>
        <Text style={styles.reasonText}>{reason}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: theme.fontSize.small,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  score: {
    fontSize: theme.fontSize.hero,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scoreUnit: {
    fontSize: theme.fontSize.title,
    fontWeight: '300',
    marginLeft: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonIcon: {
    fontSize: theme.fontSize.standard,
    marginRight: theme.spacing.sm,
  },
  reasonText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 22,
  },
});
