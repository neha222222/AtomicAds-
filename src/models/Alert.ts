// Alert Model following OOP principles

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export enum DeliveryType {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export enum VisibilityType {
  ORGANIZATION = 'ORGANIZATION',
  TEAM = 'TEAM',
  USER = 'USER'
}

export interface IAlert {
  id?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  deliveryType: DeliveryType;
  reminderFrequency: number; // in milliseconds
  visibilityType: VisibilityType;
  visibilityTargets: string[]; // array of team IDs or user IDs
  startTime: Date;
  expiryTime: Date;
  enabled: boolean;
  archived: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Alert implements IAlert {
  public id?: string;
  public title: string;
  public message: string;
  public severity: AlertSeverity;
  public deliveryType: DeliveryType;
  public reminderFrequency: number;
  public visibilityType: VisibilityType;
  public visibilityTargets: string[];
  public startTime: Date;
  public expiryTime: Date;
  public enabled: boolean;
  public archived: boolean;
  public createdBy: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: IAlert) {
    this.id = data.id;
    this.title = data.title;
    this.message = data.message;
    this.severity = data.severity;
    this.deliveryType = data.deliveryType;
    this.reminderFrequency = data.reminderFrequency || 2 * 60 * 60 * 1000; // 2 hours default
    this.visibilityType = data.visibilityType;
    this.visibilityTargets = data.visibilityTargets;
    this.startTime = new Date(data.startTime);
    this.expiryTime = new Date(data.expiryTime);
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.archived = data.archived || false;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  public isActive(): boolean {
    const now = new Date();
    return this.enabled && 
           !this.archived && 
           this.startTime <= now && 
           this.expiryTime > now;
  }

  public isExpired(): boolean {
    return new Date() > this.expiryTime;
  }

  public shouldSendReminder(lastSentTime?: Date): boolean {
    if (!this.isActive()) return false;
    if (!lastSentTime) return true;
    
    const timeSinceLastSent = Date.now() - lastSentTime.getTime();
    return timeSinceLastSent >= this.reminderFrequency;
  }

  public toJSON(): IAlert {
    return {
      id: this.id,
      title: this.title,
      message: this.message,
      severity: this.severity,
      deliveryType: this.deliveryType,
      reminderFrequency: this.reminderFrequency,
      visibilityType: this.visibilityType,
      visibilityTargets: this.visibilityTargets,
      startTime: this.startTime,
      expiryTime: this.expiryTime,
      enabled: this.enabled,
      archived: this.archived,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
