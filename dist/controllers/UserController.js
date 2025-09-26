"use strict";
// User Controller - Handles user-specific endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const AlertService_1 = require("../services/AlertService");
const NotificationService_1 = require("../services/NotificationService");
const AnalyticsService_1 = require("../services/AnalyticsService");
const ReminderService_1 = require("../services/ReminderService");
class UserController {
    constructor() {
        this.alertService = new AlertService_1.AlertService();
        this.notificationService = new NotificationService_1.NotificationService();
        this.analyticsService = new AnalyticsService_1.AnalyticsService();
        this.reminderService = new ReminderService_1.ReminderService();
    }
    // Get alerts for current user
    async getMyAlerts(req, res) {
        try {
            const alerts = await this.alertService.getUserAlerts(req.user.id);
            res.json({
                success: true,
                data: alerts,
                summary: {
                    active: alerts.active.length,
                    snoozed: alerts.snoozed.length,
                    read: alerts.read.length
                }
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Mark alert as read
    async markAsRead(req, res) {
        try {
            const { alertId } = req.params;
            await this.alertService.markAlertAsRead(req.user.id, alertId);
            res.json({
                success: true,
                message: 'Alert marked as read'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Mark alert as unread
    async markAsUnread(req, res) {
        try {
            const { alertId } = req.params;
            await this.alertService.markAlertAsUnread(req.user.id, alertId);
            res.json({
                success: true,
                message: 'Alert marked as unread'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Snooze alert for the day
    async snoozeAlert(req, res) {
        try {
            const { alertId } = req.params;
            await this.alertService.snoozeAlert(req.user.id, alertId);
            res.json({
                success: true,
                message: 'Alert snoozed until tomorrow'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get notification history
    async getNotificationHistory(req, res) {
        try {
            const notifications = await this.notificationService.getNotificationHistory(req.user.id);
            res.json({
                success: true,
                data: notifications,
                count: notifications.length
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get user analytics
    async getMyAnalytics(req, res) {
        try {
            const analytics = await this.analyticsService.getUserAnalytics(req.user.id);
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get active alerts (unread)
    async getActiveAlerts(req, res) {
        try {
            const alerts = await this.alertService.getUserAlerts(req.user.id);
            res.json({
                success: true,
                data: alerts.active,
                count: alerts.active.length
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get snoozed alerts
    async getSnoozedAlerts(req, res) {
        try {
            const alerts = await this.alertService.getUserAlerts(req.user.id);
            res.json({
                success: true,
                data: alerts.snoozed,
                count: alerts.snoozed.length
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get read alerts history
    async getReadAlerts(req, res) {
        try {
            const alerts = await this.alertService.getUserAlerts(req.user.id);
            res.json({
                success: true,
                data: alerts.read,
                count: alerts.read.length
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Test notification channel
    async testNotification(req, res) {
        try {
            const { channel } = req.params;
            const success = await this.notificationService.testNotificationChannel(channel, req.user.id);
            res.json({
                success: true,
                message: success ? 'Test notification sent successfully' : 'Failed to send test notification',
                channelWorking: success
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Manually trigger reminder for testing
    async triggerReminder(req, res) {
        try {
            const { alertId } = req.params;
            // Only allow in development mode
            if (process.env.NODE_ENV !== 'development') {
                res.status(403).json({
                    success: false,
                    error: 'This feature is only available in development mode'
                });
                return;
            }
            await this.reminderService.triggerRemindersForAlert(alertId);
            res.json({
                success: true,
                message: 'Reminder triggered successfully'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.UserController = UserController;
