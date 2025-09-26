// Analytics Service - Provides system-wide metrics and insights

import { AlertRepository } from '../repositories/AlertRepository';
import { UserAlertPreferenceRepository } from '../repositories/UserAlertPreferenceRepository';
import { NotificationDeliveryRepository } from '../repositories/NotificationDeliveryRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AlertSeverity } from '../models/Alert';

export interface AnalyticsData {
  alerts: {
    total: number;
    active: number;
    expired: number;
    archived: number;
    bySeverity: {
      info: number;
      warning: number;
      critical: number;
    };
  };
  notifications: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  };
  userEngagement: {
    totalUsers: number;
    alertsRead: number;
    alertsSnoozed: number;
    alertsUnread: number;
    engagementRate: number;
  };
  topAlerts: {
    mostSnoozed: Array<{ alertId: string; title: string; snoozedCount: number }>;
    mostRead: Array<{ alertId: string; title: string; readCount: number }>;
    mostDelivered: Array<{ alertId: string; title: string; deliveryCount: number }>;
  };
}

export class AnalyticsService {
  private alertRepo: AlertRepository;
  private preferenceRepo: UserAlertPreferenceRepository;
  private deliveryRepo: NotificationDeliveryRepository;
  private userRepo: UserRepository;

  constructor() {
    this.alertRepo = new AlertRepository();
    this.preferenceRepo = new UserAlertPreferenceRepository();
    this.deliveryRepo = new NotificationDeliveryRepository();
    this.userRepo = new UserRepository();
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const [
      alertStats,
      notificationStats,
      userEngagementStats,
      topAlerts
    ] = await Promise.all([
      this.getAlertStatistics(),
      this.getNotificationStatistics(),
      this.getUserEngagementStatistics(),
      this.getTopAlerts()
    ]);

    return {
      alerts: alertStats,
      notifications: notificationStats,
      userEngagement: userEngagementStats,
      topAlerts
    };
  }

  private async getAlertStatistics() {
    const allAlerts = await this.alertRepo.findAll();
    const activeAlerts = await this.alertRepo.findActive();
    
    const bySeverity = {
      info: 0,
      warning: 0,
      critical: 0
    };

    let archived = 0;
    let expired = 0;

    for (const alert of allAlerts) {
      // Count by severity
      switch (alert.severity) {
        case AlertSeverity.INFO:
          bySeverity.info++;
          break;
        case AlertSeverity.WARNING:
          bySeverity.warning++;
          break;
        case AlertSeverity.CRITICAL:
          bySeverity.critical++;
          break;
      }

      // Count archived
      if (alert.archived) {
        archived++;
      }

      // Count expired
      if (alert.isExpired()) {
        expired++;
      }
    }

    return {
      total: allAlerts.length,
      active: activeAlerts.length,
      expired,
      archived,
      bySeverity
    };
  }

  private async getNotificationStatistics() {
    const stats = await this.deliveryRepo.getDeliveryStats();
    
    return {
      total: stats.total,
      delivered: stats.delivered,
      failed: stats.failed,
      pending: stats.pending,
      deliveryRate: stats.total > 0 
        ? Math.round((stats.delivered / stats.total) * 100 * 100) / 100 
        : 0
    };
  }

  private async getUserEngagementStatistics() {
    const allUsers = await this.userRepo.findAll();
    const allPreferences = await Promise.all(
      allUsers.map(user => this.preferenceRepo.findByUser(user.id!))
    );

    let alertsRead = 0;
    let alertsSnoozed = 0;
    let alertsUnread = 0;
    let usersEngaged = 0;

    for (const userPreferences of allPreferences) {
      if (userPreferences.length > 0) {
        usersEngaged++;
      }

      for (const preference of userPreferences) {
        switch (preference.state) {
          case 'READ':
            alertsRead++;
            break;
          case 'SNOOZED':
            alertsSnoozed++;
            break;
          case 'UNREAD':
            alertsUnread++;
            break;
        }
      }
    }

    const engagementRate = allUsers.length > 0
      ? Math.round((usersEngaged / allUsers.length) * 100 * 100) / 100
      : 0;

    return {
      totalUsers: allUsers.length,
      alertsRead,
      alertsSnoozed,
      alertsUnread,
      engagementRate
    };
  }

  private async getTopAlerts() {
    const allAlerts = await this.alertRepo.findAll();
    
    // Count metrics for each alert
    const alertMetrics = new Map<string, {
      title: string;
      snoozedCount: number;
      readCount: number;
      deliveryCount: number;
    }>();

    for (const alert of allAlerts) {
      if (!alert.id) continue;

      const preferences = await this.preferenceRepo.findByAlert(alert.id);
      const deliveries = await this.deliveryRepo.findByAlert(alert.id);

      const snoozedCount = preferences.filter(p => p.state === 'SNOOZED').length;
      const readCount = preferences.filter(p => p.state === 'READ').length;
      const deliveryCount = deliveries.filter(d => d.status === 'DELIVERED').length;

      alertMetrics.set(alert.id, {
        title: alert.title,
        snoozedCount,
        readCount,
        deliveryCount
      });
    }

    // Sort and get top 5 for each category
    const metricsArray = Array.from(alertMetrics.entries());
    
    const mostSnoozed = metricsArray
      .sort((a, b) => b[1].snoozedCount - a[1].snoozedCount)
      .slice(0, 5)
      .map(([id, metrics]) => ({
        alertId: id,
        title: metrics.title,
        snoozedCount: metrics.snoozedCount
      }));

    const mostRead = metricsArray
      .sort((a, b) => b[1].readCount - a[1].readCount)
      .slice(0, 5)
      .map(([id, metrics]) => ({
        alertId: id,
        title: metrics.title,
        readCount: metrics.readCount
      }));

    const mostDelivered = metricsArray
      .sort((a, b) => b[1].deliveryCount - a[1].deliveryCount)
      .slice(0, 5)
      .map(([id, metrics]) => ({
        alertId: id,
        title: metrics.title,
        deliveryCount: metrics.deliveryCount
      }));

    return {
      mostSnoozed,
      mostRead,
      mostDelivered
    };
  }

  async getUserAnalytics(userId: string): Promise<{
    totalAlerts: number;
    unreadAlerts: number;
    readAlerts: number;
    snoozedAlerts: number;
    notificationsReceived: number;
    lastNotificationAt?: Date;
  }> {
    const preferences = await this.preferenceRepo.findByUser(userId);
    const deliveries = await this.deliveryRepo.findByUser(userId);

    const unreadAlerts = preferences.filter(p => p.state === 'UNREAD').length;
    const readAlerts = preferences.filter(p => p.state === 'READ').length;
    const snoozedAlerts = preferences.filter(p => p.state === 'SNOOZED').length;
    
    const lastDelivery = deliveries
      .filter(d => d.status === 'DELIVERED')
      .sort((a, b) => (b.deliveredAt?.getTime() || 0) - (a.deliveredAt?.getTime() || 0))[0];

    return {
      totalAlerts: preferences.length,
      unreadAlerts,
      readAlerts,
      snoozedAlerts,
      notificationsReceived: deliveries.filter(d => d.status === 'DELIVERED').length,
      lastNotificationAt: lastDelivery?.deliveredAt
    };
  }

  async getAlertAnalytics(alertId: string): Promise<{
    deliveries: {
      total: number;
      delivered: number;
      failed: number;
    };
    engagement: {
      read: number;
      unread: number;
      snoozed: number;
    };
    averageNotificationsPerUser: number;
  }> {
    const preferences = await this.preferenceRepo.findByAlert(alertId);
    const deliveries = await this.deliveryRepo.findByAlert(alertId);

    const delivered = deliveries.filter(d => d.status === 'DELIVERED').length;
    const failed = deliveries.filter(d => d.status === 'FAILED').length;

    const read = preferences.filter(p => p.state === 'READ').length;
    const unread = preferences.filter(p => p.state === 'UNREAD').length;
    const snoozed = preferences.filter(p => p.state === 'SNOOZED').length;

    const totalNotifications = preferences.reduce((sum, p) => sum + p.notificationCount, 0);
    const averageNotificationsPerUser = preferences.length > 0
      ? Math.round((totalNotifications / preferences.length) * 100) / 100
      : 0;

    return {
      deliveries: {
        total: deliveries.length,
        delivered,
        failed
      },
      engagement: {
        read,
        unread,
        snoozed
      },
      averageNotificationsPerUser
    };
  }
}
