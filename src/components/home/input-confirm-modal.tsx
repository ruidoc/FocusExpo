import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface InputConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  requiredText: string;
  confirmText: string;
  cancelText: string;
  extraWarning?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');
const ANIMATION_DURATION_IN = 260;
const ANIMATION_DURATION_OUT = 220;

const InputConfirmModal: React.FC<InputConfirmModalProps> = ({
  visible,
  title,
  message,
  requiredText,
  confirmText,
  cancelText,
  extraWarning,
  onConfirm,
  onClose,
}) => {
  const { colors, isDark } = useCustomTheme();
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState<boolean>(visible);
  const shouldAnimateInRef = React.useRef<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState<boolean>(false);
  const [inputText, setInputText] = React.useState('');

  const isMatch = inputText === requiredText;

  // 关闭时清空输入
  React.useEffect(() => {
    if (!visible) {
      setInputText('');
    }
  }, [visible]);

  const animateIn = React.useCallback(() => {
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    fadeAnim.setValue(0);
    slideAnim.setValue(screenHeight);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_IN,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateOut = React.useCallback(
    (onEnd?: () => void) => {
      setIsAnimatingOut(true);
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: ANIMATION_DURATION_OUT + 60,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsAnimatingOut(false);
          onEnd && onEnd();
        }
      });
    },
    [fadeAnim, slideAnim],
  );

  React.useEffect(() => {
    if (visible) {
      if (!mounted) {
        shouldAnimateInRef.current = true;
        setMounted(true);
      } else {
        animateIn();
      }
    } else if (mounted) {
      animateOut(() => setMounted(false));
    }
  }, [visible, mounted, animateIn, animateOut]);

  React.useEffect(() => {
    if (mounted && visible && shouldAnimateInRef.current) {
      shouldAnimateInRef.current = false;
      const id = requestAnimationFrame(animateIn);
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [mounted, visible, animateIn]);

  const handleConfirm = () => {
    if (!isMatch) return;
    Keyboard.dismiss();
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle={Platform.select({
        ios: 'overFullScreen',
        default: undefined,
      })}
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          pointerEvents={isAnimatingOut ? 'none' : 'auto'}
          style={[
            {
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end' as const,
            },
            { opacity: fadeAnim },
          ]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={-32}
            style={{ width: '100%' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  {
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    margin: 8,
                    paddingHorizontal: 16,
                    paddingTop: 39,
                    paddingBottom: 45,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 1,
                    elevation: 5,
                  },
                  { transform: [{ translateY: slideAnim }] },
                ]}>
                {/* 顶部手柄条 */}
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    alignSelf: 'center',
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.08)',
                  }}
                />
                {/* 关闭按钮 */}
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={24} color={colors.text3} />
                </TouchableOpacity>

                {/* 内容区域 */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <View
                    style={{
                      width: 53,
                      height: 53,
                      borderRadius: 26.5,
                      backgroundColor: 'rgba(247, 175, 93, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}>
                    <Icon name="warning" size={24} color="#F7AF5D" />
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '500',
                      color: colors.text,
                      textAlign: 'center',
                      lineHeight: 30,
                    }}>
                    {title}
                  </Text>
                </View>

                {/* 提示横幅 */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 20,
                  }}>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: '400',
                      color: colors.text2,
                      lineHeight: 20,
                      letterSpacing: -0.1,
                    }}>
                    {message}
                  </Text>
                </View>

                {/* 额外警告信息 */}
                {extraWarning && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(247, 175, 93, 0.1)',
                      borderRadius: 8,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 20,
                    }}>
                    <Icon
                      name="information-circle-outline"
                      size={16}
                      color="#F7AF5D"
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '400',
                        color: '#F7AF5D',
                        lineHeight: 18,
                      }}>
                      {extraWarning}
                    </Text>
                  </View>
                )}

                {/* 要求输入的文字 */}
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text2,
                    marginBottom: 8,
                  }}>
                  确定要终止？请输入以下文字：
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                  }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '500',
                      color: '#F7AF5D',
                      lineHeight: 22,
                    }}>
                    {requiredText}
                  </Text>
                </View>

                {/* 输入框 */}
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    fontSize: 15,
                    color: colors.text,
                    marginBottom: 24,
                  }}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="请在此输入..."
                  placeholderTextColor={colors.text2}
                  autoCorrect={false}
                  autoCapitalize="none"
                  contextMenuHidden={true}
                />

                {/* 按钮区域 */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      backgroundColor: colors.border,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={handleClose}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: colors.primary,
                      }}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      backgroundColor: isMatch
                        ? colors.primary
                        : colors.primaryMuted,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    disabled={!isMatch}
                    onPress={handleConfirm}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: isMatch ? '#FFFFFF' : colors.text2,
                      }}>
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default InputConfirmModal;
