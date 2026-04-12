import { Page } from '@/components/business';
import { Button, Dialog, TextInput, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { usePlanStore, useUserStore } from '@/stores';
import { stopAppLimits } from '@/utils/permission';
import { storage } from '@/utils/storage';
import { resetUserActivation } from '@/utils/user-activation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useMemo, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const DELETE_ITEMS = [
  '账号信息',
  '专注计划',
  '专注记录与统计数据',
  '已选择的应用配置',
  '引导与反馈记录',
];
const LOGOFF_INPUT_ACCESSORY_ID = 'logoff-confirm-accessory';

const App = () => {
  const { colors } = useCustomTheme();
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const store = useUserStore();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const accountLabel = useMemo(() => {
    return (
      store.uInfo?.phone ||
      store.uInfo?.username ||
      store.uInfo?.id ||
      '当前账号'
    );
  }, [store.uInfo]);

  const canDelete = confirmText.trim() === '确认注销';

  const resetLocalData = async () => {
    store.logout();
    resetUserActivation();

    storage.delete('record_id');
    storage.delete('cus_plans');
    storage.delete('once_plans');
    storage.delete('exit_plan_ids');
    storage.delete('paused_plan_id');

    await Promise.allSettled([
      AsyncStorage.removeItem('onboarding_state'),
      AsyncStorage.removeItem('focus_apps'),
      AsyncStorage.removeItem('shield_apps'),
    ]);

    await Promise.allSettled([
      storage.setGroup('access_token', ''),
      storage.setGroup('record_id', ''),
      storage.setGroup('is_subscribed', 'false'),
      storage.setGroup('today_used', '0'),
    ]);
  };

  const onPressDelete = async () => {
    const action = await Dialog.confirm({
      title: '确认注销账号',
      message: '注销后账号及相关数据将被立即删除，且无法恢复。',
      confirmButtonText: '继续注销',
      cancelButtonText: '取消',
      buttonReverse: true,
    });

    if (action !== 'confirm') return;
    setConfirmText('');
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!canDelete || loading) return;

    setLoading(true);
    try {
      const pstore = usePlanStore.getState();
      const hasFocus = pstore.has_active_task();

      if (hasFocus && Platform.OS === 'ios') {
        await stopAppLimits();
        await pstore.exitPlan();
      }

      const ok = await store.deleteAccount();
      if (!ok) return;

      setShowConfirmModal(false);
      setConfirmText('');
      Toast('账号已注销', 'success');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await resetLocalData();

      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.log('重载应用失败，回退到首页路由', error);
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 30, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          showsVerticalScrollIndicator={false}>
          <View className="flex-1">
            <View className="mx-5 mb-6">
              <Text className="mb-3 text-base" style={{ color: colors.text }}>
                当前账号
              </Text>
              <View
                className="rounded-2xl px-4 py-4"
                style={{ backgroundColor: colors.card2 }}>
                <Text className="text-base" style={{ color: colors.text }}>
                  {accountLabel}
                </Text>
              </View>
            </View>

            <View className="mx-5 mb-8">
              <Text className="mb-3 text-base" style={{ color: colors.text }}>
                注销后将删除以下数据
              </Text>
              <View
                className="rounded-2xl px-4 py-4"
                style={{ backgroundColor: colors.card2 }}>
                {DELETE_ITEMS.map(item => (
                  <Text
                    key={item}
                    className="mb-2 text-[15px]"
                    style={{ color: colors.text }}>
                    {`\u2022 ${item}`}
                  </Text>
                ))}
                <Text
                  className="mt-2 text-sm leading-6"
                  style={{ color: colors.notification || '#ef4444' }}>
                  注销后数据不可恢复，请谨慎操作。
                </Text>
              </View>
            </View>

            <Button
              className="mx-12 mt-5"
              loading={loading}
              loadingText="注销中..."
              onPress={onPressDelete}>
              我要注销
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        visible={showConfirmModal}
        title="最后确认"
        showCancelButton
        confirmButtonText="立即注销"
        confirmButtonDisabled={!canDelete}
        cancelButtonText="取消"
        onPressCancel={() => {
          setShowConfirmModal(false);
          setConfirmText('');
        }}
        onPressConfirm={confirmDelete}>
        <Text className="mb-4 text-sm leading-6" style={{ color: colors.text }}>
          请输入“确认注销”后才可继续，删除后账号与数据将立即注销且不可恢复。
        </Text>

        <View
          className="rounded-2xl px-4 py-3"
          style={{
            backgroundColor: colors.controlBg,
            borderWidth: 1,
            borderColor: colors.controlBorder,
          }}>
          <TextInput
            placeholder="确认注销"
            placeholderTextColor={colors.text3}
            value={confirmText}
            clearable
            inputAccessoryViewID={
              Platform.OS === 'ios' ? LOGOFF_INPUT_ACCESSORY_ID : undefined
            }
            returnKeyType="default"
            onChange={setConfirmText}
          />
        </View>
      </Dialog>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={LOGOFF_INPUT_ACCESSORY_ID}>
          <View
            className="items-end border-t px-4 py-3"
            style={{
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            }}>
            <Pressable
              className="rounded-full px-3 py-1.5"
              onPress={() => Keyboard.dismiss()}>
              <Text
                className="text-sm font-medium"
                style={{ color: colors.primary }}>
                收起键盘
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Page>
  );
};

export default App;
