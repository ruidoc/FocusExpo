#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeModule, NSObject)
RCT_EXTERN_METHOD(requestScreenTimePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(checkScreenTimePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(selectAppsToLimit:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(startAppLimits:(nonnull NSNumber *)durationMinutes resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopAppLimits:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(renderAppLabelToImage:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end