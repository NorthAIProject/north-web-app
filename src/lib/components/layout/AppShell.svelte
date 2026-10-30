<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import BrandLockup from '#lib/components/brand/BrandLockup.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { buildNav, type NavItem } from '#lib/nav/nav.js';
	import CommandPalette from './CommandPalette.svelte';
	import ShellWidgets from './ShellWidgets.svelte';
	import CrewsUnreadBadge from '#lib/features/crews/CrewsUnreadBadge.svelte';

	// The shell for every signed-in page (Go: layout.App / layout.AppWide).
	// A wide page lays out its own panes edge to edge (a crew's chat): the
	// rail starts collapsed and main does not scroll, so each pane scrolls on
	// its own.
	let {
		user,
		simpleNav = false,
		wide = false,
		children
	}: {
		user: { displayName: string; email: string };
		simpleNav?: boolean;
		wide?: boolean;
		children: Snippet;
	} = $props();

	const i18n = useI18n();
	const nav = $derived(buildNav(i18n, page.data.navActive ?? page.url.pathname, simpleNav));
</script>

<Sidebar.Provider open={!wide} class={wide ? 'h-dvh overflow-hidden' : 'min-h-dvh'}>
	<Sidebar.Root collapsible="icon" id="app-sidebar">
		<Sidebar.Header>
			<BrandLockup
				href="/app"
				markSize="size-6"
				textClass="text-base font-medium tracking-tight group-data-[collapsible=icon]:hidden"
			/>
		</Sidebar.Header>
		<Sidebar.Content>
			{#each nav as group (group.label)}
				{#if group.more}
					<Collapsible.Root open={group.open} data-testid="nav-more">
						<Sidebar.Group>
							<Collapsible.Trigger class="cursor-pointer">
								{#snippet child({ props })}
									<Sidebar.GroupLabel {...props}>
										{group.label}
										<ChevronDownIcon class="ml-auto size-3.5" />
									</Sidebar.GroupLabel>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.Menu>
									{#each group.items as item (item.href)}
										{@render navItem(item)}
									{/each}
								</Sidebar.Menu>
							</Collapsible.Content>
						</Sidebar.Group>
					</Collapsible.Root>
				{:else}
					<Sidebar.Group>
						<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
						<Sidebar.Menu>
							{#each group.items as item (item.href)}
								{@render navItem(item)}
							{/each}
						</Sidebar.Menu>
					</Sidebar.Group>
				{/if}
			{/each}
		</Sidebar.Content>
		<Sidebar.Footer>
			<div class="p-1">
				<div class="mb-2 px-2 group-data-[collapsible=icon]:hidden">
					<p class="truncate text-sm font-medium">{user.displayName}</p>
					<p class="truncate text-xs text-muted-foreground">{user.email}</p>
				</div>
				<!-- A POST rather than a link: a GET that ends a session can be fired by any image tag. -->
				<form method="post" action="/logout">
					<Button type="submit" variant="ghost" size="sm" class="w-full justify-start">
						<LogOutIcon class="size-4" />
						<span class="group-data-[collapsible=icon]:hidden">{i18n.t('layout.signout')}</span>
					</Button>
				</form>
			</div>
		</Sidebar.Footer>
	</Sidebar.Root>
	<Sidebar.Inset class={wide ? 'min-h-0' : ''}>
		<header
			class="flex min-h-14 shrink-0 items-center gap-2 border-b border-border pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]"
		>
			<Sidebar.Trigger class="size-11">
				<PanelLeftIcon class="size-4" />
			</Sidebar.Trigger>
			<span class="md:hidden">
				<BrandLockup href="/app" markSize="size-5" textClass="text-sm font-medium tracking-tight" />
			</span>
			<div class="ml-auto flex min-w-0 items-center gap-2">
				<ShellWidgets>
					<CommandPalette />
				</ShellWidgets>
			</div>
		</header>
		<main class={wide ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto'}>
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

{#snippet navItem(item: NavItem)}
	<Sidebar.MenuItem>
		<!-- Where you are is one of gold's few jobs: a short rule at the edge
		     and the icon, over the raised navy the primitive already paints. -->
		<Sidebar.MenuButton
			isActive={item.active}
			tooltipContent={item.label}
			class="relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary data-[active=true]:[&>svg]:text-sidebar-primary"
		>
			{#snippet child({ props })}
				<a href={item.href} {...props}>
					{#if item.icon}
						<item.icon class="size-4" />
					{/if}
					<span>{item.label}</span>
					{#if item.href === '/app/crews'}
						<!-- Unread crew messages (iOS has the same badge; Go had only the rail dots). -->
						<CrewsUnreadBadge class="ml-auto" />
					{/if}
				</a>
			{/snippet}
		</Sidebar.MenuButton>
		{#if item.children.length && item.active}
			<Sidebar.MenuSub>
				{#each item.children as sub (sub.href + sub.label)}
					<Sidebar.MenuSubItem>
						<Sidebar.MenuSubButton href={sub.href} isActive={sub.active}>
							<span>{sub.label}</span>
						</Sidebar.MenuSubButton>
					</Sidebar.MenuSubItem>
				{/each}
			</Sidebar.MenuSub>
		{/if}
	</Sidebar.MenuItem>
{/snippet}
