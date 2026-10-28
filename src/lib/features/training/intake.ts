// The training intake's choices (north-client web/workouts/workouts.templ).

/**
 * The equipment the plan validator understands. The value is what the form
 * posts and stays English (the validator's vocabulary); key labels it.
 */
export const EQUIPMENT_OPTIONS = [
	{ value: 'dumbbell', key: 'workouts.intake.equip.dumbbell' },
	{ value: 'barbell', key: 'workouts.intake.equip.barbell' },
	{ value: 'kettlebell', key: 'workouts.intake.equip.kettlebell' },
	{ value: 'pull-up bar', key: 'workouts.intake.equip.pullupbar' },
	{ value: 'bench', key: 'workouts.intake.equip.bench' },
	{ value: 'resistance band', key: 'workouts.intake.equip.band' },
	{ value: 'machine', key: 'workouts.intake.equip.machine' },
	{ value: 'treadmill', key: 'workouts.intake.equip.treadmill' },
	{ value: 'bike', key: 'workouts.intake.equip.bike' },
	{ value: 'rower', key: 'workouts.intake.equip.rower' }
] as const;

export const EXPERIENCE_OPTIONS = [
	{ value: 'beginner', key: 'workouts.intake.exp.beginner' },
	{ value: 'returning', key: 'workouts.intake.exp.returning' },
	{ value: 'intermediate', key: 'workouts.intake.exp.intermediate' },
	{ value: 'advanced', key: 'workouts.intake.exp.advanced' }
] as const;
