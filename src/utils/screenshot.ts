import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * 保存图片到相册
 * @param uri 图片文件路径
 * @param filename 文件名（可选）
 * @returns Promise<boolean> 是否保存成功
 */
export const saveToAlbum = async (
  uri: string,
  filename?: string,
): Promise<boolean> => {
  try {
    // 请求相册权限
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要相册权限来保存图片');
      return false;
    }

    // 保存到相册
    const asset = await MediaLibrary.createAssetAsync(uri);

    // 创建或获取相册
    const albumName = 'FocusExpo';
    let album = await MediaLibrary.getAlbumAsync(albumName);

    if (album == null) {
      // 如果相册不存在，创建新相册
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      // 如果相册存在，添加到现有相册
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    Alert.alert('保存成功', `图片已保存到相册"${albumName}"`);
    return true;
  } catch (error) {
    console.error('保存到相册失败:', error);
    Alert.alert('保存失败', '无法保存图片到相册');
    return false;
  }
};

/**
 * 分享图片
 * @param uri 图片文件路径
 * @returns Promise<boolean> 是否分享成功
 */
export const shareImage = async (uri: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert('分享不可用', '当前设备不支持分享功能');
      return false;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      dialogTitle: '分享截图',
    });

    return true;
  } catch (error) {
    console.error('分享失败:', error);
    Alert.alert('分享失败', '无法分享图片');
    return false;
  }
};

/**
 * 截图并保存到相册
 * @param captureFunction 截图函数，返回 Promise<string>
 * @param filename 文件名（可选）
 * @returns Promise<boolean> 是否保存成功
 */
export const captureAndSave = async (
  captureFunction: () => Promise<string | undefined>,
  filename?: string,
): Promise<boolean> => {
  try {
    const uri = await captureFunction();
    if (!uri) {
      Alert.alert('截图失败', '无法生成截图');
      return false;
    }

    return await saveToAlbum(uri, filename);
  } catch (error) {
    console.error('截图保存失败:', error);
    Alert.alert('操作失败', '截图或保存过程中出现错误');
    return false;
  }
};

/**
 * 截图并分享
 * @param captureFunction 截图函数，返回 Promise<string>
 * @returns Promise<boolean> 是否分享成功
 */
export const captureAndShare = async (
  captureFunction: () => Promise<string | undefined>,
): Promise<boolean> => {
  try {
    const uri = await captureFunction();
    if (!uri) {
      Alert.alert('截图失败', '无法生成截图');
      return false;
    }

    return await shareImage(uri);
  } catch (error) {
    console.error('截图分享失败:', error);
    Alert.alert('操作失败', '截图或分享过程中出现错误');
    return false;
  }
};
