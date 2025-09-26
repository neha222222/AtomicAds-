// Alert Repository for data access

import { Alert, IAlert } from '../models/Alert';
import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

export class AlertRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async create(alert: IAlert): Promise<Alert> {
    const id = uuidv4();
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

    return new Alert({ ...alert, id, createdAt: new Date(now), updatedAt: new Date(now) });
  }

  async update(id: string, updates: Partial<IAlert>): Promise<Alert | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

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

    return new Alert({ ...updatedAlert, updatedAt: new Date(now) });
  }

  async findById(id: string): Promise<Alert | null> {
    const sql = 'SELECT * FROM alerts WHERE id = ?';
    const row = await this.db.get(sql, [id]);
    
    if (!row) return null;
    return this.mapRowToAlert(row);
  }

  async findAll(filters?: {
    severity?: string;
    enabled?: boolean;
    archived?: boolean;
    createdBy?: string;
  }): Promise<Alert[]> {
    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];

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

  async findActive(): Promise<Alert[]> {
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

  async findByVisibility(organizationId: string, teamId?: string, userId?: string): Promise<Alert[]> {
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

  async archive(id: string): Promise<boolean> {
    const sql = 'UPDATE alerts SET archived = 1, updated_at = ? WHERE id = ?';
    const result = await this.db.run(sql, [new Date().toISOString(), id]);
    return result.changes > 0;
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM alerts WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  private mapRowToAlert(row: any): Alert {
    return new Alert({
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
