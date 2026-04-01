import Foundation

func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
  if !condition() {
    fputs("Assertion failed: \(message)\n", stderr)
    exit(1)
  }
}

func testActiveSessionProducesActiveSnapshot() {
  let session = FocusSessionRecord(
    sessionId: "session-1",
    planId: "plan-1",
    windowId: "window-1",
    focusType: "periodic",
    mode: "shield",
    entrySource: "schedule",
    state: .active,
    startAt: 1_000,
    endAt: 1_600,
    totalMinutes: 10,
    pausedUntil: nil,
    recordId: "record-1",
    endReason: nil
  )

  let snapshot = FocusSnapshotResolver.resolve(
    now: 1_120,
    session: session,
    currentWindow: FocusWindowRecord(
      windowId: "window-1",
      planId: "plan-1",
      startAt: 1_000,
      endAt: 1_600,
      state: .active,
      skipReason: nil
    ),
    storedWindow: nil,
    isShielding: true,
    planName: "测试计划"
  )

  expect(snapshot.hasActiveSession == true, "active session should be active")
  expect(snapshot.isPaused == false, "active session should not be paused")
  expect(snapshot.isWindowLocked == true, "active session should lock current window")
  expect(snapshot.lockReason == "active_session", "active session should report active_session lock")
  expect(snapshot.planId == "plan-1", "snapshot should expose session plan id")
  expect(snapshot.recordId == "record-1", "snapshot should expose record id")
  expect(snapshot.actualMinutes == 2, "elapsed minutes should be floored by whole minutes")
}

func testPausedSessionProducesPausedSnapshot() {
  let session = FocusSessionRecord(
    sessionId: "session-2",
    planId: "plan-2",
    windowId: nil,
    focusType: "once",
    mode: "shield",
    entrySource: "quick_start",
    state: .paused,
    startAt: 2_000,
    endAt: 2_900,
    totalMinutes: 15,
    pausedUntil: 2_200,
    recordId: nil,
    endReason: nil
  )

  let snapshot = FocusSnapshotResolver.resolve(
    now: 2_050,
    session: session,
    currentWindow: nil,
    storedWindow: nil,
    isShielding: false,
    planName: nil
  )

  expect(snapshot.hasActiveSession == true, "paused session should still count as active session")
  expect(snapshot.isPaused == true, "paused session should be flagged paused")
  expect(snapshot.pausedUntil == 2_200, "paused snapshot should expose paused until")
}

func testSkippedWindowDoesNotLockCurrentWindow() {
  let currentWindow = FocusWindowRecord(
    windowId: "window-3",
    planId: "plan-3",
    startAt: 3_000,
    endAt: 3_900,
    state: .active,
    skipReason: nil
  )

  let storedWindow = FocusWindowRecord(
    windowId: "window-3",
    planId: "plan-3",
    startAt: 3_000,
    endAt: 3_900,
    state: .skipped,
    skipReason: .quotaInsufficient
  )

  let snapshot = FocusSnapshotResolver.resolve(
    now: 3_100,
    session: nil,
    currentWindow: currentWindow,
    storedWindow: storedWindow,
    isShielding: false,
    planName: "跳过窗口"
  )

  expect(snapshot.hasActiveSession == false, "skipped window should not create active session")
  expect(snapshot.isWindowLocked == false, "skipped window should not block one-off task creation")
  expect(snapshot.windowState == "skipped", "snapshot should expose skipped window state")
  expect(snapshot.endReason == "quota_insufficient", "snapshot should expose skip reason")
}

func testUnskippedCurrentWindowStillLocks() {
  let currentWindow = FocusWindowRecord(
    windowId: "window-4",
    planId: "plan-4",
    startAt: 4_000,
    endAt: 4_900,
    state: .active,
    skipReason: nil
  )

  let snapshot = FocusSnapshotResolver.resolve(
    now: 4_100,
    session: nil,
    currentWindow: currentWindow,
    storedWindow: nil,
    isShielding: false,
    planName: "未跳过窗口"
  )

  expect(snapshot.isWindowLocked == true, "current periodic window should still lock once tasks")
  expect(snapshot.lockReason == "plan_window", "window lock should report plan_window")
}

func testActualMinutesCountsCrossedMinuteBoundary() {
  let session = FocusSessionRecord(
    sessionId: "session-5",
    planId: "plan-5",
    windowId: nil,
    focusType: "once",
    mode: "shield",
    entrySource: "quick_start",
    state: .active,
    startAt: 659,
    endAt: 1_200,
    totalMinutes: 10,
    pausedUntil: nil,
    recordId: "record-5",
    endReason: nil
  )

  let snapshot = FocusSnapshotResolver.resolve(
    now: 660,
    session: session,
    currentWindow: nil,
    storedWindow: nil,
    isShielding: true,
    planName: "整分边界"
  )

  expect(snapshot.actualMinutes == 1, "crossing into next wall-clock minute should count as 1 minute")
}

@main
struct FocusStateTestsRunner {
  static func main() {
    testActiveSessionProducesActiveSnapshot()
    testPausedSessionProducesPausedSnapshot()
    testSkippedWindowDoesNotLockCurrentWindow()
    testUnskippedCurrentWindowStillLocks()
    testActualMinutesCountsCrossedMinuteBoundary()
    print("FocusStateTests passed")
  }
}
