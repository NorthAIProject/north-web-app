<script lang="ts">
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: crews JoinPage (web/crews/crews.templ), in layout.Auth.
	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<AuthShell title={i18n.tf('crews.join.title', data.name)}>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.tf('crews.join.heading', data.name)}</Card.Title>
			<Card.Description>
				{data.members === 1
					? i18n.t('crews.join.desc.one')
					: i18n.tf('crews.join.desc.many', data.members)}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-2">
				<Button href="/signup" class="w-full">{i18n.t('crews.join.signup')}</Button>
				<Button href="/login" variant="ghost" class="w-full">{i18n.t('crews.join.login')}</Button>
			</div>
		</Card.Content>
	</Card.Root>
</AuthShell>
