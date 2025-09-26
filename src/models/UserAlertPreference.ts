// UserAlertPreference Model - Tracks read/unread/snooze state per alert per user

export enum AlertState {
  UNREAD = 'UNREAD',
  READ = 'READ',
  SNOOZED = 'SNOOZED'
}

export interface IUserAlertPreference {
  id?: string;
  userId: string;
  alertId: string;
  state: AlertState;
  readAt?: Date;
  snoozedUntil?: Date;
  lastNotifiedAt?: Date;
  notificationCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserAlertPreference implements IUserAlertPreference {
  public id?: string;
  public userId: string;
  public alertId: string;
  public state: AlertState;
  public readAt?: Date;
  public snoozedUntil?: Date;
  public lastNotifiedAt?: Date;
  public notificationCount: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: IUserAlertPreference) {
    this.id = data.id;
    this.userId = data.userId;
    this.alertId = data.alertId;
    this.state = data.state;
    this.readAt = data.readAt ? new Date(data.readAt) : undefined;
    this.snoozedUntil = data.snoozedUntil ? new Date(data.snoozedUntil) : undefined;
    this.lastNotifiedAt = data.lastNotifiedAt ? new Date(data.lastNotifiedAt) : undefined;
    this.notificationCount = data.notificationCount || 0;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  public markAsRead(): void {
    this.state = AlertState.READ;
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  public markAsUnread(): void {
    this.state = AlertState.UNREAD;
    this.readAt = undefined;
    this.updatedAt = new Date();
  }

  public snoozeForDay(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    this.state = AlertState.SNOOZED;
    this.snoozedUntil = tomorrow;
    this.updatedAt = new Date();
  }

  public isSnoozed(): boolean {
    if (this.state !== AlertState.SNOOZED || !this.snoozedUntil) {
      return false;
    }
    
    // Check if snooze period has expired
    if (new Date() > this.snoozedUntil) {
      this.state = AlertState.UNREAD;
      this.snoozedUntil = undefined;
      return false;
    }
    
    return true;
  }

  public incrementNotificationCount(): void {
    this.notificationCount++;
    this.lastNotifiedAt = new Date();
    this.updatedAt = new Date();
  }

  public shouldNotify(reminderFrequency: number): boolean {
    // Don't notify if snoozed
    if (this.isSnoozed()) {
      return false;
    }

    // Always notify if never notified before
    if (!this.lastNotifiedAt) {
      return true;
    }

    // Check if enough time has passed since last notification
    const timeSinceLastNotification = Date.now() - this.lastNotifiedAt.getTime();
    return timeSinceLastNotification >= reminderFrequency;
  }

  public toJSON(): IUserAlertPreference {
    return {
      id: this.id,
      userId: this.userId,
      alertId: this.alertId,
      state: this.state,
      readAt: this.readAt,
      snoozedUntil: this.snoozedUntil,
      lastNotifiedAt: this.lastNotifiedAt,
      notificationCount: this.notificationCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
