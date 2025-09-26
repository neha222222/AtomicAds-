"use strict";
// Main router configuration
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController_1 = require("../controllers/AdminController");
const UserController_1 = require("../controllers/UserController");
const AuthController_1 = require("../controllers/AuthController");
const AnalyticsController_1 = require("../controllers/AnalyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Initialize controllers
const adminController = new AdminController_1.AdminController();
const userController = new UserController_1.UserController();
const authController = new AuthController_1.AuthController();
const analyticsController = new AnalyticsController_1.AnalyticsController();
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        service: 'Alerting Platform API'
    });
});
// ============== AUTH ROUTES ==============
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/verify-token', (req, res) => authController.verifyToken(req, res));
router.get('/auth/me', auth_1.authenticate, (req, res) => authController.getMe(req, res));
router.post('/auth/change-password', auth_1.authenticate, (req, res) => authController.changePassword(req, res));
// ============== ADMIN ROUTES ==============
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_1.authenticate);
adminRouter.use(auth_1.requireAdmin);
// Alert management
adminRouter.post('/alerts', (req, res) => adminController.createAlert(req, res));
adminRouter.put('/alerts/:alertId', (req, res) => adminController.updateAlert(req, res));
adminRouter.post('/alerts/:alertId/archive', (req, res) => adminController.archiveAlert(req, res));
adminRouter.post('/alerts/:alertId/toggle', (req, res) => adminController.toggleAlert(req, res));
adminRouter.get('/alerts', (req, res) => adminController.listAlerts(req, res));
adminRouter.get('/alerts/:alertId', (req, res) => adminController.getAlert(req, res));
adminRouter.get('/my-alerts', (req, res) => adminController.getMyAlerts(req, res));
router.use('/admin', adminRouter);
// ============== USER ROUTES ==============
const userRouter = (0, express_1.Router)();
userRouter.use(auth_1.authenticate);
userRouter.use(auth_1.requireUser);
// Alert viewing and interaction
userRouter.get('/alerts', (req, res) => userController.getMyAlerts(req, res));
userRouter.get('/alerts/active', (req, res) => userController.getActiveAlerts(req, res));
userRouter.get('/alerts/snoozed', (req, res) => userController.getSnoozedAlerts(req, res));
userRouter.get('/alerts/read', (req, res) => userController.getReadAlerts(req, res));
userRouter.post('/alerts/:alertId/read', (req, res) => userController.markAsRead(req, res));
userRouter.post('/alerts/:alertId/unread', (req, res) => userController.markAsUnread(req, res));
userRouter.post('/alerts/:alertId/snooze', (req, res) => userController.snoozeAlert(req, res));
// Notifications
userRouter.get('/notifications', (req, res) => userController.getNotificationHistory(req, res));
userRouter.post('/notifications/test/:channel', (req, res) => userController.testNotification(req, res));
// User analytics
userRouter.get('/analytics', (req, res) => userController.getMyAnalytics(req, res));
// Development only - trigger reminder manually
if (process.env.NODE_ENV === 'development') {
    userRouter.post('/alerts/:alertId/trigger-reminder', (req, res) => userController.triggerReminder(req, res));
}
router.use('/user', userRouter);
// ============== ANALYTICS ROUTES ==============
const analyticsRouter = (0, express_1.Router)();
analyticsRouter.use(auth_1.authenticate);
// System-wide analytics (admin only)
analyticsRouter.get('/system', (req, res) => analyticsController.getSystemAnalytics(req, res));
analyticsRouter.get('/engagement', (req, res) => analyticsController.getEngagementStats(req, res));
// Specific analytics
analyticsRouter.get('/alerts/stats', (req, res) => analyticsController.getAlertStats(req, res));
analyticsRouter.get('/alerts/top', (req, res) => analyticsController.getTopAlerts(req, res));
analyticsRouter.get('/alerts/:alertId', (req, res) => analyticsController.getAlertAnalytics(req, res));
analyticsRouter.get('/notifications/stats', (req, res) => analyticsController.getNotificationStats(req, res));
analyticsRouter.get('/users/:userId', (req, res) => analyticsController.getUserAnalytics(req, res));
router.use('/analytics', analyticsRouter);
// ============== PUBLIC ROUTES (No auth required) ==============
router.get('/status', (req, res) => {
    res.json({
        status: 'operational',
        version: '1.0.0',
        author: 'Neha Dhruw',
        timestamp: new Date()
    });
});
// 404 handler
router.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});
exports.default = router;
