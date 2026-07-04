/**
 * SeveritySlider — 严重度滑条
 * 1-10 滑动选择，颜色渐变绿→黄→红
 */

import React from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { theme } from '../theme';
import type { Severity } from '../types';

interface SeveritySliderProps {
  /** 当前值 1-10 */
  value: Severity;
  /** 值变化回调 */
  onChange: (value: Severity) => void;
}

/** 严重度对应的颜色 */
const SEVERITY_COLORS: Record<number, string> = {
  1: '#2ED573',
  2: '#44D66A',
  3: '#5AD762',
  4: '#7FCD52',
  5: '#FFA502',
  6: '#FF8C00',
  7: '#FF6B35',
  8: '#FF4757',
  9: '#E8334A',
  10: '#D61F3D',
};

/** 严重度文字标签 */
const SEVERITY_LABELS: Record<number, string> = {
  1: '轻微',
  2: '轻度',
  3: '较轻',
  4: '中轻度',
  5: '中度',
  6: '中重度',
  7: '重度',
  8: '严重',
  9: '剧烈',
  10: '无法忍受',
};

export default function SeveritySlider({
  value,
  onChange,
}: SeveritySliderProps) {
  const [barWidth, setBarWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const barRef = React.useRef<View>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const calculateValue = (x: number): Severity => {
    if (barWidth <= 0) return value;
    const ratio = Math.max(0, Math.min(1, x / barWidth));
    const rawValue = Math.round(ratio * 9) + 1; // 1-10
    return Math.max(1, Math.min(10, rawValue)) as Severity;
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          const newValue = calculateValue(evt.nativeEvent.locationX);
          onChange(newValue);
        },
        onPanResponderMove: (evt) => {
          const newValue = calculateValue(evt.nativeEvent.locationX);
          onChange(newValue);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [barWidth, onChange, value],
  );

  const currentColor = SEVERITY_COLORS[value] || theme.colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>疼痛严重度</Text>
        <View style={[styles.valueBadge, { backgroundColor: currentColor + '25' }]}>
          <Text style={[styles.valueText, { color: currentColor }]}>
            {value}/10
          </Text>
        </View>
      </View>

      {/* 等级文字 */}
      <Text style={[styles.levelLabel, { color: currentColor }]}>
        {SEVERITY_LABELS[value]}
      </Text>

      {/* 滑条轨道 */}
      <View
        ref={barRef}
        style={styles.trackContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* 背景渐变条 */}
        <View style={styles.track}>
          {/* 分段色块 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <View
              key={i}
              style={[
                styles.trackSegment,
                { backgroundColor: SEVERITY_COLORS[i] },
                i <= value && styles.trackSegmentActive,
              ]}
            />
          ))}
        </View>

        {/* 滑块 */}
        <View
          style={[
            styles.thumb,
            {
              left: barWidth > 0
                ? ((value - 1) / 9) * barWidth - 14
                : 0,
              backgroundColor: currentColor,
              opacity: isDragging ? 1 : 0.8,
            },
          ]}
        />
      </View>

      {/* 底部文字标签 */}
      <View style={styles.labels}>
        <Text style={styles.labelText}>1 轻微</Text>
        <Text style={styles.labelText}>5 中度</Text>
        <Text style={styles.labelText}>10 剧烈</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    fontWeight: '600',
  },
  valueBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  valueText: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
  },
  levelLabel: {
    fontSize: theme.fontSize.subtitle,
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  trackContainer: {
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  trackSegment: {
    flex: 1,
    opacity: 0.3,
  },
  trackSegmentActive: {
    opacity: 1,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: theme.colors.background,
    ...theme.shadow.card,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  labelText: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
  },
});
