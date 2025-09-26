"use strict";
// Seed data script for testing
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seeder = void 0;
const Database_1 = require("./database/Database");
const TeamRepository_1 = require("./repositories/TeamRepository");
const UserRepository_1 = require("./repositories/UserRepository");
const AlertRepository_1 = require("./repositories/AlertRepository");
const User_1 = require("./models/User");
const Alert_1 = require("./models/Alert");
const config_1 = require("./config");
class Seeder {
    constructor() {
        this.db = Database_1.Database.getInstance();
        this.orgRepo = new TeamRepository_1.OrganizationRepository();
        this.teamRepo = new TeamRepository_1.TeamRepository();
        this.userRepo = new UserRepository_1.UserRepository();
        this.alertRepo = new AlertRepository_1.AlertRepository();
    }
    async seed() {
        console.log('🌱 Starting seed process...');
        try {
            // Initialize database
            await this.db.initialize();
            console.log('✅ Database initialized');
            // Clear existing data (optional - comment out to keep existing data)
            await this.clearData();
            // Create organizations
            const orgs = await this.createOrganizations();
            console.log(`✅ Created ${orgs.length} organizations`);
            // Create teams
            const teams = await this.createTeams(orgs);
            console.log(`✅ Created ${teams.length} teams`);
            // Create users
            const users = await this.createUsers(orgs[0], teams);
            console.log(`✅ Created ${users.length} users`);
            // Create alerts
            const alerts = await this.createAlerts(orgs[0], teams, users);
            console.log(`✅ Created ${alerts.length} alerts`);
            console.log('\n🎉 Seed completed successfully!');
            console.log('\n📋 Test Credentials:');
            console.log('='.repeat(50));
            console.log('Admin User:');
            console.log('  Email: neha.admin@atomicads.com');
            console.log('  Password: admin123');
            console.log('\nRegular Users:');
            console.log('  Email: john.doe@atomicads.com');
            console.log('  Password: user123');
            console.log('  Email: jane.smith@atomicads.com');
            console.log('  Password: user123');
            console.log('='.repeat(50));
        }
        catch (error) {
            console.error('❌ Seed failed:', error);
            throw error;
        }
    }
    async clearData() {
        // Clear tables in reverse order of dependencies
        await this.db.run('DELETE FROM user_alert_preferences');
        await this.db.run('DELETE FROM notification_deliveries');
        await this.db.run('DELETE FROM alerts');
        await this.db.run('DELETE FROM users');
        await this.db.run('DELETE FROM teams');
        await this.db.run('DELETE FROM organizations');
        console.log('🗑️ Cleared existing data');
    }
    async createOrganizations() {
        const orgs = [];
        const atomicads = await this.orgRepo.create('AtomicAds Inc.');
        orgs.push(atomicads);
        const techcorp = await this.orgRepo.create('TechCorp Solutions');
        orgs.push(techcorp);
        return orgs;
    }
    async createTeams(orgs) {
        const teams = [];
        // Teams for AtomicAds
        const engineering = await this.teamRepo.create({
            name: 'Engineering',
            organizationId: orgs[0].id,
            description: 'Engineering and Development Team'
        });
        teams.push(engineering);
        const marketing = await this.teamRepo.create({
            name: 'Marketing',
            organizationId: orgs[0].id,
            description: 'Marketing and Communications Team'
        });
        teams.push(marketing);
        const operations = await this.teamRepo.create({
            name: 'Operations',
            organizationId: orgs[0].id,
            description: 'Operations and Support Team'
        });
        teams.push(operations);
        return teams;
    }
    async createUsers(org, teams) {
        const users = [];
        // Admin users
        const nehaAdmin = await this.userRepo.create({
            name: 'Neha Dhruw',
            email: 'neha.admin@atomicads.com',
            password: 'admin123',
            role: User_1.UserRole.ADMIN,
            organizationId: org.id,
            teamId: teams[0].id // Engineering team
        });
        users.push(nehaAdmin);
        const adminUser = await this.userRepo.create({
            name: 'Admin User',
            email: 'admin@atomicads.com',
            password: 'admin123',
            role: User_1.UserRole.ADMIN,
            organizationId: org.id
        });
        users.push(adminUser);
        // Regular users - Engineering team
        const john = await this.userRepo.create({
            name: 'John Doe',
            email: 'john.doe@atomicads.com',
            password: 'user123',
            role: User_1.UserRole.USER,
            organizationId: org.id,
            teamId: teams[0].id
        });
        users.push(john);
        const jane = await this.userRepo.create({
            name: 'Jane Smith',
            email: 'jane.smith@atomicads.com',
            password: 'user123',
            role: User_1.UserRole.USER,
            organizationId: org.id,
            teamId: teams[0].id
        });
        users.push(jane);
        // Marketing team users
        const alice = await this.userRepo.create({
            name: 'Alice Johnson',
            email: 'alice.johnson@atomicads.com',
            password: 'user123',
            role: User_1.UserRole.USER,
            organizationId: org.id,
            teamId: teams[1].id
        });
        users.push(alice);
        const bob = await this.userRepo.create({
            name: 'Bob Wilson',
            email: 'bob.wilson@atomicads.com',
            password: 'user123',
            role: User_1.UserRole.USER,
            organizationId: org.id,
            teamId: teams[1].id
        });
        users.push(bob);
        // Operations team users
        const charlie = await this.userRepo.create({
            name: 'Charlie Brown',
            email: 'charlie.brown@atomicads.com',
            password: 'user123',
            role: User_1.UserRole.USER,
            organizationId: org.id,
            teamId: teams[2].id
        });
        users.push(charlie);
        return users;
    }
    async createAlerts(org, teams, users) {
        const alerts = [];
        const adminUser = users.find(u => u.name === 'Neha Dhruw');
        // Organization-wide critical alert
        const systemOutage = await this.alertRepo.create({
            title: '🔴 Critical System Maintenance',
            message: 'Our main production servers will undergo critical maintenance tonight from 2 AM to 4 AM EST. All services will be temporarily unavailable during this window.',
            severity: Alert_1.AlertSeverity.CRITICAL,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.ORGANIZATION,
            visibilityTargets: [org.id],
            startTime: new Date(),
            expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            enabled: true,
            archived: false,
            createdBy: adminUser.id
        });
        alerts.push(systemOutage);
        // Team-specific warning alert (Engineering)
        const codeFreeze = await this.alertRepo.create({
            title: '⚠️ Code Freeze Notice',
            message: 'Code freeze starts tomorrow at 5 PM for the upcoming release. Please ensure all your features are merged and tested before the deadline.',
            severity: Alert_1.AlertSeverity.WARNING,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.TEAM,
            visibilityTargets: [teams[0].id], // Engineering team
            startTime: new Date(),
            expiryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            enabled: true,
            archived: false,
            createdBy: adminUser.id
        });
        alerts.push(codeFreeze);
        // Team-specific info alert (Marketing)
        const campaignLaunch = await this.alertRepo.create({
            title: '📢 New Marketing Campaign Launch',
            message: 'We are launching our new summer campaign next Monday. All marketing materials should be ready by Friday EOD.',
            severity: Alert_1.AlertSeverity.INFO,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.TEAM,
            visibilityTargets: [teams[1].id], // Marketing team
            startTime: new Date(),
            expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
            enabled: true,
            archived: false,
            createdBy: adminUser.id
        });
        alerts.push(campaignLaunch);
        // User-specific alert
        const performanceReview = await this.alertRepo.create({
            title: '📝 Performance Review Reminder',
            message: 'Your quarterly performance review is scheduled for next Tuesday at 2 PM. Please complete your self-assessment form before the meeting.',
            severity: Alert_1.AlertSeverity.INFO,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.USER,
            visibilityTargets: [users[2].id, users[3].id], // John and Jane
            startTime: new Date(),
            expiryTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
            enabled: true,
            archived: false,
            createdBy: adminUser.id
        });
        alerts.push(performanceReview);
        // Organization-wide info alert
        const holidayNotice = await this.alertRepo.create({
            title: '🎉 Holiday Schedule Update',
            message: 'The office will be closed on Friday for the company anniversary celebration. Remote work is optional for those who prefer to work.',
            severity: Alert_1.AlertSeverity.INFO,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.ORGANIZATION,
            visibilityTargets: [org.id],
            startTime: new Date(),
            expiryTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
            enabled: true,
            archived: false,
            createdBy: adminUser.id
        });
        alerts.push(holidayNotice);
        // Expired alert (for testing)
        const expiredAlert = await this.alertRepo.create({
            title: '⏰ Expired Alert Example',
            message: 'This is an example of an expired alert. It should not appear in active alerts.',
            severity: Alert_1.AlertSeverity.INFO,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.ORGANIZATION,
            visibilityTargets: [org.id],
            startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            expiryTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            enabled: true,
            archived: false,
            createdBy: adminUser.id
        });
        alerts.push(expiredAlert);
        // Archived alert (for testing)
        const archivedAlert = await this.alertRepo.create({
            title: '📦 Archived Alert Example',
            message: 'This is an example of an archived alert. It should not appear in active alerts.',
            severity: Alert_1.AlertSeverity.WARNING,
            deliveryType: Alert_1.DeliveryType.IN_APP,
            reminderFrequency: config_1.config.reminderInterval,
            visibilityType: Alert_1.VisibilityType.ORGANIZATION,
            visibilityTargets: [org.id],
            startTime: new Date(),
            expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            enabled: true,
            archived: true,
            createdBy: adminUser.id
        });
        alerts.push(archivedAlert);
        return alerts;
    }
    async close() {
        await this.db.close();
    }
}
exports.Seeder = Seeder;
// Run the seeder
async function runSeeder() {
    const seeder = new Seeder();
    try {
        await seeder.seed();
        await seeder.close();
        console.log('\n✨ Seeding complete! You can now start the server.');
        process.exit(0);
    }
    catch (error) {
        console.error('Seeding failed:', error);
        await seeder.close();
        process.exit(1);
    }
}
// Execute if running directly
if (require.main === module) {
    runSeeder();
}
