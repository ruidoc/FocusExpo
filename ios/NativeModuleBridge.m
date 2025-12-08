#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NativeModule, RCTEventEmitter)
// 请求屏幕使用时间权限
RCT_EXTERN_METHOD(requestScreenTimePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 检查屏幕使用时间权限状态
RCT_EXTERN_METHOD(checkScreenTimePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 选择APP并返回列表
RCT_EXTERN_METHOD(selectAppsToLimit:(nonnull NSNumber *)maxCount apps:(nonnull NSString *)apps resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 开始应用限制（仅一次性任务屏蔽）
RCT_EXTERN_METHOD(startAppLimits:(nonnull NSNumber *)durationMinutes planId:(nullable NSString *)planId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 停止应用限制（通用）
RCT_EXTERN_METHOD(stopAppLimits:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 暂停应用限制（通用）
RCT_EXTERN_METHOD(pauseAppLimits:(nullable NSNumber *)durationMinutes resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 恢复应用限制（通用）
RCT_EXTERN_METHOD(resumeAppLimits:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 获取专注状态，返回当前屏蔽信息
RCT_EXTERN_METHOD(getFocusStatus:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

// 增量更新单个计划
RCT_EXTERN_METHOD(updatePlan:(NSString *)planJSON resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
// 删除单个计划
RCT_EXTERN_METHOD(deletePlan:(NSString *)planId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end