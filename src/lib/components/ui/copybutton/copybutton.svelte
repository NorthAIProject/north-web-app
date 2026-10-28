<script lang="ts">
	import ClipboardIcon from "@lucide/svelte/icons/clipboard";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { Button, type ButtonProps } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";

	type Props = Omit<ButtonProps, "value" | "href" | "variant" | "size"> & {
		/** ID of the element to copy from (inputs/textareas copy `value`, others `textContent`). */
		targetId?: string;
		/** Text to copy directly; takes precedence over `targetId`. */
		value?: string;
		/** Called after a successful copy. */
		oncopied?: (text: string) => void;
	};

	let { class: className, targetId, value, oncopied, ...restProps }: Props = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function resolveText(): string | null {
		if (value !== undefined) return value;
		if (!targetId) {
			console.error("CopyButton: No target-id specified");
			return null;
		}
		const el = document.getElementById(targetId);
		if (!el) {
			console.error(`CopyButton: Element with id '${targetId}' not found`);
			return null;
		}
		const withValue = el as HTMLElement & { value?: unknown };
		if (withValue.value !== undefined) return String(withValue.value);
		return el.textContent || "";
	}

	function fallbackCopy(text: string): boolean {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.top = "-9999px";
		textArea.style.left = "-9999px";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		let ok = false;
		try {
			ok = document.execCommand("copy");
			if (!ok) console.error("CopyButton: Fallback copy failed");
		} catch (err) {
			console.error("CopyButton: Fallback copy error", err);
		}
		document.body.removeChild(textArea);
		return ok;
	}

	function showCopied(text: string) {
		copied = true;
		oncopied?.(text);
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 2000);
	}

	async function copy() {
		const raw = resolveText();
		if (raw === null) return;
		const text = raw.trim();
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(text);
				showCopied(text);
				return;
			} catch (err) {
				console.error("CopyButton: Failed to copy text", err);
			}
		}
		if (fallbackCopy(text)) showCopied(text);
	}

	$effect(() => () => clearTimeout(timer));
</script>

<div data-copy-button data-target-id={targetId} class="inline-block">
	<Button
		variant="ghost"
		size="icon"
		type="button"
		class={cn("h-7 w-7 text-muted-foreground hover:text-accent-foreground", className)}
		aria-label={copied ? "Copied" : "Copy"}
		onclick={copy}
		{...restProps}
	>
		<span data-copy-icon-clipboard class={copied ? "hidden" : "inline"}>
			<ClipboardIcon class="size-4" />
		</span>
		<span data-copy-icon-check class={copied ? "inline" : "hidden"}>
			<CheckIcon class="size-4" />
		</span>
	</Button>
</div>
