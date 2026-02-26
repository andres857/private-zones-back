// src/modules/dto/add-module-item.dto.ts
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ModuleItemType } from 'src/courses/entities/courses-modules-item.entity';

export class AddModuleItemDto {

    @IsString({ message: 'courseId debe ser una cadena de texto' })
    tenantId?: string;
    
    @IsEnum(ModuleItemType, {
        message: `type debe ser uno de: ${Object.values(ModuleItemType).join(', ')}`,
    })
    type: ModuleItemType;

    @IsUUID('4', { message: 'referenceId debe ser un UUID válido' })
    referenceId: string;
}