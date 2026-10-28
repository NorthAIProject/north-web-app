<!-- Go: nutrition.planNotes — an imported file's advice and recipes, as written. -->
<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';

	let { notes, title, description }: { notes: string; title: string; description: string } = $props();
</script>

<Card.Root class="border-hairline bg-surface">
	<Collapsible.Root>
		<Collapsible.Trigger class="w-full cursor-pointer text-left">
			<Card.Header>
				<Card.Title>{title}</Card.Title>
				<Card.Description>{description}</Card.Description>
			</Card.Header>
		</Collapsible.Trigger>
		<Collapsible.Content>
			<Card.Content>
				<p class="text-muted-foreground text-sm whitespace-pre-wrap">{notes}</p>
			</Card.Content>
		</Collapsible.Content>
	</Collapsible.Root>
</Card.Root>
