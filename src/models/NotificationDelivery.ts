// NotificationDelivery Model - Logs each alert sent to a user

import { DeliveryType } from './Alert';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

export interface INotificationDelivery {
  id?: string;
  alertId: string;
  userId: string;
  deliveryType: DeliveryType;
  status: DeliveryStatus;
  deliveredAt?: Date;
  failureReason?: string;
  createdAt?: Date;
}

export class NotificationDelivery implements INotificationDelivery {
  public id?: string;
  public alertId: string;
  public userId: string;
  public deliveryType: DeliveryType;
  public status: DeliveryStatus;
  public deliveredAt?: Date;
  public failureReason?: string;
  public createdAt?: Date;

  constructor(data: INotificationDelivery) {
    this.id = data.id;
    this.alertId = data.alertId;
    this.userId = data.userId;
    this.deliveryType = data.deliveryType;
    this.status = data.status;
    this.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : undefined;
    this.failureReason = data.failureReason;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  public markAsDelivered(): void {
    this.status = DeliveryStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  public markAsFailed(reason: string): void {
    this.status = DeliveryStatus.FAILED;
    this.failureReason = reason;
  }

  public toJSON(): INotificationDelivery {
    return {
      id: this.id,
      alertId: this.alertId,
      userId: this.userId,
      deliveryType: this.deliveryType,
      status: this.status,
      deliveredAt: this.deliveredAt,
      failureReason: this.failureReason,
      createdAt: this.createdAt
    };
  }
}
