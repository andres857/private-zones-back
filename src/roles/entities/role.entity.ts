import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity()
  export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    name: string; // Ej: "admin", "manager", "employee"
  
    @Column({ nullable: true })
    description: string;
  
    @ManyToMany(() => User, user => user.roles)
    users: User[];
  }
  