#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(TokenLabelManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(tokenBase64, NSString)
RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(tokenType, NSString)
RCT_EXPORT_VIEW_PROPERTY(display, NSString)
@end


