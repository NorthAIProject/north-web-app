<script lang="ts">
	import { goto } from '$app/navigation';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { groupLabel } from '#lib/nav/nav.js';
	import { groups } from '#lib/nav/destinations.js';
	import { filterRows, paletteRows } from '#lib/nav/palette.js';

	// "Go to page": every destination, including the ones the rail leaves out.
	// ⌘K / Ctrl K anywhere opens it; ↑↓ moves, ⏎ opens, esc closes.
	const i18n = useI18n();

	let open = $state(false);
	let q = $state('');
	let active = $state(0);

	const rows = $derived(paletteRows(i18n));
	const visible = $derived(filterRows(rows, q));
	const activeRow = $derived(visible[Math.min(active, visible.length - 1)]);
	const apple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
	const hotkeyLabel = apple ? '⌘K' : 'Ctrl K';

	$effect(() => {
		// A new query starts the selection at the top again.
		void q;
		active = 0;
	});

	function reset() {
		q = '';
		active = 0;
	}

	function hotkey(event: KeyboardEvent) {
		const hit = apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
		if (!hit || event.key.toLowerCase() !== 'k' || event.repeat || event.isComposing) return;
		event.preventDefault();
		open = !open;
	}

	function nav(event: KeyboardEvent) {
		const n = visible.length;
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (n) active = (active + 1) % n;
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (n) active = (active - 1 + n) % n;
				break;
			case 'Home':
				event.preventDefault();
				active = 0;
				break;
			case 'End':
				event.preventDefault();
				active = Math.max(n - 1, 0);
				break;
			case 'Enter':
				if (!activeRow) return;
				event.preventDefault();
				go(activeRow.destination.href);
				break;
		}
	}

	function go(href: string) {
		open = false;
		reset();
		goto(href);
	}
</script>

<svelte:window onkeydown={hotkey} />

<Button
	variant="outline"
	size="sm"
	class="max-w-64 min-w-0 shrink gap-2 overflow-hidden font-normal text-muted-foreground sm:justify-start lg:max-w-80"
	aria-label={i18n.t('palette.aria')}
	onclick={() => (open = true)}
>
	<SearchIcon class="size-4" />
	<span class="hidden min-w-0 truncate sm:inline">{i18n.t('palette.trigger')}</span>
	<kbd
		class="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:ml-auto sm:inline"
		>{hotkeyLabel}</kbd
	>
</Button>

<Dialog.Root bind:open onOpenChange={(o) => !o && reset()}>
	<Dialog.Content showCloseButton={false} class="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-2xl">
		<Dialog.Title class="sr-only">{i18n.t('palette.title')}</Dialog.Title>
		<div class="relative border-b border-border">
			<span class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
				<SearchIcon class="size-4" />
			</span>
			<input
				id="command-palette-query"
				type="search"
				bind:value={q}
				onkeydown={nav}
				placeholder={i18n.t('palette.placeholder')}
				class="flex h-12 w-full rounded-none border-0 bg-transparent pl-11 text-base shadow-none outline-none placeholder:text-muted-foreground md:text-sm"
				role="combobox"
				aria-expanded="true"
				aria-controls="command-palette-list"
				aria-autocomplete="list"
				aria-activedescendant={activeRow ? `command-palette-row-${activeRow.index}` : undefined}
				autocomplete="off"
				spellcheck="false"
			/>
		</div>
		<div
			id="command-palette-list"
			role="listbox"
			aria-label={i18n.t('layout.palette.list')}
			class="flex max-h-[60vh] flex-col overflow-y-auto p-2"
		>
			{#if !q.trim()}
				{#each groups as group (group)}
					<div role="presentation" class="px-2 pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground first:pt-1">
						{groupLabel(i18n, group)}
					</div>
					{#each visible.filter((r) => r.destination.group === group) as row (row.index)}
						{@render paletteRow(row)}
					{/each}
				{/each}
			{:else}
				{#each visible as row (row.index)}
					{@render paletteRow(row)}
				{/each}
			{/if}
		</div>
		{#if visible.length === 0}
			<p class="px-4 py-6 text-center text-sm text-muted-foreground">
				{i18n.t('palette.empty.before')} <span class="font-medium text-foreground">{q}</span>{i18n.t('palette.empty.after')}
			</p>
		{/if}
		<span class="sr-only" aria-live="polite">{visible.length === 1 ? '1 page' : `${visible.length} pages`}</span>
		<div class="flex gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
			<span>↑↓ {i18n.t('palette.hint.navigate')}</span>
			<span>⏎ {i18n.t('palette.hint.open')}</span>
			<span>esc {i18n.t('palette.hint.close')}</span>
		</div>
	</Dialog.Content>
</Dialog.Root>

{#snippet paletteRow(row: (typeof visible)[number])}
	{@const Icon = row.destination.icon}
	<a
		href={row.destination.href}
		role="option"
		id="command-palette-row-{row.index}"
		aria-selected={row === activeRow}
		class={['flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground no-underline', row === activeRow && 'bg-accent']}
		onmouseenter={() => (active = visible.indexOf(row))}
		onclick={(e) => {
			e.preventDefault();
			go(row.destination.href);
		}}
	>
		<span class="shrink-0 text-muted-foreground"><Icon class="size-4" /></span>
		<span class="min-w-0 flex-1 truncate">{row.label}</span>
		<span class="hidden truncate text-xs text-muted-foreground sm:block sm:max-w-[55%]">{row.description}</span>
	</a>
{/snippet}
