import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
  } from 'typeorm';
  import { Tenant } from './tenant.entity';

  export enum LoginMethod {
    EMAIL = 'email',
    DOCUMENT = 'document',
    BOTH = 'both', // Permite login con email o con Numero de Identificacion
  }
  
  @Entity()
  export class TenantConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @OneToOne(() => Tenant, tenant => tenant.config, { onDelete: 'CASCADE' })
    @JoinColumn()
    tenant: Tenant;

    @Column({ default: true})
    status: boolean; // "active - 1", "inactive - 0", "suspended"
  
    @Column({ default: '#0052cc' })
    primaryColor: string;
  
    @Column({ default: '#ffffff' })
    secondaryColor: string;
  
    @Column({ default: true })
    showLearningModule: boolean;
  
    @Column({ default: false })
    enableChatSupport: boolean;
  
    @Column({ default: true })
    allowGamification: boolean;
  
    @Column({ nullable: true })
    timezone: string;

    // campo maximo de usuarios
    @Column({ default: 1000 })
    maxUsers: number;

    // campo maximo de almacenamiento en GB
    @Column({ default: 100 })
    storageLimit: number;

    // campo de configuracion permitir a los usuarios cambiar su contraseña
    @Column({ default: true })
    allowUserPasswordChange: boolean;

    // campo de configuracion notificaciones por correo electronico
    @Column({ default: true })
    enableEmailNotifications: boolean;

    // campo de ruta favicon
    @Column({ nullable: true})
    faviconPath: string;

    // campo de ruta logo
    @Column({ nullable: true})
    logoPath: string;

    // campo de ruta de fondo login
    @Column({ nullable: true})
    loginBackgroundPath: string;

    @Column({ nullable: true })
    iconPath: string;

    // Campos de configuracion del registro y login

    @Column({ default: true })
    allowSelfRegistration: boolean; // Permite el registro de usuarios

    @Column({ default: false })
    allowGoogleLogin: boolean;

    @Column({ default: false })
    allowFacebookLogin: boolean;

    // campo de configuracion inicio de sesion con email o con Numero de Identificacion
    @Column({
      type: 'enum',
      enum: LoginMethod,
      default: LoginMethod.EMAIL,
      nullable: false,
    })
    loginMethod: LoginMethod;

    // campo de configuracion estado de usaurios activos e iniactivos
    @Column({ default: true })
    allowValidationStatusUsers: boolean; // Al habilitar este campo, todos los usuarios deben estar activos para iniciar sesion.

    // Configuracion campos de registro de usuario
    
    // Apellido
    @Column({ default: true })
    requireLastName: boolean;

    // Telefono
    @Column({ default: true })
    requirePhone: boolean;

    // Tipo de Documento
    @Column({ default: true })
    requireDocumentType: boolean;

    // Numero de documento
    @Column({ default: true })
    requireDocument: boolean;

    // Organizacion
    @Column({ default: false })
    requireOrganization: boolean;

    // Cargo
    @Column({ default: false })
    requirePosition: boolean;

    // Genero
    @Column({ default: false })
    requireGender: boolean

    // Ciudad
    @Column({ default: false })
    requireCity: boolean;

    // Direccion
    @Column({ default: false })
    requireAddress: boolean;

  }
  