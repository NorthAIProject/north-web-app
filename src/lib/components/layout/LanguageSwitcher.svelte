<script lang="ts">
	import { page } from '$app/state';
	import { locales, useI18n } from '#lib/i18n/index.js';

	// Signed-out visitors only: Settings owns a signed-in person's language.
	// A form post rather than a link, because it writes a cookie and a GET
	// that changes state is a GET a prefetcher can fire.
	const i18n = useI18n();

	const labels: Record<string, string> = {
		en: 'English',
		'pt-PT': 'Português (Portugal)',
		'pt-BR': 'Português (Brasil)',
		es: 'Español'
	};
</script>

<!-- No submit on change: arrowing through the list would reload on the first
     keypress. Pick, then press Change (or Enter on it). Each option carries its
     own lang so a screen reader says "Español" in Spanish. -->
<form method="post" action="/locale" class="flex items-center gap-2" data-sveltekit-reload>
	<input type="hidden" name="next" value={page.url.pathname + page.url.search} />
	<label for="footer-locale" class="sr-only">{i18n.t('footer.language')}</label>
	<select
		id="footer-locale"
		name="locale"
		class="h-8 rounded-md border border-hairline bg-surface px-2 text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none pointer-coarse:h-11"
	>
		{#each locales as tag (tag)}
			<option value={tag} lang={tag} selected={tag === i18n.locale}>{labels[tag]}</option>
		{/each}
	</select>
	<button
		type="submit"
		class="h-8 cursor-pointer rounded-md border border-hairline px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none pointer-coarse:h-11"
	>
		{i18n.t('footer.language.go')}
	</button>
</form>
