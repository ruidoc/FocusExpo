import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
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
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={-32}
            style={styles.keyboardAvoiding}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}>
                {/* 顶部手柄条 */}
                <View style={styles.handle} />
                {/* 关闭按钮 */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={24} color="#B3B3BA" />
                </TouchableOpacity>

                {/* 内容区域 */}
                <View style={styles.content}>
                  <View style={styles.iconContainer}>
                    <Icon name="warning" size={24} color="#F7AF5D" />
                  </View>
                  <Text style={styles.title}>{title}</Text>
                </View>

                {/* 提示横幅 */}
                <View style={styles.banner}>
                  <Text style={styles.bannerText}>{message}</Text>
                </View>

                {/* 额外警告信息 */}
                {extraWarning && (
                  <View style={styles.warningBanner}>
                    <Icon
                      name="information-circle-outline"
                      size={16}
                      color="#F7AF5D"
                    />
                    <Text style={styles.warningText}>{extraWarning}</Text>
                  </View>
                )}

                {/* 要求输入的文字 */}
                <Text style={styles.requiredLabel}>
                  确定要终止？请输入以下文字：
                </Text>
                <View style={styles.requiredTextBox}>
                  <Text style={styles.requiredText}>{requiredText}</Text>
                </View>

                {/* 输入框 */}
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="请在此输入..."
                  placeholderTextColor="#858699"
                  autoCorrect={false}
                  autoCapitalize="none"
                  contextMenuHidden={true}
                />

                {/* 按钮区域 */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      !isMatch && styles.confirmButtonDisabled,
                    ]}
                    disabled={!isMatch}
                    onPress={handleConfirm}>
                    <Text
                      style={[
                        styles.confirmButtonText,
                        !isMatch && styles.confirmButtonTextDisabled,
                      ]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoiding: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#14141C',
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
  handle: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    backgroundColor: 'rgba(247, 175, 93, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181821',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#858699',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(247, 175, 93, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#F7AF5D',
    lineHeight: 18,
  },
  requiredLabel: {
    fontSize: 13,
    color: '#858699',
    marginBottom: 8,
  },
  requiredTextBox: {
    backgroundColor: '#181821',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  requiredText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F7AF5D',
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#181821',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A36',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#1C1C26',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7A5AF8',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#7A5AF8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#2A2A36',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  confirmButtonTextDisabled: {
    color: '#858699',
  },
});

export default InputConfirmModal;
