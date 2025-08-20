interface UserInfo {
  id?: string;
  username: string;
  phone: string;
  password?: string;
  avatar: string;
  sex: number;
  openid: string;
}

interface CusPlan {
  id?: string;
  start: string;
  start_min: number;
  start_sec?: number;
  end: string;
  end_min: number;
  end_sec?: number;
  // 定时任务：使用多选周几（1..7，周一..周日），一次性任务仍使用 'once'
  repeat: 'once' | number[];
  mode: 'focus' | 'shield';
  is_pause?: boolean; // 是否暂停
}

interface RecordInfo {
  id?: string;
  start_plan: number;
  end_plan: number;
  exit_times: number[];
  mode: 'focus' | 'shield';
  start_at: Date;
  end_at: Date;
}

interface TodayStatis {
  exit_count: number;
  total_plan: number;
  total_real: number;
  total_exit: number;
}

/*
VPN 申请弹框出现，点击会触发 'open' 和 'refuse' 两个状态，表示同意或拒绝
同意之后，会启动 VPN，此时会触发 'start' 和 'notask' 两个状态，表示启动或没有任务
*/

type VpnState = 'open' | 'refuse' | 'start' | 'notask' | 'close' | 'continue';
