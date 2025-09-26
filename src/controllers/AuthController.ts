// Auth Controller - Handles authentication endpoints

import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // User login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const result = await this.authService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user.toJSON(),
          token: result.token
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // User registration
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, organizationId, teamId } = req.body;
      
      // Validate required fields
      if (!name || !email || !password || !organizationId) {
        res.status(400).json({
          success: false,
          error: 'Name, email, password, and organizationId are required'
        });
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
        return;
      }

      const result = await this.authService.register({
        name,
        email,
        password,
        organizationId,
        teamId
      });
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user.toJSON(),
          token: result.token
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Change password
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Old password and new password are required'
        });
        return;
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
        return;
      }

      const success = await this.authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      );
      
      if (success) {
        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to change password'
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get current user info
  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: req.user.toJSON()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Verify token
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required'
        });
        return;
      }

      const payload = this.authService.verifyToken(token);
      
      res.json({
        success: true,
        message: 'Token is valid',
        data: payload
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
}
