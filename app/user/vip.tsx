import { Page } from '@/components/business';
import { Toast } from '@/components/ui';
import { trackOpenPaywall, useSuperwall } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const VipPage = () => {
  const { colors, dark } = useTheme();

  // Superwall paywall 集成
  const { registerPlacement } = useSuperwall();

  // 设计常量
  const THEME_COLOR = colors.primary;
  const TEXT_SECONDARY = '#999999';
  const CARD_BG = dark ? '#1C1C26' : '#FFFFFF';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${THEME_COLOR}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: TEXT_SECONDARY,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    // 权益卡片
    benefitsCard: {
      backgroundColor: CARD_BG,
      borderRadius: 16,
      padding: 20,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: dark ? '#2C2C36' : '#E5E7EB',
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    benefitIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${THEME_COLOR}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    benefitText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    // 主要操作按钮
    primaryButton: {
      height: 56,
      borderRadius: 12,
      backgroundColor: THEME_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    primaryButtonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
    },
    // 合规入口区域
    complianceRow: {
      marginTop: 10,
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
    },
    smallButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border || '#E5E7EB',
      backgroundColor: CARD_BG,
    },
    smallButtonText: {
      color: colors.text,
      fontSize: 14,
    },
    // 底部链接
    linksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      paddingBottom: 30,
    },
    linkText: {
      color: THEME_COLOR,
      fontSize: 14,
    },
  });

  // iOS 合规：管理订阅
  const onManageSubscriptions = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL(
          'itms-apps://apps.apple.com/account/subscriptions',
        );
      }
    } catch (e) {
      console.warn('打开订阅管理失败：', e);
      Toast({ message: '无法打开订阅管理页面' });
    }
  };

  // 恢复购买（Superwall自动处理）
  const onRestorePurchases = () => {
    Toast({ message: '正在恢复购买记录...' });
    // Superwall SDK 会自动同步购买状态
  };

  const openAgreement = () => {
    Linking.openURL('https://focusone.ruidoc.cn/agreement');
  };

  const openPrivacy = () => {
    Linking.openURL('https://focusone.ruidoc.cn/privacy');
  };

  // 打开Superwall购买页面
  const handleUpgrade = () => {
    trackOpenPaywall('show_paywall');
    registerPlacement({ placement: 'show_paywall' });
  };

  return (
    <Page>
      <View style={styles.container}>
        {/* Hero区域 */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Icon name="diamond" size={40} color={THEME_COLOR} />
          </View>
          <Text style={styles.title}>解锁专业版</Text>
          <Text style={styles.subtitle}>
            获得更强大的专注能力，提升效率，掌控时间
          </Text>
        </View>

        {/* 会员权益 */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBox}>
              <Icon name="infinite" size={18} color={THEME_COLOR} />
            </View>
            <Text style={styles.benefitText}>无限制专注计划数量</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBox}>
              <Icon name="apps" size={18} color={THEME_COLOR} />
            </View>
            <Text style={styles.benefitText}>解锁更多限制应用位</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBox}>
              <Icon name="stats-chart" size={18} color={THEME_COLOR} />
            </View>
            <Text style={styles.benefitText}>高级数据统计分析</Text>
          </View>
          <View style={[styles.benefitItem, { marginBottom: 0 }]}>
            <View style={styles.benefitIconBox}>
              <Icon name="shield-checkmark" size={18} color={THEME_COLOR} />
            </View>
            <Text style={styles.benefitText}>优先客服支持</Text>
          </View>
        </View>

        {/* 主要操作按钮 */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleUpgrade}>
          <Text style={styles.primaryButtonText}>立即订阅</Text>
        </TouchableOpacity>

        {/* 合规入口：恢复购买、管理订阅 */}
        <View style={styles.complianceRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={onRestorePurchases}>
            <Text style={styles.smallButtonText}>恢复购买</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={onManageSubscriptions}>
            <Text style={styles.smallButtonText}>管理订阅</Text>
          </TouchableOpacity>
        </View>

        {/* 协议与隐私链接 */}
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={openAgreement}>
            <Text style={styles.linkText}>用户协议</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openPrivacy}>
            <Text style={styles.linkText}>隐私政策</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Page>
  );
};

export default VipPage;
