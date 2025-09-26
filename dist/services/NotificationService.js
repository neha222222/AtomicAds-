"use strict";
// Notification Service - Handles sending notifications
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Alert_1 = require("../models/Alert");
const NotificationDelivery_1 = require("../models/NotificationDelivery");
const NotificationStrategy_1 = require("../patterns/NotificationStrategy");
const NotificationDeliveryRepository_1 = require("../repositories/NotificationDeliveryRepository");
const UserAlertPreferenceRepository_1 = require("../repositories/UserAlertPreferenceRepository");
const AlertRepository_1 = require("../repositories/AlertRepository");
const UserRepository_1 = require("../repositories/UserRepository");
class NotificationService {
    constructor() {
        this.notificationContext = new NotificationStrategy_1.NotificationContext();
        this.deliveryRepo = new NotificationDeliveryRepository_1.NotificationDeliveryRepository();
        this.preferenceRepo = new UserAlertPreferenceRepository_1.UserAlertPreferenceRepository();
        this.alertRepo = new AlertRepository_1.AlertRepository();
        this.userRepo = new UserRepository_1.UserRepository();
    }
    async sendNotification(alert, user) {
        try {
            // Check if user should receive notification
            const preference = await this.preferenceRepo.getOrCreate(user.id, alert.id);
            // Don't send if snoozed
            if (preference.isSnoozed()) {
                console.log(`⏸️ Notification skipped (snoozed) for user ${user.name}`);
                return new NotificationDelivery_1.NotificationDelivery({
                    alertId: alert.id,
                    userId: user.id,
                    deliveryType: alert.deliveryType,
                    status: NotificationDelivery_1.DeliveryStatus.FAILED,
                    failureReason: 'Alert is snoozed'
                });
            }
            // Send the notification
            const delivery = await this.notificationContext.sendNotification(alert, user);
            // Save delivery record
            const savedDelivery = await this.deliveryRepo.create(delivery.toJSON());
            // Update preference with notification details
            await this.preferenceRepo.incrementNotificationCount(user.id, alert.id);
            console.log(`📤 Notification sent: ${alert.title} → ${user.name}`);
            return savedDelivery;
        }
        catch (error) {
            console.error(`Failed to send notification to ${user.name}:`, error);
            const failedDelivery = new NotificationDelivery_1.NotificationDelivery({
                alertId: alert.id,
                userId: user.id,
                deliveryType: alert.deliveryType,
                status: NotificationDelivery_1.DeliveryStatus.FAILED,
                failureReason: error.message
            });
            return this.deliveryRepo.create(failedDelivery.toJSON());
        }
    }
    async sendBulkNotifications(alert, users) {
        const deliveries = [];
        // Send notifications in parallel for better performance
        const promises = users.map(user => this.sendNotification(alert, user));
        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === 'fulfilled') {
                deliveries.push(result.value);
            }
            else {
                console.error('Failed to send notification:', result.reason);
            }
        }
        console.log(`📧 Sent ${deliveries.length} notifications for alert: ${alert.title}`);
        return deliveries;
    }
    async getNotificationHistory(userId) {
        return this.deliveryRepo.findByUser(userId);
    }
    async getAlertNotificationHistory(alertId) {
        return this.deliveryRepo.findByAlert(alertId);
    }
    async getDeliveryStats() {
        const stats = await this.deliveryRepo.getDeliveryStats();
        const deliveryRate = stats.total > 0
            ? (stats.delivered / stats.total) * 100
            : 0;
        return {
            ...stats,
            deliveryRate: Math.round(deliveryRate * 100) / 100
        };
    }
    async getAvailableChannels() {
        return this.notificationContext.getAvailableStrategies();
    }
    async testNotificationChannel(channelName, userId) {
        try {
            const user = await this.userRepo.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const testAlert = new Alert_1.Alert({
                id: 'test',
                title: 'Test Alert',
                message: 'This is a test notification',
                severity: Alert_1.AlertSeverity.INFO,
                deliveryType: channelName,
                reminderFrequency: 0,
                visibilityType: Alert_1.VisibilityType.USER,
                visibilityTargets: [userId],
                startTime: new Date(),
                expiryTime: new Date(Date.now() + 86400000),
                enabled: true,
                archived: false,
                createdBy: userId
            });
            this.notificationContext.setStrategy(channelName);
            const delivery = await this.notificationContext.sendNotification(testAlert, user);
            return delivery.status === NotificationDelivery_1.DeliveryStatus.DELIVERED;
        }
        catch (error) {
            console.error(`Failed to test channel ${channelName}:`, error);
            return false;
        }
    }
}
exports.NotificationService = NotificationService;
