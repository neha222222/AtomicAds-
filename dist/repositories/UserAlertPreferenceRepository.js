"use strict";
// UserAlertPreference Repository for data access
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAlertPreferenceRepository = void 0;
const UserAlertPreference_1 = require("../models/UserAlertPreference");
const Database_1 = require("../database/Database");
const uuid_1 = require("uuid");
class UserAlertPreferenceRepository {
    constructor() {
        this.db = Database_1.Database.getInstance();
    }
    async create(preference) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const sql = `
      INSERT INTO user_alert_preferences (
        id, user_id, alert_id, state, read_at, snoozed_until,
        last_notified_at, notification_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.db.run(sql, [
            id,
            preference.userId,
            preference.alertId,
            preference.state,
            preference.readAt ? new Date(preference.readAt).toISOString() : null,
            preference.snoozedUntil ? new Date(preference.snoozedUntil).toISOString() : null,
            preference.lastNotifiedAt ? new Date(preference.lastNotifiedAt).toISOString() : null,
            preference.notificationCount || 0,
            now,
            now
        ]);
        return new UserAlertPreference_1.UserAlertPreference({
            ...preference,
            id,
            createdAt: new Date(now),
            updatedAt: new Date(now)
        });
    }
    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        const sql = `
      UPDATE user_alert_preferences SET
        state = ?,
        read_at = ?,
        snoozed_until = ?,
        last_notified_at = ?,
        notification_count = ?,
        updated_at = ?
      WHERE id = ?
    `;
        const updatedPref = { ...existing, ...updates };
        const now = new Date().toISOString();
        await this.db.run(sql, [
            updatedPref.state,
            updatedPref.readAt ? new Date(updatedPref.readAt).toISOString() : null,
            updatedPref.snoozedUntil ? new Date(updatedPref.snoozedUntil).toISOString() : null,
            updatedPref.lastNotifiedAt ? new Date(updatedPref.lastNotifiedAt).toISOString() : null,
            updatedPref.notificationCount,
            now,
            id
        ]);
        return new UserAlertPreference_1.UserAlertPreference({ ...updatedPref, updatedAt: new Date(now) });
    }
    async findById(id) {
        const sql = 'SELECT * FROM user_alert_preferences WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row)
            return null;
        return this.mapRowToPreference(row);
    }
    async findByUserAndAlert(userId, alertId) {
        const sql = 'SELECT * FROM user_alert_preferences WHERE user_id = ? AND alert_id = ?';
        const row = await this.db.get(sql, [userId, alertId]);
        if (!row)
            return null;
        return this.mapRowToPreference(row);
    }
    async findByUser(userId) {
        const sql = `
      SELECT * FROM user_alert_preferences 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `;
        const rows = await this.db.all(sql, [userId]);
        return rows.map(row => this.mapRowToPreference(row));
    }
    async findByAlert(alertId) {
        const sql = `
      SELECT * FROM user_alert_preferences 
      WHERE alert_id = ? 
      ORDER BY updated_at DESC
    `;
        const rows = await this.db.all(sql, [alertId]);
        return rows.map(row => this.mapRowToPreference(row));
    }
    async findUnreadByUser(userId) {
        const sql = `
      SELECT * FROM user_alert_preferences 
      WHERE user_id = ? AND state = ?
      ORDER BY created_at DESC
    `;
        const rows = await this.db.all(sql, [userId, UserAlertPreference_1.AlertState.UNREAD]);
        return rows.map(row => this.mapRowToPreference(row));
    }
    async findSnoozedByUser(userId) {
        const sql = `
      SELECT * FROM user_alert_preferences 
      WHERE user_id = ? AND state = ?
      ORDER BY snoozed_until DESC
    `;
        const rows = await this.db.all(sql, [userId, UserAlertPreference_1.AlertState.SNOOZED]);
        return rows.map(row => this.mapRowToPreference(row));
    }
    async getOrCreate(userId, alertId) {
        let preference = await this.findByUserAndAlert(userId, alertId);
        if (!preference) {
            preference = await this.create({
                userId,
                alertId,
                state: UserAlertPreference_1.AlertState.UNREAD,
                notificationCount: 0
            });
        }
        return preference;
    }
    async markAsRead(userId, alertId) {
        const preference = await this.getOrCreate(userId, alertId);
        preference.markAsRead();
        return this.update(preference.id, preference.toJSON());
    }
    async markAsUnread(userId, alertId) {
        const preference = await this.getOrCreate(userId, alertId);
        preference.markAsUnread();
        return this.update(preference.id, preference.toJSON());
    }
    async snoozeForDay(userId, alertId) {
        const preference = await this.getOrCreate(userId, alertId);
        preference.snoozeForDay();
        return this.update(preference.id, preference.toJSON());
    }
    async incrementNotificationCount(userId, alertId) {
        const preference = await this.getOrCreate(userId, alertId);
        preference.incrementNotificationCount();
        return this.update(preference.id, preference.toJSON());
    }
    async delete(id) {
        const sql = 'DELETE FROM user_alert_preferences WHERE id = ?';
        const result = await this.db.run(sql, [id]);
        return result.changes > 0;
    }
    mapRowToPreference(row) {
        return new UserAlertPreference_1.UserAlertPreference({
            id: row.id,
            userId: row.user_id,
            alertId: row.alert_id,
            state: row.state,
            readAt: row.read_at ? new Date(row.read_at) : undefined,
            snoozedUntil: row.snoozed_until ? new Date(row.snoozed_until) : undefined,
            lastNotifiedAt: row.last_notified_at ? new Date(row.last_notified_at) : undefined,
            notificationCount: row.notification_count,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }
}
exports.UserAlertPreferenceRepository = UserAlertPreferenceRepository;
