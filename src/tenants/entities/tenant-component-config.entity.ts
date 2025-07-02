import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum ComponentType {
  NAVBAR = 'navbar',
  FOOTER = 'footer',
  SIDEBAR = 'sidebar',
  HEADER = 'header',
  BREADCRUMB = 'breadcrumb',
  SEARCH_BAR = 'search_bar',
  USER_MENU = 'user_menu',
  NOTIFICATION_PANEL = 'notification_panel',
  CHAT_WIDGET = 'chat_widget',
  LOADING_SPINNER = 'loading_spinner',
  ERROR_BOUNDARY = 'error_boundary',
  MODAL = 'modal',
  TOAST = 'toast',
  CARD = 'card',
  BUTTON = 'button',
  FORM = 'form',
  TABLE = 'table',
  PAGINATION = 'pagination'
}

export enum ComponentPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
  FIXED = 'fixed',
  STICKY = 'sticky',
  ABSOLUTE = 'absolute'
}

@Entity()
@Index(['tenant', 'componentType'], { unique: false })
export class TenantComponentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: ComponentType,
    nullable: false
  })
  componentType: ComponentType;

  @Column({ nullable: true })
  componentName: string; // Nombre personalizado del componente

  // Configuración de visibilidad
  @Column({ default: true })
  isVisible: boolean;

  @Column('simple-array', { nullable: true })
  visibleOnViews: string[]; // ['login', 'dashboard', 'profile'] - en qué vistas mostrar

  @Column('simple-array', { nullable: true })
  hiddenOnViews: string[]; // vistas donde ocultar el componente

  // Configuración de posicionamiento
  @Column({
    type: 'enum',
    enum: ComponentPosition,
    nullable: true
  })
  position: ComponentPosition;

  @Column({ nullable: true })
  zIndex: number;

  @Column({ nullable: true })
  customPosition: string; // CSS position personalizada

  // Configuración de estilos
  @Column({ nullable: true })
  backgroundColor: string;

  @Column({ nullable: true })
  textColor: string;

  @Column({ nullable: true })
  borderColor: string;

  @Column({ nullable: true })
  borderRadius: string;

  @Column({ nullable: true })
  padding: string;

  @Column({ nullable: true })
  margin: string;

  @Column({ nullable: true })
  width: string;

  @Column({ nullable: true })
  height: string;

  @Column({ nullable: true })
  fontSize: string;

  @Column({ nullable: true })
  fontFamily: string;

  @Column({ nullable: true })
  fontWeight: string;

  @Column({ nullable: true, type: 'text' })
  customCss: string;

  // Configuración de contenido
  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  logoAlt: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  customHtml: string;

  // Configuración específica por tipo de componente
  @Column('json', { nullable: true })
  componentProps: any; // Props específicos del componente

  // Para Navbar
  @Column('json', { nullable: true })
  menuItems: any[]; // Elementos del menú

  @Column({ nullable: true })
  brandText: string;

  @Column({ default: false })
  showUserAvatar: boolean;

  @Column({ default: true })
  showNotifications: boolean;

  @Column({ default: true })
  showSearch: boolean;

  // Para Footer
  @Column('json', { nullable: true })
  footerLinks: any[]; // Enlaces del footer

  @Column({ nullable: true })
  copyrightText: string;

  @Column('json', { nullable: true })
  socialLinks: any[]; // Enlaces a redes sociales

  // Para Sidebar
  @Column({ default: true })
  collapsible: boolean;

  @Column({ default: false })
  collapsed: boolean;

  @Column({ nullable: true })
  sidebarWidth: string;

  // Configuración de permisos/roles
  @Column('simple-array', { nullable: true })
  allowedRoles: string[]; // Roles que pueden ver el componente

  @Column('simple-array', { nullable: true })
  restrictedRoles: string[]; // Roles que NO pueden ver el componente

  // Estados
  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  notes: string; // Notas del administrador

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}