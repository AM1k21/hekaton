<script lang="ts">
	import { goto } from '$app/navigation';
	import type { AuthResponse } from '$lib/auth';
	import Header from '$lib/components/Header.svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';
		success = '';

		// Client-side validation
		if (password !== confirmPassword) {
			error = 'Hesla se neshodují';
			return;
		}

		if (password.length < 6) {
			error = 'Heslo musí mít alespoň 6 znaků';
			return;
		}

		isLoading = true;

		try {
			const response = await fetch('/api/v1/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			const data: AuthResponse = await response.json();

			if (!response.ok) {
				error = data.message || 'Registrace se nezdařila';
				return;
			}

			success = 'Účet úspěšně vytvořen! Přesměrování na přihlášení...';
			localStorage.setItem('user', JSON.stringify(data.user));
			
			setTimeout(() => {
				goto('/auth/login');
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

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			history.back();
		} else {
			window.location.href = '/';
		}
	}
</script>

<Header showLoginButton={false} />

<div class="wrapper">
	<div class="back-button-container">
		<button onclick={goBack} class="back-button-inline">
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
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
			<span>Zpět na přehled</span>
		</button>
	</div>

	<div class="container">
		<div class="auth-card">
			<div class="auth-card-content">
				<div class="auth-header">
				<h1>Registrace</h1>
				<p>Vytvořte si nový účet</p>
			</div>

			<form onsubmit={handleRegister} class="auth-form">
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
					placeholder="Alespoň 6 znaků"
					required
					disabled={isLoading}
					onkeydown={handleKeydown}
				/>
				<span class="hint">Heslo musí mít alespoň 6 znaků</span>
			</div>

			<div class="form-group">
				<label for="confirmPassword">Potvrzení hesla</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					placeholder="Zopakujte heslo"
					required
					disabled={isLoading}
					onkeydown={handleKeydown}
				/>
			</div>

			<button type="submit" disabled={isLoading} class="submit-button">
				{#if isLoading}
					<span class="spinner"></span>
					Registruju...
				{:else}
					Zaregistrovat se
				{/if}
			</button>
			</form>
		</div>

		<div class="auth-footer">
			<p>Již máte účet? <a href="/auth/login">Přihlaste se</a></p>
		</div>
		</div>
	</div>
</div>

<style>
	.wrapper {
		min-height: 100vh;
		background-color: var(--color-bg);
		position: relative;
	}

	.back-button-container {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		z-index: 1;
	}

	.container {
		min-height: 100vh;
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

	.back-button-inline {
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
		width: fit-content;
		text-decoration: none;
		margin-bottom: 1.5rem;
	}

	.back-button-inline:hover {
		background-color: var(--color-brand-main);
		color: var(--color-surface);
	}

	.back-button-inline svg {
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

	.hint {
		font-size: 0.75rem;
		color: var(--color-text-hover);
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

	@media (max-width: 768px) {
		.back-button-container {
			top: 1rem;
			left: 1rem;
		}

		.back-button-inline span {
			display: none;
		}

		.back-button-inline {
			padding: 0.625rem;
		}
	}
</style>
