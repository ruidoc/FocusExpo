import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface ButtonProps {
  disabled?: boolean;
  onPress: () => void;
  text?: string;
  style?: ViewStyle;
  loading?: boolean;
  loadingText?: string;
}

const Button = ({
  disabled,
  onPress,
  text = '下一步',
  style,
  loading = false,
  loadingText = '加载中...',
}: ButtonProps) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ opacity }} className="w-[88%] self-center mb-8">
      <TouchableOpacity
        activeOpacity={0.8}
        className={`flex-row justify-center items-center py-[18px] rounded-[20px] ${isDisabled ? 'bg-[#E5E6EB]' : 'bg-[#53389E]'
          }`}
        style={[
          {
            shadowColor: '#3478F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          },
          style,
        ]}
        onPress={onPress}
        disabled={isDisabled}>
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color="#fff"
              className="mr-2"
            />
            <Text className="text-white text-base font-bold tracking-[0.5px] bg-transparent">
              {loadingText}
            </Text>
          </>
        ) : (
          <Text className="text-white text-base font-bold tracking-[0.5px] bg-transparent">
            {text}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button;
