// User Model

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  teamId?: string;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User implements IUser {
  public id?: string;
  public name: string;
  public email: string;
  public password?: string;
  public role: UserRole;
  public teamId?: string;
  public organizationId: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.teamId = data.teamId;
    this.organizationId = data.organizationId;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public belongsToTeam(teamId: string): boolean {
    return this.teamId === teamId;
  }

  public toJSON(): Omit<IUser, 'password'> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
