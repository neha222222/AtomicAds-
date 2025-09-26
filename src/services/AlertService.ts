// Alert Service - Business logic for alert management

import { Alert, IAlert, AlertSeverity, VisibilityType } from '../models/Alert';
import { AlertRepository } from '../repositories/AlertRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UserAlertPreferenceRepository } from '../repositories/UserAlertPreferenceRepository';
import { SubscriptionManager } from '../patterns/AlertObserver';
import { NotificationContext } from '../patterns/NotificationStrategy';

export class AlertService {
  private alertRepo: AlertRepository;
  private userRepo: UserRepository;
  private preferenceRepo: UserAlertPreferenceRepository;
  private subscriptionManager: SubscriptionManager;

  constructor() {
    this.alertRepo = new AlertRepository();
    this.userRepo = new UserRepository();
    this.preferenceRepo = new UserAlertPreferenceRepository();
    
    const notificationContext = new NotificationContext();
    this.subscriptionManager = new SubscriptionManager(notificationContext);
  }

  async createAlert(alertData: IAlert, creatorId: string): Promise<Alert> {
    // Validate creator is an admin
    const creator = await this.userRepo.findById(creatorId);
    if (!creator || !creator.isAdmin()) {
      throw new Error('Only admins can create alerts');
    }

    // Create the alert
    const alert = await this.alertRepo.create({
      ...alertData,
      createdBy: creatorId
    });

    // Subscribe relevant users based on visibility
    await this.subscribeUsersToAlert(alert);

    // Immediately notify if alert is active
    if (alert.isActive()) {
      await this.subscriptionManager.publishAlert(alert);
    }

    console.log(`✅ Alert created: ${alert.title}`);
    return alert;
  }

  async updateAlert(alertId: string, updates: Partial<IAlert>, updaterId: string): Promise<Alert> {
    // Validate updater is an admin
    const updater = await this.userRepo.findById(updaterId);
    if (!updater || !updater.isAdmin()) {
      throw new Error('Only admins can update alerts');
    }

    // Update the alert
    const updatedAlert = await this.alertRepo.update(alertId, updates);
    if (!updatedAlert) {
      throw new Error('Alert not found');
    }

    // Re-subscribe users if visibility changed
    if (updates.visibilityType || updates.visibilityTargets) {
      await this.subscribeUsersToAlert(updatedAlert);
    }

    console.log(`✅ Alert updated: ${updatedAlert.title}`);
    return updatedAlert;
  }

  async archiveAlert(alertId: string, archiverId: string): Promise<boolean> {
    // Validate archiver is an admin
    const archiver = await this.userRepo.findById(archiverId);
    if (!archiver || !archiver.isAdmin()) {
      throw new Error('Only admins can archive alerts');
    }

    const success = await this.alertRepo.archive(alertId);
    if (success) {
      console.log(`📦 Alert archived: ${alertId}`);
    }
    return success;
  }

  async getAlertById(alertId: string): Promise<Alert | null> {
    return this.alertRepo.findById(alertId);
  }

  async getAlertsByAdmin(adminId: string, filters?: {
    severity?: AlertSeverity;
    enabled?: boolean;
    archived?: boolean;
  }): Promise<Alert[]> {
    // Validate user is an admin
    const admin = await this.userRepo.findById(adminId);
    if (!admin || !admin.isAdmin()) {
      throw new Error('Only admins can view all alerts');
    }

    return this.alertRepo.findAll({
      ...filters,
      createdBy: adminId
    });
  }

  async getAllAlerts(filters?: {
    severity?: AlertSeverity;
    enabled?: boolean;
    archived?: boolean;
  }): Promise<Alert[]> {
    return this.alertRepo.findAll(filters);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return this.alertRepo.findActive();
  }

  async getUserAlerts(userId: string): Promise<{
    active: Alert[];
    snoozed: Alert[];
    read: Alert[];
  }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get alerts visible to this user
    const visibleAlerts = await this.alertRepo.findByVisibility(
      user.organizationId,
      user.teamId,
      user.id
    );

    // Get user preferences
    const preferences = await this.preferenceRepo.findByUser(userId);
    const preferenceMap = new Map(preferences.map(p => [p.alertId, p]));

    // Categorize alerts
    const active: Alert[] = [];
    const snoozed: Alert[] = [];
    const read: Alert[] = [];

    for (const alert of visibleAlerts) {
      const preference = preferenceMap.get(alert.id!);
      
      if (!preference || preference.state === 'UNREAD') {
        active.push(alert);
      } else if (preference.state === 'SNOOZED') {
        snoozed.push(alert);
      } else if (preference.state === 'READ') {
        read.push(alert);
      }
    }

    return { active, snoozed, read };
  }

  async markAlertAsRead(userId: string, alertId: string): Promise<void> {
    await this.preferenceRepo.markAsRead(userId, alertId);
    console.log(`📖 Alert marked as read for user ${userId}`);
  }

  async markAlertAsUnread(userId: string, alertId: string): Promise<void> {
    await this.preferenceRepo.markAsUnread(userId, alertId);
    console.log(`🔄 Alert marked as unread for user ${userId}`);
  }

  async snoozeAlert(userId: string, alertId: string): Promise<void> {
    await this.preferenceRepo.snoozeForDay(userId, alertId);
    console.log(`😴 Alert snoozed for user ${userId} until tomorrow`);
  }

  private async subscribeUsersToAlert(alert: Alert): Promise<void> {
    const users = await this.getUsersForAlert(alert);
    
    for (const user of users) {
      this.subscriptionManager.subscribeUserToAlert(user, alert.id!);
      // Create initial preference record
      await this.preferenceRepo.getOrCreate(user.id!, alert.id!);
    }

    console.log(`👥 Subscribed ${users.length} users to alert: ${alert.title}`);
  }

  private async getUsersForAlert(alert: Alert) {
    let users = [];
    
    switch (alert.visibilityType) {
      case VisibilityType.ORGANIZATION:
        for (const orgId of alert.visibilityTargets) {
          const orgUsers = await this.userRepo.findByOrganization(orgId);
          users.push(...orgUsers);
        }
        break;
        
      case VisibilityType.TEAM:
        for (const teamId of alert.visibilityTargets) {
          const teamUsers = await this.userRepo.findByTeam(teamId);
          users.push(...teamUsers);
        }
        break;
        
      case VisibilityType.USER:
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
}
