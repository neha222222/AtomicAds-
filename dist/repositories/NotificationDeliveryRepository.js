"use strict";
// NotificationDelivery Repository for data access
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryRepository = void 0;
const NotificationDelivery_1 = require("../models/NotificationDelivery");
const Database_1 = require("../database/Database");
const uuid_1 = require("uuid");
class NotificationDeliveryRepository {
    constructor() {
        this.db = Database_1.Database.getInstance();
    }
    async create(delivery) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const sql = `
      INSERT INTO notification_deliveries (
        id, alert_id, user_id, delivery_type, status,
        delivered_at, failure_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.db.run(sql, [
            id,
            delivery.alertId,
            delivery.userId,
            delivery.deliveryType,
            delivery.status,
            delivery.deliveredAt ? new Date(delivery.deliveredAt).toISOString() : null,
            delivery.failureReason || null,
            now
        ]);
        return new NotificationDelivery_1.NotificationDelivery({
            ...delivery,
            id,
            createdAt: new Date(now)
        });
    }
    async findById(id) {
        const sql = 'SELECT * FROM notification_deliveries WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row)
            return null;
        return this.mapRowToDelivery(row);
    }
    async findByUserAndAlert(userId, alertId) {
        const sql = `
      SELECT * FROM notification_deliveries 
      WHERE user_id = ? AND alert_id = ?
      ORDER BY created_at DESC
    `;
        const rows = await this.db.all(sql, [userId, alertId]);
        return rows.map(row => this.mapRowToDelivery(row));
    }
    async findByUser(userId) {
        const sql = `
      SELECT * FROM notification_deliveries 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
        const rows = await this.db.all(sql, [userId]);
        return rows.map(row => this.mapRowToDelivery(row));
    }
    async findByAlert(alertId) {
        const sql = `
      SELECT * FROM notification_deliveries 
      WHERE alert_id = ?
      ORDER BY created_at DESC
    `;
        const rows = await this.db.all(sql, [alertId]);
        return rows.map(row => this.mapRowToDelivery(row));
    }
    async countByStatus(status) {
        const sql = 'SELECT COUNT(*) as count FROM notification_deliveries WHERE status = ?';
        const row = await this.db.get(sql, [status]);
        return row.count;
    }
    async getDeliveryStats() {
        const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
      FROM notification_deliveries
    `;
        const row = await this.db.get(sql);
        return {
            total: row.total || 0,
            delivered: row.delivered || 0,
            failed: row.failed || 0,
            pending: row.pending || 0
        };
    }
    async getLastDeliveryTime(userId, alertId) {
        const sql = `
      SELECT delivered_at FROM notification_deliveries 
      WHERE user_id = ? AND alert_id = ? AND status = 'DELIVERED'
      ORDER BY delivered_at DESC
      LIMIT 1
    `;
        const row = await this.db.get(sql, [userId, alertId]);
        return row?.delivered_at ? new Date(row.delivered_at) : null;
    }
    mapRowToDelivery(row) {
        return new NotificationDelivery_1.NotificationDelivery({
            id: row.id,
            alertId: row.alert_id,
            userId: row.user_id,
            deliveryType: row.delivery_type,
            status: row.status,
            deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
            failureReason: row.failure_reason,
            createdAt: new Date(row.created_at)
        });
    }
}
exports.NotificationDeliveryRepository = NotificationDeliveryRepository;
