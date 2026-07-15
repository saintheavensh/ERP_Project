<script lang="ts">
	import "../app.css";
	import { Toaster } from "$lib/shared/components/ui/sonner";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";
	import { useWebSocket } from "$lib/shared/lib/websocket.svelte";
	import { authStore } from "$lib/shared/lib/auth-store.svelte";

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 5 * 1000,
			},
		},
	});

	const { connect } = useWebSocket();

	// Gate: only run init once per app lifecycle to prevent re-trigger loops
	let hasInitialized = false;

	// Auth Guard & Initialization
	$effect(() => {
		if (browser && !hasInitialized) {
			hasInitialized = true;

			const init = async () => {
				const path = $page.url.pathname;
				const isLoginPage = path.startsWith("/login");
				const isPublicPage =
					path === "/" ||
					path.startsWith("/warranty") ||
					path.startsWith("/ticket");

				// Safety timeout: If checkAuth takes more than 5s, force hide loading
				const timeout = setTimeout(() => {
					if (authStore.loading) {
						authStore.loading = false;
					}
				}, 5000);

				await authStore.checkAuth();
				clearTimeout(timeout);

				// If no user and not a public/login page, redirect to login
				if (
					!authStore.isAuthenticated &&
					!isLoginPage &&
					!isPublicPage
				) {
					window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
					return;
				}

				// If user exists and on login page, redirect to their role-specific page
				if (authStore.isAuthenticated && isLoginPage) {
					window.location.href = authStore.getRedirectPath();
					return;
				}

				// Connect to Realtime if user is logged in
				if (authStore.isAuthenticated && authStore.user) {
					connect(authStore.user.id);
				}
			};

			init();
		}
	});

	const isLoginPage = $derived($page.url.pathname.startsWith("/login"));
	const isPublicPage = $derived(
		$page.url.pathname === "/" ||
			$page.url.pathname.startsWith("/warranty") ||
			$page.url.pathname.startsWith("/ticket"),
	);
</script>

<QueryClientProvider client={queryClient}>
	{#if authStore.loading && !isLoginPage && !isPublicPage}
		<div
			class="flex h-screen w-screen items-center justify-center bg-slate-950"
		>
			<div class="flex flex-col items-center gap-4">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-[0_0_15px_rgba(37,99,235,0.3)]"
				></div>
				<p
					class="text-slate-400 font-medium tracking-widest uppercase text-[10px]"
				>
					Verifying Session
				</p>
			</div>
		</div>
	{:else}
		{@render children()}
	{/if}
	<Toaster />
</QueryClientProvider>
