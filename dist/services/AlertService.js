"use strict";
// Alert Service - Business logic for alert management
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const Alert_1 = require("../models/Alert");
const AlertRepository_1 = require("../repositories/AlertRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const UserAlertPreferenceRepository_1 = require("../repositories/UserAlertPreferenceRepository");
const AlertObserver_1 = require("../patterns/AlertObserver");
const NotificationStrategy_1 = require("../patterns/NotificationStrategy");
class AlertService {
    constructor() {
        this.alertRepo = new AlertRepository_1.AlertRepository();
        this.userRepo = new UserRepository_1.UserRepository();
        this.preferenceRepo = new UserAlertPreferenceRepository_1.UserAlertPreferenceRepository();
        const notificationContext = new NotificationStrategy_1.NotificationContext();
        this.subscriptionManager = new AlertObserver_1.SubscriptionManager(notificationContext);
    }
    async createAlert(alertData, creatorId) {
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
    async updateAlert(alertId, updates, updaterId) {
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
    async archiveAlert(alertId, archiverId) {
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
    async getAlertById(alertId) {
        return this.alertRepo.findById(alertId);
    }
    async getAlertsByAdmin(adminId, filters) {
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
    async getAllAlerts(filters) {
        return this.alertRepo.findAll(filters);
    }
    async getActiveAlerts() {
        return this.alertRepo.findActive();
    }
    async getUserAlerts(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Get alerts visible to this user
        const visibleAlerts = await this.alertRepo.findByVisibility(user.organizationId, user.teamId, user.id);
        // Get user preferences
        const preferences = await this.preferenceRepo.findByUser(userId);
        const preferenceMap = new Map(preferences.map(p => [p.alertId, p]));
        // Categorize alerts
        const active = [];
        const snoozed = [];
        const read = [];
        for (const alert of visibleAlerts) {
            const preference = preferenceMap.get(alert.id);
            if (!preference || preference.state === 'UNREAD') {
                active.push(alert);
            }
            else if (preference.state === 'SNOOZED') {
                snoozed.push(alert);
            }
            else if (preference.state === 'READ') {
                read.push(alert);
            }
        }
        return { active, snoozed, read };
    }
    async markAlertAsRead(userId, alertId) {
        await this.preferenceRepo.markAsRead(userId, alertId);
        console.log(`📖 Alert marked as read for user ${userId}`);
    }
    async markAlertAsUnread(userId, alertId) {
        await this.preferenceRepo.markAsUnread(userId, alertId);
        console.log(`🔄 Alert marked as unread for user ${userId}`);
    }
    async snoozeAlert(userId, alertId) {
        await this.preferenceRepo.snoozeForDay(userId, alertId);
        console.log(`😴 Alert snoozed for user ${userId} until tomorrow`);
    }
    async subscribeUsersToAlert(alert) {
        const users = await this.getUsersForAlert(alert);
        for (const user of users) {
            this.subscriptionManager.subscribeUserToAlert(user, alert.id);
            // Create initial preference record
            await this.preferenceRepo.getOrCreate(user.id, alert.id);
        }
        console.log(`👥 Subscribed ${users.length} users to alert: ${alert.title}`);
    }
    async getUsersForAlert(alert) {
        let users = [];
        switch (alert.visibilityType) {
            case Alert_1.VisibilityType.ORGANIZATION:
                for (const orgId of alert.visibilityTargets) {
                    const orgUsers = await this.userRepo.findByOrganization(orgId);
                    users.push(...orgUsers);
                }
                break;
            case Alert_1.VisibilityType.TEAM:
                for (const teamId of alert.visibilityTargets) {
                    const teamUsers = await this.userRepo.findByTeam(teamId);
                    users.push(...teamUsers);
                }
                break;
            case Alert_1.VisibilityType.USER:
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
}
exports.AlertService = AlertService;
