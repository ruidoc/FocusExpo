import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

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
    paddingVertical: 18,
    borderRadius: 20,
    marginBottom: 32,
    width: '88%',
    alignSelf: 'center',
    shadowColor: '#3478F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: '#53389E',
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E6EB',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
  },
});

export default CusButton;
