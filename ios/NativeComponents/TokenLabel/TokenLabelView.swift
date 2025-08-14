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
    // application | category | webDomain
    @objc var tokenType: NSString? { didSet { updateContentIfPossible() } }
    // icon | title
    @objc var display: NSString? { didSet { updateContentIfPossible() } }

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
        // Determine kind and display mode
        let kind = (tokenType as String?) ?? "application"
        let displayMode = (display as String?) ?? "icon"

        // Try to get token either from base64 or by hash from saved selection
        var anyView: AnyView?

        let dimension = CGFloat(truncating: size)

        func applyStyle<V: View>(_ view: V) -> AnyView {
            switch displayMode {
            case "title":
                return AnyView(view.labelStyle(.titleOnly).frame(width: dimension, height: dimension))
            default:
                return AnyView(view.labelStyle(.iconOnly).frame(width: dimension, height: dimension))
            }
        }

        // Prefer tokenBase64 if provided
        if let base64 = tokenBase64 as String?, let data = Data(base64Encoded: base64) {
            let decoder = JSONDecoder()
            switch kind {
            case "category":
                if let token = try? decoder.decode(ActivityCategoryToken.self, from: data) {
                    anyView = applyStyle(Label(token))
                }
            case "webDomain":
                if let token = try? decoder.decode(WebDomainToken.self, from: data) {
                    anyView = applyStyle(Label(token))
                }
            default:
                if let token = try? decoder.decode(ApplicationToken.self, from: data) {
                    anyView = applyStyle(Label(token))
                }
            }
        } else if let tokenHashStr = tokenHash as String?, let selection = loadSelection() {
            switch kind {
            case "category":
                if let token = selection.categoryTokens.first(where: { "\($0.hashValue)" == tokenHashStr }) {
                    anyView = applyStyle(Label(token))
                }
            case "webDomain":
                if let token = selection.webDomainTokens.first(where: { "\($0.hashValue)" == tokenHashStr }) {
                    anyView = applyStyle(Label(token))
                }
            default:
                if let token = selection.applicationTokens.first(where: { "\($0.hashValue)" == tokenHashStr }) {
                    anyView = applyStyle(Label(token))
                }
            }
        }

        guard let swiftUIView = anyView else { return }

        let controller = UIHostingController(rootView: swiftUIView)
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


