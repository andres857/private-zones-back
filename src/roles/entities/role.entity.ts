import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToMany,
	JoinTable
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';

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


	@ManyToMany(() => Permission, permission => permission.roles)
	@JoinTable({
	name: 'role_permissions',
	joinColumn: {
		name: 'roleId',
		referencedColumnName: 'id'
	},
	inverseJoinColumn: {
		name: 'permissionId',
		referencedColumnName: 'id'
	}
	})
	permissions: Permission[];
}