/**
 * ObjectId 与 UUID v5 映射工具
 * 
 * 由于 Superwall iOS SDK 要求 userId 必须是 UUID 格式，
 * 而我们的业务使用 MongoDB ObjectId（24位16进制字符串），
 * 因此需要将 ObjectId 映射为 UUID v5（确定性 UUID）。
 * 
 * 同一个 ObjectId 始终映射到同一个 UUID v5，服务端可以反向查找。
 */

import { v5 as uuidv5 } from 'uuid';

/**
 * Superwall UUID 命名空间（固定值）
 * 使用一个固定的 UUID 作为命名空间，确保所有 ObjectId 映射的一致性
 */
const SUPERWALL_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID v5 DNS namespace

/**
 * 将 ObjectId 转换为 UUID v5
 * 
 * @param objectId - MongoDB ObjectId（24位16进制字符串）
 * @returns UUID v5 格式的字符串
 * 
 * @example
 * ```ts
 * const uuid = objectIdToUuid('507f1f77bcf86cd799439011');
 * // 返回: '550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function objectIdToUuid(objectId: string): string {
  if (!objectId || typeof objectId !== 'string') {
    throw new Error('ObjectId must be a non-empty string');
  }

  // UUID v5 基于命名空间和输入字符串生成确定性 UUID
  // 同一个 ObjectId 总是生成同一个 UUID
  return uuidv5(objectId, SUPERWALL_NAMESPACE);
}

/**
 * 判断字符串是否为 UUID 格式
 * 
 * @param str - 待检查的字符串
 * @returns 是否为 UUID 格式
 */
export function isUuid(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * 判断字符串是否为 ObjectId 格式（24位16进制）
 * 
 * @param str - 待检查的字符串
 * @returns 是否为 ObjectId 格式
 */
export function isObjectId(str: string): boolean {
  return /^[0-9a-f]{24}$/i.test(str);
}
