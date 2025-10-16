<script lang="ts">
	import Header from '$lib/components/Header.svelte';

	let { data } = $props();

	// Stavy pro vyhledávání a filtraci
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let showExpired = $state(false);

	// Filtrované položky
	let filteredItems = $derived.by(() => {
		if (!data.items) return [];
		
		return data.items.filter((item: any) => {
			// Filtr podle vyhledávání
			const matchesSearch = searchQuery === '' || 
				item.nazev.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.okruh.toLowerCase().includes(searchQuery.toLowerCase());
			
			// Filtr podle kategorie
			const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
			
			// Filtr podle platnosti
			const matchesExpired = showExpired || !isExpired(item.relevantniDo);
			
			return matchesSearch && matchesCategory && matchesExpired;
		});
	});

	// Formátování data
	function formatDate(dateString: string | null) {
		if (!dateString) return 'Neurčeno';
		const date = new Date(dateString);
		return date.toLocaleDateString('cs-CZ', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	// Kontrola platnosti
	function isExpired(dateString: string | null) {
		if (!dateString) return false;
		const date = new Date(dateString);
		return date < new Date();
	}

	// Reset filtrů
	function resetFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		showExpired = false;
	}
</script>

<Header />

<div class="container">
	<!-- Main content -->
	<main class="main">
		{#if data.error}
			<div class="error-message">
				<p>{data.error}</p>
			</div>
		{:else if data.items && data.items.length > 0}
			<!-- Search and Filter Section -->
			<div class="filter-section">
				<div class="search-row">
					<div class="search-bar">
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
							class="search-icon"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<path d="m21 21-4.3-4.3"></path>
						</svg>
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Hledat v oznámeních..."
							class="search-input"
							/>
						{#if searchQuery}
							<button
								onclick={() => (searchQuery = '')}
								class="clear-button"
								aria-label="Vymazat hledání"
							>
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
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
							</button>
						{/if}
					</div>

					<a href="/mapa" class="map-button">
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
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
							<circle cx="12" cy="10" r="3"></circle>
						</svg>
						<span>Zobrazit mapu</span>
					</a>
				</div>

				<div class="filters">
					<div class="filter-group">
						<label for="category-select" class="filter-label">Kategorie:</label>
						<select id="category-select" bind:value={selectedCategory} class="filter-select">
							<option value="all">Všechny kategorie</option>
							{#each data.categories as category}
								<option value={category.value}>{category.label}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={showExpired} class="filter-checkbox" />
							<span>Zobrazit neaktuální</span>
						</label>
					</div>

					{#if searchQuery || selectedCategory !== 'all' || showExpired}
						<button onclick={resetFilters} class="reset-button">
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
								<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
								<path d="M21 3v5h-5"></path>
								<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
								<path d="M3 21v-5h5"></path>
							</svg>
							Resetovat filtry
						</button>
					{/if}
				</div>

				<div class="results-count">
					Zobrazeno <strong>{filteredItems.length}</strong> z <strong>{data.items.length}</strong> oznámení
				</div>
			</div>

			{#if filteredItems.length > 0}
				<div class="items-grid">
					{#each filteredItems as item, index}
						<a
							href="/detail/{item.id}"
							class="item-card"
							class:expired={isExpired(item.relevantniDo)}
						>
							<div class="item-header">
								<span class="item-category">{item.category}</span>
								{#if isExpired(item.relevantniDo)}
									<span class="expired-badge">Neaktuální</span>
								{/if}
							</div>

							<h2 class="item-title">{item.nazev}</h2>

							<div class="item-footer">
								<div class="item-dates">
									<div class="date-item">
										<span class="date-label">Vyvěšeno:</span>
										<span class="date-value">{formatDate(item.vyveseni)}</span>
									</div>
									{#if item.relevantniDo}
										<div class="date-item">
											<span class="date-label">Relevantní do:</span>
											<span class="date-value">{formatDate(item.relevantniDo)}</span>
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="no-results">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="48"
						height="48"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.3-4.3"></path>
					</svg>
					<h3>Žádné výsledky</h3>
					<p>Pro zadané filtry nebyla nalezena žádná oznámení.</p>
					<button onclick={resetFilters} class="reset-button">Resetovat filtry</button>
				</div>
			{/if}
		{:else}
			<div class="empty-state">
				<p>Zatím nejsou k dispozici žádné novinky.</p>
			</div>
		{/if}
	</main>
</div>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--color-bg);
	}

	.main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.filter-section {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: var(--padding-card-md);
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.search-row {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.search-bar {
		position: relative;
		display: flex;
		align-items: center;
		flex: 1;
	}

	.map-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: var(--color-brand-main);
		color: var(--color-surface);
		border: none;
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		text-decoration: none;
		white-space: nowrap;
	}

	.map-button:hover {
		background-color: #082469;
		box-shadow: 0 2px 8px rgba(10, 47, 131, 0.2);
	}

	.map-button svg {
		flex-shrink: 0;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		color: var(--color-text-hover);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-brand-main);
	}

	.search-input::placeholder {
		color: var(--color-text-hover);
	}

	.clear-button {
		position: absolute;
		right: 0.75rem;
		padding: 0.25rem;
		background: none;
		border: none;
		color: var(--color-text-hover);
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: color 0.2s ease;
	}

	.clear-button:hover {
		color: var(--color-text);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
		color: var(--color-text);
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--color-brand-main);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		color: var(--color-text);
		cursor: pointer;
		user-select: none;
	}

	.filter-checkbox {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--color-brand-main);
	}

	.reset-button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		background-color: var(--color-surface);
		color: var(--color-text-hover);
		border: 1px solid var(--color-border);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		margin-left: auto;
	}

	.reset-button:hover {
		background-color: var(--color-hover);
		border-color: var(--color-text-hover);
		color: var(--color-text);
	}

	.results-count {
		font-size: 0.875rem;
		color: var(--color-text-hover);
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.results-count strong {
		color: var(--color-brand-main);
		font-weight: 600;
	}

	.no-results {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: var(--padding-card-lg);
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.no-results svg {
		color: var(--color-text-hover);
	}

	.no-results h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.no-results p {
		color: var(--color-text-hover);
		margin: 0;
	}

	.items-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 640px) {
		.items-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.items-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.item-card {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: var(--padding-card-md);
		text-decoration: none;
		color: var(--color-text);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s ease;
	}

	.item-card:hover {
		background-color: var(--color-hover);
		border-color: var(--color-brand-main);
		box-shadow: 0 2px 8px rgba(10, 47, 131, 0.1);
	}

	.item-card.expired {
		opacity: 0.6;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.item-category {
		font-size: 0.75rem;
		color: var(--color-brand-main);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.expired-badge {
		font-size: 0.75rem;
		color: var(--color-danger);
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		background-color: var(--color-danger-light);
		border: 1px solid var(--color-danger);
	}

	.item-title {
		font-size: 1rem;
		font-weight: 500;
		line-height: 1.4;
		margin: 0;
		color: var(--color-text);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-footer {
		margin-top: auto;
	}

	.item-dates {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.date-item {
		display: flex;
		gap: 0.5rem;
	}

	.date-label {
		color: var(--color-text-hover);
		font-weight: 500;
	}

	.date-value {
		color: var(--color-text);
	}

	.error-message,
	.empty-state {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: var(--padding-card-lg);
		text-align: center;
		color: var(--color-text);
	}

	.error-message p,
	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.main {
			padding: 1rem 0.75rem;
		}

		.filter-section {
			padding: 1rem;
			margin-bottom: 1rem;
			gap: 1rem;
		}

		.search-row {
			flex-direction: column;
			gap: 0.75rem;
		}

		.search-bar {
			width: 100%;
		}

		.map-button {
			width: 100%;
			justify-content: center;
		}

		.filters {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-group {
			flex-direction: column;
			align-items: flex-start;
		}

		.filter-select {
			width: 100%;
		}

		.reset-button {
			margin-left: 0;
			justify-content: center;
		}

		.item-card {
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		.search-input {
			font-size: 0.875rem;
			padding-left: 2.5rem;
		}

		.search-icon {
			left: 0.75rem;
			width: 18px;
			height: 18px;
		}

		.map-button span {
			display: none;
		}

		.map-button {
			padding: 0.75rem 1rem;
		}
	}
</style>
