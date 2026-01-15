import { GradingMethod, QuestionOrderMode } from "../entities/assessment-config.entity";
import { AssessmentStatus, AssessmentType } from "../entities/assessment.entity";

export interface UpdateAssessmentParams {
    tenantId: string;
    courseId?: string;
    type?: AssessmentType;
    status?: AssessmentStatus;
    isActive?: boolean;
    order?: number;
    translations?: Array<{
        id?: string;
        languageCode?: string;
        title?: string;
        description?: string;
        instructions?: string;
        successMessage?: string;
        failureMessage?: string;
    }>;
    configuration?: Partial<{
        isGradable: boolean;
        gradingMethod: GradingMethod;
        passingScore: number;
        maxScore: number;
        generatesCertificate: boolean;
        certificateTemplateId: string;
        requirePassingScoreForCertificate: boolean;
        hasAdditionalQuestions: boolean;
        additionalQuestionsPosition: string;
        additionalQuestionsInstructions: string;
        maxAttempts: number;
        allowReview: boolean;
        showCorrectAnswers: boolean;
        showScoreImmediately: boolean;
        timeBetweenAttempts: number;
        timeLimit: number;
        strictTimeLimit: boolean;
        questionOrderMode: QuestionOrderMode;
        randomizeOptions: boolean;
        oneQuestionPerPage: boolean;
        allowNavigationBetweenQuestions: boolean;
        availableFrom: string;
        availableUntil: string;
        gradeReleaseDate: string;
        requirePassword: boolean;
        accessPassword: string;
        requireProctoring: boolean;
        preventTabSwitching: boolean;
        fullscreenMode: boolean;
        showFeedbackAfterQuestion: boolean;
        showFeedbackAfterCompletion: boolean;
        customPassMessage: string;
        customFailMessage: string;
        notifyInstructorOnCompletion: boolean;
        notifyInstructorOnNewAttempt: boolean;
        metadata: Record<string, any>;
    }>;
}