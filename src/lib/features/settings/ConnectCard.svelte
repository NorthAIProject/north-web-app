<!--
	The tabbed manual setup: pick the agent, read exactly what you will paste
	(with a placeholder where the key goes), then create the key last (Go:
	settings.connectCard, hostedTabs, agentPanel, selfHostedPanel).
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import BrandIcon from './BrandIcon.svelte';
	import CopyBlock from './CopyBlock.svelte';
	import FieldDescription from './FieldDescription.svelte';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import type { FieldErrors } from './form.js';
	import type { ConnectionSetup } from './types.js';

	let {
		previews,
		kind = '',
		name = '',
		errors = {}
	}: { previews: ConnectionSetup[]; kind?: string; name?: string; errors?: FieldErrors } = $props();

	const i18n = useI18n();

	let surface = $state('hosted');
	// The kind just submitted when it came back with errors, else the first.
	let agent = $derived(kind || previews[0]?.kind || '');
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('conn.connect.title')}</Card.Title>
		<Card.Description>{i18n.t('conn.connect.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<Tabs.Root bind:value={surface}>
			<Tabs.List class="w-full">
				<Tabs.Trigger value="hosted">{i18n.t('conn.connect.this')}</Tabs.Trigger>
				<Tabs.Trigger value="self">{i18n.t('conn.connect.selfhosted')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="hosted" class="pt-4">
				<Tabs.Root bind:value={agent}>
					<Tabs.List class="w-full">
						{#each previews as p (p.kind)}
							<Tabs.Trigger value={p.kind ?? ''}>
								<span class="[&_svg]:size-4"><BrandIcon name={p.kind ?? ''} /></span>
								{p.kindLabel}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
					{#each previews as p (p.kind)}
						<Tabs.Content value={p.kind ?? ''} class="pt-4">
							<div class="space-y-5">
								<CopyBlock heading={p.configLabel ?? ''} id="preview-config-{p.kind}" lang={p.configLang ?? ''} body={p.config ?? ''} />
								{#if p.safe}
									<div>
										<p class="text-muted-foreground mb-2 text-sm leading-relaxed">{p.safeNote}</p>
										<CopyBlock heading={p.safeLabel ?? ''} id="preview-safe-{p.kind}" lang={p.safeLang ?? ''} body={p.safe} />
									</div>
								{/if}
								<div>
									<p class="text-muted-foreground mb-2 text-sm leading-relaxed">{i18n.t('conn.connect.handoff')}</p>
									<CopyBlock
										heading={i18n.t('settings.conn.setup.prompt')}
										id="preview-prompt-{p.kind}"
										lang="text"
										body={p.prompt ?? ''}
									/>
								</div>
								<form
									method="post"
									action="?/create"
									class="border-hairline space-y-4 border-t pt-5"
									use:enhance={withInvalidFocus(() => async ({ update }) => update({ reset: false }))}
								>
									<!-- The tab is the choice: picking the client and creating the key are one action. -->
									<input type="hidden" name="client_kind" value={p.kind} />
									<div class="space-y-2">
										<Label for="name-{p.kind}">{i18n.t('conn.name')}</Label>
										<Input
											id="name-{p.kind}"
											name="name"
											value={name}
											required
											placeholder={i18n.t('conn.name.ph')}
											aria-invalid={errors.name ? true : undefined}
											aria-describedby={describedBy(`name-${p.kind}`, errors.name)}
										/>
										<FieldMessage id="name-{p.kind}" error={errors.name} />
										<FieldDescription>{i18n.t('conn.name.desc')}</FieldDescription>
									</div>
									<Button type="submit">
										{i18n.tf('conn.connect.create', p.kindLabel ?? '')}
									</Button>
								</form>
							</div>
						</Tabs.Content>
					{/each}
				</Tabs.Root>
			</Tabs.Content>
			<Tabs.Content value="self" class="pt-4">
				<!-- The standalone MCP binary issues nothing: it acts with a token from its own environment. -->
				<div class="space-y-4 text-sm leading-relaxed">
					<p class="text-muted-foreground">
						{i18n.t('settings.conn.self.intro.before')}<code class="font-mono">cmd/mcp-server</code>{i18n.t(
							'settings.conn.self.intro.after'
						)}
					</p>
					<ul class="text-muted-foreground list-disc space-y-1.5 pl-5">
						<li>
							{i18n.t('settings.conn.self.cred.before')} <code class="font-mono">MCP_API_TOKEN</code>
							{i18n.t('settings.conn.self.cred.after')}
						</li>
						<li>
							{i18n.t('settings.conn.self.acts.before')} <code class="font-mono">MCP_USER_ID</code>{i18n.t(
								'settings.conn.self.acts.after'
							)}
						</li>
						<li>{i18n.t('settings.conn.self.revoke')}</li>
						<li>
							{i18n.t('settings.conn.self.listen.before')} <code class="font-mono">MCP_LISTEN_ADDR</code> —
							<code class="font-mono">127.0.0.1:8093</code>
							{i18n.t('settings.conn.self.listen.after')}
						</li>
					</ul>
					<p class="text-muted-foreground">{i18n.t('conn.hosted')}</p>
				</div>
			</Tabs.Content>
		</Tabs.Root>
		<noscript>
			<div class="mt-4 space-y-6">
				<p class="text-muted-foreground text-sm leading-relaxed">{i18n.t('conn.connect.nojs')}</p>
				{#each previews as p (p.kind)}
					<div>
						<h3 class="mb-2 text-sm font-medium">{p.kindLabel}</h3>
						<CopyBlock heading={p.configLabel ?? ''} id="noscript-{p.kind}" lang={p.configLang ?? ''} body={p.config ?? ''} />
					</div>
				{/each}
			</div>
		</noscript>
	</Card.Content>
</Card.Root>
