// Wire shapes the training pages read, from the generated API contract.

import type { components } from '#lib/api/generated/schema.js';

type Schemas = components['schemas'];

export type PlanDetail = Schemas['PlanDetail'];
export type PlanDay = Schemas['TrainingDay'];
export type PlanExercise = Schemas['DayExercise'];
export type PlanSummary = Schemas['PlanSummary'];
export type TrainingWeek = Schemas['TrainingWeek'];
export type WeekSession = Schemas['WeekSession'];
export type WeekRequest = Schemas['WeekRequest'];
export type CatalogExercise = Schemas['ExerciseSummary'];
export type TrainingOverview = Schemas['TrainingOverview'];
export type TrainingIntake = Schemas['TrainingIntake'];
export type WorkoutDraft = Schemas['WorkoutImportDraft'];
