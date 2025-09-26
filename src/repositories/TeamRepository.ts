// Team Repository for data access

import { Team, ITeam } from '../models/Team';
import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

export class TeamRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async create(team: ITeam): Promise<Team> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO teams (
        id, name, organization_id, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      team.name,
      team.organizationId,
      team.description || null,
      now,
      now
    ]);

    return new Team({ 
      ...team, 
      id, 
      createdAt: new Date(now), 
      updatedAt: new Date(now) 
    });
  }

  async update(id: string, updates: Partial<ITeam>): Promise<Team | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const sql = `
      UPDATE teams SET
        name = ?,
        description = ?,
        updated_at = ?
      WHERE id = ?
    `;

    const updatedTeam = { ...existing, ...updates };
    const now = new Date().toISOString();

    await this.db.run(sql, [
      updatedTeam.name,
      updatedTeam.description || null,
      now,
      id
    ]);

    return new Team({ ...updatedTeam, updatedAt: new Date(now) });
  }

  async findById(id: string): Promise<Team | null> {
    const sql = 'SELECT * FROM teams WHERE id = ?';
    const row = await this.db.get(sql, [id]);
    
    if (!row) return null;
    return this.mapRowToTeam(row);
  }

  async findByOrganization(organizationId: string): Promise<Team[]> {
    const sql = 'SELECT * FROM teams WHERE organization_id = ? ORDER BY name';
    const rows = await this.db.all(sql, [organizationId]);
    return rows.map(row => this.mapRowToTeam(row));
  }

  async findAll(): Promise<Team[]> {
    const sql = 'SELECT * FROM teams ORDER BY name';
    const rows = await this.db.all(sql);
    return rows.map(row => this.mapRowToTeam(row));
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM teams WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  private mapRowToTeam(row: any): Team {
    return new Team({
      id: row.id,
      name: row.name,
      organizationId: row.organization_id,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}

// Organization Repository (simple implementation for completeness)
export class OrganizationRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async create(name: string): Promise<{ id: string; name: string }> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO organizations (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `;

    await this.db.run(sql, [id, name, now, now]);
    return { id, name };
  }

  async findById(id: string): Promise<{ id: string; name: string } | null> {
    const sql = 'SELECT * FROM organizations WHERE id = ?';
    const row = await this.db.get(sql, [id]);
    
    if (!row) return null;
    return { id: row.id, name: row.name };
  }

  async findAll(): Promise<{ id: string; name: string }[]> {
    const sql = 'SELECT * FROM organizations ORDER BY name';
    const rows = await this.db.all(sql);
    return rows.map(row => ({ id: row.id, name: row.name }));
  }
}
