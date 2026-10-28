import { getContext, setContext } from "svelte";

const KEY = Symbol("input-otp");

export class InputOTPState {
	chars = $state<string[]>([]);
	#slots = new Map<number, HTMLInputElement>();

	constructor(private readonly onChange: (value: string) => void) {}

	get value() {
		return this.chars.join("");
	}

	setFromString(v: string) {
		const next: string[] = [];
		for (let i = 0; i < Math.max(v.length, this.chars.length); i++) next[i] = v[i] ?? "";
		this.chars = next;
	}

	register(index: number, el: HTMLInputElement) {
		this.#slots.set(index, el);
		return () => {
			if (this.#slots.get(index) === el) this.#slots.delete(index);
		};
	}

	#sorted() {
		return [...this.#slots.keys()].sort((a, b) => a - b);
	}

	focus(index: number | undefined) {
		if (index === undefined) return;
		const el = this.#slots.get(index);
		if (!el) return;
		el.focus();
		setTimeout(() => el.select(), 0);
	}

	next(index: number) {
		const keys = this.#sorted();
		const i = keys.indexOf(index);
		return i >= 0 && i < keys.length - 1 ? keys[i + 1] : undefined;
	}

	prev(index: number) {
		const keys = this.#sorted();
		const i = keys.indexOf(index);
		return i > 0 ? keys[i - 1] : undefined;
	}

	firstEmpty() {
		return this.#sorted().find((k) => !this.chars[k]);
	}

	focusFirst() {
		this.focus(this.#sorted()[0]);
	}

	set(index: number, ch: string) {
		const next = [...this.chars];
		next[index] = ch;
		for (let i = 0; i < next.length; i++) next[i] ??= "";
		this.chars = next;
		this.onChange(this.value);
	}

	paste(fromIndex: number, text: string) {
		const chars = text.replace(/\s/g, "").split("");
		const keys = this.#sorted();
		const start = keys.indexOf(fromIndex);
		if (start < 0) return;
		const next = [...this.chars];
		for (let i = 0; i < chars.length && start + i < keys.length; i++) next[keys[start + i]] = chars[i];
		for (let i = 0; i < next.length; i++) next[i] ??= "";
		this.chars = next;
		this.onChange(this.value);
		this.focus(this.firstEmpty() ?? keys[Math.min(start + chars.length, keys.length - 1)]);
	}
}

export function setInputOTPContext(state: InputOTPState) {
	return setContext(KEY, state);
}

export function getInputOTPContext() {
	return getContext<InputOTPState>(KEY);
}
