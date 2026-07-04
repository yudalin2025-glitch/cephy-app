/**
 * HistoryScreen — 历史记录
 * 日历热力图 + 列表视图 + 筛选
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import AttackListItem from '../components/AttackListItem';
import type { AttackRecord, Severity } from '../types';

interface HistoryScreenProps {
  navigation: any;
}

/** 模拟历史数据 */
const MOCK_ATTACKS: AttackRecord[] = Array.from({ length: 60 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const severity = Math.max(1, Math.min(10, Math.round(Math.random() * 8 + 2))) as Severity;
  return {
    id: `mock-${i}`,
    timestamp: date.toISOString(),
    location: ['temple_left', 'front_right', 'entire_head', 'back_left', 'top'][
      Math.floor(Math.random() * 5)
    ] as AttackRecord['location'],
    severity,
    durationHours: Math.round(Math.random() * 10 + 1),
    symptoms: ['nausea', 'photophobia'],
    triggers: ['weather', 'stress'],
    source: i % 3 === 0 ? 'voice' : 'manual',
    synced: true,
  };
});

type ViewMode = 'calendar' | 'list';

/** 获取严重度对应的热力颜色 */
function getHeatColor(severity: number): string {
  if (severity === 0) return 'transparent';
  if (severity <= 3) return '#2ED57330';
  if (severity <= 5) return '#FFA50230';
  if (severity <= 7) return '#FFA50260';
  return '#FF475760';
}

function getHeatTextColor(severity: number): string {
  if (severity === 0) return theme.colors.textSecondary;
  if (severity <= 3) return theme.colors.riskLow;
  if (severity <= 5) return theme.colors.riskMedium;
  if (severity <= 7) return '#FF8C00';
  return theme.colors.riskHigh;
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [minSeverity, setMinSeverity] = useState<number>(0);

  // 按日期分组
  const attacksByDate = useMemo(() => {
    const map = new Map<string, AttackRecord[]>();
    MOCK_ATTACKS.forEach((attack) => {
      const key = attack.timestamp.split('T')[0];
      const existing = map.get(key) || [];
      existing.push(attack);
      map.set(key, existing);
    });
    return map;
  }, []);

  // 日历数据
  const calendarData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0=Sun

    const days: (number | null)[] = [];
    // 填充月初空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ];

  const changeMonth = (delta: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  // 筛选后的记录列表
  const filteredAttacks = useMemo(() => {
    const sorted = [...MOCK_ATTACKS].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return minSeverity > 0
      ? sorted.filter((a) => a.severity >= minSeverity)
      : sorted;
  }, [minSeverity]);

  const formatDateKey = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleAttackPress = (attack: AttackRecord) => {
    console.log('编辑记录:', attack.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 顶部标题 + 视图切换 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>历史记录</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'calendar' && styles.toggleActive,
              ]}
              onPress={() => setViewMode('calendar')}
              accessibilityLabel="日历视图"
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'calendar' && styles.toggleTextActive,
                ]}
              >
                📅 日历
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'list' && styles.toggleActive,
              ]}
              onPress={() => setViewMode('list')}
              accessibilityLabel="列表视图"
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'list' && styles.toggleTextActive,
                ]}
              >
                📋 列表
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 日历视图 */}
        {viewMode === 'calendar' && (
          <View style={styles.calendarSection}>
            {/* 月份导航 */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={styles.monthNavButton}
                accessibilityLabel="上个月"
              >
                <Text style={styles.monthNavArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {selectedDate.getFullYear()}年 {monthNames[selectedDate.getMonth()]}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={styles.monthNavButton}
                accessibilityLabel="下个月"
              >
                <Text style={styles.monthNavArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* 星期头 */}
            <View style={styles.weekHeader}>
              {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
                <View key={w} style={styles.weekDay}>
                  <Text style={styles.weekDayText}>{w}</Text>
                </View>
              ))}
            </View>

            {/* 日期网格 */}
            <View style={styles.calendarGrid}>
              {calendarData.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.calendarCell} />;
                }

                const dateKey = formatDateKey(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  day,
                );
                const dayAttacks = attacksByDate.get(dateKey) || [];
                const maxSeverity = dayAttacks.length
                  ? Math.max(...dayAttacks.map((a) => a.severity))
                  : 0;
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === selectedDate.getMonth() &&
                  new Date().getFullYear() === selectedDate.getFullYear();

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.calendarCell,
                      isToday && styles.calendarCellToday,
                    ]}
                    onPress={() => console.log('查看日期:', dateKey)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.calendarDayBg,
                        { backgroundColor: getHeatColor(maxSeverity) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          { color: getHeatTextColor(maxSeverity) },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    {dayAttacks.length > 0 && (
                      <Text style={styles.calendarDot}>•</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 图例 */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2ED57330' }]} />
                <Text style={styles.legendText}>轻度 1-3</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FFA50250' }]} />
                <Text style={styles.legendText}>中度 4-6</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF475760' }]} />
                <Text style={styles.legendText}>重度 7-10</Text>
              </View>
            </View>
          </View>
        )}

        {/* 列表视图 */}
        {viewMode === 'list' && (
          <View style={styles.listSection}>
            {/* 筛选器 */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>最低严重度:</Text>
              {[0, 3, 5, 7].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.filterChip,
                    minSeverity === val && styles.filterChipActive,
                  ]}
                  onPress={() => setMinSeverity(val)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      minSeverity === val && styles.filterChipTextActive,
                    ]}
                  >
                    {val === 0 ? '全部' : `${val}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              data={filteredAttacks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AttackListItem attack={item} onPress={handleAttackPress} />
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>暂无记录</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: '700',
    color: theme.colors.text,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  toggleText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  // Calendar Styles
  calendarSection: {
    marginBottom: theme.spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  monthNavButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavArrow: {
    fontSize: theme.fontSize.subtitle,
    color: theme.colors.text,
  },
  monthTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  weekDayText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarCellToday: {
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  calendarDayBg: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: theme.fontSize.small,
    fontWeight: '600',
  },
  calendarDot: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    color: theme.colors.primary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
  },
  // List Styles
  listSection: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
  },
});
