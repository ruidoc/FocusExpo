import Foundation
import UIKit
import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

@available(iOS 16.0, *)
@objc class TokenLabelView: UIView {
    @objc var tokenBase64: NSString? { didSet { updateContentIfPossible() } }
    @objc var tokenHash: NSString? { didSet { updateContentIfPossible() } }
    @objc var size: NSNumber = 40 { didSet { updateContentIfPossible() } }

    private var hostingController: UIHostingController<AnyView>?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor.clear
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = UIColor.clear
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        hostingController?.view.frame = bounds
    }

    private func updateContentIfPossible() {
        guard let tokenHashStr = tokenHash as String? else { return }
        guard let selection = loadSelection() else { return }
        guard let token = selection.applicationTokens.first(where: { "\($0.hashValue)" == tokenHashStr }) else { return }

        let dimension = CGFloat(truncating: size)
        let swiftUIView = Label(token)
            .labelStyle(.iconOnly)
            .frame(width: dimension, height: dimension)

        let controller = UIHostingController(rootView: AnyView(swiftUIView))
        controller.view.backgroundColor = UIColor.clear

        hostingController?.view.removeFromSuperview()
        hostingController = controller

        addSubview(controller.view)
        controller.view.frame = bounds
        controller.view.autoresizingMask = [UIView.AutoresizingMask.flexibleWidth, UIView.AutoresizingMask.flexibleHeight]
        setNeedsLayout()
        layoutIfNeeded()
    }

    private func loadSelection() -> FamilyActivitySelection? {
        guard let defaults = UserDefaults(suiteName: "group.com.focusone"),
              let data = defaults.data(forKey: "FocusOne.AppSelection"),
              let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
            return nil
        }
        return selection
    }
}


