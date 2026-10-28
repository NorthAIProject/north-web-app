// The plan page's shared data (Go: nutrition.PlanPage), handed to each part.

import type { Ingredient, Macros, Overage, Plan, PlanTypeOption } from './view.js';

export type PlanPage = {
	plan: Plan;
	/** The person's macro target; absent until the calculator made one, and then nothing can be added. */
	target?: Macros;
	ingredients: Ingredient[];
	planTypes: PlanTypeOption[];
	/** A refused form, shown beside the form its scope names. */
	problem?: { scope: string; errors: Record<string, string> };
	overage?: Overage & { repost: { action: string; fields: { name: string; value: string }[] } };
	/** The option a change just landed on, whose tab opens first. */
	openOption: string;
};

export const advanced = (p: PlanPage) => p.plan.mode === 'advanced';

/** A field's message when the refused form is the one scope names. */
export function errorFor(p: PlanPage, scope: string, field: string): string {
	return p.problem?.scope === scope ? (p.problem.errors[field] ?? '') : '';
}

export function errorsFor(p: PlanPage, scope: string): Record<string, string> {
	return p.problem?.scope === scope ? p.problem.errors : {};
}
