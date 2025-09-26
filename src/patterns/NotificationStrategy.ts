// Strategy Pattern for Notification Channels

import { Alert } from '../models/Alert';
import { User } from '../models/User';
import { NotificationDelivery, DeliveryStatus } from '../models/NotificationDelivery';

// Strategy Interface
export interface NotificationStrategy {
  send(alert: Alert, user: User): Promise<NotificationDelivery>;
  getName(): string;
  isAvailable(): boolean;
}

// Concrete Strategy: In-App Notification
export class InAppNotificationStrategy implements NotificationStrategy {
  private notifications: Map<string, any[]> = new Map();

  async send(alert: Alert, user: User): Promise<NotificationDelivery> {
    try {
      // Simulate in-app notification delivery
      if (!this.notifications.has(user.id!)) {
        this.notifications.set(user.id!, []);
      }

      const userNotifications = this.notifications.get(user.id!)!;
      userNotifications.push({
        alertId: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: new Date()
      });

      const delivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date()
      });

      console.log(`📱 In-App notification sent to ${user.name}: ${alert.title}`);
      return delivery;
    } catch (error) {
      const delivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.FAILED,
        failureReason: (error as Error).message
      });
      return delivery;
    }
  }

  getName(): string {
    return 'IN_APP';
  }

  isAvailable(): boolean {
    return true;
  }

  // Helper method to get notifications for a user
  getUserNotifications(userId: string): any[] {
    return this.notifications.get(userId) || [];
  }
}

// Concrete Strategy: Email Notification (Future-proofed)
export class EmailNotificationStrategy implements NotificationStrategy {
  private emailService: any; // Would be actual email service

  async send(alert: Alert, user: User): Promise<NotificationDelivery> {
    try {
      // Placeholder for email sending logic
      console.log(`📧 Email would be sent to ${user.email}: ${alert.title}`);
      
      const delivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date()
      });

      return delivery;
    } catch (error) {
      const delivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.FAILED,
        failureReason: (error as Error).message
      });
      return delivery;
    }
  }

  getName(): string {
    return 'EMAIL';
  }

  isAvailable(): boolean {
    return false; // Not implemented for MVP
  }
}

// Concrete Strategy: SMS Notification (Future-proofed)
export class SMSNotificationStrategy implements NotificationStrategy {
  private smsService: any; // Would be actual SMS service

  async send(alert: Alert, user: User): Promise<NotificationDelivery> {
    try {
      // Placeholder for SMS sending logic
      console.log(`📱 SMS would be sent to user ${user.name}: ${alert.title}`);
      
      const delivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date()
      });

      return delivery;
    } catch (error) {
      const delivery = new NotificationDelivery({
        alertId: alert.id!,
        userId: user.id!,
        deliveryType: alert.deliveryType,
        status: DeliveryStatus.FAILED,
        failureReason: (error as Error).message
      });
      return delivery;
    }
  }

  getName(): string {
    return 'SMS';
  }

  isAvailable(): boolean {
    return false; // Not implemented for MVP
  }
}

// Context Class
export class NotificationContext {
  private strategy: NotificationStrategy;
  private strategies: Map<string, NotificationStrategy> = new Map();

  constructor() {
    // Register all available strategies
    this.registerStrategy(new InAppNotificationStrategy());
    this.registerStrategy(new EmailNotificationStrategy());
    this.registerStrategy(new SMSNotificationStrategy());
    
    // Set default strategy
    this.strategy = this.strategies.get('IN_APP')!;
  }

  private registerStrategy(strategy: NotificationStrategy): void {
    this.strategies.set(strategy.getName(), strategy);
  }

  setStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }
    if (!strategy.isAvailable()) {
      throw new Error(`Strategy ${strategyName} is not available`);
    }
    this.strategy = strategy;
  }

  async sendNotification(alert: Alert, user: User): Promise<NotificationDelivery> {
    // Set strategy based on alert's delivery type
    this.setStrategy(alert.deliveryType);
    return this.strategy.send(alert, user);
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.entries())
      .filter(([_, strategy]) => strategy.isAvailable())
      .map(([name, _]) => name);
  }

  getStrategy(name: string): NotificationStrategy | undefined {
    return this.strategies.get(name);
  }
}
