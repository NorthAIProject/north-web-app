// The landing demos' behaviour: a port of north-client
// web/assets/js/landing/landing.js. Everything here is presentation — the
// demos are canned so a visitor can operate them before signing up; the real
// equivalents live behind /app.
//
// The words come from the catalogue under land.goal.*, land.bmi.* and
// land.setter.*; fill() replaces their {placeholders}. A missing key renders
// as itself (Translator.t), which is visibly wrong rather than silently English.

type T = (key: string) => string;
type Vars = Record<string, string | number>;

export function fill(s: string, vars?: Vars): string {
	if (!vars) return s;
	for (const [name, value] of Object.entries(vars)) s = s.split(`{${name}}`).join(String(value));
	return s;
}

/** A plan line can open with a placeholder ("{pull}, press…"), lower case in every language. */
export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const tr = (t: T, key: string, vars?: Vars) => fill(t(key), vars);

// ---------------------------------------------------------------------------
// Goal repair
// ---------------------------------------------------------------------------

export type Session = { day: string; work: string };

export type Goal = {
	objective: string;
	horizon: string;
	commitment: string;
	equipment: string;
	constraint: string;
	sessions: Session[];
	measure: string;
};

export const goalFields = ['objective', 'horizon', 'commitment', 'equipment', 'constraint'] as const;

export const blankGoal = (): Goal => ({
	objective: '',
	horizon: '',
	commitment: '',
	equipment: '',
	constraint: '',
	sessions: [],
	measure: ''
});

/**
 * Turns a sentence somebody would actually type into the shape a training
 * block can be built from. Deliberately shallow — it exists so the demo
 * responds to what a visitor writes rather than replaying a fixed script.
 * The keyword lists cover the four languages the page is served in.
 */
export function parseGoal(text: string, t: T): Goal {
	const s = (text || '').toLowerCase();

	const explicit = s.match(
		/([1-7])\s*(?:x|times|days?|sessions?|veces|d[ií]as?|vezes|sesi[oó]n(?:es)?|sess(?:ão|ões)|treinos?)/
	);
	const days = explicit ? Number(explicit[1]) : 3;

	const kit: string[] = [];
	if (/barbell|squat rack|the gym|gym\b|gimnasio|gin[aá]sio|academia/.test(s)) kit.push('barbell');
	if (/dumbbell|db\b|mancuerna|halter/.test(s)) kit.push('dumbbells');
	if (/pull ?-?up|chin ?-?up|dominada|barra fixa|elevaç/.test(s)) kit.push('pullup');
	if (/kettlebell|kb\b|pesa rusa/.test(s)) kit.push('kettlebell');
	if (/band|el[aá]stic/.test(s)) kit.push('bands');
	if (!kit.length) kit.push('none');

	const wantsLean = /lose|leaner|lean|fat|weight off|slim|cut|perder|adelgaz|grasa|gordura|emagrec|secar|definir/.test(s);
	const wantsStrong = /strong|strength|lift|muscle|bigger|gains|fuert|fuerza|m[uú]sculo|forte|for[cç]a|massa/.test(s);
	const wantsEndurance =
		/run|hike|cycle|endurance|cardio|marathon|fitter|correr|corrida|senderismo|caminhad|trilha|resist[eê]ncia|marat[oó]n|maratona|bici/.test(
			s
		);

	let objective = t('land.goal.obj.habit');
	if (wantsStrong && wantsLean) objective = t('land.goal.obj.both');
	else if (wantsStrong) objective = t('land.goal.obj.strong');
	else if (wantsLean) objective = t('land.goal.obj.lean');
	else if (wantsEndurance) objective = t('land.goal.obj.endurance');

	const hasBack = /back|espalda|costas|lumbar|lombar/.test(s);
	const hasKnee = /knee|rodilla|joelho/.test(s);
	const hasShoulder = /shoulder|hombro|ombro/.test(s);

	let constraint = t('land.goal.con.none');
	if (hasBack) constraint = t('land.goal.con.back');
	else if (hasKnee) constraint = t('land.goal.con.knee');
	else if (hasShoulder) constraint = t('land.goal.con.shoulder');
	else if (
		/if i'?m lucky|busy|no time|work|kids|travel|suerte|sin tiempo|trabajo|niños|hijos|viaj|sorte|sem tempo|trabalho|filhos|miúdos|crianças/.test(
			s
		)
	)
		constraint = t('land.goal.con.busy');

	const heavy = t(
		kit.includes('barbell')
			? 'land.goal.heavy.barbell'
			: kit.includes('dumbbells')
				? 'land.goal.heavy.dumbbell'
				: 'land.goal.heavy.bodyweight'
	);
	const pull = t(
		kit.includes('pullup')
			? 'land.goal.pull.pullups'
			: kit.includes('dumbbells')
				? 'land.goal.pull.rows'
				: 'land.goal.pull.inverted'
	);
	const cautious = hasBack || hasKnee || hasShoulder;

	const sessions = [
		tr(t, cautious ? 'land.goal.s1.cautious' : 'land.goal.s1', { heavy, pull }),
		tr(t, cautious ? 'land.goal.s2.cautious' : 'land.goal.s2', { heavy }),
		t(wantsLean ? 'land.goal.s3.lean' : 'land.goal.s3')
	]
		.slice(0, Math.max(2, Math.min(3, days)))
		.map((work, i) => ({ day: tr(t, 'land.goal.session', { n: i + 1 }), work: capitalise(work) }));

	return {
		objective,
		horizon: t('land.goal.horizon'),
		commitment: tr(t, days === 1 ? 'land.goal.commit.one' : 'land.goal.commit.many', { n: days }),
		// "kettlebell" is borrowed unchanged in every language the page speaks.
		equipment: kit.map((k) => (k === 'kettlebell' ? k : t(`land.goal.kit.${k}`))).join(', '),
		constraint,
		sessions,
		measure: t(wantsLean ? 'land.goal.measure.lean' : 'land.goal.measure')
	};
}

// ---------------------------------------------------------------------------
// BMI
// ---------------------------------------------------------------------------

export type BmiBand = 'under' | 'normal' | 'over' | 'obese';

export function bmiOf(heightCm: number, weightKg: number): number {
	return weightKg / Math.pow(heightCm / 100, 2);
}

export function bmiBand(raw: number): BmiBand {
	if (raw < 18.5) return 'under';
	if (raw < 25) return 'normal';
	if (raw < 30) return 'over';
	return 'obese';
}

/** "25.9" with the catalogue's decimal mark ("25,9" in es/pt). */
export function bmiText(raw: number, t: T): string {
	return raw.toFixed(1).replace('.', t('land.bmi.decimal'));
}

// ---------------------------------------------------------------------------
// Goal setter
// ---------------------------------------------------------------------------

export type SetterGoal = 'strength' | 'leaner' | 'endurance' | 'pain';
export type Kit = { barbell: boolean; dumbbells: boolean; pullup: boolean; none: boolean };

/** "Nothing at all" is a claim about the other boxes, so it settles them. */
export function toggleKit(kit: Kit, key: keyof Kit, checked: boolean): Kit {
	const next = { ...kit, [key]: checked };
	if (key === 'none' && checked) {
		next.barbell = false;
		next.dumbbells = false;
		next.pullup = false;
	} else if (checked) {
		next.none = false;
	}
	return next;
}

export function setterSummary(goal: SetterGoal, days: number, kit: Kit, t: T): string {
	const names: string[] = [];
	if (kit.barbell) names.push(t('land.setter.owned.barbell'));
	if (kit.dumbbells) names.push(t('land.setter.owned.dumbbells'));
	if (kit.pullup) names.push(t('land.setter.owned.pullup'));
	const owned = names.length ? names.join(t('land.setter.owned.and')) : t('land.setter.owned.none');
	return tr(t, days === 1 ? 'land.setter.summary.one' : 'land.setter.summary.many', {
		days,
		objective: t(`land.setter.obj.${goal}`),
		owned
	});
}

/** Six days per goal in the catalogue: land.setter.<goal>.1 … .6. */
export function setterSplit(goal: SetterGoal, days: number, kit: Kit, t: T): Session[] {
	const heavy = t(
		kit.barbell ? 'land.goal.heavy.barbell' : kit.dumbbells ? 'land.goal.heavy.dumbbell' : 'land.goal.heavy.bodyweight'
	);
	const pull = t(kit.pullup ? 'land.goal.pull.pullups' : kit.dumbbells ? 'land.goal.pull.rows' : 'land.goal.pull.inverted');
	const out: Session[] = [];
	for (let n = 1; n <= days; n++) {
		out.push({
			day: tr(t, 'land.setter.day', { n }),
			work: capitalise(tr(t, `land.setter.${goal}.${n}`, { heavy, pull }))
		});
	}
	return out;
}
