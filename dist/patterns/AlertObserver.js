"use strict";
// Observer Pattern for Alert Subscriptions
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionManager = exports.AlertPublisher = exports.UserAlertObserver = void 0;
// Concrete Observer: User Alert Observer
class UserAlertObserver {
    constructor(user, notificationContext) {
        this.user = user;
        this.notificationContext = notificationContext;
    }
    async update(alert) {
        // Check if user should receive this alert based on visibility
        if (this.shouldReceiveAlert(alert)) {
            try {
                await this.notificationContext.sendNotification(alert, this.user);
                console.log(`🔔 User ${this.user.name} notified about alert: ${alert.title}`);
            }
            catch (error) {
                console.error(`Failed to notify user ${this.user.name}:`, error);
            }
        }
    }
    shouldReceiveAlert(alert) {
        switch (alert.visibilityType) {
            case 'ORGANIZATION':
                return alert.visibilityTargets.includes(this.user.organizationId);
            case 'TEAM':
                return this.user.teamId ? alert.visibilityTargets.includes(this.user.teamId) : false;
            case 'USER':
                return alert.visibilityTargets.includes(this.user.id);
            default:
                return false;
        }
    }
    getUserId() {
        return this.user.id;
    }
    getObserverName() {
        return `UserObserver_${this.user.name}`;
    }
}
exports.UserAlertObserver = UserAlertObserver;
// Concrete Subject: Alert Publisher
class AlertPublisher {
    constructor() {
        this.observers = new Map();
    }
    attach(observer) {
        const userId = observer.getUserId();
        if (!this.observers.has(userId)) {
            this.observers.set(userId, observer);
            console.log(`➕ Observer attached for user: ${userId}`);
        }
    }
    detach(observer) {
        const userId = observer.getUserId();
        if (this.observers.delete(userId)) {
            console.log(`➖ Observer detached for user: ${userId}`);
        }
    }
    async notifyObservers(alert) {
        if (!alert.isActive()) {
            console.log(`⏸️ Alert ${alert.title} is not active, skipping notifications`);
            return;
        }
        const notificationPromises = [];
        for (const observer of this.observers.values()) {
            notificationPromises.push(observer.update(alert));
        }
        await Promise.all(notificationPromises);
        console.log(`✅ Notified ${notificationPromises.length} observers about alert: ${alert.title}`);
    }
    getObserverCount() {
        return this.observers.size;
    }
    hasObserver(userId) {
        return this.observers.has(userId);
    }
}
exports.AlertPublisher = AlertPublisher;
// Subscription Manager to handle multiple publishers
class SubscriptionManager {
    constructor(notificationContext) {
        this.publishers = new Map();
        this.notificationContext = notificationContext;
    }
    subscribeUserToAlert(user, alertId) {
        if (!this.publishers.has(alertId)) {
            this.publishers.set(alertId, new AlertPublisher());
        }
        const publisher = this.publishers.get(alertId);
        const observer = new UserAlertObserver(user, this.notificationContext);
        publisher.attach(observer);
    }
    unsubscribeUserFromAlert(userId, alertId) {
        const publisher = this.publishers.get(alertId);
        if (publisher && publisher.hasObserver(userId)) {
            // We need to create a temporary observer just to detach it
            // In a real implementation, we'd store observers differently
            console.log(`Unsubscribing user ${userId} from alert ${alertId}`);
        }
    }
    async publishAlert(alert) {
        const publisher = this.publishers.get(alert.id) || new AlertPublisher();
        await publisher.notifyObservers(alert);
    }
    getPublisherForAlert(alertId) {
        return this.publishers.get(alertId);
    }
}
exports.SubscriptionManager = SubscriptionManager;
