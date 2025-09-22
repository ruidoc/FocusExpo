import http from '@/utils/request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from 'mobx';

interface OnboardingState {
  // 用户选择的问题类型
  problem: 'short_video' | 'game' | 'study';
  mode: 'shield' | 'focus';
  // 后续可以添加更多引导页的状态
}

class GuideStore {
  constructor() {
    makeAutoObservable(this);
    this.init();
  }
  // 用户选择的问题类型
  problem: OnboardingState['problem'] = null;
  // 用户设置的目标
  selected_apps: string[] = [];
  // 当前选中的应用名称（仅内存临时使用，不持久化不上传）
  selectedAppName: string = '';
  // 专注模式
  mode: OnboardingState['mode'] = 'shield';
  // 是否完成未登录引导
  unloginComplete = false;
  // 是否完成引导
  isComplete = false;
  // 用户id
  user_id: string = '';
  // 引导id
  guide_id: string = '';
  // 当前步骤
  currentStep: string = 'step0';

  getProblemLable = () => {
    switch (this.problem) {
      case 'short_video':
        return '短视频';
      case 'game':
        return '游戏';
      case 'study':
        return '学习';
    }
  };

  init = async () => {
    try {
      const state = await AsyncStorage.getItem('onboarding_state');
      if (state) {
        const parsed = JSON.parse(state);
        this.guide_id = parsed.guide_id;
        this.problem = parsed.problem;
        this.selected_apps = parsed.selected_apps || [];
        this.mode = parsed.mode || 'shield';
        this.isComplete = parsed.isComplete;
        this.unloginComplete = parsed.unloginComplete;
        this.currentStep = parsed.currentStep || 'step1';
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  };

  get currentStepIndex() {
    return parseInt(this.currentStep.slice(-1), 10);
  }

  setProblem = (type: string) => {
    this.problem = type as OnboardingState['problem'];
    this.mode = this.problem === 'study' ? 'focus' : 'shield';
    this.saveState();
  };

  setMode = (mode: OnboardingState['mode']) => {
    this.mode = mode;
    this.saveState();
  };

  setGuideId = (id: string) => {
    this.guide_id = id;
    this.saveState();
  };

  setSelectedApps = (apps: string[]) => {
    this.selected_apps = apps;
    this.saveState();
  };

  // 只做内存赋值，不做持久化和上传
  setSelectedAppName = (appName: string) => {
    this.selectedAppName = appName;
  };

  setCurrentStep = (step: string) => {
    this.currentStep = step;
    this.saveState();
  };

  completeOnboarding = () => {
    this.isComplete = true;
    this.saveState();
  };

  completeUnlogin = () => {
    this.unloginComplete = true;
    this.saveState();
  };

  private saveState = async () => {
    try {
      await AsyncStorage.setItem(
        'onboarding_state',
        JSON.stringify({
          guide_id: this.guide_id,
          mode: this.mode,
          problem: this.problem,
          selected_apps: this.selected_apps,
          isComplete: this.isComplete,
          unloginComplete: this.unloginComplete,
          currentStep: this.currentStep,
        }),
      );
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };

  // 创建引导记录
  createGuide = async (fun?: (data?: any) => void) => {
    try {
      const res: any = await http.post('/guide', {
        id: this.guide_id,
        problem: this.problem,
        mode: this.mode,
        selected_apps: this.selected_apps,
        current_step: this.currentStep,
      });
      this.setGuideId(res.id);
      if (fun) fun(res);
    } catch (error) {
      console.log(error);
      if (fun) fun();
    }
  };

  // 更新引导记录
  updateGuide = async (fun?: (data?: any) => void) => {
    if (!this.guide_id) return;
    try {
      const res: any = await http.put(`/guide/${this.guide_id}`, {
        problem: this.problem,
        mode: this.mode,
        selected_apps: this.selected_apps,
        current_step: this.currentStep,
      });
      if (fun) fun(res);
    } catch (error) {
      console.log(error);
      if (fun) fun();
    }
  };
}

const store = new GuideStore();

export default store;
