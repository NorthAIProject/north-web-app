<script lang="ts">
	import type { Snippet } from 'svelte';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import PlugIcon from '@lucide/svelte/icons/plug';
	import { createQuery } from '@tanstack/svelte-query';
	import { browserApi } from '#lib/api/client.js';
	import AwardsHost from '#lib/features/awards/AwardsHost.svelte';
	import NudgeBell from '#lib/features/nudges/NudgeBell.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	// The header's right-hand cluster, in Go's order: the "connect an agent"
	// pill (settings/connections), the command palette (children), the nudge
	// bell (polls every 20 s, toasts a new nudge). The awards host sits beside
	// them: it opens the badge celebration after any navigation or announced
	// write (see #lib/features/awards/writes.js).
	let { children }: { children: Snippet } = $props();

	const i18n = useI18n();

	// Fetched once, not polled: whether an agent is connected does not change
	// while a page is open. Nothing shows once one is connected, and nothing
	// shows when the lookup fails — the connections page explains failures.
	const connections = createQuery(() => ({
		queryKey: ['settings', 'connections', 'count'] as const,
		queryFn: async ({ signal }: { signal: AbortSignal }) => {
			const { data } = await browserApi().GET('/settings/connections', { signal });
			return data?.connections.length ?? 0;
		},
		staleTime: Infinity,
		retry: false
	}));
	const showPill = $derived(connections.data === 0);
</script>

<div data-testid="agent-pill" class="contents">
	{#if showPill}
		<!-- AgentPill (Go web/settings agentpill.templ): the topbar prompt to
		     connect an agent over MCP. Below sm only the icon fits, and a
		     truncated call to action is worse than none. -->
		<a
			href="/app/settings/connections"
			class="border-hairline text-muted-foreground hover:text-foreground hover:border-border hidden h-8 items-center gap-2 rounded-full border pr-3 pl-1.5 text-xs transition-colors sm:inline-flex"
		>
			<span class="bg-signal text-background rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase">
				{i18n.t('nav.agentpill.new')}
			</span>
			<span class="whitespace-nowrap">{i18n.t('nav.agentpill')}</span>
			<ArrowRightIcon class="size-3.5" />
		</a>
		<a
			href="/app/settings/connections"
			aria-label={i18n.t('nav.agentpill')}
			class="border-hairline text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-full border sm:hidden"
		>
			<PlugIcon class="size-3.5" />
		</a>
	{/if}
</div>
{@render children()}
<NudgeBell />
<AwardsHost />
