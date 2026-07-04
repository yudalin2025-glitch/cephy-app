/**
 * HomeScreen — 首页仪表盘
 * 顶部风险评分 + 月统计 + 操作按钮 + 最近记录
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import RiskCard from '../components/RiskCard';
import AttackListItem from '../components/AttackListItem';
import type { AttackRecord, MonthlyStats, RiskScore } from '../types';

interface HomeScreenProps {
  navigation: any;
}

/** 模拟风险数据（实际应从 API 获取） */
const MOCK_RISK: RiskScore = {
  score: 65,
  reason: '气压下降 12hPa，今日风力较强',
  date: new Date().toISOString().split('T')[0],
};

/** 模拟月统计 */
const MOCK_STATS: MonthlyStats = {
  attacksCount: 8,
  averageSeverity: 5.5,
  changeFromLastMonth: -15,
};

/** 模拟最近记录 */
const MOCK_RECENT_ATTACKS: AttackRecord[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    location: 'temple_left',
    severity: 7,
    durationHours: 4,
    symptoms: ['nausea', 'photophobia'],
    triggers: ['weather'],
    source: 'manual',
    synced: true,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    location: 'front_right',
    severity: 4,
    durationHours: 2,
    symptoms: ['photophobia'],
    triggers: ['stress', 'sleep'],
    source: 'voice',
    synced: true,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    location: 'entire_head',
    severity: 8,
    durationHours: 6,
    symptoms: ['nausea', 'photophobia', 'phonophobia', 'vomiting'],
    triggers: ['weather', 'stress'],
    source: 'manual',
    synced: true,
  },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [risk] = useState<RiskScore>(MOCK_RISK);
  const [stats] = useState<MonthlyStats>(MOCK_STATS);
  const [recentAttacks] = useState<AttackRecord[]>(MOCK_RECENT_ATTACKS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 实际应用中在此刷新数据
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAttackPress = (attack: AttackRecord) => {
    // 导航到记录详情（实际应跳转编辑页）
    console.log('查看记录:', attack.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentAttacks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AttackListItem attack={item} onPress={handleAttackPress} />
        )}
        ListHeaderComponent={
          <View>
            {/* 顶部问候 */}
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>今天感觉怎么样？</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </Text>
            </View>

            {/* 风险评分卡片 */}
            <RiskCard score={risk.score} reason={risk.reason} />

            {/* 月统计卡片 */}
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>本月统计</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.attacksCount}</Text>
                  <Text style={styles.statLabel}>发作次数</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.averageSeverity}</Text>
                  <Text style={styles.statLabel}>平均严重度</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text
                    style={[
                      styles.statNumber,
                      {
                        color:
                          stats.changeFromLastMonth < 0
                            ? theme.colors.riskLow
                            : theme.colors.riskHigh,
                      },
                    ]}
                  >
                    {stats.changeFromLastMonth > 0 ? '+' : ''}
                    {stats.changeFromLastMonth}%
                  </Text>
                  <Text style={styles.statLabel}>较上月</Text>
                </View>
              </View>
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('VoiceRecord')}
                activeOpacity={0.8}
                accessibilityLabel="语音记录"
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>🎤</Text>
                <Text style={styles.actionText}>语音记录</Text>
                <Text style={styles.actionHint}>说出发作情况</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => navigation.navigate('ManualRecord')}
                activeOpacity={0.8}
                accessibilityLabel="手动记录"
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionText}>手动记录</Text>
                <Text style={styles.actionHint}>详细填写</Text>
              </TouchableOpacity>
            </View>

            {/* 最近记录标题 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近记录</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('History')}
                accessibilityLabel="查看全部记录"
              >
                <Text style={styles.seeAllText}>查看全部 →</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📓</Text>
            <Text style={styles.emptyText}>还没有记录</Text>
            <Text style={styles.emptyHint}>点击上方按钮开始记录</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  greeting: {
    marginBottom: theme.spacing.lg,
  },
  greetingText: {
    fontSize: theme.fontSize.title,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  statsTitle: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.subtitle,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.divider,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    ...theme.shadow.button,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.fontSize.standard,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionHint: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptyHint: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
});
