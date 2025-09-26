# 🔔 Alerting & Notification Platform

**Author:** Neha Dhruw  
**Version:** 1.0.0  

A lightweight, extensible alerting and notification system built with TypeScript, demonstrating clean OOP design patterns and modular architecture.

## 🌟 Features

### Admin Features
- ✅ Create, update, and archive alerts
- ✅ Configure visibility (Organization, Team, or User level)
- ✅ Set alert severity (Info, Warning, Critical)
- ✅ Enable/disable reminders
- ✅ View all alerts with filtering options
- ✅ Track alert delivery and engagement metrics

### User Features
- ✅ Receive relevant alerts based on visibility settings
- ✅ Automatic reminders every 2 hours until snoozed
- ✅ Snooze alerts for the day
- ✅ Mark alerts as read/unread
- ✅ View notification history
- ✅ Personal analytics dashboard

### System Features
- ✅ In-App notification delivery (MVP)
- ✅ Extensible for Email & SMS (future-ready)
- ✅ Comprehensive analytics dashboard
- ✅ Role-based access control
- ✅ RESTful API architecture

## 🏗️ Architecture & Design Patterns

### Design Patterns Implemented

1. **Strategy Pattern** (`src/patterns/NotificationStrategy.ts`)
   - Enables multiple notification channels
   - Easy addition of new delivery methods without modifying existing code

2. **Observer Pattern** (`src/patterns/AlertObserver.ts`)
   - Manages user subscriptions to alerts
   - Automatic notification dispatch to relevant users

3. **State Pattern** (`src/patterns/AlertStatePattern.ts`)
   - Manages alert states (Read, Unread, Snoozed)
   - Clean state transitions with validation

### OOP Principles
- **Encapsulation**: Models encapsulate data and behavior
- **Abstraction**: Interfaces define contracts for implementations
- **Inheritance**: Base classes provide common functionality
- **Polymorphism**: Multiple notification strategies with common interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation & Setup

```bash
# Clone the repository
cd alerting-platform

# Install dependencies
npm install

# Run database seed (creates test data)
npm run seed

# Start development server
npm run dev
```

The server will start at `http://localhost:3000`

### Alternative: One-Command Setup
```bash
npm run setup
```
This will install dependencies, seed the database, and start the server.

## 📝 Test Credentials

### Admin Account
- **Email:** neha.admin@atomicads.com
- **Password:** admin123

### User Accounts
- **Email:** john.doe@atomicads.com
- **Password:** user123
- **Email:** jane.smith@atomicads.com
- **Password:** user123

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints Overview

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password

#### Admin Endpoints
- `POST /api/admin/alerts` - Create new alert
- `PUT /api/admin/alerts/:alertId` - Update alert
- `POST /api/admin/alerts/:alertId/archive` - Archive alert
- `POST /api/admin/alerts/:alertId/toggle` - Enable/disable alert
- `GET /api/admin/alerts` - List all alerts
- `GET /api/admin/alerts/:alertId` - Get alert details

#### User Endpoints
- `GET /api/user/alerts` - Get user's alerts
- `GET /api/user/alerts/active` - Get active alerts
- `GET /api/user/alerts/snoozed` - Get snoozed alerts
- `POST /api/user/alerts/:alertId/read` - Mark as read
- `POST /api/user/alerts/:alertId/snooze` - Snooze alert
- `GET /api/user/notifications` - Get notification history
- `GET /api/user/analytics` - Get personal analytics

#### Analytics Endpoints
- `GET /api/analytics/system` - System-wide analytics (admin only)
- `GET /api/analytics/alerts/stats` - Alert statistics
- `GET /api/analytics/alerts/top` - Top performing alerts
- `GET /api/analytics/users/:userId` - User analytics

## 📊 API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "neha.admin@atomicads.com",
    "password": "admin123"
  }'
```

### Create Alert (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "System Update",
    "message": "System will be updated tonight",
    "severity": "INFO",
    "deliveryType": "IN_APP",
    "reminderFrequency": 7200000,
    "visibilityType": "ORGANIZATION",
    "visibilityTargets": ["org-id"],
    "startTime": "2025-09-25T00:00:00Z",
    "expiryTime": "2025-09-30T00:00:00Z",
    "enabled": true
  }'
```

### Snooze Alert (User)
```bash
curl -X POST http://localhost:3000/api/user/alerts/<alertId>/snooze \
  -H "Authorization: Bearer <token>"
```

### Get Analytics
```bash
curl -X GET http://localhost:3000/api/analytics/system \
  -H "Authorization: Bearer <token>"
```

## 🗂️ Project Structure

```
alerting-platform/
├── src/
│   ├── config/              # Configuration files
│   ├── controllers/          # API controllers
│   │   ├── AdminController.ts
│   │   ├── UserController.ts
│   │   ├── AuthController.ts
│   │   └── AnalyticsController.ts
│   ├── database/            # Database connection
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models
│   │   ├── Alert.ts
│   │   ├── User.ts
│   │   ├── Team.ts
│   │   ├── NotificationDelivery.ts
│   │   └── UserAlertPreference.ts
│   ├── patterns/            # Design pattern implementations
│   │   ├── NotificationStrategy.ts
│   │   ├── AlertObserver.ts
│   │   └── AlertStatePattern.ts
│   ├── repositories/        # Data access layer
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   │   ├── AlertService.ts
│   │   ├── NotificationService.ts
│   │   ├── ReminderService.ts
│   │   ├── AnalyticsService.ts
│   │   └── AuthService.ts
│   ├── app.ts               # Application setup
│   ├── server.ts            # Server entry point
│   └── seed.ts              # Database seeder
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Reminder Logic

The system implements a sophisticated reminder system:

1. **Automatic Reminders**: Alerts trigger reminders every 2 hours
2. **Snooze Function**: Users can snooze alerts for the current day
3. **Smart Reset**: Snoozed alerts automatically reset the next day
4. **Expiry Handling**: Reminders stop when alerts expire

### How It Works
- A background service (`ReminderService`) checks for pending reminders every 5 minutes
- Each user's notification preference is tracked individually
- Snoozed alerts are excluded from reminders until the next day

## 🔧 Available Scripts

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build TypeScript to JavaScript
npm run start     # Start production server
npm run seed      # Populate database with test data
npm run clean     # Clean build artifacts and database
npm run setup     # Complete setup (install, seed, start)
```

## 📈 Analytics Dashboard

The platform provides comprehensive analytics:

### System Metrics
- Total alerts created
- Active vs expired alerts
- Alert breakdown by severity
- Delivery success rates

### User Engagement
- Read/unread ratios
- Snooze patterns
- User activity rates
- Notification effectiveness

### Alert Performance
- Most snoozed alerts
- Most read alerts
- Highest delivery rates

## 🔮 Future Enhancements

The system is designed to be extensible for:

1. **Additional Notification Channels**
   - Email notifications
   - SMS notifications
   - Push notifications

2. **Advanced Features**
   - Custom reminder frequencies
   - Scheduled alerts
   - Alert escalations
   - Rich media support

3. **Enterprise Features**
   - Multi-tenancy
   - Advanced RBAC
   - Audit logging
   - Webhook integrations

## 🧪 Testing

### Manual Testing Steps

1. **Authentication Flow**
   - Register a new user
   - Login with credentials
   - Verify token generation

2. **Admin Operations**
   - Create alerts with different visibility
   - Update existing alerts
   - Archive alerts
   - View analytics

3. **User Operations**
   - View relevant alerts
   - Mark as read/unread
   - Snooze alerts
   - Check reminder behavior

4. **Reminder System**
   - Wait for 2-hour intervals (or trigger manually in dev mode)
   - Verify snooze functionality
   - Check next-day reset

## 🤝 Key Design Decisions

1. **SQLite Database**: Lightweight, file-based database perfect for MVP
2. **JWT Authentication**: Stateless, secure authentication
3. **TypeScript**: Type safety and better IDE support
4. **Design Patterns**: Extensible, maintainable architecture
5. **Repository Pattern**: Clean separation of data access logic
6. **Service Layer**: Business logic isolated from controllers

## 📞 Support & Contact

**Developer:** Neha Dhruw  
**Submission Date:** Friday, 26/09/25

---

## 🎯 Assignment Requirements Checklist

### ✅ Functional Requirements
- [x] Admin can create unlimited alerts
- [x] Alerts include title, message, severity, delivery type
- [x] Configurable visibility (Org/Team/User)
- [x] 2-hour reminder frequency
- [x] Snooze functionality (resets daily)
- [x] Read/unread status tracking
- [x] Analytics dashboard
- [x] In-App notifications (MVP)

### ✅ Technical Requirements
- [x] OOP design principles
- [x] Strategy Pattern for channels
- [x] Observer Pattern for subscriptions
- [x] State Pattern for alert states
- [x] Clean, modular code
- [x] Extensible architecture
- [x] RESTful APIs
- [x] Seed data for testing

### ✅ Deliverables
- [x] Backend codebase
- [x] Clear README with setup instructions
- [x] Admin APIs (Create, Update, List)
- [x] User APIs (Fetch, Mark, Snooze)
- [x] Analytics endpoint
- [x] Predefined test data

---

**Thank you for reviewing this submission!** 🚀
