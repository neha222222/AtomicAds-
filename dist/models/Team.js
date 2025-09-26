"use strict";
// Team Model
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
class Team {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.organizationId = data.organizationId;
        this.description = data.description;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            organizationId: this.organizationId,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.Team = Team;
