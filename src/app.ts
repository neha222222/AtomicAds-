// Main application file

import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { Database } from './database/Database';
import { ReminderService } from './services/ReminderService';
import routes from './routes';

export class App {
  private app: Application;
  private db: Database;
  private reminderService: ReminderService;

  constructor() {
    this.app = express();
    this.db = Database.getInstance();
    this.reminderService = new ReminderService();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Enable CORS
    this.app.use(cors());
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', routes);
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Alerting & Notification Platform',
        version: '1.0.0',
        author: 'Neha Dhruw',
        description: 'A lightweight alerting and notification system',
        documentation: '/api/status',
        health: '/api/health'
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', err);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: config.nodeEnv === 'development' ? err.message : undefined
      });
    });
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database
      await this.db.initialize();
      console.log('✅ Database initialized');
      
      // Start reminder service
      this.reminderService.start();
      console.log('✅ Reminder service started');
      
      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    const port = config.port;
    
    this.app.listen(port, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Alerting Platform Server`);
      console.log(`📝 Author: Neha Dhruw`);
      console.log(`🔗 Server running at http://localhost:${port}`);
      console.log(`📍 API endpoints at http://localhost:${port}/api`);
      console.log(`🏥 Health check at http://localhost:${port}/api/health`);
      console.log('='.repeat(50));
    });
  }

  public getExpressApp(): Application {
    return this.app;
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down application...');
    
    // Stop reminder service
    this.reminderService.stop();
    
    // Close database
    await this.db.close();
    
    console.log('Application shutdown complete');
  }
}
