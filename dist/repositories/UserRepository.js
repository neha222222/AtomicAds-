"use strict";
// User Repository for data access
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("../models/User");
const Database_1 = require("../database/Database");
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserRepository {
    constructor() {
        this.db = Database_1.Database.getInstance();
    }
    async create(user) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const hashedPassword = await bcryptjs_1.default.hash(user.password || 'default123', 10);
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
        return new User_1.User({ ...user, id, password: hashedPassword, createdAt: new Date(now), updatedAt: new Date(now) });
    }
    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
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
        return new User_1.User({ ...updatedUser, updatedAt: new Date(now) });
    }
    async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row)
            return null;
        return this.mapRowToUser(row);
    }
    async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const row = await this.db.get(sql, [email]);
        if (!row)
            return null;
        return this.mapRowToUser(row);
    }
    async findAll() {
        const sql = 'SELECT * FROM users ORDER BY name';
        const rows = await this.db.all(sql);
        return rows.map(row => this.mapRowToUser(row));
    }
    async findByOrganization(organizationId) {
        const sql = 'SELECT * FROM users WHERE organization_id = ? ORDER BY name';
        const rows = await this.db.all(sql, [organizationId]);
        return rows.map(row => this.mapRowToUser(row));
    }
    async findByTeam(teamId) {
        const sql = 'SELECT * FROM users WHERE team_id = ? ORDER BY name';
        const rows = await this.db.all(sql, [teamId]);
        return rows.map(row => this.mapRowToUser(row));
    }
    async validatePassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user || !user.password)
            return null;
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        return isValid ? user : null;
    }
    async delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        const result = await this.db.run(sql, [id]);
        return result.changes > 0;
    }
    mapRowToUser(row) {
        return new User_1.User({
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
exports.UserRepository = UserRepository;
