// Notification Service - Handles sending notifications

import { Alert, AlertSeverity, VisibilityType } from '../models/Alert';
import { User } from '../models/User';
import { NotificationDelivery, DeliveryStatus } from '../models/NotificationDelivery';
import { NotificationContext } from '../patterns/NotificationStrategy';
import { NotificationDeliveryRepository } from '../repositories/NotificationDeliveryRepository';
import { UserAlertPreferenceRepository } from '../repositories/UserAlertPreferenceRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { UserRepository } from '../repositories/UserRepository';

export class NotificationService {
  private notificationContext: NotificationContext;
  private deliveryRepo: NotificationDeliveryRepository;
  private preferenceRepo: UserAlertPreferenceRepository;
  private alertRepo: AlertRepository;
  private userRepo: UserRepository;

  constructor() {
    this.notificationContext = new NotificationContext();
    this.deliveryRepo = new NotificationDeliveryRepository();
    this.preferenceRepo = new UserAlertPreferenceRepository();
    this.alertRepo = new AlertRepository();
    this.userRepo = new UserRepository();
  }

  async sendNotification(alert: Alert, user: User): Promise<NotificationDelivery> {
    try {
      // Check if user should receive notification
      const preference = await this.preferenceRepo.getOrCreate(user.id!, alert.id!);
      
      // Don't send if snoozed
      if (preference.isSnoozed()) {
        console.log(`⏸️ Notification skipped (snoozed) for user ${user.name}`);
        return new NotificationDelivery({
          alertId: alert.id!,
          userId: user.id!,
          deliveryType: alert.deliveryType,
          status: DeliveryStatus.FAILED,
          failureReason: 'Alert is snoozed'
        });
      }

      // Send the notification
      const delivery = await this.notificationContext.sendNotification(alert, user);
      
      // Save delivery record
      const savedDelivery = await this.deliveryRepo.create(delivery.toJSON());
      
      // Update preference with notification details
      await this.preferenceRepo.incrementNotificationCount(user.id!, alert.id!);
      
      console.log(`📤 Notification sent: ${alert.title} → ${user.name}`);
      return savedDelivery;
    } catch (error) {
      console.error(`Failed to send notification to ${user.name}:`, error);
      
      const failedDelivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.FAILED,
        failureReason: (error as Error).message
      });
      
      return this.deliveryRepo.create(failedDelivery.toJSON());
    }
  }

  async sendBulkNotifications(alert: Alert, users: User[]): Promise<NotificationDelivery[]> {
    const deliveries: NotificationDelivery[] = [];
    
    // Send notifications in parallel for better performance
    const promises = users.map(user => this.sendNotification(alert, user));
    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        deliveries.push(result.value);
      } else {
        console.error('Failed to send notification:', result.reason);
      }
    }
    
    console.log(`📧 Sent ${deliveries.length} notifications for alert: ${alert.title}`);
    return deliveries;
  }

  async getNotificationHistory(userId: string): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.findByUser(userId);
  }

  async getAlertNotificationHistory(alertId: string): Promise<NotificationDelivery[]> {
    return this.deliveryRepo.findByAlert(alertId);
  }

  async getDeliveryStats(): Promise<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  }> {
    const stats = await this.deliveryRepo.getDeliveryStats();
    
    const deliveryRate = stats.total > 0 
      ? (stats.delivered / stats.total) * 100 
      : 0;
    
    return {
      ...stats,
      deliveryRate: Math.round(deliveryRate * 100) / 100
    };
  }

  async getAvailableChannels(): Promise<string[]> {
    return this.notificationContext.getAvailableStrategies();
  }

  async testNotificationChannel(channelName: string, userId: string): Promise<boolean> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const testAlert = new Alert({
        id: 'test',
        title: 'Test Alert',
        message: 'This is a test notification',
        severity: AlertSeverity.INFO,
        deliveryType: channelName as any,
        reminderFrequency: 0,
        visibilityType: VisibilityType.USER,
        visibilityTargets: [userId],
        startTime: new Date(),
        expiryTime: new Date(Date.now() + 86400000),
        enabled: true,
        archived: false,
        createdBy: userId
      });

      this.notificationContext.setStrategy(channelName);
      const delivery = await this.notificationContext.sendNotification(testAlert, user);
      
      return delivery.status === DeliveryStatus.DELIVERED;
    } catch (error) {
      console.error(`Failed to test channel ${channelName}:`, error);
      return false;
    }
  }
}
