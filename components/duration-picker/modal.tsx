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
import DurationPicker from './index';

type DurationPickerModalProps = {
  visible: boolean;
  defaultMinutes?: number;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (totalMinutes: number) => void;
  onCancel: () => void;
  onClose: () => void;
};

const { height: screenHeight } = Dimensions.get('window');
const ANIMATION_DURATION_IN = 260;
const ANIMATION_DURATION_OUT = 220;

const DurationPickerModal: React.FC<DurationPickerModalProps> = ({
  visible,
  defaultMinutes = 0,
  title = '选择时长',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState<boolean>(visible);
  const shouldAnimateInRef = React.useRef<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState<boolean>(false);
  const [minutes, setMinutes] = React.useState<number>(defaultMinutes);

  React.useEffect(() => {
    if (visible) setMinutes(defaultMinutes);
  }, [visible, defaultMinutes]);

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
        (shouldAnimateInRef as any).current = true;
        setMounted(true);
      } else {
        animateIn();
      }
    } else if (mounted) {
      animateOut(() => setMounted(false));
    }
  }, [visible, mounted, animateIn, animateOut]);

  React.useEffect(() => {
    if (mounted && visible && (shouldAnimateInRef as any).current) {
      (shouldAnimateInRef as any).current = false;
      const id = requestAnimationFrame(animateIn);
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [mounted, visible, animateIn]);

  const handleConfirm = () => {
    onConfirm(minutes);
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
      presentationStyle={Platform.select({
        ios: 'overFullScreen',
        default: undefined,
      })}
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          pointerEvents={isAnimatingOut ? 'none' : 'auto'}
          style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}>
              <View style={styles.handle} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={24} color="#B3B3BA" />
              </TouchableOpacity>

              <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
              </View>

              <View style={{ paddingHorizontal: 8, marginBottom: 8 }}>
                <DurationPicker
                  defaultMinutes={minutes}
                  onChange={setMinutes}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}>
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
    paddingBottom: 20,
    height: 255, // 固定高度，对应设计稿
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
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
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

export default DurationPickerModal;
