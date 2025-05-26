import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  revokedAt: Date; // Cuándo fue revocado

  @Column({ nullable: true })
  revokedFromIp: string; // Desde qué IP se revocó

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string; // IP desde donde se creó

  @Column({ nullable: true })
  deviceFingerprint: string; // Identificador único del dispositivo

  @ManyToOne(() => User, user => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método helper para verificar si el token está activo
  isActive(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  // Método helper para obtener información del dispositivo
  getDeviceInfo(): string {
    if (this.userAgent) {
      // Extraer información básica del user agent
      const mobile = /Mobile|Android|iPhone|iPad/.test(this.userAgent);
      const browser = this.userAgent.match(/(Chrome|Firefox|Safari|Edge)/i)?.[0] || 'Unknown';
      return `${browser}${mobile ? ' (Mobile)' : ' (Desktop)'}`;
    }
    return 'Unknown Device';
  }
}