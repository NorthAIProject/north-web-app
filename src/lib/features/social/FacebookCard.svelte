<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import PersonRow from './PersonRow.svelte';
	import PostForm from './PostForm.svelte';
	import { facebookNotice, facebookNoticeVariant, peopleFound } from './format.js';
	import type { FacebookFriends } from './types.js';

	// Go: facebookCard and facebookPeople (web/social/finding.templ). result is
	// how the connection the page was opened from ended (?facebook=…).
	let { facebook, result }: { facebook: FacebookFriends; result: string } = $props();
	const i18n = useI18n();
	const notice = $derived(facebookNotice(i18n, result));
</script>

<Card.Root id="facebook" class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('social.fb.title')}</Card.Title>
		<Card.Description>{i18n.t('social.fb.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-4">
			{#if notice}
				<Alert.Root variant={facebookNoticeVariant(result)}>
					<Alert.Description>{notice}</Alert.Description>
				</Alert.Root>
			{/if}
			{#if facebook.connected}
				{#if !facebook.importedAt}
					<p class="text-sm text-muted-foreground">{i18n.t('social.fb.connected')}</p>
				{:else if facebook.people.length === 0}
					<p class="text-sm text-muted-foreground">{i18n.t('social.fb.none')}</p>
				{:else}
					<ul class="divide-y divide-hairline">
						{#each facebook.people as c (c.id)}
							<PersonRow person={c}>
								{#if c.following === ''}
									<!-- Every match has a handle: having one is what made them findable. -->
									<PostForm action="/app/friends?/follow" fields={{ follow: c.handle }}>
										<Button type="submit" size="sm">{i18n.t('social.follow.ask')}</Button>
									</PostForm>
								{:else if c.following === 'accepted'}
									<Badge variant="secondary">{i18n.t('social.fb.following')}</Badge>
								{/if}
							</PersonRow>
						{/each}
					</ul>
					<p class="text-xs text-muted-foreground">{peopleFound(i18n, facebook.people.length)}</p>
				{/if}
			{/if}
			<div class="flex flex-wrap gap-2">
				{#if facebook.configured}
					<!-- A full navigation: the connect route redirects to Facebook. -->
					<Button
						href="/app/friends/facebook/connect"
						variant="outline"
						size="sm"
						data-sveltekit-reload
					>
						{facebook.connected ? i18n.t('social.fb.find') : i18n.t('social.fb.connect')}
					</Button>
				{/if}
				{#if facebook.connected}
					<PostForm action="/app/friends?/facebookDisconnect">
						<Button type="submit" variant="ghost" size="sm">{i18n.t('social.fb.disconnect')}</Button
						>
					</PostForm>
				{/if}
			</div>
		</div>
	</Card.Content>
</Card.Root>
