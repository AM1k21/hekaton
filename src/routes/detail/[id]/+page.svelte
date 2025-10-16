<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	let summaryState: 'loading' | 'loaded' | 'error' = $state('loading');
	let summary: string = $state('');
	let summaryError: string = $state('');

	onMount(async () => {
		if (data.item) {
			try {
				const response = await fetch('/api/v1/gemini/summary', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data.item)
				});

				if (!response.ok) {
					throw new Error('Failed to fetch summary');
				}

				const result = await response.json();
				if (result.status === 'ok' && result.summary) {
					summary = result.summary;
					summaryState = 'loaded';
				} else {
					throw new Error('Invalid response format');
				}
			} catch (error) {
				console.error('Error loading summary:', error);
				summaryError = 'AI shrnutí je momentálně nedostupné. Zkuste to prosím později.';
				summaryState = 'error';
			}
		} else {
			summaryError = 'Nenalezena data pro vytvoření shrnutí';
			summaryState = 'error';
		}
	});

	function formatDate(dateString: string | null) {
		if (!dateString) return 'Neurčeno';
		const date = new Date(dateString);
		return date.toLocaleDateString('cs-CZ', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatDateTime(dateString: string | null) {
		if (!dateString) return 'Neurčeno';
		const date = new Date(dateString);
		return date.toLocaleDateString('cs-CZ', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Kontrola platnosti
	function isExpired(dateString: string | null) {
		if (!dateString) return false;
		const date = new Date(dateString);
		return date < new Date();
	}

	// Spočítej dny do konce platnosti
	function daysUntilExpiry(dateString: string | null) {
		if (!dateString) return null;
		const date = new Date(dateString);
		const today = new Date();
		const diffTime = date.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			history.back();
		} else {
			window.location.href = '/';
		}
	}
</script>

<Header />

<div class="container">
	<!-- Main content -->
	<main class="main">
		<!-- Back button -->
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

		{#if data.error}
			<div class="error-card">
				<h2>Chyba</h2>
				<p>{data.error}</p>
								<button onclick={goBack} class="primary-button">Zpět na přehled</button>
			</div>
		{:else if data.item}
			<article class="detail-card">
				<!-- Status bar -->
				<div class="status-bar" class:expired={isExpired(data.item.relevantniDo)}>
					<span class="category-badge">{data.item.category}</span>
					{#if isExpired(data.item.relevantniDo)}
						<span class="status-badge expired-badge">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<path d="m15 9-6 6m0-6 6 6"></path>
							</svg>
							Vypršelo
						</span>
					{:else if daysUntilExpiry(data.item.relevantniDo) !== null && daysUntilExpiry(data.item.relevantniDo)! <= 7}
						<span class="status-badge warning-badge">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
								></path>
								<path d="M12 9v4m0 4h.01"></path>
							</svg>
							Vyprší za {daysUntilExpiry(data.item.relevantniDo)} {daysUntilExpiry(
								data.item.relevantniDo
							) === 1
								? 'den'
								: daysUntilExpiry(data.item.relevantniDo)! <= 4
									? 'dny'
									: 'dní'}
						</span>
					{:else}
						<span class="status-badge active-badge">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
								<path d="M22 4 12 14.01l-3-3"></path>
							</svg>
							Aktivní
						</span>
					{/if}
				</div>

				<!-- Title -->
				<h1 class="detail-title">{data.item.nazev}</h1>

				<!-- Meta information -->
				<div class="meta-grid">
					<div class="meta-item">
						<div class="meta-icon">
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
								<rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
								<line x1="16" x2="16" y1="2" y2="6"></line>
								<line x1="8" x2="8" y1="2" y2="6"></line>
								<line x1="3" x2="21" y1="10" y2="10"></line>
							</svg>
						</div>
						<div class="meta-content">
							<span class="meta-label">Datum vyvěšení</span>
							<span class="meta-value">{formatDate(data.item.vyveseni)}</span>
						</div>
					</div>

					{#if data.item.relevantniDo}
						<div class="meta-item">
							<div class="meta-icon">
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
									<circle cx="12" cy="12" r="10"></circle>
									<polyline points="12 6 12 12 16 14"></polyline>
								</svg>
							</div>
							<div class="meta-content">
								<span class="meta-label">Relevantní do</span>
								<span class="meta-value">{formatDate(data.item.relevantniDo)}</span>
							</div>
						</div>
					{/if}

					<div class="meta-item">
						<div class="meta-icon">
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
								<path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
								<path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path>
								<path d="M12 3v6"></path>
							</svg>
						</div>
						<div class="meta-content">
							<span class="meta-label">Kategorie</span>
							<span class="meta-value">{data.item.category}</span>
						</div>
					</div>
				</div>

				<!-- AI Summary -->
				<div class="ai-summary" class:loading={summaryState === 'loading'} class:error={summaryState === 'error'}>
					<div class="summary-header">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 8V4H8"></path>
							<rect width="16" height="12" x="4" y="8" rx="2"></rect>
							<path d="M2 14h2"></path>
							<path d="M20 14h2"></path>
							<path d="M15 13v2"></path>
							<path d="M9 13v2"></path>
						</svg>
						<h3>AI Shrnutí</h3>
					</div>
					
					{#if summaryState === 'loading'}
						<div class="summary-loading">
							<div class="spinner"></div>
							<p>Generuji AI shrnutí...</p>
						</div>
					{:else if summaryState === 'error'}
						<p class="summary-error">
							{summaryError || 'Nepodařilo se načíst AI shrnutí'}
						</p>
					{:else if summaryState === 'loaded'}
						<div class="summary-content">
							{@html summary}
						</div>
					{/if}
				</div>

				<!-- Action button -->
				<div class="actions">
					<a href={data.item.url} target="_blank" rel="noopener noreferrer" class="primary-button">
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
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
							<polyline points="15 3 21 3 21 9"></polyline>
							<line x1="10" x2="21" y1="14" y2="3"></line>
						</svg>
						Zobrazit oznámení na úřední desce
					</a>
				</div>

				<!-- Documents -->
				{#if data.item.dokumenty && data.item.dokumenty.length > 0}
					{#each data.item.dokumenty as dokument, index (dokument.url || index)}
						<a
							href={dokument.url}
							target="_blank"
							rel="noopener noreferrer"
							class="document-card"
						>
							<div class="document-icon" 
								class:pdf={dokument.url.toLowerCase().endsWith('.pdf')}
								class:docx={dokument.url.toLowerCase().endsWith('.docx') || dokument.url.toLowerCase().endsWith('.doc')}
								class:xlsx={dokument.url.toLowerCase().endsWith('.xlsx')}
							>
								{#if dokument.url.toLowerCase().endsWith('.pdf')}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14 2 14 8 20 8"></polyline>
										<line x1="16" x2="8" y1="13" y2="13"></line>
										<line x1="16" x2="8" y1="17" y2="17"></line>
										<polyline points="10 9 9 9 8 9"></polyline>
									</svg>
									<span class="file-type-badge pdf">PDF</span>
								{:else if dokument.url.toLowerCase().endsWith('.docx') || dokument.url.toLowerCase().endsWith('.doc')}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14 2 14 8 20 8"></polyline>
										<line x1="16" x2="8" y1="13" y2="13"></line>
										<line x1="16" x2="8" y1="17" y2="17"></line>
										<polyline points="10 9 9 9 8 9"></polyline>
									</svg>
									<span class="file-type-badge docx">{dokument.url.toLowerCase().endsWith('.docx') ? 'DOCX' : 'DOC'}</span>
								{:else if dokument.url.toLowerCase().endsWith('.xlsx')}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14 2 14 8 20 8"></polyline>
										<rect x="8" y="12" width="8" height="7" rx="1"></rect>
										<line x1="12" x2="12" y1="12" y2="19"></line>
										<line x1="8" x2="16" y1="15" y2="15"></line>
									</svg>
									<span class="file-type-badge xlsx">XLSX</span>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14 2 14 8 20 8"></polyline>
									</svg>
								{/if}
							</div>
							<div class="document-content">
								<span class="document-name">{dokument.nazev}</span>
								{#if dokument.typ}
									<span class="document-type">{dokument.typ}</span>
								{/if}
							</div>
							<div class="document-arrow">
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
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
									<polyline points="15 3 21 3 21 9"></polyline>
									<line x1="10" x2="21" y1="14" y2="3"></line>
								</svg>
							</div>
						</a>
					{/each}
				{/if}

				<!-- Additional info -->
				<div class="info-section">
					<h3 class="info-title">Informace o dokumentu</h3>
					<p class="info-text">
						Tento dokument byl zveřejněn na úřední desce Královéhradeckého kraje. Pro úplné
						informace klikněte na tlačítko výše pro zobrazení původního
						dokumentu.
					</p>
				</div>
			</article>
		{/if}
	</main>
</div>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--color-bg);
	}

	.main {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
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
		margin-bottom: 1.5rem;
		width: fit-content;
		text-decoration: none;
	}

	.back-button-inline:hover {
		background-color: var(--color-brand-main);
		color: var(--color-surface);
	}

	.back-button-inline svg {
		width: 20px;
		height: 20px;
	}

	.error-card {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: var(--padding-card-lg);
		text-align: center;
	}

	.error-card h2 {
		color: var(--color-danger);
		margin-bottom: 1rem;
	}

	.error-card p {
		margin-bottom: 1.5rem;
		color: var(--color-text);
	}

	.detail-card {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: var(--padding-card-lg);
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.detail-card > .document-card:not(:first-of-type) {
		margin-top: -1rem;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.status-bar.expired {
		opacity: 0.7;
	}

	.category-badge {
		font-size: 0.75rem;
		color: var(--color-brand-main);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.375rem 0.75rem;
		background-color: rgba(10, 47, 131, 0.1);
		border: 1px solid var(--color-brand-main);
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.375rem 0.75rem;
		border: 1px solid;
	}

	.active-badge {
		color: var(--color-success);
		background-color: var(--color-success-light);
		border-color: var(--color-success);
	}

	.warning-badge {
		color: var(--color-warning);
		background-color: var(--color-warning-light);
		border-color: var(--color-warning);
	}

	.expired-badge {
		color: var(--color-danger);
		background-color: var(--color-danger-light);
		border-color: var(--color-danger);
	}

	.detail-title {
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.3;
		color: var(--color-text);
		margin: 0;
	}

	.meta-grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 640px) {
		.meta-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.meta-item {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.meta-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(10, 47, 131, 0.1);
		color: var(--color-brand-main);
		border: 1px solid var(--color-brand-main);
	}

	.meta-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-label {
		font-size: 0.875rem;
		color: var(--color-text-hover);
		font-weight: 500;
	}

	.meta-value {
		font-size: 1rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.ai-summary {
		padding: 1.5rem;
		background-color: rgba(10, 47, 131, 0.05);
		border: 1px solid var(--color-brand-main);
	}

	.ai-summary.loading {
		background-color: rgba(59, 130, 246, 0.05);
		border-color: var(--color-info);
	}

	.ai-summary.error {
		background-color: rgba(220, 38, 38, 0.05);
		border-color: var(--color-danger);
	}

	.summary-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		color: var(--color-brand-main);
	}

	.ai-summary.loading .summary-header {
		color: var(--color-info);
	}

	.ai-summary.error .summary-header {
		color: var(--color-danger);
	}

	.summary-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.summary-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(59, 130, 246, 0.2);
		border-top-color: var(--color-info);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.summary-loading p {
		color: var(--color-text);
		font-size: 0.9375rem;
		margin: 0;
	}

	.summary-error {
		color: var(--color-danger);
		line-height: 1.6;
		margin: 0;
	}

	.summary-content {
		color: var(--color-text);
		line-height: 1.6;
	}

	.summary-content :global(p) {
		margin: 0 0 1rem 0;
	}

	.summary-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.summary-content :global(strong) {
		font-weight: 600;
		color: var(--color-brand-main);
	}

	.summary-content :global(ul),
	.summary-content :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.summary-content :global(li) {
		margin: 0.25rem 0;
	}

	.actions {
		display: flex;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.primary-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background-color: var(--color-brand-main);
		color: var(--color-surface);
		border: none;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		text-decoration: none;
		width: 100%;
	}

	.primary-button:hover {
		background-color: #082469;
		box-shadow: 0 4px 12px rgba(10, 47, 131, 0.2);
	}

	.primary-button svg {
		width: 20px;
		height: 20px;
	}

	.info-section {
		padding: 1.5rem;
		background-color: var(--color-hover);
		border-left: 3px solid var(--color-brand-main);
	}

	.info-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-brand-main);
		margin: 0 0 0.75rem 0;
	}

	.info-text {
		font-size: 0.9375rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	.document-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.document-card:hover {
		background-color: var(--color-hover);
		border-color: var(--color-brand-main);
		box-shadow: 0 2px 8px rgba(10, 47, 131, 0.1);
	}

	.document-icon {
		position: relative;
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(220, 38, 55, 0.1);
		color: var(--color-brand-secondary);
		border: 1px solid var(--color-brand-secondary);
	}

	.document-icon.pdf {
		background-color: rgba(220, 38, 55, 0.1);
		color: var(--color-brand-secondary);
		border-color: var(--color-brand-secondary);
	}

	.document-icon.docx {
		background-color: rgba(33, 102, 191, 0.1);
		color: #2166bf;
		border-color: #2166bf;
	}

	.document-icon.xlsx {
		background-color: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border-color: #10b981;
	}

	.file-type-badge {
		position: absolute;
		bottom: -6px;
		right: -6px;
		background-color: var(--color-brand-secondary);
		color: var(--color-surface);
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.125rem 0.375rem;
		letter-spacing: 0.05em;
	}

	.file-type-badge.pdf {
		background-color: var(--color-brand-secondary);
	}

	.file-type-badge.docx {
		background-color: #2166bf;
	}

	.file-type-badge.xlsx {
		background-color: #10b981;
	}

	.document-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.document-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.document-type {
		font-size: 0.8125rem;
		color: var(--color-text-hover);
	}

	.document-arrow {
		flex-shrink: 0;
		color: var(--color-brand-main);
		transition: transform 0.2s ease;
	}

	.document-card:hover .document-arrow {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.back-button-inline span {
			display: none;
		}

		.back-button-inline {
			padding: 0.625rem;
			margin-bottom: 1rem;
		}

		.main {
			padding: 1.5rem 0.75rem;
		}

		.detail-card {
			padding: 1.5rem 1rem;
			gap: 1.5rem;
		}

		.detail-title {
			font-size: 1.375rem;
		}

		.meta-grid {
			gap: 1rem;
		}

		.ai-summary {
			padding: 1rem;
		}

		.document-card {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.document-icon {
			width: 48px;
			height: 48px;
		}

		.document-icon svg {
			width: 24px;
			height: 24px;
		}

		.document-name {
			font-size: 0.875rem;
		}

		.document-type {
			font-size: 0.75rem;
		}

		.document-arrow svg {
			width: 18px;
			height: 18px;
		}
	}
</style>
