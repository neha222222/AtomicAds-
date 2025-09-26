"use strict";
// Reminder Service - Handles recurring reminder logic
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const cron = __importStar(require("node-cron"));
const AlertRepository_1 = require("../repositories/AlertRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const UserAlertPreferenceRepository_1 = require("../repositories/UserAlertPreferenceRepository");
const NotificationService_1 = require("./NotificationService");
class ReminderService {
    constructor() {
        this.alertRepo = new AlertRepository_1.AlertRepository();
        this.userRepo = new UserRepository_1.UserRepository();
        this.preferenceRepo = new UserAlertPreferenceRepository_1.UserAlertPreferenceRepository();
        this.notificationService = new NotificationService_1.NotificationService();
        this.reminderTasks = new Map();
        this.isRunning = false;
    }
    start() {
        if (this.isRunning) {
            console.log('⚠️ Reminder service is already running');
            return;
        }
        // Run reminder check every 5 minutes (more frequent than 2 hours for better responsiveness)
        const task = cron.schedule('*/5 * * * *', async () => {
            await this.processReminders();
        });
        task.start();
        this.reminderTasks.set('main', task);
        this.isRunning = true;
        console.log('🔄 Reminder service started - checking every 5 minutes');
        // Process reminders immediately on start
        this.processReminders();
    }
    stop() {
        for (const [taskId, task] of this.reminderTasks) {
            task.stop();
            console.log(`⏹️ Stopped reminder task: ${taskId}`);
        }
        this.reminderTasks.clear();
        this.isRunning = false;
        console.log('⏹️ Reminder service stopped');
    }
    async processReminders() {
        try {
            console.log('🔍 Processing reminders...');
            // Get all active alerts
            const activeAlerts = await this.alertRepo.findActive();
            for (const alert of activeAlerts) {
                await this.processAlertReminders(alert);
            }
            console.log(`✅ Processed reminders for ${activeAlerts.length} active alerts`);
        }
        catch (error) {
            console.error('❌ Error processing reminders:', error);
        }
    }
    async processAlertReminders(alert) {
        // Get all users who should receive this alert
        const users = await this.getUsersForAlert(alert);
        for (const user of users) {
            try {
                // Get or create user preference for this alert
                const preference = await this.preferenceRepo.getOrCreate(user.id, alert.id);
                // Check if reminder should be sent
                if (preference.shouldNotify(alert.reminderFrequency)) {
                    console.log(`🔔 Sending reminder to ${user.name} for alert: ${alert.title}`);
                    await this.notificationService.sendNotification(alert, user);
                }
            }
            catch (error) {
                console.error(`Failed to process reminder for user ${user.id}:`, error);
            }
        }
    }
    async getUsersForAlert(alert) {
        let users = [];
        switch (alert.visibilityType) {
            case 'ORGANIZATION':
                for (const orgId of alert.visibilityTargets) {
                    const orgUsers = await this.userRepo.findByOrganization(orgId);
                    users.push(...orgUsers);
                }
                break;
            case 'TEAM':
                for (const teamId of alert.visibilityTargets) {
                    const teamUsers = await this.userRepo.findByTeam(teamId);
                    users.push(...teamUsers);
                }
                break;
            case 'USER':
                for (const userId of alert.visibilityTargets) {
                    const user = await this.userRepo.findById(userId);
                    if (user)
                        users.push(user);
                }
                break;
        }
        // Remove duplicates
        const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
        return uniqueUsers;
    }
    // Manual trigger for testing
    async triggerRemindersForAlert(alertId) {
        const alert = await this.alertRepo.findById(alertId);
        if (!alert) {
            throw new Error('Alert not found');
        }
        if (!alert.isActive()) {
            throw new Error('Alert is not active');
        }
        await this.processAlertReminders(alert);
        console.log(`✅ Manually triggered reminders for alert: ${alert.title}`);
    }
    // Check snooze expiry and reset states
    async checkSnoozeExpiry() {
        const allPreferences = await this.preferenceRepo.findSnoozedByUser('*'); // Would need to implement this
        for (const preference of allPreferences) {
            if (!preference.isSnoozed()) {
                // Snooze has expired, update state
                preference.markAsUnread();
                await this.preferenceRepo.update(preference.id, preference.toJSON());
                console.log(`⏰ Snooze expired for user ${preference.userId}, alert ${preference.alertId}`);
            }
        }
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeTasks: this.reminderTasks.size,
            nextRun: this.isRunning ? new Date(Date.now() + 5 * 60 * 1000) : undefined
        };
    }
}
exports.ReminderService = ReminderService;
