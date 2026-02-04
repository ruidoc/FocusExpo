import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface NoticeBarProps {
  message: string;
  mode?: 'closable' | 'link';
  status?: 'primary' | 'success' | 'warning' | 'error';
  onPress?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
}

const NoticeBar = ({
  message,
  mode,
  status = 'primary',
  onPress,
  onClose,
  style,
}: NoticeBarProps) => {
  const { colors, isDark } = useCustomTheme();

  const statusColors = {
    primary: { bg: colors.primary, text: '#FFFFFF' },
    success: { bg: colors.success, text: '#FFFFFF' },
    warning: { bg: colors.warning, text: '#FFFFFF' },
    error: { bg: colors.danger, text: '#FFFFFF' },
  };

  const currentStatus = statusColors[status];
  const backgroundColor = isDark
    ? `${currentStatus.bg}CC`
    : currentStatus.bg;

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}>
      <Icon name="information-circle" size={18} color={currentStatus.text} />
      <Text style={[styles.message, { color: currentStatus.text }]} numberOfLines={1}>
        {message}
      </Text>
      {mode === 'link' && (
        <Icon name="chevron-forward" size={18} color={currentStatus.text} />
      )}
      {mode === 'closable' && (
        <Pressable onPress={onClose} hitSlop={8}>
          <Icon name="close" size={18} color={currentStatus.text} />
        </Pressable>
      )}
    </View>
  );

  if (mode === 'link' && onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
});

export default NoticeBar;
