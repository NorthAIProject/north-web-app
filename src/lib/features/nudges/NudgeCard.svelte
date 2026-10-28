<!-- The overview's list of open coach notes (Go web/nudges Card). Nothing when there are none. -->
<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	let { nudges }: { nudges: { id: string; title: string; body: string; href: string }[] } = $props();
	const i18n = useI18n();
</script>

{#if nudges.length > 0}
	<Card.Root data-testid="nudge-card">
		<Card.Header>
			<Card.Title>{i18n.t('nudges.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="space-y-3">
				{#each nudges as n (n.id)}
					<li>
						<a href={n.href} class="hover:text-foreground block text-sm font-medium">{n.title}</a>
						<p class="text-muted-foreground mt-0.5 text-sm">{n.body}</p>
					</li>
				{/each}
			</ul>
		</Card.Content>
	</Card.Root>
{/if}
