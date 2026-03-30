/**
 * Expo 动态配置
 * 用于根据构建环境设置不同的配置
 */
module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
    },
  };
};
