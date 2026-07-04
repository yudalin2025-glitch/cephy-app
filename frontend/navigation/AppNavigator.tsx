/**
 * AppNavigator — 导航配置
 * 底部 Tab（Home, History, Report）+ Modal（VoiceRecord, ManualRecord）+ Stack（Login）
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportScreen from '../screens/ReportScreen';
import VoiceRecordScreen from '../screens/VoiceRecordScreen';
import ManualRecordScreen from '../screens/ManualRecordScreen';

// ==================== 导航类型定义 ====================

export type RootStackParamList = {
  MainTabs: undefined;
  VoiceRecord: undefined;
  ManualRecord: { parsedData?: any } | undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Report: undefined;
};

// ==================== 导航实例 ====================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ==================== Tab 图标组件（纯文字，无图库依赖） ====================

function TabIcon({
  label,
  focused,
}: {
  label: string;
  focused: boolean;
}) {
  const icons: Record<string, string> = {
    Home: '🏠',
    History: '📅',
    Report: '📊',
  };

  return (
    <View style={tabStyles.iconContainer}>
      <Text style={tabStyles.icon}>{icons[label] || '●'}</Text>
      <Text
        style={[
          tabStyles.label,
          focused && tabStyles.labelActive,
        ]}
      >
        {label === 'Home' ? '首页' : label === 'History' ? '历史' : '报告'}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

// ==================== 主 Tab 导航 ====================

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="History" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Report" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ==================== 根导航 ====================

export default function AppNavigator({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'none', // 零动画，偏头痛患者友好
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="VoiceRecord"
        component={VoiceRecordScreen}
        options={{
          presentation: 'modal',
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="ManualRecord"
        component={ManualRecordScreen}
        options={{
          presentation: 'modal',
          animation: 'none',
        }}
      />
    </Stack.Navigator>
  );
}
