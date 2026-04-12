// 参考链接: https://www.figma.com/design/m5y9YkJCpEZn8ivxr1YCKS/Lumina-UI-Kit-1.1--Full-Version-?node-id=137-38936&m=dev
const baseCommon = {
  primary: '#7A5AF8', // 主题色
  primary2: '#F44771', // 副主题色
  green: '#16B364', // 绿色
  orange: '#EF6820', // 橙色
  blue: '#2E90FA', // 蓝色
  blue2: '#3538CD', // 蓝色2
  indigo: '#3538CD', // 设计稿 indigo
  fuchsia: '#D444F1', // 紫红色
};

const baseLight = {
  ...baseCommon,
  primaryForeground: '#FFFFFF',
  background: '#EEEEEF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  card2: '#FFFFFF',
  text: '#0F172A',
  text2: '#64748B',
  text3: '#94A3B8', // 弱化文字
  text4: '#CBD5E1', // 禁用文字
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#CBD5E1',
  muted: '#EEEEEF',
  mutedForeground: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.18)',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  controlBg: '#F3F5F8',
  controlStrongBg: '#C7D7FE',
  controlBorder: '#DDE3EC',
  indigoBg: '#C7D7FE',
  tabActiveBg: '#FFFFFF',
  tabBg: '#EEEEEF',
  tabDivider: '#DBDBDD',
  chipActiveBg: '#FFFFFF',
  chipActiveBorder: '#DBDBDD',
  chipActiveText: '#3538CD',
  chipInactiveBg: '#EEEEEF',
  chipInactiveBorder: '#DBDBDD',
  chipInactiveText: '#64748B',
  primarySoft: 'rgba(122, 90, 248, 0.12)',
  successSoft: 'rgba(22, 163, 74, 0.12)',
  warningSoft: 'rgba(245, 158, 11, 0.14)',
  dangerSoft: 'rgba(239, 68, 68, 0.12)',
  buttonDisabledBg: '#D9D0FD',
  buttonDisabledText: 'rgba(255, 255, 255, 0.7)',
  progressTrack: '#DFE5EE',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const baseDark = {
  ...baseCommon,
  primaryForeground: '#FFFFFF',
  background: '#14141C',
  surface: '#181821',
  card: '#181821',
  card2: '#1C1C26',
  text: '#E5E7EB', // 主文字
  text2: '#9CA3AF', // 次文字
  text3: '#6B7280', // 弱化文字
  text4: '#9CA3AF', // 禁用文字
  textInverse: '#FFFFFF',
  border: '#1C1C26',
  borderStrong: '#2A2A3A',
  muted: '#0F172A',
  mutedForeground: '#94A3B8',
  overlay: 'rgba(0, 0, 0, 0.5)',
  inputBg: '#181821',
  inputBorder: '#1C1C26',
  controlBg: '#1C1C26',
  controlStrongBg: '#1F235B',
  controlBorder: '#2A2A3A',
  indigoBg: '#1F235B',
  tabActiveBg: '#181821',
  tabBg: '#101017',
  tabDivider: '#181821',
  chipActiveBg: '#181821',
  chipActiveBorder: '#181821',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#101017',
  chipInactiveBorder: '#181821',
  chipInactiveText: '#9CA3AF',
  primarySoft: 'rgba(122, 90, 248, 0.16)',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  buttonDisabledBg: '#3D2E7A',
  buttonDisabledText: 'rgba(255, 255, 255, 0.5)',
  progressTrack: '#2A2A3A',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F87171',
};

export const Colors = {
  light: {
    ...baseLight,
    tint: baseLight.primary,
    icon: baseLight.text2,
    tabIconDefault: baseLight.text2,
    tabIconSelected: baseLight.primary,
  },
  dark: {
    ...baseDark,
    tint: baseDark.primaryForeground,
    icon: baseDark.text2,
    tabIconDefault: baseDark.text2,
    tabIconSelected: baseDark.primaryForeground,
  },
};

// 导出导航主题（供 React Navigation 使用），与 Lumina 色板对齐
export const NavThemes = {
  light: {
    dark: false,
    colors: {
      primary: baseLight.primary,
      background: baseLight.background,
      card: baseLight.surface,
      text: baseLight.text,
      border: baseLight.border,
      notification: baseLight.primary,
    },
  },
  dark: {
    dark: true,
    colors: {
      primary: baseDark.primary,
      background: baseDark.background,
      card: baseDark.surface,
      text: baseDark.text,
      border: baseDark.border,
      notification: baseDark.primary,
    },
  },
};
