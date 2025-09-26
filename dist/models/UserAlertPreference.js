"use strict";
// UserAlertPreference Model - Tracks read/unread/snooze state per alert per user
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAlertPreference = exports.AlertState = void 0;
var AlertState;
(function (AlertState) {
    AlertState["UNREAD"] = "UNREAD";
    AlertState["READ"] = "READ";
    AlertState["SNOOZED"] = "SNOOZED";
})(AlertState || (exports.AlertState = AlertState = {}));
class UserAlertPreference {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.alertId = data.alertId;
        this.state = data.state;
        this.readAt = data.readAt ? new Date(data.readAt) : undefined;
        this.snoozedUntil = data.snoozedUntil ? new Date(data.snoozedUntil) : undefined;
        this.lastNotifiedAt = data.lastNotifiedAt ? new Date(data.lastNotifiedAt) : undefined;
        this.notificationCount = data.notificationCount || 0;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }
    markAsRead() {
        this.state = AlertState.READ;
        this.readAt = new Date();
        this.updatedAt = new Date();
    }
    markAsUnread() {
        this.state = AlertState.UNREAD;
        this.readAt = undefined;
        this.updatedAt = new Date();
    }
    snoozeForDay() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        this.state = AlertState.SNOOZED;
        this.snoozedUntil = tomorrow;
        this.updatedAt = new Date();
    }
    isSnoozed() {
        if (this.state !== AlertState.SNOOZED || !this.snoozedUntil) {
            return false;
        }
        // Check if snooze period has expired
        if (new Date() > this.snoozedUntil) {
            this.state = AlertState.UNREAD;
            this.snoozedUntil = undefined;
            return false;
        }
        return true;
    }
    incrementNotificationCount() {
        this.notificationCount++;
        this.lastNotifiedAt = new Date();
        this.updatedAt = new Date();
    }
    shouldNotify(reminderFrequency) {
        // Don't notify if snoozed
        if (this.isSnoozed()) {
            return false;
        }
        // Always notify if never notified before
        if (!this.lastNotifiedAt) {
            return true;
        }
        // Check if enough time has passed since last notification
        const timeSinceLastNotification = Date.now() - this.lastNotifiedAt.getTime();
        return timeSinceLastNotification >= reminderFrequency;
    }
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            alertId: this.alertId,
            state: this.state,
            readAt: this.readAt,
            snoozedUntil: this.snoozedUntil,
            lastNotifiedAt: this.lastNotifiedAt,
            notificationCount: this.notificationCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.UserAlertPreference = UserAlertPreference;
