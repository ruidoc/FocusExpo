import Foundation

enum FocusSessionState: String, Codable {
  case active
  case paused
  case stopped
}

enum FocusWindowState: String, Codable {
  case active
  case skipped
}

enum FocusEndReason: String, Codable {
  case completed = "completed"
  case quotaInsufficient = "quota_insufficient"
  case userExit = "user_exit"
}

struct FocusSessionRecord: Codable {
  let sessionId: String
  let planId: String?
  let windowId: String?
  let focusType: String
  let mode: String
  let entrySource: String
  var state: FocusSessionState
  let startAt: TimeInterval
  let endAt: TimeInterval
  let totalMinutes: Int
  var pausedUntil: TimeInterval?
  var recordId: String?
  var endReason: FocusEndReason?
}

struct FocusWindowRecord: Codable {
  let windowId: String
  let planId: String
  let startAt: TimeInterval
  let endAt: TimeInterval
  var state: FocusWindowState
  var skipReason: FocusEndReason?
}

struct FocusResolvedSnapshot {
  let hasActiveSession: Bool
  let isPaused: Bool
  let isShielding: Bool
  let isWindowLocked: Bool
  let lockReason: String?
  let startAt: TimeInterval
  let endAt: TimeInterval
  let totalMinutes: Int
  let actualMinutes: Int
  let focusType: String?
  let planId: String?
  let planName: String?
  let focusMode: String?
  let recordId: String?
  let pausedUntil: TimeInterval?
  let sessionId: String?
  let sessionState: String?
  let windowId: String?
  let windowState: String?
  let endReason: String?
}

enum FocusStateStore {
  static let sessionKey = "FocusOne.Session.Current"
  static let windowKey = "FocusOne.Window.Current"

  static func makeSessionId() -> String {
    UUID().uuidString.lowercased()
  }

  static func makeWindowId(planId: String, startAt: TimeInterval, endAt: TimeInterval) -> String {
    "\(planId)#\(Int(startAt))#\(Int(endAt))"
  }

  static func loadSession(defaults: UserDefaults) -> FocusSessionRecord? {
    guard let data = defaults.data(forKey: sessionKey) else { return nil }
    return try? JSONDecoder().decode(FocusSessionRecord.self, from: data)
  }

  static func saveSession(_ session: FocusSessionRecord, defaults: UserDefaults) {
    guard let data = try? JSONEncoder().encode(session) else { return }
    defaults.set(data, forKey: sessionKey)
  }

  static func clearSession(defaults: UserDefaults) {
    defaults.removeObject(forKey: sessionKey)
  }

  static func loadWindow(defaults: UserDefaults) -> FocusWindowRecord? {
    guard let data = defaults.data(forKey: windowKey) else { return nil }
    return try? JSONDecoder().decode(FocusWindowRecord.self, from: data)
  }

  static func saveWindow(_ window: FocusWindowRecord, defaults: UserDefaults) {
    guard let data = try? JSONEncoder().encode(window) else { return }
    defaults.set(data, forKey: windowKey)
  }

  static func clearWindow(defaults: UserDefaults) {
    defaults.removeObject(forKey: windowKey)
  }

  static func elapsedMinutes(
    startAt: TimeInterval,
    now: TimeInterval,
    endAt: TimeInterval,
    totalMinutes: Int
  ) -> Int {
    guard startAt > 0, totalMinutes > 0 else { return 0 }

    let clampedNow = max(startAt, min(now, endAt))
    let startMinuteBucket = Int(floor(startAt / 60.0))
    let currentMinuteBucket = Int(floor(clampedNow / 60.0))
    let crossedMinutes = max(0, currentMinuteBucket - startMinuteBucket)

    return max(0, min(totalMinutes, crossedMinutes))
  }
}

enum FocusSnapshotResolver {
  static func resolve(
    now: TimeInterval,
    session: FocusSessionRecord?,
    currentWindow: FocusWindowRecord?,
    storedWindow: FocusWindowRecord?,
    isShielding: Bool,
    planName: String?
  ) -> FocusResolvedSnapshot {
    let matchedSkippedWindow =
      currentWindow != nil &&
      storedWindow?.state == .skipped &&
      storedWindow?.windowId == currentWindow?.windowId

    let sessionStillValid: Bool
    if let session {
      switch session.state {
      case .active:
        sessionStillValid = now < session.endAt
      case .paused:
        sessionStillValid = now < session.endAt || (session.pausedUntil ?? 0) > now
      case .stopped:
        sessionStillValid = false
      }
    } else {
      sessionStillValid = false
    }

    let hasActiveSession = sessionStillValid
    let isPaused = session?.state == .paused && (session?.pausedUntil ?? 0) > now && !isShielding
    let isWindowLocked = hasActiveSession || (currentWindow != nil && !matchedSkippedWindow)
    let lockReason: String? = hasActiveSession
      ? "active_session"
      : ((currentWindow != nil && !matchedSkippedWindow) ? "plan_window" : nil)

    let actualMinutes: Int
    if let session {
      actualMinutes = FocusStateStore.elapsedMinutes(
        startAt: session.startAt,
        now: now,
        endAt: session.endAt,
        totalMinutes: session.totalMinutes
      )
    } else {
      actualMinutes = 0
    }

    let effectivePlanId = session?.planId ?? currentWindow?.planId ?? storedWindow?.planId
    let effectiveWindowId = currentWindow?.windowId ?? storedWindow?.windowId ?? session?.windowId
    let effectiveWindowState: String? = {
      if matchedSkippedWindow { return FocusWindowState.skipped.rawValue }
      if let currentWindow { return currentWindow.state.rawValue }
      if let storedWindow { return storedWindow.state.rawValue }
      return nil
    }()
    let effectiveEndReason = matchedSkippedWindow
      ? storedWindow?.skipReason?.rawValue
      : session?.endReason?.rawValue

    return FocusResolvedSnapshot(
      hasActiveSession: hasActiveSession,
      isPaused: isPaused,
      isShielding: isShielding,
      isWindowLocked: isWindowLocked,
      lockReason: lockReason,
      startAt: session?.startAt ?? 0,
      endAt: session?.endAt ?? 0,
      totalMinutes: session?.totalMinutes ?? 0,
      actualMinutes: actualMinutes,
      focusType: session?.focusType,
      planId: effectivePlanId,
      planName: planName,
      focusMode: session?.mode,
      recordId: session?.recordId,
      pausedUntil: isPaused ? session?.pausedUntil : nil,
      sessionId: session?.sessionId,
      sessionState: session?.state.rawValue,
      windowId: effectiveWindowId,
      windowState: effectiveWindowState,
      endReason: effectiveEndReason
    )
  }
}
