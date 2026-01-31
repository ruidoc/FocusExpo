import { MMKV } from 'react-native-mmkv';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const appGroupIdentifier = 'group.com.focusone';

/**
 * 通用存储类
 * 基于 MMKV 提供高性能的本地存储功能
 */
class StorageManager {
  private mmkv: MMKV;

  constructor(id?: string) {
    this.mmkv = new MMKV({ id: id || 'default' });
  }

  /**
   * 设置字符串值
   */
  set(key: string, value: string | number | boolean): void {
    this.mmkv.set(key, value);
  }

  /**
   * 获取字符串值
   */
  getString(key: string, defaultValue?: string): string | undefined {
    return this.mmkv.getString(key) ?? defaultValue;
  }

  /**
   * 获取数字值
   */
  getNumber(key: string, defaultValue?: number): number | undefined {
    return this.mmkv.getNumber(key) ?? defaultValue;
  }

  /**
   * 获取布尔值
   */
  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    return this.mmkv.getBoolean(key) ?? defaultValue;
  }

  /**
   * 设置对象值（自动序列化为 JSON）
   */
  setObject<T = any>(key: string, value: T): void {
    try {
      const jsonString = JSON.stringify(value);
      this.mmkv.set(key, jsonString);
    } catch (error) {
      console.error(`存储对象失败 [${key}]:`, error);
    }
  }

  /**
   * 获取对象值（自动反序列化 JSON）
   */
  getObject<T = any>(key: string, defaultValue?: T): T | undefined {
    try {
      const jsonString = this.mmkv.getString(key);
      if (jsonString) {
        return JSON.parse(jsonString) as T;
      }
      return defaultValue;
    } catch (error) {
      console.error(`获取对象失败 [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * 删除指定键
   */
  delete(key: string): void {
    this.mmkv.delete(key);
  }

  /**
   * 清空所有数据
   */
  clearAll(): void {
    this.mmkv.clearAll();
  }

  /**
   * 获取所有键名（用于调试）
   */
  getAllKeys(): string[] {
    return this.mmkv.getAllKeys();
  }

  /**
   * 获取原始值（用于调试，自动检测类型）
   */
  getRawValue(key: string): { value: any; type: string } {
    // 尝试获取字符串
    const strValue = this.mmkv.getString(key);
    if (strValue !== undefined) {
      // 尝试解析为 JSON
      try {
        const parsed = JSON.parse(strValue);
        return { value: parsed, type: 'object' };
      } catch {
        return { value: strValue, type: 'string' };
      }
    }

    // 尝试获取数字
    const numValue = this.mmkv.getNumber(key);
    if (numValue !== undefined) {
      return { value: numValue, type: 'number' };
    }

    // 尝试获取布尔值
    const boolValue = this.mmkv.getBoolean(key);
    if (boolValue !== undefined) {
      return { value: boolValue, type: 'boolean' };
    }

    return { value: undefined, type: 'unknown' };
  }

  // 设置组共享数据
  async setGroup(key: string, data: string) {
    try {
      await SharedGroupPreferences.setItem(key, data, appGroupIdentifier);
    } catch (errorCode) {
      console.log(errorCode);
    }
  }

  // 获取组共享数据
  async getGroup(key: string) {
    try {
      return await SharedGroupPreferences.getItem(key, appGroupIdentifier);
    } catch (errorCode) {
      console.log(errorCode);
    }
  }
}

// 导出默认实例
export const storage = new StorageManager();
