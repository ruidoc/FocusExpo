export interface LiveFocusDeltaInput {
  active: boolean;
  paused: boolean;
  curplanMinute: number;
  currentRecordId?: string;
  snapshotRecordId?: string;
  snapshotCurplanMinute: number;
}

export function getLiveFocusDelta({
  active,
  paused,
  curplanMinute,
  currentRecordId,
  snapshotRecordId,
  snapshotCurplanMinute,
}: LiveFocusDeltaInput): number {
  if (!active || paused || !currentRecordId || curplanMinute <= 0) {
    return 0;
  }

  if (snapshotRecordId && snapshotRecordId === currentRecordId) {
    return Math.max(0, curplanMinute - snapshotCurplanMinute);
  }

  return curplanMinute;
}

export function addLiveFocusDelta(baseMinutes: number, delta: number): number {
  return Math.max(0, baseMinutes + Math.max(0, delta));
}
