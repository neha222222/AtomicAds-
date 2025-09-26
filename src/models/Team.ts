// Team Model

export interface ITeam {
  id?: string;
  name: string;
  organizationId: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Team implements ITeam {
  public id?: string;
  public name: string;
  public organizationId: string;
  public description?: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: ITeam) {
    this.id = data.id;
    this.name = data.name;
    this.organizationId = data.organizationId;
    this.description = data.description;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  public toJSON(): ITeam {
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
