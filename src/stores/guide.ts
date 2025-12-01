import http from '@/utils/request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

interface OnboardingState {
  // 用户选择的问题类型
  problem: 'short_video' | 'game' | 'study';
  mode: 'shield' | 'focus';
  // 后续可以添加更多引导页的状态
}

const GuideStore = combine(
  {
    problem: null as OnboardingState['problem'] | null, // 用户选择的问题类型
    selected_apps: [] as string[], // 用户设置的目标
    selectedAppName: '' as string, // 当前选中的应用名称（仅内存临时使用，不持久化不上传）
    mode: 'shield' as OnboardingState['mode'], // 专注模式
    unloginComplete: false as boolean, // 是否完成未登录引导
    isComplete: false as boolean, // 是否完成引导
    user_id: '' as string, // 用户id
    guide_id: '' as string, // 引导id
    currentStep: 'step0' as string, // 当前步骤
  },
  (set, get) => ({
    getProblemLable: () => {
      switch (get().problem) {
        case 'short_video':
          return '短视频';
        case 'game':
          return '游戏';
        case 'study':
          return '学习';
      }
    },

    // Getter 方法改为普通函数
    currentStepIndex: () => {
      return parseInt(get().currentStep.slice(-1), 10);
    },

    init: async () => {
      try {
        const state = await AsyncStorage.getItem('onboarding_state');
        if (state) {
          const parsed = JSON.parse(state);
          set({
            guide_id: parsed.guide_id,
            problem: parsed.problem,
            selected_apps: parsed.selected_apps || [],
            mode: parsed.mode || 'shield',
            isComplete: parsed.isComplete,
            unloginComplete: parsed.unloginComplete,
            currentStep: parsed.currentStep || 'step1',
          });
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      }
    },

    setProblem: (type: string) => {
      const problem = type as OnboardingState['problem'];
      const mode = problem === 'study' ? 'focus' : 'shield';
      set({ problem, mode });
      (get() as any).saveState();
    },

    setMode: (mode: OnboardingState['mode']) => {
      set({ mode });
      (get() as any).saveState();
    },

    setGuideId: (id: string) => {
      set({ guide_id: id });
      (get() as any).saveState();
    },

    setSelectedApps: (apps: string[]) => {
      set({ selected_apps: apps });
      (get() as any).saveState();
    },

    // 只做内存赋值，不做持久化和上传
    setSelectedAppName: (appName: string) => {
      set({ selectedAppName: appName });
    },

    setCurrentStep: (step: string) => {
      set({ currentStep: step });
      (get() as any).saveState();
    },

    completeOnboarding: () => {
      set({ isComplete: true });
      (get() as any).saveState();
    },

    completeUnlogin: () => {
      set({ unloginComplete: true });
      (get() as any).saveState();
    },

    saveState: async () => {
      try {
        await AsyncStorage.setItem(
          'onboarding_state',
          JSON.stringify({
            guide_id: get().guide_id,
            mode: get().mode,
            problem: get().problem,
            selected_apps: get().selected_apps,
            isComplete: get().isComplete,
            unloginComplete: get().unloginComplete,
            currentStep: get().currentStep,
          }),
        );
      } catch (error) {
        console.error('Failed to save onboarding state:', error);
      }
    },

    // 创建引导记录
    createGuide: async (fun?: (data?: any) => void) => {
      try {
        const res: any = await http.post('/guide', {
          id: get().guide_id,
          problem: get().problem,
          mode: get().mode,
          selected_apps: get().selected_apps,
          current_step: get().currentStep,
        });
        (get() as any).setGuideId(res.id);
        if (fun) fun(res);
      } catch (error) {
        console.log(error);
        if (fun) fun();
      }
    },

    // 更新引导记录
    updateGuide: async (fun?: (data?: any) => void) => {
      if (!get().guide_id) return;
      try {
        const res: any = await http.put(`/guide/${get().guide_id}`, {
          problem: get().problem,
          mode: get().mode,
          selected_apps: get().selected_apps,
          current_step: get().currentStep,
        });
        if (fun) fun(res);
      } catch (error) {
        console.log(error);
        if (fun) fun();
      }
    },
  }),
);

const store = create(GuideStore);
// 初始化 store
store.getState().init();

export default store;
