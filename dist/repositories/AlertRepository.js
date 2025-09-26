"use strict";
// Alert Repository for data access
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertRepository = void 0;
const Alert_1 = require("../models/Alert");
const Database_1 = require("../database/Database");
const uuid_1 = require("uuid");
class AlertRepository {
    constructor() {
        this.db = Database_1.Database.getInstance();
    }
    async create(alert) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const sql = `
      INSERT INTO alerts (
        id, title, message, severity, delivery_type, reminder_frequency,
        visibility_type, visibility_targets, start_time, expiry_time,
        enabled, archived, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.db.run(sql, [
            id,
            alert.title,
            alert.message,
            alert.severity,
            alert.deliveryType,
            alert.reminderFrequency,
            alert.visibilityType,
            JSON.stringify(alert.visibilityTargets),
            alert.startTime.toISOString(),
            alert.expiryTime.toISOString(),
            alert.enabled ? 1 : 0,
            alert.archived ? 1 : 0,
            alert.createdBy,
            now,
            now
        ]);
        return new Alert_1.Alert({ ...alert, id, createdAt: new Date(now), updatedAt: new Date(now) });
    }
    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        const sql = `
      UPDATE alerts SET
        title = ?,
        message = ?,
        severity = ?,
        delivery_type = ?,
        reminder_frequency = ?,
        visibility_type = ?,
        visibility_targets = ?,
        start_time = ?,
        expiry_time = ?,
        enabled = ?,
        archived = ?,
        updated_at = ?
      WHERE id = ?
    `;
        const updatedAlert = { ...existing, ...updates };
        const now = new Date().toISOString();
        await this.db.run(sql, [
            updatedAlert.title,
            updatedAlert.message,
            updatedAlert.severity,
            updatedAlert.deliveryType,
            updatedAlert.reminderFrequency,
            updatedAlert.visibilityType,
            JSON.stringify(updatedAlert.visibilityTargets),
            new Date(updatedAlert.startTime).toISOString(),
            new Date(updatedAlert.expiryTime).toISOString(),
            updatedAlert.enabled ? 1 : 0,
            updatedAlert.archived ? 1 : 0,
            now,
            id
        ]);
        return new Alert_1.Alert({ ...updatedAlert, updatedAt: new Date(now) });
    }
    async findById(id) {
        const sql = 'SELECT * FROM alerts WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row)
            return null;
        return this.mapRowToAlert(row);
    }
    async findAll(filters) {
        let sql = 'SELECT * FROM alerts WHERE 1=1';
        const params = [];
        if (filters?.severity) {
            sql += ' AND severity = ?';
            params.push(filters.severity);
        }
        if (filters?.enabled !== undefined) {
            sql += ' AND enabled = ?';
            params.push(filters.enabled ? 1 : 0);
        }
        if (filters?.archived !== undefined) {
            sql += ' AND archived = ?';
            params.push(filters.archived ? 1 : 0);
        }
        if (filters?.createdBy) {
            sql += ' AND created_by = ?';
            params.push(filters.createdBy);
        }
        sql += ' ORDER BY created_at DESC';
        const rows = await this.db.all(sql, params);
        return rows.map(row => this.mapRowToAlert(row));
    }
    async findActive() {
        const now = new Date().toISOString();
        const sql = `
      SELECT * FROM alerts 
      WHERE enabled = 1 
        AND archived = 0 
        AND start_time <= ? 
        AND expiry_time > ?
      ORDER BY severity DESC, created_at DESC
    `;
        const rows = await this.db.all(sql, [now, now]);
        return rows.map(row => this.mapRowToAlert(row));
    }
    async findByVisibility(organizationId, teamId, userId) {
        const activeAlerts = await this.findActive();
        return activeAlerts.filter(alert => {
            const targets = alert.visibilityTargets;
            switch (alert.visibilityType) {
                case 'ORGANIZATION':
                    return targets.includes(organizationId);
                case 'TEAM':
                    return teamId ? targets.includes(teamId) : false;
                case 'USER':
                    return userId ? targets.includes(userId) : false;
                default:
                    return false;
            }
        });
    }
    async archive(id) {
        const sql = 'UPDATE alerts SET archived = 1, updated_at = ? WHERE id = ?';
        const result = await this.db.run(sql, [new Date().toISOString(), id]);
        return result.changes > 0;
    }
    async delete(id) {
        const sql = 'DELETE FROM alerts WHERE id = ?';
        const result = await this.db.run(sql, [id]);
        return result.changes > 0;
    }
    mapRowToAlert(row) {
        return new Alert_1.Alert({
            id: row.id,
            title: row.title,
            message: row.message,
            severity: row.severity,
            deliveryType: row.delivery_type,
            reminderFrequency: row.reminder_frequency,
            visibilityType: row.visibility_type,
            visibilityTargets: JSON.parse(row.visibility_targets),
            startTime: new Date(row.start_time),
            expiryTime: new Date(row.expiry_time),
            enabled: row.enabled === 1,
            archived: row.archived === 1,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }
}
exports.AlertRepository = AlertRepository;
