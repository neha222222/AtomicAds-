// Admin Controller - Handles admin-specific endpoints

import { Request, Response } from 'express';
import { AlertService } from '../services/AlertService';
import { AuthRequest } from '../middleware/auth';
import { Alert, IAlert } from '../models/Alert';

export class AdminController {
  private alertService: AlertService;

  constructor() {
    this.alertService = new AlertService();
  }

  // Create new alert
  async createAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alertData: IAlert = req.body;
      const alert = await this.alertService.createAlert(alertData, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: alert
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Update existing alert
  async updateAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const updates: Partial<IAlert> = req.body;
      
      const alert = await this.alertService.updateAlert(alertId, updates, req.user.id);
      
      res.json({
        success: true,
        message: 'Alert updated successfully',
        data: alert
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Archive alert
  async archiveAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const success = await this.alertService.archiveAlert(alertId, req.user.id);
      
      if (success) {
        res.json({
          success: true,
          message: 'Alert archived successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // List all alerts (admin view)
  async listAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { severity, status, archived } = req.query;
      
      const filters: any = {};
      if (severity) filters.severity = severity as string;
      if (status === 'active') filters.enabled = true;
      if (status === 'inactive') filters.enabled = false;
      if (archived === 'true') filters.archived = true;
      if (archived === 'false') filters.archived = false;

      const alerts = await this.alertService.getAllAlerts(filters);
      
      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get single alert details
  async getAlert(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Enable/disable alert
  async toggleAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { enabled } = req.body;
      
      const alert = await this.alertService.updateAlert(
        alertId, 
        { enabled }, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: `Alert ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: alert
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get alerts created by specific admin
  async getMyAlerts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alerts = await this.alertService.getAlertsByAdmin(req.user.id);
      
      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
}
