"use strict";
// Strategy Pattern for Notification Channels
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationContext = exports.SMSNotificationStrategy = exports.EmailNotificationStrategy = exports.InAppNotificationStrategy = void 0;
const NotificationDelivery_1 = require("../models/NotificationDelivery");
// Concrete Strategy: In-App Notification
class InAppNotificationStrategy {
    constructor() {
        this.notifications = new Map();
    }
    async send(alert, user) {
        try {
            // Simulate in-app notification delivery
            if (!this.notifications.has(user.id)) {
                this.notifications.set(user.id, []);
            }
            const userNotifications = this.notifications.get(user.id);
            userNotifications.push({
                alertId: alert.id,
                title: alert.title,
                message: alert.message,
                severity: alert.severity,
                timestamp: new Date()
            });
            const delivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.DELIVERED,
                deliveredAt: new Date()
            });
            console.log(`📱 In-App notification sent to ${user.name}: ${alert.title}`);
            return delivery;
        }
        catch (error) {
            const delivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.FAILED,
                failureReason: error.message
            });
            return delivery;
        }
    }
    getName() {
        return 'IN_APP';
    }
    isAvailable() {
        return true;
    }
    // Helper method to get notifications for a user
    getUserNotifications(userId) {
        return this.notifications.get(userId) || [];
    }
}
exports.InAppNotificationStrategy = InAppNotificationStrategy;
// Concrete Strategy: Email Notification (Future-proofed)
class EmailNotificationStrategy {
    async send(alert, user) {
        try {
            // Placeholder for email sending logic
            console.log(`📧 Email would be sent to ${user.email}: ${alert.title}`);
            const delivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.DELIVERED,
                deliveredAt: new Date()
            });
            return delivery;
        }
        catch (error) {
            const delivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.FAILED,
                failureReason: error.message
            });
            return delivery;
        }
    }
    getName() {
        return 'EMAIL';
    }
    isAvailable() {
        return false; // Not implemented for MVP
    }
}
exports.EmailNotificationStrategy = EmailNotificationStrategy;
// Concrete Strategy: SMS Notification (Future-proofed)
class SMSNotificationStrategy {
    async send(alert, user) {
        try {
            // Placeholder for SMS sending logic
            console.log(`📱 SMS would be sent to user ${user.name}: ${alert.title}`);
            const delivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.DELIVERED,
                deliveredAt: new Date()
            });
            return delivery;
        }
        catch (error) {
            const delivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.FAILED,
                failureReason: error.message
            });
            return delivery;
        }
    }
    getName() {
        return 'SMS';
    }
    isAvailable() {
        return false; // Not implemented for MVP
    }
}
exports.SMSNotificationStrategy = SMSNotificationStrategy;
// Context Class
class NotificationContext {
    constructor() {
        this.strategies = new Map();
        // Register all available strategies
        this.registerStrategy(new InAppNotificationStrategy());
        this.registerStrategy(new EmailNotificationStrategy());
        this.registerStrategy(new SMSNotificationStrategy());
        // Set default strategy
        this.strategy = this.strategies.get('IN_APP');
    }
    registerStrategy(strategy) {
        this.strategies.set(strategy.getName(), strategy);
    }
    setStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Strategy ${strategyName} not found`);
        }
        if (!strategy.isAvailable()) {
            throw new Error(`Strategy ${strategyName} is not available`);
        }
        this.strategy = strategy;
    }
    async sendNotification(alert, user) {
        // Set strategy based on alert's delivery type
        this.setStrategy(alert.deliveryType);
        return this.strategy.send(alert, user);
    }
    getAvailableStrategies() {
        return Array.from(this.strategies.entries())
            .filter(([_, strategy]) => strategy.isAvailable())
            .map(([name, _]) => name);
    }
    getStrategy(name) {
        return this.strategies.get(name);
    }
}
exports.NotificationContext = NotificationContext;
