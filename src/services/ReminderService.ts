// Reminder Service - Handles recurring reminder logic

import * as cron from 'node-cron';
import { AlertRepository } from '../repositories/AlertRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UserAlertPreferenceRepository } from '../repositories/UserAlertPreferenceRepository';
import { NotificationService } from './NotificationService';
import { config } from '../config';

export class ReminderService {
  private alertRepo: AlertRepository;
  private userRepo: UserRepository;
  private preferenceRepo: UserAlertPreferenceRepository;
  private notificationService: NotificationService;
  private reminderTasks: Map<string, cron.ScheduledTask>;
  private isRunning: boolean;

  constructor() {
    this.alertRepo = new AlertRepository();
    this.userRepo = new UserRepository();
    this.preferenceRepo = new UserAlertPreferenceRepository();
    this.notificationService = new NotificationService();
    this.reminderTasks = new Map();
    this.isRunning = false;
  }

  start(): void {
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

  stop(): void {
    for (const [taskId, task] of this.reminderTasks) {
      task.stop();
      console.log(`⏹️ Stopped reminder task: ${taskId}`);
    }
    
    this.reminderTasks.clear();
    this.isRunning = false;
    console.log('⏹️ Reminder service stopped');
  }

  async processReminders(): Promise<void> {
    try {
      console.log('🔍 Processing reminders...');
      
      // Get all active alerts
      const activeAlerts = await this.alertRepo.findActive();
      
      for (const alert of activeAlerts) {
        await this.processAlertReminders(alert);
      }
      
      console.log(`✅ Processed reminders for ${activeAlerts.length} active alerts`);
    } catch (error) {
      console.error('❌ Error processing reminders:', error);
    }
  }

  private async processAlertReminders(alert: any): Promise<void> {
    // Get all users who should receive this alert
    const users = await this.getUsersForAlert(alert);
    
    for (const user of users) {
      try {
        // Get or create user preference for this alert
        const preference = await this.preferenceRepo.getOrCreate(user.id!, alert.id!);
        
        // Check if reminder should be sent
        if (preference.shouldNotify(alert.reminderFrequency)) {
          console.log(`🔔 Sending reminder to ${user.name} for alert: ${alert.title}`);
          await this.notificationService.sendNotification(alert, user);
        }
      } catch (error) {
        console.error(`Failed to process reminder for user ${user.id}:`, error);
      }
    }
  }

  private async getUsersForAlert(alert: any) {
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
          if (user) users.push(user);
        }
        break;
    }
    
    // Remove duplicates
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.id, u])).values()
    );
    
    return uniqueUsers;
  }

  // Manual trigger for testing
  async triggerRemindersForAlert(alertId: string): Promise<void> {
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
  async checkSnoozeExpiry(): Promise<void> {
    const allPreferences = await this.preferenceRepo.findSnoozedByUser('*'); // Would need to implement this
    
    for (const preference of allPreferences) {
      if (!preference.isSnoozed()) {
        // Snooze has expired, update state
        preference.markAsUnread();
        await this.preferenceRepo.update(preference.id!, preference.toJSON());
        console.log(`⏰ Snooze expired for user ${preference.userId}, alert ${preference.alertId}`);
      }
    }
  }

  getStatus(): {
    isRunning: boolean;
    activeTasks: number;
    nextRun?: Date;
  } {
    return {
      isRunning: this.isRunning,
      activeTasks: this.reminderTasks.size,
      nextRun: this.isRunning ? new Date(Date.now() + 5 * 60 * 1000) : undefined
    };
  }
}
