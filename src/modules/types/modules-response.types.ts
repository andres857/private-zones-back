import { ResolvedModuleItem } from "../modules.service";

export interface ModuleWithResolvedItems {
    id: string;
    title: string;
    description?: string;
    courseId: string;
    thumbnailImagePath?: string;
    createdAt: Date;
    updatedAt: Date;
    configuration?: {
        isActive: boolean;
        order: number;
        approvalPercentage: number;
    };
    course: { id: string; tenantId: string };
    items: ResolvedModuleItem[];
}