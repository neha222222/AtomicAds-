"use strict";
// Analytics Controller - Handles analytics endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const AnalyticsService_1 = require("../services/AnalyticsService");
class AnalyticsController {
    constructor() {
        this.analyticsService = new AnalyticsService_1.AnalyticsService();
    }
    // Get system-wide analytics (admin only)
    async getSystemAnalytics(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'Admin access required'
                });
                return;
            }
            const analytics = await this.analyticsService.getAnalytics();
            res.json({
                success: true,
                data: analytics,
                timestamp: new Date()
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get analytics for specific alert
    async getAlertAnalytics(req, res) {
        try {
            const { alertId } = req.params;
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'Admin access required'
                });
                return;
            }
            const analytics = await this.analyticsService.getAlertAnalytics(alertId);
            res.json({
                success: true,
                data: analytics,
                alertId,
                timestamp: new Date()
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get analytics for specific user (admin can see any user, users can see their own)
    async getUserAnalytics(req, res) {
        try {
            const { userId } = req.params;
            // Check permissions
            if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only view your own analytics'
                });
                return;
            }
            const analytics = await this.analyticsService.getUserAnalytics(userId);
            res.json({
                success: true,
                data: analytics,
                userId,
                timestamp: new Date()
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get alert statistics summary
    async getAlertStats(req, res) {
        try {
            const analytics = await this.analyticsService.getAnalytics();
            res.json({
                success: true,
                data: analytics.alerts,
                timestamp: new Date()
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get notification statistics summary
    async getNotificationStats(req, res) {
        try {
            const analytics = await this.analyticsService.getAnalytics();
            res.json({
                success: true,
                data: analytics.notifications,
                timestamp: new Date()
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get user engagement statistics
    async getEngagementStats(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    error: 'Admin access required'
                });
                return;
            }
            const analytics = await this.analyticsService.getAnalytics();
            res.json({
                success: true,
                data: analytics.userEngagement,
                timestamp: new Date()
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get top performing alerts
    async getTopAlerts(req, res) {
        try {
            const analytics = await this.analyticsService.getAnalytics();
            res.json({
                success: true,
                data: analytics.topAlerts,
                timestamp: new Date()
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
exports.AnalyticsController = AnalyticsController;
