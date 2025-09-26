"use strict";
// NotificationDelivery Model - Logs each alert sent to a user
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDelivery = exports.DeliveryStatus = void 0;
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "PENDING";
    DeliveryStatus["DELIVERED"] = "DELIVERED";
    DeliveryStatus["FAILED"] = "FAILED";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
class NotificationDelivery {
    constructor(data) {
        this.id = data.id;
        this.alertId = data.alertId;
        this.userId = data.userId;
        this.deliveryType = data.deliveryType;
        this.status = data.status;
        this.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : undefined;
        this.failureReason = data.failureReason;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    }
    markAsDelivered() {
        this.status = DeliveryStatus.DELIVERED;
        this.deliveredAt = new Date();
    }
    markAsFailed(reason) {
        this.status = DeliveryStatus.FAILED;
        this.failureReason = reason;
    }
    toJSON() {
        return {
            id: this.id,
            alertId: this.alertId,
            userId: this.userId,
            deliveryType: this.deliveryType,
            status: this.status,
            deliveredAt: this.deliveredAt,
            failureReason: this.failureReason,
            createdAt: this.createdAt
        };
    }
}
exports.NotificationDelivery = NotificationDelivery;
