// Database connection and initialization

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { config } from '../config';

export class Database {
  private static instance: Database;
  private db: sqlite3.Database;
  private runAsync: any;
  private getAsync: any;
  private allAsync: any;

  private constructor() {
    const dbPath = path.resolve(config.dbPath);
    this.db = new sqlite3.Database(dbPath);
    
    // Promisify database methods
    this.runAsync = promisify(this.db.run.bind(this.db));
    this.getAsync = promisify(this.db.get.bind(this.db));
    this.allAsync = promisify(this.db.all.bind(this.db));
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Organizations table
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teams table
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
      )
    `);

    // Users table
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        team_id TEXT,
        organization_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
      )
    `);

    // Alerts table
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        delivery_type TEXT NOT NULL,
        reminder_frequency INTEGER NOT NULL,
        visibility_type TEXT NOT NULL,
        visibility_targets TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        expiry_time DATETIME NOT NULL,
        enabled INTEGER DEFAULT 1,
        archived INTEGER DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Notification deliveries table
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id TEXT PRIMARY KEY,
        alert_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        delivery_type TEXT NOT NULL,
        status TEXT NOT NULL,
        delivered_at DATETIME,
        failure_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alert_id) REFERENCES alerts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // User alert preferences table
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS user_alert_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        alert_id TEXT NOT NULL,
        state TEXT NOT NULL,
        read_at DATETIME,
        snoozed_until DATETIME,
        last_notified_at DATETIME,
        notification_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, alert_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (alert_id) REFERENCES alerts(id)
      )
    `);

    // Create indexes for better performance
    await this.runAsync(`CREATE INDEX IF NOT EXISTS idx_alerts_visibility ON alerts(visibility_type)`);
    await this.runAsync(`CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(enabled, archived, start_time, expiry_time)`);
    await this.runAsync(`CREATE INDEX IF NOT EXISTS idx_deliveries_alert_user ON notification_deliveries(alert_id, user_id)`);
    await this.runAsync(`CREATE INDEX IF NOT EXISTS idx_preferences_user_alert ON user_alert_preferences(user_id, alert_id)`);
  }

  public async run(sql: string, params: any[] = []): Promise<any> {
    return this.runAsync(sql, params);
  }

  public async get(sql: string, params: any[] = []): Promise<any> {
    return this.getAsync(sql, params);
  }

  public async all(sql: string, params: any[] = []): Promise<any[]> {
    return this.allAsync(sql, params);
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
