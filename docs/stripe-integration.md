# Stripe 支付集成指南

本文档说明如何在 FocusExpo 项目中使用 Stripe PaymentSheet 进行支付。

## 概述

### 支付架构

| 支付方式       | 用途           | 端点                                 |
| -------------- | -------------- | ------------------------------------ |
| Stripe Web     | Web 端支付     | `/stripe/webhook` (Checkout Session) |
| **Stripe iOS** | iOS App 支付   | `/stripe/ios/create-payment`         |
| 微信支付       | APP/扫码支付   | `/payment/wechat/*`                  |
| 支付宝         | APP/PC 支付    | `/payment/alipay/*`                  |
| IAP            | App Store 内购 | Superwall 管理                       |

### iOS Stripe 支付流程

```
客户端                          服务端                          Stripe
   │                              │                              │
   │──1. 请求创建支付 ──────────>│                              │
   │   POST /stripe/ios/          │──2. 创建 Customer ────────>│
   │   create-payment       │<─── Customer ID ───────────│
   │                              │──3. 创建 CustomerSession ─>│
   │                              │<── CustomerSession Secret ─│
   │                              │──4. 创建 PaymentIntent ───>│
   │                              │<── PaymentIntent Secret ───│
   │<─5. 返回支付参数 ────────────│                              │
   │                              │                              │
   │──6. 初始化 PaymentSheet ─────────────────────────────────>│
   │──7. 用户完成支付 ────────────────────────────────────────>│
   │<─8. 支付结果 ────────────────────────────────────────────│
   │                              │                              │
   │                              │<─9. Webhook 通知 ──────────│
   │                              │   payment_intent.succeeded  │
   │                              │──10. 创建订单/订阅 ───────>│
```

## 客户端配置

### 1. 配置 StripeProvider

编辑 `src/components/providers/StripeProvider.tsx`，替换 `STRIPE_PUBLISHABLE_KEY`：

### 2. 使用 useStripePayment Hook

```typescript
import { useStripePayment } from '@/utils/stripe';

const MyComponent = () => {
  const { checkout, loading } = useStripePayment();

  const handlePayment = async () => {
    const result = await checkout({
      amount: 1999,         // 金额（单位：分）
      currency: 'cny',      // 货币
      productId: 'vip_001', // 商品 ID
      productName: '月度会员', // 商品名称
    });

    if (result.success) {
      // 支付成功
      console.log('支付完成');
    } else if (result.canceled) {
      // 用户取消
      console.log('用户取消支付');
    } else {
      // 支付失败
      console.error('支付失败:', result.error);
    }
  };

  return (
    <Button onPress={handlePayment} loading={loading}>
      立即支付
    </Button>
  );
};
```

## 服务端实现（已完成）

服务端代码已经在 FocusApi 项目中实现，位于 `src/shared/payment/stripe/` 目录。

### API 端点

#### POST `/stripe/ios/create-payment`

创建 iOS PaymentSheet 所需参数。

**请求参数：**

```typescript
{
  amount: number;       // 金额（单位：分）
  currency?: string;    // 货币，默认 'cny'
  productId?: string;   // 商品 ID
  productName?: string; // 商品名称
  period?: number;      // 订阅周期（月）
}
```

**响应：**

```typescript
{
  data: {
    paymentIntent: string; // PaymentIntent client_secret
    customerSessionClientSecret: string; // CustomerSession client_secret
    customer: string; // Stripe Customer ID
    publishableKey: string; // Stripe publishable key
  }
}
```

### Webhook 处理

Webhook 端点：`POST /stripe/webhook`

自动处理以下事件：

- `payment_intent.succeeded` - iOS PaymentSheet 支付成功，自动创建订单和订阅
- `payment_intent.payment_failed` - 支付失败记录
- `checkout.session.completed` - Web 端支付（已有逻辑，不受影响）

### 数据库变更

`users` 表新增字段：

- `stripe_id` - Stripe 客户 ID

## iOS 配置

### URL Scheme 配置

`app.json` 已配置 `scheme: ["focusone"]`，无需额外配置。

### Apple Pay 配置（可选）

如需支持 Apple Pay：

1. 在 Apple Developer 后台创建 Merchant ID
2. 配置 `app.json` 中的 `merchantIdentifier`
3. 在 Stripe Dashboard 配置 Apple Pay

## 测试

### 测试卡号

| 卡号                | 说明           |
| ------------------- | -------------- |
| 4242 4242 4242 4242 | 成功支付       |
| 4000 0000 0000 3220 | 需要 3D Secure |
| 4000 0000 0000 9995 | 余额不足       |

### 访问测试页面

导航到 `/checkout` 页面即可测试支付流程。

## 常见问题

### Q: PaymentSheet 不显示？

检查：

1. `STRIPE_PUBLISHABLE_KEY` 是否正确配置
2. 服务端是否正确返回 `paymentIntent` client_secret
3. 控制台是否有错误日志

### Q: 3D Secure 认证后无法返回应用？

确保：

1. `app.json` 中 `scheme` 已配置
2. `StripeProvider` 中 `urlScheme` 参数正确
3. `initPaymentSheet` 中 `returnURL` 格式正确

### Q: 支付成功但订单未创建？

Webhook 处理失败，检查：

1. Webhook 端点是否正确配置
2. Webhook 签名验证是否通过
3. 服务端日志是否有错误

## 参考链接

- [Stripe React Native SDK](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Stripe API 文档](https://stripe.com/docs/api)
- [Stripe Webhook](https://stripe.com/docs/webhooks)

## 文件清单

### 客户端 (FocusExpo)

| 文件                                          | 说明                     |
| --------------------------------------------- | ------------------------ |
| `src/components/providers/StripeProvider.tsx` | Stripe SDK 初始化        |
| `src/utils/stripe.ts`                         | useStripePayment Hook    |
| `app/checkout/index.tsx`                      | 支付示例页面             |
| `app/_layout.tsx`                             | 添加 StripeProvider 包裹 |
| `app.json`                                    | 添加 Stripe 插件配置     |

### 服务端 (FocusApi)

| 文件                                             | 说明                                   |
| ------------------------------------------------ | -------------------------------------- |
| `src/shared/payment/stripe/stripe.service.ts`    | 新增 iOS PaymentSheet 方法             |
| `src/shared/payment/stripe/stripe.controller.ts` | 新增 `/stripe/ios/create-payment` 端点 |
| `src/shared/payment/stripe/stripe.dto.ts`        | 新增请求/响应 DTO                      |
| `src/shared/payment/stripe/stripe.module.ts`     | 导入 UserModule, SubscriptionModule    |
| `src/shared/database/entities/user.entity.ts`    | 新增 `stripe_id` 字段                  |
