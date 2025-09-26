// User Controller - Handles user-specific endpoints

import { Request, Response } from 'express';
import { AlertService } from '../services/AlertService';
import { NotificationService } from '../services/NotificationService';
import { AnalyticsService } from '../services/AnalyticsService';
import { ReminderService } from '../services/ReminderService';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  private alertService: AlertService;
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;
  private reminderService: ReminderService;

  constructor() {
    this.alertService = new AlertService();
    this.notificationService = new NotificationService();
    this.analyticsService = new AnalyticsService();
    this.reminderService = new ReminderService();
  }

  // Get alerts for current user
  async getMyAlerts(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Mark alert as read
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      await this.alertService.markAlertAsRead(req.user.id, alertId);
      
      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Mark alert as unread
  async markAsUnread(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      await this.alertService.markAlertAsUnread(req.user.id, alertId);
      
      res.json({
        success: true,
        message: 'Alert marked as unread'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Snooze alert for the day
  async snoozeAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      await this.alertService.snoozeAlert(req.user.id, alertId);
      
      res.json({
        success: true,
        message: 'Alert snoozed until tomorrow'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get notification history
  async getNotificationHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notifications = await this.notificationService.getNotificationHistory(req.user.id);
      
      res.json({
        success: true,
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get user analytics
  async getMyAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const analytics = await this.analyticsService.getUserAnalytics(req.user.id);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get active alerts (unread)
  async getActiveAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = await this.alertService.getUserAlerts(req.user.id);
      
      res.json({
        success: true,
        data: alerts.active,
        count: alerts.active.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get snoozed alerts
  async getSnoozedAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = await this.alertService.getUserAlerts(req.user.id);
      
      res.json({
        success: true,
        data: alerts.snoozed,
        count: alerts.snoozed.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get read alerts history
  async getReadAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = await this.alertService.getUserAlerts(req.user.id);
      
      res.json({
        success: true,
        data: alerts.read,
        count: alerts.read.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Test notification channel
  async testNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { channel } = req.params;
      const success = await this.notificationService.testNotificationChannel(
        channel,
        req.user.id
      );
      
      res.json({
        success: true,
        message: success ? 'Test notification sent successfully' : 'Failed to send test notification',
        channelWorking: success
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Manually trigger reminder for testing
  async triggerReminder(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
}
