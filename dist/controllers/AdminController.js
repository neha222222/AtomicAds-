"use strict";
// Admin Controller - Handles admin-specific endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const AlertService_1 = require("../services/AlertService");
class AdminController {
    constructor() {
        this.alertService = new AlertService_1.AlertService();
    }
    // Create new alert
    async createAlert(req, res) {
        try {
            const alertData = req.body;
            const alert = await this.alertService.createAlert(alertData, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Alert created successfully',
                data: alert
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Update existing alert
    async updateAlert(req, res) {
        try {
            const { alertId } = req.params;
            const updates = req.body;
            const alert = await this.alertService.updateAlert(alertId, updates, req.user.id);
            res.json({
                success: true,
                message: 'Alert updated successfully',
                data: alert
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Archive alert
    async archiveAlert(req, res) {
        try {
            const { alertId } = req.params;
            const success = await this.alertService.archiveAlert(alertId, req.user.id);
            if (success) {
                res.json({
                    success: true,
                    message: 'Alert archived successfully'
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Alert not found'
                });
            }
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // List all alerts (admin view)
    async listAlerts(req, res) {
        try {
            const { severity, status, archived } = req.query;
            const filters = {};
            if (severity)
                filters.severity = severity;
            if (status === 'active')
                filters.enabled = true;
            if (status === 'inactive')
                filters.enabled = false;
            if (archived === 'true')
                filters.archived = true;
            if (archived === 'false')
                filters.archived = false;
            const alerts = await this.alertService.getAllAlerts(filters);
            res.json({
                success: true,
                data: alerts,
                count: alerts.length
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get single alert details
    async getAlert(req, res) {
        try {
            const { alertId } = req.params;
            const alert = await this.alertService.getAlertById(alertId);
            if (!alert) {
                res.status(404).json({
                    success: false,
                    error: 'Alert not found'
                });
                return;
            }
            res.json({
                success: true,
                data: alert
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Enable/disable alert
    async toggleAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { enabled } = req.body;
            const alert = await this.alertService.updateAlert(alertId, { enabled }, req.user.id);
            res.json({
                success: true,
                message: `Alert ${enabled ? 'enabled' : 'disabled'} successfully`,
                data: alert
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    // Get alerts created by specific admin
    async getMyAlerts(req, res) {
        try {
            const alerts = await this.alertService.getAlertsByAdmin(req.user.id);
            res.json({
                success: true,
                data: alerts,
                count: alerts.length
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
exports.AdminController = AdminController;
