import Icon from '@expo/vector-icons/Ionicons';
import { Button, Flex } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  mode: 'focus' | 'shield';
  setMode: (mode: 'focus' | 'shield') => void;
  desc: string;
  focusApps: string[];
  shieldApps: string[];
  allApps: any[];
}

const MODE_COLORS = {
  focus: '#27ae60', // 绿色
  shield: '#e74c3c', // 红色
};

const ModeSwitcher: React.FC<Props> = ({
  mode,
  setMode,
  desc,
  focusApps,
  shieldApps,
  allApps,
}) => {
  const anim = useRef(new Animated.Value(mode === 'focus' ? 0 : 1)).current;
  const navigation = useNavigation();

  const addApp = (m: 'focus' | 'shield') => {
    (navigation as any).navigate('AddApp', { mode: m });
  };

  useEffect(() => {
    Animated.timing(anim, {
      toValue: mode === 'focus' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [mode]);

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [MODE_COLORS.focus, MODE_COLORS.shield],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.btnGroup}>
        <Button.Option
          text="专注模式"
          type="white"
          style={[styles.btn, mode === 'focus' && styles.activeBtn]}
          textStyle={[
            styles.btnText,
            mode === 'focus' && { color: MODE_COLORS.focus, opacity: 1 },
          ]}
          onPress={() => setMode('focus')}
          active={mode === 'focus'}
        />
        <Button.Option
          text="屏蔽模式"
          type="white"
          style={[styles.btn, mode === 'shield' && styles.activeBtn]}
          textStyle={[
            styles.btnText,
            mode === 'shield' && { color: MODE_COLORS.shield, opacity: 1 },
          ]}
          onPress={() => setMode('shield')}
          active={mode === 'shield'}
        />
      </View>
      <Text style={styles.desc}>{desc}</Text>
      <Flex justify="center" align="center" style={styles.appIconsRow}>
        {(() => {
          const apps = mode === 'focus' ? focusApps : shieldApps;
          const showApps = allApps
            .filter(app => apps.includes(app.packageName))
            .slice(0, 4);
          if (apps.length === 0) {
            return (
              <Flex
                direction="row"
                align="center"
                justify="center"
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  backgroundColor: 'transparent',
                  minWidth: 90,
                  minHeight: 36,
                }}
                onPress={() => addApp(mode)}>
                <Icon
                  name="add"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: '500',
                    opacity: 0.85,
                  }}>
                  添加APP
                </Text>
              </Flex>
            );
          }
          return (
            <Flex
              style={styles.iconRowInner}
              justify="center"
              align="center"
              onPress={() => addApp(mode)}>
              {showApps.map(app => (
                <View key={app.packageName} style={styles.appIconWrap}>
                  <Animated.Image
                    source={{ uri: 'data:image/jpeg;base64,' + app.icon }}
                    style={styles.appIcon}
                    resizeMode="cover"
                  />
                </View>
              ))}
              {apps.length > 4 && (
                <View
                  style={[
                    styles.appIconWrap,
                    {
                      backgroundColor: '#eee',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}>
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    +{apps.length - 4}
                  </Text>
                </View>
              )}
            </Flex>
          );
        })()}
      </Flex>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    marginBottom: 0,
  },
  activeBtn: {
    backgroundColor: '#fff',
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  btnGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    borderRadius: 10,
    padding: 0,
    marginBottom: 12,
    width: 230,
  },
  btn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 10,
    minWidth: 60,
    margin: 0,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderWidth: 0,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    opacity: 0.8,
  },
  activeText: {
    color: '#333',
    opacity: 1,
  },
  desc: {
    color: '#fff',
    fontSize: 15,
    marginTop: 8,
    minHeight: 22,
    textAlign: 'center',
  },
  appIconsRow: {
    minHeight: 36,
    marginTop: 12,
    marginBottom: 6,
    height: 36,
  },
  iconRowInner: {
    height: 36,
    gap: 8,
  },
  appIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    marginHorizontal: 0,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

export default ModeSwitcher;
