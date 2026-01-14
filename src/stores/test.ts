import { create } from 'zustand';
import { createComputed } from 'zustand-computed';
import { combine } from 'zustand/middleware';

const baseStateCreator = combine(
  {
    problem: 'video',
    test_val: { key1: 'test1' },
  },
  (set, get) => ({
    setTestVal: (val: any) => {
      set({ test_val: { ...get().test_val, ...val } });
    },
    setProblem: (problem: string) => {
      set({ problem });
    },
  }),
);

type BaseState = ReturnType<typeof baseStateCreator>;

// 定义计算属性
const withComputed = createComputed((state: BaseState) => {
  return {
    test_val_str: Object.values(state.test_val).join('#'),
  };
});

const store = create(withComputed(baseStateCreator));

export default store;
