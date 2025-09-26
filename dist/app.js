"use strict";
// Main application file
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const Database_1 = require("./database/Database");
const ReminderService_1 = require("./services/ReminderService");
const routes_1 = __importDefault(require("./routes"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.db = Database_1.Database.getInstance();
        this.reminderService = new ReminderService_1.ReminderService();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Enable CORS
        this.app.use((0, cors_1.default)());
        // Parse JSON bodies
        this.app.use(express_1.default.json());
        // Parse URL-encoded bodies
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        // API routes
        this.app.use('/api', routes_1.default);
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
    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('Global error handler:', err);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: config_1.config.nodeEnv === 'development' ? err.message : undefined
            });
        });
    }
    async initialize() {
        try {
            // Initialize database
            await this.db.initialize();
            console.log('✅ Database initialized');
            // Start reminder service
            this.reminderService.start();
            console.log('✅ Reminder service started');
            console.log('✅ Application initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize application:', error);
            throw error;
        }
    }
    async start() {
        const port = config_1.config.port;
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
    getExpressApp() {
        return this.app;
    }
    async shutdown() {
        console.log('Shutting down application...');
        // Stop reminder service
        this.reminderService.stop();
        // Close database
        await this.db.close();
        console.log('Application shutdown complete');
    }
}
exports.App = App;
