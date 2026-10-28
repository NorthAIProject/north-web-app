import { getContext, setContext } from "svelte";

const KEY = Symbol("carousel");

export class CarouselState {
	current = $state(0);
	count = $state(0);
	/** Live drag offset in % of the track width; null when not dragging. */
	dragOffset = $state<number | null>(null);
	hovered = $state(false);

	constructor(private readonly opts: { loop: () => boolean; onIndexChange: (i: number) => void }) {}

	get loop() {
		return this.opts.loop();
	}

	get canPrev() {
		return this.loop || this.current > 0;
	}

	get canNext() {
		return this.loop || this.current < this.count - 1;
	}

	register() {
		this.count++;
		return () => {
			this.count--;
			if (this.current > Math.max(0, this.count - 1)) this.goTo(Math.max(0, this.count - 1));
		};
	}

	goTo(index: number) {
		this.current = index;
		this.opts.onIndexChange(index);
	}

	navigate(direction: number) {
		if (this.count === 0) return;
		let next = this.current + direction;
		next = this.loop
			? ((next % this.count) + this.count) % this.count
			: Math.max(0, Math.min(next, this.count - 1));
		this.goTo(next);
	}
}

export function setCarouselContext(state: CarouselState) {
	return setContext(KEY, state);
}

export function getCarouselContext() {
	return getContext<CarouselState>(KEY);
}
