export type TutorialModuleId =
  | 'shell'
  | 'F01'
  | 'F02'
  | 'F03'
  | 'F04'
  | 'F05'
  | 'F06'
  | 'F07'
  | 'F08'
  | 'F09';

export interface LocalizedTutorialText {
  readonly es: string;
  readonly en: string;
}

export interface TutorialStepDefinition {
  readonly id: string;
  readonly selector: string;
  readonly title: LocalizedTutorialText;
  readonly description: LocalizedTutorialText;
  readonly route?: string;
  readonly requiredPermission?: string;
  readonly placement?: 'top' | 'right' | 'bottom' | 'left';
  readonly align?: 'start' | 'center' | 'end';
  readonly allowInteraction?: boolean;
  readonly optional?: boolean;
}

export interface TutorialDefinition {
  readonly id: string;
  readonly moduleId: TutorialModuleId;
  readonly version: number;
  readonly title: LocalizedTutorialText;
  readonly description: LocalizedTutorialText;
  readonly estimatedMinutes: number;
  readonly featured?: boolean;
  readonly route: string;
  readonly requiredPermissions?: readonly string[];
  readonly steps: readonly TutorialStepDefinition[];
}

export type TutorialProgressStatus = 'not-started' | 'in-progress' | 'completed' | 'dismissed';

export interface TutorialProgress {
  readonly tutorialId: string;
  readonly version: number;
  readonly status: TutorialProgressStatus;
  readonly lastStepId?: string;
  readonly updatedAt: string;
}

export interface TutorialDisplayProgress extends TutorialProgress {
  readonly updated: boolean;
}
