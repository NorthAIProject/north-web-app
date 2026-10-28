<!--
	One tappable tile that opens its detail dialog (web/day cards.templ
	dayCard). The whole tile is the dialog trigger, a button, for keyboard and
	screen-reader use.
-->
<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let {
		id,
		titleKey,
		color,
		icon: Icon,
		meta = '',
		open = $bindable(false),
		children,
		detail
	}: {
		id: string;
		titleKey: string;
		color: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon: Component<any>;
		meta?: string;
		open?: boolean;
		children: Snippet;
		detail: Snippet<[() => void]>;
	} = $props();

	const i18n = useI18n();
	const close = () => (open = false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		data-testid="card-{id}"
		class="border-hairline bg-surface hover:border-ring focus-visible:ring-ring flex min-h-40 w-full flex-col rounded-2xl border p-3 text-left shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:min-h-44 sm:p-4"
	>
		<span class="flex w-full items-center justify-between gap-1">
			<span class="text-foreground flex min-w-0 items-center gap-1.5 truncate text-sm font-medium">
				<span class="flex shrink-0" style:color><Icon class="size-4" /></span>
				{i18n.t(titleKey)}
			</span>
			<span class="text-muted-foreground text-xs tabular-nums">{meta}</span>
		</span>
		<span class="flex flex-1 items-center">
			{@render children()}
		</span>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{i18n.t(titleKey)}</Dialog.Title>
		</Dialog.Header>
		{@render detail(close)}
	</Dialog.Content>
</Dialog.Root>
