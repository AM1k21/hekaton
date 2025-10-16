<script lang="ts">
	interface User {
		id: string;
		email: string;
	}

	interface HeaderProps {
		showLoginButton?: boolean;
	}

	let { showLoginButton = true } = $props();
	let user: User | null = $state(null);

	if (typeof window !== 'undefined') {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			user = JSON.parse(storedUser);
		}
	}

	function handleLogout() {
		localStorage.removeItem('user');
		user = null;
		window.location.href = '/';
	}
</script>

<header class="header">
	<div class="header-content">
		<a href="/" class="header-left">
			<img
				src="https://www.khk.cz/themes/khk/assets/img/RGB_maxzoom-jednoradkove-color-rgb.svg"
				alt="Královéhradecký kraj"
				class="logo"
			/>
			<div class="header-text">
				<h1 class="title">Úřední deska</h1>
				<p class="subtitle">Královéhradecký kraj</p>
			</div>
		</a>
		{#if showLoginButton && !user}
			<nav class="header-nav">
				<a href="/auth/login" class="nav-button">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					<span>Přihlásit se</span>
				</a>
			</nav>
		{:else if user}
			<nav class="header-nav">
				<a href="/account" class="nav-button" title={user.email}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					<span>{user.email.split('@')[0]}</span>
				</a>
			</nav>
		{/if}
	</div>
</header>

<style>
	.header {
		background-color: var(--color-surface);
		border-bottom: 2px solid var(--color-brand-main);
		padding: 1rem;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.header-left:hover {
		opacity: 0.8;
	}

	.logo {
		height: 48px;
		width: auto;
		flex-shrink: 0;
	}

	.header-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-brand-main);
		margin: 0;
		line-height: 1.2;
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--color-text-hover);
		margin: 0;
		line-height: 1.2;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background-color: var(--color-surface);
		color: var(--color-brand-main);
		border: 1px solid var(--color-brand-main);
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		text-decoration: none;
	}

	.nav-button:hover {
		background-color: var(--color-brand-main);
		color: var(--color-surface);
	}

	.nav-button svg {
		width: 20px;
		height: 20px;
	}

	@media (max-width: 768px) {
		.header {
			padding: 0.875rem 0.75rem;
		}

		.header-content {
			gap: 0.75rem;
		}

		.header-left {
			gap: 0.75rem;
		}

		.logo {
			height: 40px;
		}

		.title {
			font-size: 1.125rem;
		}

		.subtitle {
			font-size: 0.75rem;
		}

		.nav-button span {
			display: none;
		}

		.nav-button {
			padding: 0.625rem;
		}
	}

	@media (max-width: 480px) {
		.header-text {
			display: none;
		}

		.title {
			font-size: 1rem;
		}
	}
</style>
