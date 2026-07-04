/**
 * App.tsx — 入口文件
 * 导航容器 + 暗色主题 + 认证状态管理
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { theme } from './theme';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import { isLoggedIn } from './services/auth';

/** 自定义暗色导航主题 */
const CephyNavigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.riskHigh,
  },
};

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'loggedIn' | 'loggedOut'>(
    'loading',
  );

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const loggedIn = await isLoggedIn();
      setAuthState(loggedIn ? 'loggedIn' : 'loggedOut');
    } catch {
      setAuthState('loggedOut');
    }
  };

  const handleLoginSuccess = () => {
    setAuthState('loggedIn');
  };

  // 加载状态
  if (authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>C</Text>
        </View>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loadingSpinner}
        />
      </View>
    );
  }

  return (
    <NavigationContainer theme={CephyNavigationTheme}>
      <StatusBar style="light" />
      {authState === 'loggedOut' ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AppNavigator isLoggedIn={true} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  loadingLogoText: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.colors.white,
  },
  loadingSpinner: {
    marginTop: theme.spacing.lg,
  },
});
