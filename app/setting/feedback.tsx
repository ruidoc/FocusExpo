import { Button, Checkbox, TextInput, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { getAppVersion } from '@/utils/analytics';
import request from '@/utils/request';
import { useHeaderHeight } from '@react-navigation/elements';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const options = [
  { label: '账号权益问题', value: 'account_rights' },
  { label: 'Bug 反馈', value: 'bug' },
  { label: '功能建议', value: 'feature_suggestion' },
  { label: '其他问题', value: 'other' },
];

const App = () => {
  const { colors } = useCustomTheme();
  const headerHeight = useHeaderHeight();
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const toSubmit = async () => {
    setLoading(true);
    try {
      await request.post('/feedback', {
        type,
        content: reason,
        contact,
        app_version: getAppVersion(),
      });
      Toast('反馈成功', 'success');
      setLoading(false);
      router.back();
    } catch {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 20,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1 }}>
          <View className="flex-col items-stretch mx-5 gap-2">
            <Text className="text-base" style={{ color: colors.text }}>
              反馈类型
            </Text>
            <View
              className="rounded-lg mb-[30px] py-[15px] px-[15px]"
              style={{ backgroundColor: colors.card }}>
              {[0, 2].map(rowStart => (
                <View
                  key={rowStart}
                  className={`flex-row gap-3 ${rowStart === 0 ? 'mb-3' : ''}`}>
                  {options.slice(rowStart, rowStart + 2).map(option => {
                    const isActive = type === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setType(option.value)}
                        className="flex-1 flex-row items-center min-w-0">
                        <Checkbox.Icon
                          active={isActive}
                          size={20}
                          activeColor={colors.primary}
                        />
                        <Text
                          className="ml-2 flex-1"
                          style={{
                            fontSize: 15.3,
                            color: colors.text,
                            opacity: 0.8,
                          }}
                          numberOfLines={2}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
          <View className="flex-col items-stretch mx-5 gap-2">
            <Text className="text-base" style={{ color: colors.text }}>
              反馈内容
            </Text>
            <View
              className="rounded-lg mb-[30px] py-[10px] px-[15px]"
              style={{ backgroundColor: colors.card }}>
              <TextInput
                type="textarea"
                rows={7}
                placeholder="请输入您的意见和反馈，我们会尽快处理并改进"
                placeholderTextColor={colors.text3}
                value={reason}
                clearable
                submitBehavior="blurAndSubmit"
                returnKeyType="done"
                style={{ color: colors.text }}
                onChange={setReason}
              />
            </View>
          </View>
          <View className="flex-col items-stretch mx-5 gap-2">
            <Text className="text-base" style={{ color: colors.text }}>
              联系方式
              <Text style={{ color: colors.text3, fontSize: 13 }}>
                （选填）
              </Text>
            </Text>
            <View
              className="rounded-lg mb-[30px] py-[10px] px-[15px]"
              style={{ backgroundColor: colors.card }}>
              <TextInput
                placeholder="微信号或邮箱，方便我们联系你"
                placeholderTextColor={colors.text3}
                value={contact}
                clearable
                style={{ color: colors.text }}
                onChange={setContact}
              />
            </View>
          </View>
          <Button
            disabled={!reason || !type}
            style={{ marginHorizontal: 20, marginTop: 14 }}
            loading={loading}
            onPress={toSubmit}>
            提交反馈
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default App;
