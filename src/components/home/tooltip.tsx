import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TooltipProps {
  title: string;
  description: string;
  currentStep?: number;
  totalSteps?: number;
  onNext?: () => void;
  onClose?: () => void;
  visible: boolean;
  position?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  currentStep = 1,
  totalSteps = 5,
  onNext,
  onClose,
  visible,
  position = { top: 150, right: 20 },
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, position]}>
          {/* 箭头 */}
          <View style={styles.arrow} />
          
          {/* 内容 */}
          <View style={styles.content}>
            <View style={styles.textContent}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.pagination}>
                {currentStep}/{totalSteps}
              </Text>
              {onNext && (
                <TouchableOpacity onPress={onNext}>
                  <Text style={styles.nextButton}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    position: 'absolute',
    maxWidth: 240,
    backgroundColor: '#101017',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  arrow: {
    position: 'absolute',
    top: -4,
    right: 10,
    width: 14,
    height: 4,
    backgroundColor: '#101017',
    // 这里可以用SVG来创建更精确的箭头形状
  },
  content: {
    padding: 16,
  },
  textContent: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 16,
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    color: '#858699',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    fontSize: 12,
    fontWeight: '400',
    color: '#858699',
  },
  nextButton: {
    fontSize: 12,
    fontWeight: '400',
    color: '#7A5AF8',
  },
});

export default Tooltip;
