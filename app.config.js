/**
 * Expo 动态配置
 * 用于根据构建环境设置不同的配置
 */
module.exports = ({ config }) => {
  // 从环境变量获取 APP_VARIANT，默认为 development
  const appVariant = process.env.APP_VARIANT || 'development';

  return {
    ...config,
    extra: {
      ...config.extra,
      // 暴露给 JS 代码使用
      appVariant,
    },
  };
};
