import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');
const ANIMATION_DURATION_IN = 260;
const ANIMATION_DURATION_OUT = 220;

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState<boolean>(visible);
  const shouldAnimateInRef = React.useRef<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState<boolean>(false);

  const animateIn = React.useCallback(() => {
    // 重置初始值，避免闪烁
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
        // 使用基于物理的 spring，确保丝滑
        damping: 18,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateOut = React.useCallback((onEnd?: () => void) => {
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
  }, [fadeAnim, slideAnim]);

  // 受控挂载：visible 变为 true 先挂载再入场动画；变为 false 先退场动画再卸载
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

  // 当刚挂载且需要入场动画时执行
  React.useEffect(() => {
    if (mounted && visible && shouldAnimateInRef.current) {
      shouldAnimateInRef.current = false;
      // 等待一帧以确保 Modal 完全可见，再开始动画
      const id = requestAnimationFrame(animateIn);
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [mounted, visible, animateIn]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle={Platform.select({ ios: 'overFullScreen', default: undefined })}
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          pointerEvents={isAnimatingOut ? 'none' : 'auto'}
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* 顶部手柄条，增强视觉 */}
              <View style={styles.handle} />
              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={24} color="#B3B3BA" />
              </TouchableOpacity>

              {/* 内容区域 */}
              <View style={styles.content}>
                {/* 图标 */}
                <View style={styles.iconContainer}>
                  <Icon name="warning" size={24} color="#F7AF5D" />
                </View>

                {/* 标题 */}
                <Text style={styles.title}>{title}</Text>
              </View>

              {/* 提示横幅 */}
              <View style={styles.banner}>
                <Text style={styles.bannerText}>{message}</Text>
              </View>

              {/* 按钮区域 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
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
  modalContainer: {
    backgroundColor: '#14141C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    margin: 8,
    paddingHorizontal: 16,
    paddingTop: 39,
    paddingBottom: 45,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181821',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#858699',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  bannerDecoration: {
    width: 48,
    height: 40,
    backgroundColor: '#16B364',
    borderRadius: 4,
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
    color: '#858699',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#7A5AF8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default ConfirmationModal;
