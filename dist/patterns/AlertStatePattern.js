"use strict";
// State Pattern for Alert States
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertStateManager = exports.AlertStateContext = exports.SnoozedState = exports.ReadState = exports.UnreadState = void 0;
const UserAlertPreference_1 = require("../models/UserAlertPreference");
// Concrete State: Unread State
class UnreadState {
    read(context) {
        console.log('📖 Marking alert as read');
        context.preference.markAsRead();
        context.setState(new ReadState());
    }
    unread(context) {
        console.log('⚠️ Alert is already unread');
    }
    snooze(context) {
        console.log('😴 Snoozing alert for the day');
        context.preference.snoozeForDay();
        context.setState(new SnoozedState());
    }
    getStateName() {
        return UserAlertPreference_1.AlertState.UNREAD;
    }
    canTransitionTo(state) {
        return state === UserAlertPreference_1.AlertState.READ || state === UserAlertPreference_1.AlertState.SNOOZED;
    }
}
exports.UnreadState = UnreadState;
// Concrete State: Read State
class ReadState {
    read(context) {
        console.log('⚠️ Alert is already read');
    }
    unread(context) {
        console.log('🔄 Marking alert as unread');
        context.preference.markAsUnread();
        context.setState(new UnreadState());
    }
    snooze(context) {
        console.log('😴 Snoozing alert for the day');
        context.preference.snoozeForDay();
        context.setState(new SnoozedState());
    }
    getStateName() {
        return UserAlertPreference_1.AlertState.READ;
    }
    canTransitionTo(state) {
        return state === UserAlertPreference_1.AlertState.UNREAD || state === UserAlertPreference_1.AlertState.SNOOZED;
    }
}
exports.ReadState = ReadState;
// Concrete State: Snoozed State
class SnoozedState {
    read(context) {
        console.log('📖 Marking snoozed alert as read');
        context.preference.markAsRead();
        context.setState(new ReadState());
    }
    unread(context) {
        console.log('🔄 Marking snoozed alert as unread');
        context.preference.markAsUnread();
        context.setState(new UnreadState());
    }
    snooze(context) {
        console.log('⚠️ Alert is already snoozed');
        // Check if snooze has expired
        if (!context.preference.isSnoozed()) {
            console.log('⏰ Snooze has expired, resetting to unread');
            context.preference.markAsUnread();
            context.setState(new UnreadState());
        }
    }
    getStateName() {
        return UserAlertPreference_1.AlertState.SNOOZED;
    }
    canTransitionTo(state) {
        // From snoozed, can go to any state
        return true;
    }
}
exports.SnoozedState = SnoozedState;
// Context Class
class AlertStateContext {
    constructor(preference) {
        this.preference = preference;
        // Initialize state based on current preference state
        this.state = this.getInitialState(preference.state);
    }
    getInitialState(stateEnum) {
        switch (stateEnum) {
            case UserAlertPreference_1.AlertState.READ:
                return new ReadState();
            case UserAlertPreference_1.AlertState.SNOOZED:
                return new SnoozedState();
            case UserAlertPreference_1.AlertState.UNREAD:
            default:
                return new UnreadState();
        }
    }
    setState(state) {
        const currentStateName = this.state.getStateName();
        const newStateName = state.getStateName();
        if (this.state.canTransitionTo(newStateName)) {
            this.state = state;
            console.log(`✅ State transition: ${currentStateName} → ${newStateName}`);
        }
        else {
            console.log(`❌ Invalid state transition: ${currentStateName} → ${newStateName}`);
        }
    }
    markAsRead() {
        this.state.read(this);
    }
    markAsUnread() {
        this.state.unread(this);
    }
    snooze() {
        this.state.snooze(this);
    }
    getCurrentState() {
        return this.state.getStateName();
    }
    canTransitionTo(state) {
        return this.state.canTransitionTo(state);
    }
}
exports.AlertStateContext = AlertStateContext;
// State Manager for managing multiple alert states
class AlertStateManager {
    constructor() {
        this.contexts = new Map();
    }
    getOrCreateContext(preference) {
        const key = `${preference.userId}_${preference.alertId}`;
        if (!this.contexts.has(key)) {
            this.contexts.set(key, new AlertStateContext(preference));
        }
        return this.contexts.get(key);
    }
    markAsRead(preference) {
        const context = this.getOrCreateContext(preference);
        context.markAsRead();
    }
    markAsUnread(preference) {
        const context = this.getOrCreateContext(preference);
        context.markAsUnread();
    }
    snooze(preference) {
        const context = this.getOrCreateContext(preference);
        context.snooze();
    }
    getState(userId, alertId) {
        const key = `${userId}_${alertId}`;
        const context = this.contexts.get(key);
        return context?.getCurrentState();
    }
}
exports.AlertStateManager = AlertStateManager;
