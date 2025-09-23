// 参考链接: https://www.figma.com/design/m5y9YkJCpEZn8ivxr1YCKS/Lumina-UI-Kit-1.1--Full-Version-?node-id=137-38936&m=dev
const baseCommon = {
  primary: '#7A5AF8', // 主题色
  primary2: '#F44771', // 副主题色
  green: '#16B364', // 绿色
  orange: '#EF6820', // 橙色
  blue: '#2E90FA', // 蓝色
  blue2: '#3538CD', // 蓝色2
  fuchsia: '#D444F1', // 紫红色
};

const baseLight = {
  ...baseCommon,
  primaryForeground: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  text2: '#64748B',
  text3: '#94A3B8', // 弱化文字
  text4: '#CBD5E1', // 禁用文字
  border: '#E5E7EB',
  muted: '#F5F7FB',
  mutedForeground: '#94A3B8',
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
  text: '#E5E7EB', // 主文字
  text2: '#9CA3AF', // 次文字
  text3: '#6B7280', // 弱化文字
  text4: '#9CA3AF', // 禁用文字
  border: '#1F2937',
  muted: '#0F172A',
  mutedForeground: '#94A3B8',
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

// 导出 Xiaoshu 主题覆盖项，保持与 Lumina 色板一致
export const XiaoShuThemeOverrides = {
  light: {
    brand_6: baseLight.primary,
    primary_color: baseLight.primary,
    text_title_color: baseLight.text,
    text_body_color: baseLight.text2,
    divider_color: baseLight.border,
    background_color: baseLight.background,
    card_background_color: baseLight.surface,
    notice_bar_background_color_lightness: 96,
  },
  dark: {
    brand_6: baseDark.primary,
    primary_color: baseDark.primary,
    text_title_color: baseDark.text,
    text_body_color: baseDark.text2,
    divider_color: baseDark.border,
    background_color: baseDark.background,
    card_background_color: baseDark.surface,
    steps_background_color: 'transparent',
    notice_bar_background_color_lightness: 10,
    divider_color_light: 'transparent',
  },
};
