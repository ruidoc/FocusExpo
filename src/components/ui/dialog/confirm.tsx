import React, { createContext, useContext, useState } from 'react';
import DialogComponent from './component';

interface DialogConfig {
  title?: string;
  message?: string;
  buttonReverse?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

type DialogAction = 'confirm' | 'cancel';

interface DialogContextType {
  showDialog: (
    config: DialogConfig,
  ) => Promise<DialogAction>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig>({});
  const [resolve, setResolve] = useState<
    ((value: DialogAction) => void) | null
  >(null);

  const showDialog = (
    dialogConfig: DialogConfig,
  ): Promise<DialogAction> => {
    return new Promise(res => {
      setConfig(dialogConfig);
      setVisible(true);
      setResolve(() => res);
    });
  };

  const handleConfirm = () => {
    setVisible(false);
    resolve?.('confirm');
    setTimeout(() => {
      setConfig({});
      setResolve(null);
    }, 300);
  };

  const handleCancel = () => {
    setVisible(false);
    resolve?.('cancel');
    setTimeout(() => {
      setConfig({});
      setResolve(null);
    }, 300);
  };

  return (
    <DialogContext.Provider value={{ showDialog }}>
      {children}
      <DialogComponent
        visible={visible}
        title={config.title}
        showCancelButton={true}
        confirmButtonText={config.confirmButtonText || '确定'}
        cancelButtonText={config.cancelButtonText || '取消'}
        onPressConfirm={handleConfirm}
        onPressCancel={handleCancel}>
        {config.message && (
          <Text style={{ color: '#333', fontSize: 16, lineHeight: 24 }}>
            {config.message}
          </Text>
        )}
      </DialogComponent>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

// 全局 Dialog 实例（用于静态方法）
let globalDialogInstance: DialogContextType | null = null;

export const setGlobalDialogInstance = (instance: DialogContextType) => {
  globalDialogInstance = instance;
};

export const getGlobalDialogInstance = () => {
  return globalDialogInstance;
};

