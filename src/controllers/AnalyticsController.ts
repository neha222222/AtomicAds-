// Analytics Controller - Handles analytics endpoints

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthRequest } from '../middleware/auth';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // Get system-wide analytics (admin only)
  async getSystemAnalytics(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get analytics for specific alert
  async getAlertAnalytics(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get analytics for specific user (admin can see any user, users can see their own)
  async getUserAnalytics(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get alert statistics summary
  async getAlertStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const analytics = await this.analyticsService.getAnalytics();
      
      res.json({
        success: true,
        data: analytics.alerts,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get notification statistics summary
  async getNotificationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const analytics = await this.analyticsService.getAnalytics();
      
      res.json({
        success: true,
        data: analytics.notifications,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get user engagement statistics
  async getEngagementStats(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get top performing alerts
  async getTopAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const analytics = await this.analyticsService.getAnalytics();
      
      res.json({
        success: true,
        data: analytics.topAlerts,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
}
