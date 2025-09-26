"use strict";
// Server entry point
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Create and start the application
const app = new app_1.App();
async function startServer() {
    try {
        await app.initialize();
        await app.start();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n📛 SIGINT received, shutting down gracefully...');
    await app.shutdown();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n📛 SIGTERM received, shutting down gracefully...');
    await app.shutdown();
    process.exit(0);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the server
startServer();
