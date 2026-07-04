/**
 * ReportScreen — 医生报告
 * 日期范围 + 摘要统计 + 趋势图(字符画) + 触发因素分布 + 生成PDF
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import type { Report, Trigger } from '../types';

interface ReportScreenProps {
  navigation: any;
}

/** 模拟报告数据 */
const MOCK_REPORT: Report = {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
  totalAttacks: 12,
  averageSeverity: 5.8,
  midasScore: 28,
  severityTrend: [3, 5, 2, 7, 4, 6, 5, 8, 3, 6, 4, 7, 5, 3, 6, 8, 4, 5, 7, 6, 3, 5, 4, 7, 6, 5, 8, 4, 6, 5],
  triggerDistribution: [
    { trigger: 'weather', count: 8 },
    { trigger: 'stress', count: 6 },
    { trigger: 'sleep', count: 5 },
    { trigger: 'hormones', count: 3 },
    { trigger: 'food', count: 2 },
    { trigger: 'caffeine', count: 2 },
    { trigger: 'light', count: 2 },
    { trigger: 'dehydration', count: 1 },
  ],
};

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

/** MIDAS 评分等级 */
function getMidasLevel(score: number): { label: string; color: string } {
  if (score <= 5) return { label: '轻度残疾', color: theme.colors.riskLow };
  if (score <= 10) return { label: '中度残疾', color: theme.colors.riskMedium };
  if (score <= 20) return { label: '重度残疾', color: '#FF6B35' };
  return { label: '极重度残疾', color: theme.colors.riskHigh };
}

export default function ReportScreen({ navigation }: ReportScreenProps) {
  const [report] = useState<Report>(MOCK_REPORT);
  const [dateRange, setDateRange] = useState<string>('30天');

  const midasLevel = getMidasLevel(report.midasScore);

  /** 将严重度趋势渲染为字符画 */
  const renderAsciiChart = (data: number[]): string[] => {
    const maxVal = Math.max(...data, 1);
    const height = 5;
    const lines: string[] = [];

    // 将数据分段压缩，最多显示20个点
    const step = Math.max(1, Math.floor(data.length / 20));
    const compressed = data.filter((_, i) => i % step === 0).slice(0, 20);

    for (let row = height; row >= 1; row--) {
      const threshold = (maxVal / height) * row;
      const line = compressed
        .map((val) => {
          if (val >= threshold) {
            // 根据严重度选择字符
            if (val >= 7) return '█';
            if (val >= 4) return '▓';
            return '▒';
          }
          return '·';
        })
        .join('');
      lines.push(line);
    }

    return lines;
  };

  const chartLines = useMemo(
    () => renderAsciiChart(report.severityTrend),
    [report.severityTrend],
  );

  const handleGeneratePDF = () => {
    Alert.alert('报告生成', 'PDF 报告已生成，保存到文件系统', [
      { text: '好的' },
    ]);
  };

  /** 日期范围选择 */
  const dateRanges = ['7天', '30天', '90天', '180天'];
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    // 实际应用中重新请求数据
  };

  const maxTriggerCount = Math.max(...report.triggerDistribution.map((t) => t.count), 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部标题 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>医生报告</Text>
          <Text style={styles.headerSubtitle}>
            可用于就诊时提供给医生参考
          </Text>
        </View>

        {/* 日期范围选择 */}
        <View style={styles.dateRow}>
          {dateRanges.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.dateChip,
                dateRange === range && styles.dateChipActive,
              ]}
              onPress={() => handleDateRangeChange(range)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  dateRange === range && styles.dateChipTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 摘要卡片 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>摘要统计</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{report.totalAttacks}</Text>
              <Text style={styles.summaryLabel}>总发作次数</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{report.averageSeverity}</Text>
              <Text style={styles.summaryLabel}>平均严重度</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryNumber, { color: midasLevel.color }]}
              >
                {report.midasScore}
              </Text>
              <Text style={styles.summaryLabel}>MIDAS 评分</Text>
            </View>
          </View>
          <View
            style={[styles.midasBadge, { backgroundColor: midasLevel.color + '25' }]}
          >
            <Text style={[styles.midasText, { color: midasLevel.color }]}>
              {midasLevel.label}
            </Text>
          </View>
        </View>

        {/* 频率趋势图 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>频率趋势</Text>
          <Text style={styles.chartSubtitle}>
            {new Date(report.startDate).toLocaleDateString('zh-CN')} -{' '}
            {new Date(report.endDate).toLocaleDateString('zh-CN')}
          </Text>
          <View style={styles.asciiChart}>
            <View style={styles.chartYAxis}>
              <Text style={styles.chartAxisLabel}>严重</Text>
              <Text style={styles.chartAxisLabel}>轻</Text>
            </View>
            <View style={styles.chartContent}>
              {chartLines.map((line, i) => (
                <Text key={i} style={styles.chartLine}>
                  {line}
                </Text>
              ))}
              {/* X轴 */}
              <View style={styles.chartXAxis}>
                <Text style={styles.chartAxisLabel}>开始</Text>
                <Text style={styles.chartAxisLabel}>结束</Text>
              </View>
            </View>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <Text style={styles.legendChar}>▒</Text>
              <Text style={styles.legendText}>轻度 1-3</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendChar}>▓</Text>
              <Text style={styles.legendText}>中度 4-6</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendChar}>█</Text>
              <Text style={styles.legendText}>重度 7-10</Text>
            </View>
          </View>
        </View>

        {/* 触发因素分布 */}
        <View style={styles.triggerCard}>
          <Text style={styles.triggerTitle}>触发因素分布</Text>
          {report.triggerDistribution
            .sort((a, b) => b.count - a.count)
            .map((item) => {
              const barWidth = (item.count / maxTriggerCount) * 100;
              return (
                <View key={item.trigger} style={styles.triggerRow}>
                  <Text style={styles.triggerLabel}>
                    {TRIGGER_LABELS[item.trigger] || item.trigger}
                  </Text>
                  <View style={styles.triggerBarContainer}>
                    <View
                      style={[
                        styles.triggerBar,
                        { width: `${barWidth}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.triggerCount}>{item.count}</Text>
                </View>
              );
            })}
        </View>

        {/* 生成 PDF 按钮 */}
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={handleGeneratePDF}
          activeOpacity={0.8}
          accessibilityLabel="生成报告 PDF"
          accessibilityRole="button"
        >
          <Text style={styles.pdfButtonIcon}>📄</Text>
          <Text style={styles.pdfButtonText}>生成报告 PDF</Text>
        </TouchableOpacity>

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            此报告仅供医疗参考，不能替代专业医疗诊断。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  dateChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  dateChipActive: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
  },
  dateChipText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  dateChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  summaryTitle: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.divider,
  },
  midasBadge: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  midasText: {
    fontSize: theme.fontSize.standard,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  chartTitle: {
    fontSize: theme.fontSize.standard,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  chartSubtitle: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  asciiChart: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    paddingRight: theme.spacing.sm,
    paddingVertical: 2,
  },
  chartAxisLabel: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
  },
  chartContent: {
    flex: 1,
  },
  chartLine: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.colors.text,
    lineHeight: 14,
    letterSpacing: 0,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendChar: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
  },
  legendText: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
  },
  triggerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  triggerTitle: {
    fontSize: theme.fontSize.standard,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  triggerLabel: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    width: 60,
  },
  triggerBarContainer: {
    flex: 1,
    height: 22,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 11,
    marginHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  triggerBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 11,
    minWidth: 4,
  },
  triggerCount: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  pdfButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadow.button,
  },
  pdfButtonIcon: {
    fontSize: 22,
    marginRight: theme.spacing.sm,
  },
  pdfButtonText: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  footerText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
