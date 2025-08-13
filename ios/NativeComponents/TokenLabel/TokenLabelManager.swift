import Foundation
import React

@objc(TokenLabelManager)
class TokenLabelManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { true }

  override func view() -> UIView! {
    return TokenLabelView()
  }
}


