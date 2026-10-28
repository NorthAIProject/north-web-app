import { getContext, setContext } from "svelte";

const KEY = Symbol("rating");

export type RatingStyle = "star" | "heart" | "emoji";

export class RatingState {
	value = $state(0);
	preview = $state(0);
	#items = $state<number[]>([]);

	constructor(
		private readonly opts: {
			readonly: () => boolean;
			precision: () => number;
			onlyInteger: () => boolean;
			onValueChange: (value: number, maxValue: number) => void;
		},
	) {}

	get readonly() {
		return this.opts.readonly();
	}

	get maxValue() {
		return Math.max(1, ...this.#items);
	}

	/** Value used for painting: hover preview wins over the committed value. */
	get displayValue() {
		return this.preview > 0 ? this.preview : this.value;
	}

	register(itemValue: number) {
		this.#items.push(itemValue);
		return () => {
			const i = this.#items.indexOf(itemValue);
			if (i >= 0) this.#items.splice(i, 1);
		};
	}

	fillPercent(itemValue: number): number {
		const v = this.displayValue;
		if (itemValue <= Math.floor(v)) return 100;
		if (itemValue - 1 < v && v < itemValue) return (v - Math.floor(v)) * 100;
		return 0;
	}

	select(itemValue: number) {
		if (this.readonly) return;
		const precision = this.opts.precision() > 0 ? this.opts.precision() : 1;
		let next = itemValue;
		if (this.opts.onlyInteger()) {
			next = Math.round(next);
		} else if (this.value === next && next % 1 === 0) {
			next = Math.max(0, next - precision);
		} else {
			next = Math.round(next / precision) * precision;
		}
		next = Math.max(0, Math.min(this.maxValue, next));
		this.value = next;
		this.preview = 0;
		this.opts.onValueChange(next, this.maxValue);
	}

	hover(itemValue: number) {
		if (this.readonly) return;
		this.preview = itemValue;
	}

	leave() {
		this.preview = 0;
	}
}

export function setRatingContext(state: RatingState) {
	return setContext(KEY, state);
}

export function getRatingContext() {
	return getContext<RatingState>(KEY);
}
