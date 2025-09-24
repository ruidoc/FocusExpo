import Foundation
import UIKit
import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

private enum TokenLabelConstants {
    static let baseIconSize: CGFloat = 20
}

@available(iOS 16.0, *)
private struct TokenLabelStyle: LabelStyle {
    let targetDimension: CGFloat
    let displayMode: String

    private var safeDimension: CGFloat { max(targetDimension, 1) }
    private var baseIconSize: CGFloat { TokenLabelConstants.baseIconSize }

    func makeBody(configuration: Configuration) -> some View {
        let scale = safeDimension / baseIconSize

        let iconOnlyContent = HStack(spacing: 0) {
            configuration.icon
                .scaleEffect(scale, anchor: .center)
                .frame(width: safeDimension, height: safeDimension)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(maxHeight: .infinity, alignment: .center)

        switch displayMode {
        case "title":
            return AnyView(
                VStack(spacing: 4) {
                    iconOnlyContent
                    configuration.title
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, alignment: .center)
            )
        default:
            return AnyView(iconOnlyContent)
        }
    }
}

@available(iOS 16.0, *)
@objc class TokenLabelView: UIView {
    @objc var tokenBase64: NSString? { didSet { updateContentIfPossible() } }
    @objc var size: NSNumber? { didSet { updateContentIfPossible() } }
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
        let dimension = size.map { CGFloat(truncating: $0) } ?? TokenLabelConstants.baseIconSize

        let decoder = JSONDecoder()
        var anyView: AnyView?

        if let base64 = tokenBase64 as String?, let data = Data(base64Encoded: base64) {
            switch kind {
            case "category":
                if let token = try? decoder.decode(ActivityCategoryToken.self, from: data) {
                    anyView = AnyView(Label(token).labelStyle(TokenLabelStyle(targetDimension: dimension, displayMode: displayMode)))
                }
            case "webDomain":
                if let token = try? decoder.decode(WebDomainToken.self, from: data) {
                    anyView = AnyView(Label(token).labelStyle(TokenLabelStyle(targetDimension: dimension, displayMode: displayMode)))
                }
            default:
                if let token = try? decoder.decode(ApplicationToken.self, from: data) {
                    anyView = AnyView(Label(token).labelStyle(TokenLabelStyle(targetDimension: dimension, displayMode: displayMode)))
                }
            }
        }

        guard let swiftUIView = anyView else {
            hostingController?.view.removeFromSuperview()
            hostingController = nil
            return
        }

        invalidateIntrinsicContentSize()

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

    override var intrinsicContentSize: CGSize {
        let dimension = size.map { CGFloat(truncating: $0) } ?? TokenLabelConstants.baseIconSize
        return CGSize(width: dimension, height: dimension)
    }
}



