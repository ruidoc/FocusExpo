/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// 需要与 Lumina UI Kit 保持一致的主题主色（占位，待按 Figma 替换）
// 参考链接: https://www.figma.com/design/m5y9YkJCpEZn8ivxr1YCKS/Lumina-UI-Kit-1.1--Full-Version-?node-id=137-38936&m=dev
// 注意：以下为示例色值，请按设计稿替换
const LuminaLightPalette = {
  primary: "#7A5AF8", // 主题主色（示例）
  primaryForeground: "#FFFFFF",
  background: "#FFFFFF",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E5E7EB",
  muted: "#F5F7FB",
  mutedForeground: "#94A3B8",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",
};

const LuminaDarkPalette = {
  primary: "#7A5AF8",
  primaryForeground: "#FFFFFF",
  background: "#14141C",
  surface: "#181821",
  textPrimary: "#E5E7EB",
  textSecondary: "#9CA3AF",
  border: "#1F2937",
  muted: "#0F172A",
  mutedForeground: "#94A3B8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#F87171",
};

const tintColorLight = LuminaLightPalette.primary;
const tintColorDark = LuminaDarkPalette.primaryForeground;

// 统一色板
const colors = {
  primary: LuminaLightPalette.primary, // 主色（按需替换）
  primaryLight: "#EEF2FF", // 主色淡色（示例）
  green: LuminaLightPalette.success,
  gray: "#C0C4CC",
  border: LuminaLightPalette.border,
  cardBg: LuminaLightPalette.surface,
  desc: LuminaLightPalette.mutedForeground,
};

export const Colors = {
  light: {
    text: LuminaLightPalette.textPrimary,
    background: LuminaLightPalette.background,
    tint: tintColorLight,
    icon: LuminaLightPalette.textSecondary,
    tabIconDefault: LuminaLightPalette.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: LuminaDarkPalette.textPrimary,
    background: LuminaDarkPalette.background,
    tint: tintColorDark,
    icon: LuminaDarkPalette.textSecondary,
    tabIconDefault: LuminaDarkPalette.textSecondary,
    tabIconSelected: tintColorDark,
  },
};

export default colors;

// 导出导航主题（供 React Navigation 使用），与 Lumina 色板对齐
export const NavThemes = {
  light: {
    dark: false,
    colors: {
      primary: LuminaLightPalette.primary,
      background: LuminaLightPalette.background,
      card: LuminaLightPalette.surface,
      text: LuminaLightPalette.textPrimary,
      border: LuminaLightPalette.border,
      notification: LuminaLightPalette.primary,
    },
  },
  dark: {
    dark: true,
    colors: {
      primary: LuminaDarkPalette.primary,
      background: LuminaDarkPalette.background,
      card: LuminaDarkPalette.surface,
      text: LuminaDarkPalette.textPrimary,
      border: LuminaDarkPalette.border,
      notification: LuminaDarkPalette.primary,
    },
  },
};

// 导出 Xiaoshu 主题覆盖项，保持与 Lumina 色板一致
export const XiaoShuThemeOverrides = {
  light: {
    brand_6: LuminaLightPalette.primary,
    primary_color: LuminaLightPalette.primary,
    text_title_color: LuminaLightPalette.textPrimary,
    text_body_color: LuminaLightPalette.textSecondary,
    divider_color: LuminaLightPalette.border,
    background_color: LuminaLightPalette.background,
    card_background_color: LuminaLightPalette.surface,
    notice_bar_background_color_lightness: 96,
  },
  dark: {
    brand_6: LuminaDarkPalette.primary,
    primary_color: LuminaDarkPalette.primary,
    text_title_color: LuminaDarkPalette.textPrimary,
    text_body_color: LuminaDarkPalette.textSecondary,
    divider_color: LuminaDarkPalette.border,
    background_color: LuminaDarkPalette.background,
    card_background_color: LuminaDarkPalette.surface,
    steps_background_color: "transparent",
    notice_bar_background_color_lightness: 10,
  },
};
