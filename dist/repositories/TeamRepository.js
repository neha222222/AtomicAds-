"use strict";
// Team Repository for data access
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationRepository = exports.TeamRepository = void 0;
const Team_1 = require("../models/Team");
const Database_1 = require("../database/Database");
const uuid_1 = require("uuid");
class TeamRepository {
    constructor() {
        this.db = Database_1.Database.getInstance();
    }
    async create(team) {
        const id = (0, uuid_1.v4)();
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
        return new Team_1.Team({
            ...team,
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
        return new Team_1.Team({ ...updatedTeam, updatedAt: new Date(now) });
    }
    async findById(id) {
        const sql = 'SELECT * FROM teams WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row)
            return null;
        return this.mapRowToTeam(row);
    }
    async findByOrganization(organizationId) {
        const sql = 'SELECT * FROM teams WHERE organization_id = ? ORDER BY name';
        const rows = await this.db.all(sql, [organizationId]);
        return rows.map(row => this.mapRowToTeam(row));
    }
    async findAll() {
        const sql = 'SELECT * FROM teams ORDER BY name';
        const rows = await this.db.all(sql);
        return rows.map(row => this.mapRowToTeam(row));
    }
    async delete(id) {
        const sql = 'DELETE FROM teams WHERE id = ?';
        const result = await this.db.run(sql, [id]);
        return result.changes > 0;
    }
    mapRowToTeam(row) {
        return new Team_1.Team({
            id: row.id,
            name: row.name,
            organizationId: row.organization_id,
            description: row.description,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        });
    }
}
exports.TeamRepository = TeamRepository;
// Organization Repository (simple implementation for completeness)
class OrganizationRepository {
    constructor() {
        this.db = Database_1.Database.getInstance();
    }
    async create(name) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const sql = `
      INSERT INTO organizations (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `;
        await this.db.run(sql, [id, name, now, now]);
        return { id, name };
    }
    async findById(id) {
        const sql = 'SELECT * FROM organizations WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row)
            return null;
        return { id: row.id, name: row.name };
    }
    async findAll() {
        const sql = 'SELECT * FROM organizations ORDER BY name';
        const rows = await this.db.all(sql);
        return rows.map(row => ({ id: row.id, name: row.name }));
    }
}
exports.OrganizationRepository = OrganizationRepository;
