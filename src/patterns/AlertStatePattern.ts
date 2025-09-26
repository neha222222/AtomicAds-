// State Pattern for Alert States

import { UserAlertPreference, AlertState as StateEnum } from '../models/UserAlertPreference';

// State Interface
export interface AlertState {
  read(context: AlertStateContext): void;
  unread(context: AlertStateContext): void;
  snooze(context: AlertStateContext): void;
  getStateName(): StateEnum;
  canTransitionTo(state: StateEnum): boolean;
}

// Concrete State: Unread State
export class UnreadState implements AlertState {
  read(context: AlertStateContext): void {
    console.log('📖 Marking alert as read');
    context.preference.markAsRead();
    context.setState(new ReadState());
  }

  unread(context: AlertStateContext): void {
    console.log('⚠️ Alert is already unread');
  }

  snooze(context: AlertStateContext): void {
    console.log('😴 Snoozing alert for the day');
    context.preference.snoozeForDay();
    context.setState(new SnoozedState());
  }

  getStateName(): StateEnum {
    return StateEnum.UNREAD;
  }

  canTransitionTo(state: StateEnum): boolean {
    return state === StateEnum.READ || state === StateEnum.SNOOZED;
  }
}

// Concrete State: Read State
export class ReadState implements AlertState {
  read(context: AlertStateContext): void {
    console.log('⚠️ Alert is already read');
  }

  unread(context: AlertStateContext): void {
    console.log('🔄 Marking alert as unread');
    context.preference.markAsUnread();
    context.setState(new UnreadState());
  }

  snooze(context: AlertStateContext): void {
    console.log('😴 Snoozing alert for the day');
    context.preference.snoozeForDay();
    context.setState(new SnoozedState());
  }

  getStateName(): StateEnum {
    return StateEnum.READ;
  }

  canTransitionTo(state: StateEnum): boolean {
    return state === StateEnum.UNREAD || state === StateEnum.SNOOZED;
  }
}

// Concrete State: Snoozed State
export class SnoozedState implements AlertState {
  read(context: AlertStateContext): void {
    console.log('📖 Marking snoozed alert as read');
    context.preference.markAsRead();
    context.setState(new ReadState());
  }

  unread(context: AlertStateContext): void {
    console.log('🔄 Marking snoozed alert as unread');
    context.preference.markAsUnread();
    context.setState(new UnreadState());
  }

  snooze(context: AlertStateContext): void {
    console.log('⚠️ Alert is already snoozed');
    // Check if snooze has expired
    if (!context.preference.isSnoozed()) {
      console.log('⏰ Snooze has expired, resetting to unread');
      context.preference.markAsUnread();
      context.setState(new UnreadState());
    }
  }

  getStateName(): StateEnum {
    return StateEnum.SNOOZED;
  }

  canTransitionTo(state: StateEnum): boolean {
    // From snoozed, can go to any state
    return true;
  }
}

// Context Class
export class AlertStateContext {
  private state: AlertState;
  public preference: UserAlertPreference;

  constructor(preference: UserAlertPreference) {
    this.preference = preference;
    // Initialize state based on current preference state
    this.state = this.getInitialState(preference.state);
  }

  private getInitialState(stateEnum: StateEnum): AlertState {
    switch (stateEnum) {
      case StateEnum.READ:
        return new ReadState();
      case StateEnum.SNOOZED:
        return new SnoozedState();
      case StateEnum.UNREAD:
      default:
        return new UnreadState();
    }
  }

  setState(state: AlertState): void {
    const currentStateName = this.state.getStateName();
    const newStateName = state.getStateName();
    
    if (this.state.canTransitionTo(newStateName)) {
      this.state = state;
      console.log(`✅ State transition: ${currentStateName} → ${newStateName}`);
    } else {
      console.log(`❌ Invalid state transition: ${currentStateName} → ${newStateName}`);
    }
  }

  markAsRead(): void {
    this.state.read(this);
  }

  markAsUnread(): void {
    this.state.unread(this);
  }

  snooze(): void {
    this.state.snooze(this);
  }

  getCurrentState(): StateEnum {
    return this.state.getStateName();
  }

  canTransitionTo(state: StateEnum): boolean {
    return this.state.canTransitionTo(state);
  }
}

// State Manager for managing multiple alert states
export class AlertStateManager {
  private contexts: Map<string, AlertStateContext> = new Map();

  getOrCreateContext(preference: UserAlertPreference): AlertStateContext {
    const key = `${preference.userId}_${preference.alertId}`;
    
    if (!this.contexts.has(key)) {
      this.contexts.set(key, new AlertStateContext(preference));
    }
    
    return this.contexts.get(key)!;
  }

  markAsRead(preference: UserAlertPreference): void {
    const context = this.getOrCreateContext(preference);
    context.markAsRead();
  }

  markAsUnread(preference: UserAlertPreference): void {
    const context = this.getOrCreateContext(preference);
    context.markAsUnread();
  }

  snooze(preference: UserAlertPreference): void {
    const context = this.getOrCreateContext(preference);
    context.snooze();
  }

  getState(userId: string, alertId: string): StateEnum | undefined {
    const key = `${userId}_${alertId}`;
    const context = this.contexts.get(key);
    return context?.getCurrentState();
  }
}
