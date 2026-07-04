/**
 * LoginScreen — 登录页面
 * 极简深色背景 + 大字标题 + Apple 登录优先
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { theme } from '../theme';
import { signInWithApple, signInWithEmail } from '../services/auth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithApple();
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else if (result.error && result.error !== '用户取消了登录') {
      Alert.alert('登录失败', result.error);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('提示', '请输入邮箱和密码');
      return;
    }

    setIsLoading(true);
    const result = await signInWithEmail(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      Alert.alert('登录失败', result.error || '请检查邮箱和密码');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo 和标题区域 */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.appName}>Cephy</Text>
          <Text style={styles.tagline}>Your Smart Migraine Companion</Text>
        </View>

        {/* 登录表单 */}
        <View style={styles.form}>
          {/* Sign in with Apple 按钮（主要） */}
          <TouchableOpacity
            style={[styles.appleButton, isLoading && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityLabel="使用 Apple 登录"
            accessibilityRole="button"
          >
            <Text style={styles.appleButtonIcon}></Text>
            <Text style={styles.appleButtonText}>
              {isLoading ? '登录中...' : 'Sign in with Apple'}
            </Text>
          </TouchableOpacity>

          {/* 分隔线 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 邮箱登录 */}
          {showEmailForm ? (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.emailLoginButton, isLoading && styles.buttonDisabled]}
                onPress={handleEmailSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.emailLoginText}>
                  {isLoading ? '登录中...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setShowEmailForm(false)}
                disabled={isLoading}
              >
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emailLink}
              onPress={() => setShowEmailForm(true)}
              disabled={isLoading}
            >
              <Text style={styles.emailLinkText}>Sign in with Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 底部法律文字 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text> and{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadow.button,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.colors.white,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 4,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    ...theme.shadow.button,
  },
  appleButtonIcon: {
    fontSize: 24,
    color: theme.colors.textDark,
    marginRight: theme.spacing.sm,
  },
  appleButtonText: {
    fontSize: theme.fontSize.standard,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  emailForm: {
    gap: theme.spacing.md,
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailLoginButton: {
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.button,
  },
  emailLoginText: {
    fontSize: theme.fontSize.standard,
    fontWeight: '600',
    color: theme.colors.white,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backLinkText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
  },
  emailLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  emailLinkText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});
