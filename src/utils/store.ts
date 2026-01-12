// 实验匹配判断
export const getFlag = (state: Record<string, any>, key: string) => {
  // 如果有本地覆盖，优先使用本地覆盖的值
  if (state.localOverrides?.[key] !== undefined) {
    return state.localOverrides[key];
  }

  // 如果没有本地覆盖，根据 serverValue 来决定默认值
  const flag = state.featureFlags?.[key];
  if (flag) {
    const serverValue = flag.serverValue;
    // 如果 serverValue 是 "test"，返回 true
    if (serverValue === 'test') {
      return true;
    }
    // 如果 serverValue 是 "control"，返回 false
    if (serverValue === 'control') {
      return false;
    }
    // 如果 serverValue 是布尔值，直接返回
    if (typeof serverValue === 'boolean') {
      return serverValue;
    }
    // 否则使用 enabled 字段
    return flag.enabled || false;
  }

  return false;
};

// 获取所有 Flag 的列表（用于调试面板）
export const getFlags = (state: Record<string, any>) => {
  return Object.values(state.featureFlags).map((flag: any) => ({
    ...flag,
    // 如果有本地覆盖，更新 enabled 和 isOverridden
    enabled: getFlag(state, flag.key),
    isOverridden: !!state.localOverrides[flag.key],
  }));
};
