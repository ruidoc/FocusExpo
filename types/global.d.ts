// 全局类型声明

// 扩展全局命名空间
declare global {
  // 添加全局接口
  interface Window {
    myGlobalVariable: string;
  }

  interface HttpRes {
    statusCode: number;
    token?: string;
    message?: string;
    data?: any;
  }

  // 添加全局变量
  const APP_VERSION: string;
}

// 这个导出是必须的，让TypeScript将此文件视为模块
export {};
