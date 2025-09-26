"use strict";
// Alert Model following OOP principles
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = exports.VisibilityType = exports.DeliveryType = exports.AlertSeverity = void 0;
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "INFO";
    AlertSeverity["WARNING"] = "WARNING";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var DeliveryType;
(function (DeliveryType) {
    DeliveryType["IN_APP"] = "IN_APP";
    DeliveryType["EMAIL"] = "EMAIL";
    DeliveryType["SMS"] = "SMS";
})(DeliveryType || (exports.DeliveryType = DeliveryType = {}));
var VisibilityType;
(function (VisibilityType) {
    VisibilityType["ORGANIZATION"] = "ORGANIZATION";
    VisibilityType["TEAM"] = "TEAM";
    VisibilityType["USER"] = "USER";
})(VisibilityType || (exports.VisibilityType = VisibilityType = {}));
class Alert {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.message = data.message;
        this.severity = data.severity;
        this.deliveryType = data.deliveryType;
        this.reminderFrequency = data.reminderFrequency || 2 * 60 * 60 * 1000; // 2 hours default
        this.visibilityType = data.visibilityType;
        this.visibilityTargets = data.visibilityTargets;
        this.startTime = new Date(data.startTime);
        this.expiryTime = new Date(data.expiryTime);
        this.enabled = data.enabled !== undefined ? data.enabled : true;
        this.archived = data.archived || false;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }
    isActive() {
        const now = new Date();
        return this.enabled &&
            !this.archived &&
            this.startTime <= now &&
            this.expiryTime > now;
    }
    isExpired() {
        return new Date() > this.expiryTime;
    }
    shouldSendReminder(lastSentTime) {
        if (!this.isActive())
            return false;
        if (!lastSentTime)
            return true;
        const timeSinceLastSent = Date.now() - lastSentTime.getTime();
        return timeSinceLastSent >= this.reminderFrequency;
    }
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            message: this.message,
            severity: this.severity,
            deliveryType: this.deliveryType,
            reminderFrequency: this.reminderFrequency,
            visibilityType: this.visibilityType,
            visibilityTargets: this.visibilityTargets,
            startTime: this.startTime,
            expiryTime: this.expiryTime,
            enabled: this.enabled,
            archived: this.archived,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.Alert = Alert;
