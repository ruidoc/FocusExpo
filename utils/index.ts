import { Toast } from '@fruits-chain/react-native-xiaoshu';
import dayjs from 'dayjs';
import CodePush from 'react-native-code-push';

export const toast = (message: string) => {
  Toast({ message, position: 'bottom' });
};

export const checkCodePushUpdate = async () => {
  try {
    const update = await CodePush.checkForUpdate();
    if (update) {
      const downloadProgress = ({
        receivedBytes,
        totalBytes,
      }: {
        receivedBytes: number;
        totalBytes: number;
      }) => {
        // 处理下载进度
        const progress = (receivedBytes / totalBytes) * 100;
        console.log(`下载进度: ${progress}%`);
      };

      // 下载并安装更新
      await update.download(downloadProgress);
    }
  } catch (error) {
    console.error('CodePush 更新检查失败:', error);
  }
};

export const fenToYuan = (fen: number | string): string => {
  if (typeof fen === 'string') fen = parseInt(fen, 10);
  return (fen / 100).toFixed(2);
};

// 获取当前分钟数
export const getCurrentMinute = (more = false): number => {
  let today = dayjs();
  let now = today.hour() * 60 + today.minute();
  if (more && today.second() > 0) {
    now += 1;
  }
  return now;
};
