// User Repository for data access

import { User, IUser } from '../models/User';
import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export class UserRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async create(user: IUser): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(user.password || 'default123', 10);
    
    const sql = `
      INSERT INTO users (
        id, name, email, password, role, team_id, organization_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      user.name,
      user.email,
      hashedPassword,
      user.role,
      user.teamId || null,
      user.organizationId,
      now,
      now
    ]);

    return new User({ ...user, id, password: hashedPassword, createdAt: new Date(now), updatedAt: new Date(now) });
  }

  async update(id: string, updates: Partial<IUser>): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const sql = `
      UPDATE users SET
        name = ?,
        email = ?,
        role = ?,
        team_id = ?,
        organization_id = ?,
        updated_at = ?
      WHERE id = ?
    `;

    const updatedUser = { ...existing, ...updates };
    const now = new Date().toISOString();

    await this.db.run(sql, [
      updatedUser.name,
      updatedUser.email,
      updatedUser.role,
      updatedUser.teamId || null,
      updatedUser.organizationId,
      now,
      id
    ]);

    return new User({ ...updatedUser, updatedAt: new Date(now) });
  }

  async findById(id: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const row = await this.db.get(sql, [id]);
    
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const row = await this.db.get(sql, [email]);
    
    if (!row) return null;
    return this.mapRowToUser(row);
  }

  async findAll(): Promise<User[]> {
    const sql = 'SELECT * FROM users ORDER BY name';
    const rows = await this.db.all(sql);
    return rows.map(row => this.mapRowToUser(row));
  }

  async findByOrganization(organizationId: string): Promise<User[]> {
    const sql = 'SELECT * FROM users WHERE organization_id = ? ORDER BY name';
    const rows = await this.db.all(sql, [organizationId]);
    return rows.map(row => this.mapRowToUser(row));
  }

  async findByTeam(teamId: string): Promise<User[]> {
    const sql = 'SELECT * FROM users WHERE team_id = ? ORDER BY name';
    const rows = await this.db.all(sql, [teamId]);
    return rows.map(row => this.mapRowToUser(row));
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  private mapRowToUser(row: any): User {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      teamId: row.team_id,
      organizationId: row.organization_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}
