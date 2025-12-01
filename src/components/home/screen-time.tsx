// 屏幕时间权限获取页面组件

import { Button } from '@/components/ui';
import { useHomeStore } from '@/stores';
import { getScreenTimePermission } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const ScreenTimePermissionPage = ({
  colors,
  xcolor,
}: {
  colors: any;
  xcolor: any;
}) => {
  const handleRequestPermission = async () => {
    const granted = await getScreenTimePermission();
    if (granted) {
      // 成功获取权限，更新状态
      useHomeStore().setIOSScreenTimePermission(true);
    } else {
      useHomeStore().setIOSScreenTimePermission(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      backgroundColor: colors.background,
    },
    icon: {
      fontSize: 80,
      color: xcolor.brand_6,
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: xcolor.gray_8,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    button: {
      backgroundColor: xcolor.brand_6,
      paddingHorizontal: 40,
      borderRadius: 25,
    },
    buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Icon name="shield-checkmark" style={styles.icon} />
        <Text style={styles.title}>需要屏幕时间权限</Text>
        <Text style={styles.description}>
          为了帮助您专注工作和学习，我们需要获取屏幕时间权限来管理应用使用。
          {'\n\n'}
          请在设置中授予权限，然后返回应用继续使用。
        </Text>
        <Button
          style={styles.button}
          onPress={handleRequestPermission}
          className="text-white font-bold text-lg">
          获取权限
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ScreenTimePermissionPage;
