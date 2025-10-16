<script lang="ts">
	import { goto } from '$app/navigation';
	import type { AuthResponse } from '$lib/auth';
	import Header from '$lib/components/Header.svelte';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		isLoading = true;

		try {
			const response = await fetch('/api/v1/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			const data: AuthResponse = await response.json();

			if (!response.ok) {
				error = data.message || 'Přihlášení se nezdařilo';
				return;
			}

			success = 'Úspěšně přihlášeno! Přesměrování...';
			localStorage.setItem('user', JSON.stringify(data.user));
			
			setTimeout(() => {
				goto('/');
			}, 150);
		} catch (err) {
			error = 'Chyba při komunikaci se serverem';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isLoading) {
			const event = new Event('submit', { cancelable: true });
			(e.target as HTMLFormElement)?.closest('form')?.dispatchEvent(event);
		}
	}
</script>

<Header showLoginButton={false} />

<div class="container">
	<div class="auth-card">
		<a href="/" class="back-button">
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
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			Zpět
		</a>
		<div class="auth-card-content">
			<div class="auth-header">
				<h1>Přihlášení</h1>
				<p>Přihlaste se ke svému účtu</p>
			</div>

			<form onsubmit={handleLogin} class="auth-form">
			{#if error}
				<div class="message error-message">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			{#if success}
				<div class="message success-message">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>{success}</span>
				</div>
			{/if}

			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="vase@email.com"
					required
					disabled={isLoading}
					onkeydown={handleKeydown}
				/>
			</div>

			<div class="form-group">
				<label for="password">Heslo</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Zadejte heslo"
					required
					disabled={isLoading}
					onkeydown={handleKeydown}
				/>
			</div>

			<button type="submit" disabled={isLoading} class="submit-button">
				{#if isLoading}
					<span class="spinner"></span>
					Přihlašuji se...
				{:else}
					Přihlásit se
				{/if}
			</button>
			</form>
		</div>

		<div class="auth-footer">
			<p>Nemáte účet? <a href="/auth/register">Zaregistrujte se</a></p>
		</div>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--color-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.auth-card {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		width: 100%;
		max-width: 400px;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--color-brand-main);
		text-decoration: none;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
		align-self: flex-start;
		padding: 0.875rem 1.5rem;
		border: 2px solid var(--color-brand-main);
		background-color: transparent;
		border-radius: 4px;
		width: fit-content;
	}

	.back-button:hover {
		color: var(--color-brand-main);
		background-color: rgba(10, 47, 131, 0.05);
	}

	.back-button svg {
		width: 20px;
		height: 20px;
	}

	.auth-card-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.auth-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}

	.auth-header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-brand-main);
	}

	.auth-header p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-hover);
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border: 1px solid;
		font-size: 0.875rem;
	}

	.error-message {
		background-color: var(--color-danger-light);
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.success-message {
		background-color: var(--color-success-light);
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.message svg {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.form-group input {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-brand-main);
		box-shadow: 0 0 0 3px rgba(10, 47, 131, 0.1);
	}

	.form-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-button {
		padding: 0.875rem 1rem;
		background-color: var(--color-brand-main);
		color: white;
		border: none;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #081d52;
		box-shadow: 0 4px 12px rgba(10, 47, 131, 0.2);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.auth-footer {
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-hover);
	}

	.auth-footer p {
		margin: 0;
	}

	.auth-footer a {
		color: var(--color-brand-main);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.auth-footer a:hover {
		color: #081d52;
		text-decoration: underline;
	}
</style>
