/**
 * ManualRecordScreen — 手动记录界面
 * 选择疼痛位置、严重度、症状、触发因素、备注
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { theme } from '../theme';
import SeveritySlider from '../components/SeveritySlider';
import type { PainLocation, Severity, Symptom, Trigger } from '../types';

interface ManualRecordScreenProps {
  navigation: any;
  route?: any;
}

/** 头部 16 区位置定义 */
const PAIN_LOCATIONS: { key: PainLocation; label: string; row: number }[] = [
  { key: 'front_left', label: '前额偏左', row: 1 },
  { key: 'front_center', label: '前额正中', row: 1 },
  { key: 'front_right', label: '前额偏右', row: 1 },
  { key: 'temple_left', label: '左太阳穴', row: 2 },
  { key: 'behind_eye_left', label: '左眼后', row: 2 },
  { key: 'behind_eye_right', label: '右眼后', row: 2 },
  { key: 'temple_right', label: '右太阳穴', row: 2 },
  { key: 'top', label: '头顶', row: 3 },
  { key: 'side_left', label: '左侧头部', row: 3 },
  { key: 'side_right', label: '右侧头部', row: 3 },
  { key: 'back_left', label: '左后脑', row: 4 },
  { key: 'back_lower_left', label: '左后下', row: 4 },
  { key: 'back_lower_right', label: '右后下', row: 4 },
  { key: 'back_right', label: '右后脑', row: 4 },
  { key: 'neck', label: '脖子', row: 5 },
  { key: 'entire_head', label: '整个头部', row: 5 },
];

/** 可选症状 */
const SYMPTOMS: { key: Symptom; label: string }[] = [
  { key: 'nausea', label: '恶心 🤢' },
  { key: 'photophobia', label: '畏光 ☀️' },
  { key: 'phonophobia', label: '畏声 🔊' },
  { key: 'dizziness', label: '头晕 🌀' },
  { key: 'vomiting', label: '呕吐 🤮' },
  { key: 'aura_visual', label: '视觉先兆 👁️' },
  { key: 'aura_sensory', label: '感觉先兆 ✋' },
  { key: 'numbness', label: '麻木 💤' },
  { key: 'fatigue', label: '疲劳 😴' },
];

/** 可选触发因素 */
const TRIGGERS: { key: Trigger; label: string }[] = [
  { key: 'weather', label: '天气' },
  { key: 'stress', label: '压力' },
  { key: 'sleep', label: '睡眠' },
  { key: 'hormones', label: '激素' },
  { key: 'food', label: '食物' },
  { key: 'caffeine', label: '咖啡因' },
  { key: 'alcohol', label: '酒精' },
  { key: 'exercise', label: '运动' },
  { key: 'light', label: '光线' },
  { key: 'noise', label: '噪音' },
  { key: 'skipped_meal', label: '没吃饭' },
  { key: 'dehydration', label: '脱水' },
  { key: 'medication', label: '药物' },
  { key: 'other', label: '其他' },
];

export default function ManualRecordScreen({
  navigation,
  route,
}: ManualRecordScreenProps) {
  // 从语音记录传递来的数据
  const parsedData = route?.params?.parsedData;

  const [selectedLocation, setSelectedLocation] = useState<PainLocation | null>(
    parsedData?.location ?? null,
  );
  const [severity, setSeverity] = useState<Severity>(
    parsedData?.severity ?? 5,
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>(
    parsedData?.symptoms ?? [],
  );
  const [selectedTriggers, setSelectedTriggers] = useState<Trigger[]>(
    parsedData?.triggers ?? [],
  );
  const [notes, setNotes] = useState('');

  /** 切换症状勾选 */
  const toggleSymptom = (symptom: Symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  /** 切换触发因素勾选 */
  const toggleTrigger = (trigger: Trigger) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger],
    );
  };

  /** 保存记录 */
  const handleSave = () => {
    if (!selectedLocation) {
      Alert.alert('提示', '请选择疼痛位置');
      return;
    }

    // 实际应用中调用 API 保存
    Alert.alert('已保存', '发作记录已成功保存', [
      {
        text: '好的',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  /** 位置行分组 */
  const locationRows = [1, 2, 3, 4, 5].map((rowNum) =>
    PAIN_LOCATIONS.filter((loc) => loc.row === rowNum),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部标题 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityLabel="返回"
            accessibilityRole="button"
            style={styles.backTouchable}
          >
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {parsedData ? '修改记录' : '手动记录'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* 1. 选择疼痛位置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>疼痛位置</Text>
          {locationRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.locationRow}>
              {row.map((loc) => (
                <TouchableOpacity
                  key={loc.key}
                  style={[
                    styles.locationButton,
                    selectedLocation === loc.key && styles.locationSelected,
                  ]}
                  onPress={() => setSelectedLocation(loc.key)}
                  activeOpacity={0.7}
                  accessibilityLabel={loc.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedLocation === loc.key }}
                >
                  <Text
                    style={[
                      styles.locationText,
                      selectedLocation === loc.key && styles.locationTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {loc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* 2. 严重度 */}
        <View style={styles.section}>
          <SeveritySlider value={severity} onChange={setSeverity} />
        </View>

        {/* 3. 症状勾选 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>症状</Text>
          <View style={styles.checkGrid}>
            {SYMPTOMS.map((symptom) => (
              <TouchableOpacity
                key={symptom.key}
                style={[
                  styles.checkButton,
                  selectedSymptoms.includes(symptom.key) && styles.checkSelected,
                ]}
                onPress={() => toggleSymptom(symptom.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.checkIcon}>
                  {selectedSymptoms.includes(symptom.key) ? '✓ ' : ''}
                </Text>
                <Text
                  style={[
                    styles.checkText,
                    selectedSymptoms.includes(symptom.key) && styles.checkTextSelected,
                  ]}
                >
                  {symptom.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. 触发因素勾选 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>触发因素</Text>
          <View style={styles.checkGrid}>
            {TRIGGERS.map((trigger) => (
              <TouchableOpacity
                key={trigger.key}
                style={[
                  styles.checkButton,
                  styles.checkTriggerButton,
                  selectedTriggers.includes(trigger.key) && styles.checkTriggerSelected,
                ]}
                onPress={() => toggleTrigger(trigger.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.checkIcon}>
                  {selectedTriggers.includes(trigger.key) ? '✓ ' : ''}
                </Text>
                <Text
                  style={[
                    styles.checkText,
                    selectedTriggers.includes(trigger.key) && styles.checkTriggerTextSelected,
                  ]}
                >
                  {trigger.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. 备注 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>备注（可选）</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="补充说明..."
            placeholderTextColor={theme.colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            !selectedLocation && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!selectedLocation}
          activeOpacity={0.8}
          accessibilityLabel="保存记录"
          accessibilityRole="button"
        >
          <Text style={styles.saveText}>保存记录</Text>
        </TouchableOpacity>

        {/* 底部间距 */}
        <View style={styles.bottomPadding} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  backTouchable: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerRight: {
    width: 44,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.standard,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  locationButton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  locationSelected: {
    backgroundColor: theme.colors.primary + '25',
    borderColor: theme.colors.primary,
  },
  locationText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  locationTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
  },
  checkSelected: {
    backgroundColor: '#2ED57320',
    borderColor: theme.colors.riskLow,
  },
  checkTriggerButton: {},
  checkTriggerSelected: {
    backgroundColor: '#FFA50220',
    borderColor: theme.colors.riskMedium,
  },
  checkIcon: {
    fontSize: theme.fontSize.small,
    color: theme.colors.riskLow,
  },
  checkText: {
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
  },
  checkTextSelected: {
    color: theme.colors.riskLow,
    fontWeight: '600',
  },
  checkTriggerTextSelected: {
    color: theme.colors.riskMedium,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.standard,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
    lineHeight: 24,
  },
  saveButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadow.button,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontSize: theme.fontSize.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  bottomPadding: {
    height: 40,
  },
});
