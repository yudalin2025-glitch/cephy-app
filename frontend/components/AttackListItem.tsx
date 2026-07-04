/**
 * AttackListItem — 偏头痛发作记录列表项
 * 显示时间、严重度条、疼痛位置
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import type { AttackRecord, Severity } from '../types';

interface AttackListItemProps {
  /** 攻击记录数据 */
  attack: AttackRecord;
  /** 点击事件回调 */
  onPress?: (attack: AttackRecord) => void;
}

/** 位置图标映射 */
const LOCATION_ICONS: Record<string, string> = {
  front_left: '🌡️',
  front_right: '🌡️',
  front_center: '🌡️',
  temple_left: '🫀',
  temple_right: '🫀',
  behind_eye_left: '👁️',
  behind_eye_right: '👁️',
  top: '⬆️',
  side_left: '📎',
  side_right: '📎',
  back_left: '🔙',
  back_right: '🔙',
  back_lower_left: '🔙',
  back_lower_right: '🔙',
  neck: '🦴',
  entire_head: '🔴',
};

/** 位置中文名映射 */
const LOCATION_LABELS: Record<string, string> = {
  front_left: '前额偏左',
  front_right: '前额偏右',
  front_center: '前额正中',
  temple_left: '左太阳穴',
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
  entire_head: '整个头部',
};

/**
 * 格式化日期时间（本地化友好）
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (isToday) {
    return `今天 ${hours}:${minutes}`;
  }

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * 获取严重度对应的颜色
 */
function getSeverityColor(severity: Severity): string {
  if (severity <= 3) return theme.colors.riskLow;
  if (severity <= 6) return theme.colors.riskMedium;
  return theme.colors.riskHigh;
}

/**
 * 渲染严重度圆点条
 */
function SeverityDots({ severity }: { severity: Severity }) {
  const dots = [];
  for (let i = 1; i <= 10; i++) {
    const filled = i <= severity;
    dots.push(
      <View
        key={i}
        style={[
          styles.dot,
          {
            backgroundColor: filled
              ? getSeverityColor(severity)
              : theme.colors.divider,
          },
        ]}
      />,
    );
  }
  return <View style={styles.dotsRow}>{dots}</View>;
}

export default function AttackListItem({
  attack,
  onPress,
}: AttackListItemProps) {
  const icon = LOCATION_ICONS[attack.location] || '📍';
  const locationLabel = LOCATION_LABELS[attack.location] || attack.location;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(attack)}
      activeOpacity={0.7}
      accessibilityLabel={`${formatTime(attack.timestamp)}, 严重度 ${attack.severity} 级, ${locationLabel}`}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <Text style={styles.time}>{formatTime(attack.timestamp)}</Text>
        <Text style={styles.severityLabel}>严重度 {attack.severity}</Text>
      </View>

      <SeverityDots severity={attack.severity} />

      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>{icon}</Text>
        <Text style={styles.locationText}>{locationLabel}</Text>
        {attack.durationHours && (
          <Text style={styles.duration}>
            ⏱ {attack.durationHours}h
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  time: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  severityLabel: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: theme.fontSize.standard,
    marginRight: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    flex: 1,
  },
  duration: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
});
