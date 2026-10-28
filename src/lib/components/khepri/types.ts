// Props and view models for the shared Khepri components, translated from the
// Go structs the templ components take (north-client web/shared/*). Field
// names are the Go ones in camelCase; times are Date or ISO strings.

// ---------------------------------------------------------------------------
// muscleviewer (web/shared/muscleviewer, internal/bodymap)
// ---------------------------------------------------------------------------

/** One side of the flat (no-WebGL) body figure. */
export type FigureView = {
	viewBox: string;
	/** The whole body, drawn first as its dark inside. */
	silhouette: string;
	regions: { region: string; d: string }[];
};

/** bodymap.RegionHeat: one region's recent heat, 0..1, and when it was last trained. */
export type RegionHeat = {
	region: string;
	intensity: number;
	/** Null/undefined when never trained. */
	lastTrained?: Date | string | null;
};

/** bodymap.Map: every region's heat over the last `days` days. */
export type BodyMap = {
	days: number;
	lastSession?: Date | string | null;
	regions: RegionHeat[];
};

/** bodymap.Shape: morph-target strengths, each 0..1. */
export type BodyShape = {
	waist: number;
	hips: number;
	chest: number;
	overall: number;
};

/** muscleviewer.Props */
export type MuscleViewerProps = {
	/** Unique on the page; namespaces the figure. */
	id?: string;
	primary?: string[];
	secondary?: string[];
	stabilizers?: string[];
	exerciseName?: string;
	/** Replaces the three tiers with recent-training heat and tap-to-inspect. */
	map?: BodyMap | null;
	hideLegend?: boolean;
	/** Shapes the skin to a person's measurements (their own body only). */
	shape?: BodyShape | null;
};

/** What a tap on a region shows, already in the reader's language. */
export type MuscleDetail = { name: string; last?: string; href?: string };

// ---------------------------------------------------------------------------
// medal (web/shared/medal, docs/medals)
// ---------------------------------------------------------------------------

export type AwardArea =
	| 'training'
	| 'lifts'
	| 'consistency'
	| 'habits'
	| 'nutrition'
	| 'hydration'
	| 'sleep'
	| 'mind'
	| 'goals'
	| 'body'
	| 'social';

/** medal.Props. Size is in CSS pixels. */
export type MedalProps = {
	badgeId?: string;
	area?: AwardArea | string;
	size: number;
	locked?: boolean;
	monthly?: boolean;
	label?: string;
	/** Short, upper-case, localised month: makes a monthly coin carry text. */
	month?: string;
	target?: number;
};

/** medal.MonthlyProps */
export type MonthlyMedalProps = {
	month: string;
	target: number;
	size: number;
	locked?: boolean;
	label?: string;
};

// ---------------------------------------------------------------------------
// exerciseart / exerciserow
// ---------------------------------------------------------------------------

/** exerciseart.Props */
export type ExerciseArtProps = {
	/** Unique on the page. */
	id?: string;
	/** exercise.IllustrationSlug; empty renders nothing. */
	slug: string;
	name: string;
	/** Merged onto the outer box. Size generously (≥ 56px). */
	class?: string;
};

/** The parts of exercise.Exercise the row helpers read. */
export type ExerciseLike = {
	slug: string;
	name: string;
	/** Empty when the exercise has no artwork. */
	illustrationSlug?: string;
	/** "none" for bodyweight movements. */
	equipment?: string;
};

// ---------------------------------------------------------------------------
// mascot
// ---------------------------------------------------------------------------

export type MascotSize = 'sm' | 'md' | 'lg';
/** Sustained poses a mascot can start in. */
export type MascotState = 'idle' | 'thinking' | 'listening' | 'working';
/** Gestures play once and hand back. */
export type MascotGesture = 'celebrate' | 'nod';

/** mascot.Props */
export type MascotProps = {
	id?: string;
	size?: MascotSize;
	state?: MascotState | string;
	gesture?: MascotGesture | string;
	class?: string;
};

// ---------------------------------------------------------------------------
// workoutcard (lift.Card)
// ---------------------------------------------------------------------------

/** lift.CardExercise */
export type CardExercise = {
	name: string;
	sets?: number;
	volumeKg?: number;
	/** English "22.5 kg × 8"; used when bestWeightKg is absent. */
	best?: string;
	bestWeightKg?: number;
	bestReps?: number;
	pr: boolean;
};

/** lift.Card */
export type WorkoutCardData = {
	/** Duration in seconds. */
	durationSeconds: number;
	sets: number;
	volumeKg: number;
	distanceM?: number | null;
	prs: number;
	/** Most volume first. */
	exercises: CardExercise[];
};

// ---------------------------------------------------------------------------
// moment
// ---------------------------------------------------------------------------

/** moments.Moment */
export type MomentData = { kind: string; title: string; body: string };

// ---------------------------------------------------------------------------
// instrument / emptystate
// ---------------------------------------------------------------------------

/** ui.KpiCellProps */
export type KpiCellProps = { label: string; value: string; href?: string; cta?: string };

/** ui.EmptyProps (the CTA is the children snippet). */
export type EmptyStateProps = { eyebrow?: string; title: string; body?: string; class?: string };

// ---------------------------------------------------------------------------
// workoutsummary
// ---------------------------------------------------------------------------

/** lift.RecapExercise, the input NewRecap reads. */
export type LiftRecapExercise = {
	name: string;
	sets?: number;
	volumeKg: number;
	best?: string;
	bestWeightKg?: number;
	bestReps?: number;
	e1rm?: number;
	previousE1rm?: number;
	change?: number;
	previousVolume?: number;
	hasPrevious?: boolean;
};

/** lift.Recap, the input NewRecap reads. */
export type LiftRecap = {
	startedAt?: Date | string | null;
	planWeekday?: string;
	focus?: string;
	/** English sentence, for readers with no language of their own. */
	sentence: string;
	durationSeconds: number;
	setsDone: number;
	setsPrescribed: number;
	volumeKg: number;
	calories: number;
	exercises: LiftRecapExercise[];
	hasComparison?: boolean;
};

/** workoutsummary.ExerciseRow */
export type RecapExerciseRow = {
	name: string;
	best: string;
	e1rm: string;
	change: number;
	hasChange: boolean;
};

/** A Chart.js config as templUI's chart.Props carries it (viz.GroupedBar). */
export type ChartJsDataset = {
	label: string;
	data: number[];
	borderWidth?: number;
	backgroundColor?: string | string[];
	borderColor?: string | string[];
};
export type ChartJsProps = {
	id: string;
	variant: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
	class?: string;
	data: { labels: string[]; datasets: ChartJsDataset[] };
	showLegend?: boolean;
	showXAxis?: boolean;
	showYAxis?: boolean;
	showXLabels?: boolean;
	showYLabels?: boolean;
	showXGrid?: boolean;
	showYGrid?: boolean;
	beginAtZero?: boolean;
};

/** workoutsummary.Recap, already shaped for the card (see newRecap). */
export type RecapView = {
	planWeekday: string;
	focus: string;
	startedAt: Date | null;
	/** English line; the card shows the localised one when it can build it. */
	sentence: string;
	/** The localised sentence (Recap.SentenceIn). */
	sentenceLocalised: string;
	duration: string;
	sets: string;
	volume: string;
	calories: string;
	exercises: RecapExerciseRow[];
	chart: ChartJsProps | null;
};

/** workoutsummary.WeekDay */
export type WeekDay = { date: Date; focus?: string; done: boolean; today: boolean; past: boolean };

/** workoutsummary.Week */
export type Week = { sentence: string; done: number; planned: number; days: WeekDay[] };

/** workoutsummary.StaleMuscle */
export type StaleMuscle = { name: string; days: number };

/** workoutsummary.Readiness */
export type Readiness = {
	fatigued: string[];
	recovering: string[];
	fresh: string[];
	stale: StaleMuscle[];
	lastSession: Date | string;
};
