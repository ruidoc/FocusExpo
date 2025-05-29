import React, { useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

interface CusButtonProps {
  disabled?: boolean;
  onPress: () => void;
  text?: string;
  style?: ViewStyle;
  loading?: boolean;
  loadingText?: string;
}

const CusButton = ({
  disabled,
  onPress,
  text = '下一步',
  style,
  loading = false,
  loadingText = '加载中...',
}: CusButtonProps) => {
  const { dark } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.nextButton,
          isDisabled && styles.nextButtonDisabled,
          style,
          {
            backgroundColor: dark ? '#007AFF' : '#3478F6',
          },
        ]}
        onPress={onPress}
        disabled={isDisabled}>
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.nextButtonText}>{loadingText}</Text>
          </>
        ) : (
          <Text style={styles.nextButtonText}>{text}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 32,
    width: '88%',
    alignSelf: 'center',
    shadowColor: '#3478F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E6EB',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
  },
});

export default CusButton;
