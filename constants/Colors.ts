/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

// 统一色板
const colors = {
  primary: "#3478F6", // 主色
  primaryLight: "#F3F8FE", // 主色淡色
  green: "#34b545", // 完成绿色
  gray: "#C0C4CC", // 灰色
  border: "#E5E6EB", // 边框灰
  cardBg: "#fff", // 卡片白
  desc: "#B0B8C7", // 描述灰
};

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export default colors;
