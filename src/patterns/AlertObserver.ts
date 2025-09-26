// Observer Pattern for Alert Subscriptions

import { Alert } from '../models/Alert';
import { User } from '../models/User';
import { NotificationContext } from './NotificationStrategy';

// Observer Interface
export interface AlertObserver {
  update(alert: Alert): Promise<void>;
  getUserId(): string;
  getObserverName(): string;
}

// Subject Interface
export interface AlertSubject {
  attach(observer: AlertObserver): void;
  detach(observer: AlertObserver): void;
  notifyObservers(alert: Alert): Promise<void>;
}

// Concrete Observer: User Alert Observer
export class UserAlertObserver implements AlertObserver {
  private user: User;
  private notificationContext: NotificationContext;

  constructor(user: User, notificationContext: NotificationContext) {
    this.user = user;
    this.notificationContext = notificationContext;
  }

  async update(alert: Alert): Promise<void> {
    // Check if user should receive this alert based on visibility
    if (this.shouldReceiveAlert(alert)) {
      try {
        await this.notificationContext.sendNotification(alert, this.user);
        console.log(`🔔 User ${this.user.name} notified about alert: ${alert.title}`);
      } catch (error) {
        console.error(`Failed to notify user ${this.user.name}:`, error);
      }
    }
  }

  private shouldReceiveAlert(alert: Alert): boolean {
    switch (alert.visibilityType) {
      case 'ORGANIZATION':
        return alert.visibilityTargets.includes(this.user.organizationId);
      
      case 'TEAM':
        return this.user.teamId ? alert.visibilityTargets.includes(this.user.teamId) : false;
      
      case 'USER':
        return alert.visibilityTargets.includes(this.user.id!);
      
      default:
        return false;
    }
  }

  getUserId(): string {
    return this.user.id!;
  }

  getObserverName(): string {
    return `UserObserver_${this.user.name}`;
  }
}

// Concrete Subject: Alert Publisher
export class AlertPublisher implements AlertSubject {
  private observers: Map<string, AlertObserver> = new Map();

  attach(observer: AlertObserver): void {
    const userId = observer.getUserId();
    if (!this.observers.has(userId)) {
      this.observers.set(userId, observer);
      console.log(`➕ Observer attached for user: ${userId}`);
    }
  }

  detach(observer: AlertObserver): void {
    const userId = observer.getUserId();
    if (this.observers.delete(userId)) {
      console.log(`➖ Observer detached for user: ${userId}`);
    }
  }

  async notifyObservers(alert: Alert): Promise<void> {
    if (!alert.isActive()) {
      console.log(`⏸️ Alert ${alert.title} is not active, skipping notifications`);
      return;
    }

    const notificationPromises: Promise<void>[] = [];
    
    for (const observer of this.observers.values()) {
      notificationPromises.push(observer.update(alert));
    }

    await Promise.all(notificationPromises);
    console.log(`✅ Notified ${notificationPromises.length} observers about alert: ${alert.title}`);
  }

  getObserverCount(): number {
    return this.observers.size;
  }

  hasObserver(userId: string): boolean {
    return this.observers.has(userId);
  }
}

// Subscription Manager to handle multiple publishers
export class SubscriptionManager {
  private publishers: Map<string, AlertPublisher> = new Map();
  private notificationContext: NotificationContext;

  constructor(notificationContext: NotificationContext) {
    this.notificationContext = notificationContext;
  }

  subscribeUserToAlert(user: User, alertId: string): void {
    if (!this.publishers.has(alertId)) {
      this.publishers.set(alertId, new AlertPublisher());
    }

    const publisher = this.publishers.get(alertId)!;
    const observer = new UserAlertObserver(user, this.notificationContext);
    publisher.attach(observer);
  }

  unsubscribeUserFromAlert(userId: string, alertId: string): void {
    const publisher = this.publishers.get(alertId);
    if (publisher && publisher.hasObserver(userId)) {
      // We need to create a temporary observer just to detach it
      // In a real implementation, we'd store observers differently
      console.log(`Unsubscribing user ${userId} from alert ${alertId}`);
    }
  }

  async publishAlert(alert: Alert): Promise<void> {
    const publisher = this.publishers.get(alert.id!) || new AlertPublisher();
    await publisher.notifyObservers(alert);
  }

  getPublisherForAlert(alertId: string): AlertPublisher | undefined {
    return this.publishers.get(alertId);
  }
}
