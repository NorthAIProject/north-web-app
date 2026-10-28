<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined }) & {
				/** templUI NoTogglePassword: hide the show/hide eye on password inputs. */
				noTogglePassword?: boolean;
			}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		noTogglePassword = false,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();

	// Matches templUI input (web/shared/ui/input/input.templ).
	const base =
		"flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30 selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40";

	const hasToggle = $derived(type === "password" && !noTogglePassword);
	let revealed = $state(false);
	const effectiveType = $derived(hasToggle && revealed ? "text" : type);
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(base, className)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else if hasToggle}
	<!-- templUI wraps password inputs with an eye toggle (input.js). -->
	<div class="relative w-full">
		<input
			bind:this={ref}
			data-slot={dataSlot}
			class={cn(base, "pr-8", className)}
			type={effectiveType}
			bind:value
			{...restProps}
		/>
		<button
			type="button"
			class="absolute top-1/2 right-0 inline-flex size-9 shrink-0 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md opacity-50 transition-all outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/50"
			aria-label={revealed ? "Hide password" : "Show password"}
			aria-pressed={revealed}
			onclick={() => (revealed = !revealed)}
		>
			{#if revealed}
				<EyeOffIcon class="size-[18px]" />
			{:else}
				<EyeIcon class="size-[18px]" />
			{/if}
		</button>
	</div>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(base, className)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
