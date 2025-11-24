module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      // Use react-native-css-interop plugins directly instead of nativewind/babel
      // to avoid the react-native-worklets/plugin issue with Reanimated 3.x
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      // Reanimated 3.x plugin (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};
