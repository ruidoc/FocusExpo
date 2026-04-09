# 商业化埋点文档

> FocusExpo 订阅商业化埋点设计

---

## 设计原则

1. **按业务域分组**：统一收敛为 `paywall`、`purchase`、`restore`、`subscription` 四组。
2. **保持现有格式**：事件名与属性名统一使用 `snake_case`。
3. **自动补前缀**：代码中使用裸事件名，发送到 PostHog 时统一补齐为 `focus_xxx`。
4. **页面埋点前端打**：页面进入、点击、切换等 UI 行为由前端发送。
5. **非页面埋点服务端优先**：交易结果、订阅同步、状态变化、webhook 处理等优先由服务端发送。
6. **不单独拆 entitlement**：当前权益仍由订阅状态推导，通过 `subscription_*` 事件中的 `is_entitled` 表达即可。

---

## 分组概览

| 分组 | 含义 | 负责范围 | 触发端 |
|---|---|---|---|
| `paywall` | 付费墙页面行为 | 打开、关闭、切换套餐、点击购买 | 前端 |
| `purchase` | 真实购买交易 | 发起购买、购买成功、失败、取消 | 前端为主，成功结果服务端优先 |
| `restore` | 恢复购买流程 | 开始恢复、恢复完成、恢复失败 | 前端发起，结果服务端优先 |
| `subscription` | 订阅状态与同步 | 权益页、管理订阅、同步、状态变化、续费、到期、退款、webhook | 前端仅页面行为，其余服务端优先 |

---

## 数据流

```text
用户进入权益页
    ↓
【paywall / subscription 页面行为】
    ├─ rights_page_viewed
    ├─ paywall_opened
    ├─ paywall_product_selected
    └─ paywall_purchase_clicked
    ↓
用户发起购买
    ↓
【purchase 交易流】
    ├─ purchase_started
    ├─ purchase_cancelled
    ├─ purchase_failed
    └─ purchase_completed
    ↓
购买后同步订阅状态
    ↓
【restore / subscription 同步流】
    ├─ restore_started / restore_completed / restore_failed
    ├─ subscription_sync_started
    ├─ subscription_sync_completed
    └─ subscription_sync_failed
    ↓
Apple webhook / 后端状态处理
    ↓
【subscription 生命周期】
    ├─ subscription_webhook_processed
    ├─ subscription_status_changed
    ├─ subscription_renewed
    ├─ subscription_expired
    └─ subscription_refunded
```

---

## 公共字段

以下字段继续由现有 `trackEvent` 自动注入：

| 字段 | 说明 |
|---|---|
| `user_id` | 当前用户 ID |
| `app_version` | App 版本 |
| `app_env` | 当前环境 |
| `platform` | 平台 |
| `event_origin` | 事件来源 |
| `is_logged_in` | 是否已登录 |

---

## 字段规范

### 页面上下文字段

| 字段 | 说明 | 示例 |
|---|---|---|
| `screen_name` | 当前页面名 | `paywall_index` / `rights_page` |
| `entry_source` | 进入来源 | `rights_page` / `home_banner` / `onboarding` / `limit_reached` / `debug` |
| `placement` | 页面内埋点位 | `paywall_index` / `vip_upgrade_card` / `benefit_block` |

### 商品字段

| 字段 | 说明 | 示例 |
|---|---|---|
| `product_id` | 商品 ID | `com.focusone.vip_12` |
| `product_name` | 商品名称 | `年会员` |
| `period` | 周期值 | `7` / `1` / `3` / `12` |
| `price` | 原价 | `78` |
| `currency` | 货币 | `CNY` |

### 优惠字段

| 字段 | 说明 | 建议值 |
|---|---|---|
| `offer_type` | 优惠类型 | `none` / `free_trial` / `pay_as_you_go` / `pay_up_front` / `promotional` |
| `offer_price` | 优惠价 | `0` / `1` |
| `is_intro_offer_eligible` | 是否有首购资格 | `true` / `false` |

### 订阅字段

| 字段 | 说明 | 建议值 |
|---|---|---|
| `subscription_status` | 当前订阅状态 | `active` / `cancelled` / `expired` / `billing_retry` / `revoked` |
| `previous_status` | 变更前状态 | 同上 |
| `is_entitled` | 当前是否有权益 | `true` / `false` |
| `expires_at` | 过期时间 | ISO 时间字符串 |
| `sync_source` | 本次同步来源 | `purchase` / `restore` / `app_launch` / `manual_refresh` / `webhook` |
| `purchase_source` | 购买来源 | `app_store` |
| `change_reason` | 状态变更原因 | `renewed` / `expired` / `refunded` / `manual_fix` |

### 错误字段

| 字段 | 说明 |
|---|---|
| `error_code` | 错误码 |
| `error_message` | 错误信息 |
| `error_type` | 归一化错误类型 |
| `transaction_id` | Apple 交易 ID |
| `notification_type` | Apple 通知类型 |
| `notification_subtype` | Apple 通知子类型 |

---

## 事件清单

### 1. paywall 组

| 事件名 | 中文说明 | 触发时机 | 触发端 |
|---|---|---|---|
| `paywall_opened` | 打开付费墙 | 进入付费页时 | 前端 |
| `paywall_closed` | 关闭付费墙 | 用户关闭或返回离开付费页时 | 前端 |
| `paywall_product_selected` | 选择套餐 | 用户切换周/月/季/年套餐时 | 前端 |
| `paywall_purchase_clicked` | 点击购买按钮 | 用户点击主 CTA 时 | 前端 |

#### paywall 组字段建议

| 事件名 | 必填字段 | 可选字段 |
|---|---|---|
| `paywall_opened` | `screen_name`, `entry_source`, `placement` | `product_id`, `subscription_status` |
| `paywall_closed` | `screen_name`, `entry_source`, `placement` | `product_id`, `close_action`, `dwell_ms` |
| `paywall_product_selected` | `screen_name`, `product_id`, `period` | `product_name`, `price`, `currency`, `offer_type`, `offer_price`, `is_intro_offer_eligible` |
| `paywall_purchase_clicked` | `screen_name`, `product_id`, `period` | `entry_source`, `placement`, `product_name`, `price`, `currency`, `offer_type`, `offer_price`, `is_intro_offer_eligible` |

### 2. purchase 组

| 事件名 | 中文说明 | 触发时机 | 触发端 |
|---|---|---|---|
| `purchase_started` | 发起购买 | 调用购买接口时 | 前端 |
| `purchase_completed` | 购买完成 | 交易确认成功后 | 服务端优先，前端可兜底 |
| `purchase_failed` | 购买失败 | 交易失败且非取消时 | 前端或服务端 |
| `purchase_cancelled` | 购买取消 | 用户取消系统支付弹窗时 | 前端 |

#### purchase 组字段建议

| 事件名 | 必填字段 | 可选字段 |
|---|---|---|
| `purchase_started` | `product_id`, `screen_name`, `period` | `entry_source`, `product_name`, `price`, `currency`, `offer_type`, `offer_price`, `is_intro_offer_eligible`, `purchase_source` |
| `purchase_completed` | `product_id`, `screen_name`, `period` | `entry_source`, `product_name`, `price`, `currency`, `offer_type`, `offer_price`, `purchase_source`, `transaction_id` |
| `purchase_failed` | `product_id`, `screen_name`, `period`, `error_code` | `entry_source`, `product_name`, `price`, `currency`, `error_message`, `purchase_source` |
| `purchase_cancelled` | `product_id`, `screen_name`, `period` | `entry_source`, `product_name`, `price`, `currency`, `purchase_source` |

### 3. restore 组

| 事件名 | 中文说明 | 触发时机 | 触发端 |
|---|---|---|---|
| `restore_started` | 开始恢复购买 | 用户点击恢复购买并发起请求时 | 前端 |
| `restore_completed` | 恢复购买完成 | 恢复购买成功并拿到最新状态时 | 服务端优先，前端可兜底 |
| `restore_failed` | 恢复购买失败 | 恢复请求失败时 | 前端或服务端 |

#### restore 组字段建议

| 事件名 | 必填字段 | 可选字段 |
|---|---|---|
| `restore_started` | `screen_name` | `entry_source`, `subscription_status` |
| `restore_completed` | `screen_name` | `entry_source`, `subscription_status`, `is_entitled`, `restored_count` |
| `restore_failed` | `screen_name`, `error_code` | `entry_source`, `subscription_status`, `error_message` |

### 4. subscription 组

| 事件名 | 中文说明 | 触发时机 | 触发端 |
|---|---|---|---|
| `rights_page_viewed` | 查看权益页 | 打开权益页时 | 前端 |
| `manage_subscription_clicked` | 点击管理订阅 | 用户从权益页点击“管理订阅”时 | 前端 |
| `subscription_sync_started` | 开始同步订阅状态 | 购买后、恢复后或主动刷新开始同步时 | 服务端优先 |
| `subscription_sync_completed` | 订阅同步完成 | 成功拿到最新订阅状态时 | 服务端 |
| `subscription_sync_failed` | 订阅同步失败 | 同步超时或请求失败时 | 服务端 |
| `subscription_status_changed` | 订阅状态变化 | 状态从一种变为另一种时 | 服务端 |
| `subscription_renewed` | 自动续费成功 | 收到续费成功并完成状态更新时 | 服务端 |
| `subscription_expired` | 订阅到期 | 订阅到期失效时 | 服务端 |
| `subscription_refunded` | 订阅退款/撤销 | Apple 退款或撤销时 | 服务端 |
| `subscription_webhook_processed` | webhook 已处理 | 一条 Apple 通知验签并落库完成时 | 服务端 |

#### subscription 组字段建议

| 事件名 | 必填字段 | 可选字段 |
|---|---|---|
| `rights_page_viewed` | `screen_name` | `entry_source`, `subscription_status`, `is_entitled`, `expires_at` |
| `manage_subscription_clicked` | `screen_name` | `subscription_status`, `is_entitled`, `expires_at` |
| `subscription_sync_started` | `sync_source` | `product_id`, `subscription_status` |
| `subscription_sync_completed` | `sync_source`, `subscription_status`, `is_entitled` | `product_id`, `product_name`, `period`, `expires_at` |
| `subscription_sync_failed` | `sync_source`, `error_type` | `product_id`, `subscription_status`, `error_message`, `wait_ms`, `poll_count` |
| `subscription_status_changed` | `previous_status`, `subscription_status` | `product_id`, `product_name`, `period`, `expires_at`, `is_entitled`, `change_reason` |
| `subscription_renewed` | `product_id`, `period`, `expires_at` | `product_name`, `subscription_status`, `is_entitled` |
| `subscription_expired` | `product_id`, `period`, `expires_at` | `product_name`, `subscription_status`, `is_entitled`, `change_reason` |
| `subscription_refunded` | `product_id`, `period` | `product_name`, `subscription_status`, `is_entitled`, `expires_at`, `change_reason` |
| `subscription_webhook_processed` | `notification_type` | `notification_subtype`, `product_id`, `period`, `subscription_status` |

---

## 最终推荐事件列表

本期建议只保留以下必要事件，不增加低价值噪音事件：

| 分组 | 事件名 |
|---|---|
| `paywall` | `paywall_opened`, `paywall_closed`, `paywall_product_selected`, `paywall_purchase_clicked` |
| `purchase` | `purchase_started`, `purchase_completed`, `purchase_failed`, `purchase_cancelled` |
| `restore` | `restore_started`, `restore_completed`, `restore_failed` |
| `subscription` | `rights_page_viewed`, `manage_subscription_clicked`, `subscription_sync_started`, `subscription_sync_completed`, `subscription_sync_failed`, `subscription_status_changed`, `subscription_renewed`, `subscription_expired`, `subscription_refunded`, `subscription_webhook_processed` |

合计 **21 个事件**。

---

## 当前不建议新增的事件

以下事件当前阶段不建议加入，原因是信息价值低或噪音过大：

| 不建议事件 | 原因 |
|---|---|
| `paywall_scrolled` | 对当前商业化判断价值低 |
| `paywall_exposed` | 与 `paywall_opened` 高度重叠 |
| `restore_clicked` | 可直接用 `restore_started` 代表 |
| 商品列表加载成功/失败事件 | 容易产生噪音，且不直接代表商业化转化 |
| 每次轮询都打一条同步事件 | 事件量过大，不利于看板分析 |
| Apple 每种原始通知都单独建业务事件 | 粒度过细，后续难维护 |
| 单独的 `entitlement_*` 事件组 | 当前权益仍由订阅状态推导，重复表达 |

---

## 落地建议

1. 前端先补齐 `paywall_*`、`purchase_started`、`purchase_cancelled`、`restore_started`、`rights_*`。
2. 服务端负责 `purchase_completed`、`restore_completed`、`subscription_*` 的主口径。
3. 如果前端存在实时体验需要，可保留少量兜底事件，但分析和报表以服务端为准。
4. 新增埋点函数时，统一放入 `src/utils/analytics.ts`，命名保持与事件名语义一致。

---

**更新时间**: 2026-04-08
**维护者**: GPT / Cursor
