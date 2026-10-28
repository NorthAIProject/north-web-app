// The calculator's units edge (north-client internal/calculator/macroplan):
// the form is typed in the person's own units and stored metric.

export const UNITS_METRIC = 'metric';
export const UNITS_IMPERIAL = 'imperial';

const poundsPerKg = 1 / 0.45359237;
const inchesPerCm = 1 / 2.54;

/** macroplan.ToMetric: a weight and height entered in units, as kg and cm. */
export function toMetric(weight: number, height: number, units: string): { kg: number; cm: number } {
	if (units === UNITS_IMPERIAL) return { kg: weight / poundsPerKg, cm: height / inchesPerCm };
	return { kg: weight, cm: height };
}

/** util.RoundHalfUpToScale(v, 1). */
const roundOne = (v: number) => Math.round(v * 10 + Number.EPSILON * Math.sign(v)) / 10;

/** macroplan.Display: stored metric back in the units it was entered in. */
export function display(kg: number, cm: number, units: string): { weight: number; height: number } {
	if (units === UNITS_IMPERIAL) return { weight: roundOne(kg * poundsPerKg), height: roundOne(cm * inchesPerCm) };
	return { weight: kg, height: cm };
}

export const weightUnit = (units: string) => (units === UNITS_IMPERIAL ? 'lb' : 'kg');
export const heightUnit = (units: string) => (units === UNITS_IMPERIAL ? 'in' : 'cm');

/** The defaults the selects show as placeholders (macroplan constants). */
export const ACTIVITY_MODERATE = 'moderate';
export const GOAL_MAINTENANCE = 'maintenance';
export const SPLIT_MODERATE_CARB = 'moderate_carb';

/**
 * Go's fmt "%.0f": rounds an exact half to even (2712.5 → "2712"), where
 * toFixed rounds it up.
 */
export function whole(v: number): string {
	const floor = Math.floor(v);
	if (v - floor === 0.5) return String(floor % 2 === 0 ? floor : floor + 1);
	return v.toFixed(0);
}
