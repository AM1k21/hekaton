<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	interface User {
		id: string;
		email: string;
		seenAlert: boolean;
	}

	let { data } = $props();

	let user: User | null = $state(null);
	let showAlert = $state(false);

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let showExpired = $state(false);
	let selectedUserFilters = $state<number[]>([]);
	let userPreferences = $state<Array<{ zajmy: string[]; lokace: string; radius: number; displayName?: string }>>([]);
	let showUserFiltersDropdown = $state(false);

	onMount(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			user = JSON.parse(storedUser);
			showAlert = !data.seenAlert;
			
			// Load user preferences
			(async () => {
				try {
					const response = await fetch('/api/v1/auth/get-settings', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ email: user?.email })
					});

					if (response.ok) {
						const settings = await response.json();
						userPreferences = settings.notificationPreferences || [];
					}
				} catch (err) {
					console.error('Error loading user preferences:', err);
				}
			})();
		}

		// Close dropdown when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.user-filters-dropdown-wrapper')) {
				showUserFiltersDropdown = false;
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Haversine formula pro výpočet vzdálenosti
	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371; // Poloměr Země v km
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	// Kontrola, zda položka odpovídá uživatelským filtrům
	function matchesUserFilters(item: any): boolean {
		if (selectedUserFilters.length === 0) return true;

		return selectedUserFilters.some(filterIndex => {
			const pref = userPreferences[filterIndex];
			if (!pref) return false;

			// Kontrola kategorie
			const categoryMatch = pref.zajmy.length === 0 || pref.zajmy.includes(item.category);
			if (!categoryMatch) return false;

			// Kontrola lokace a radiusu
			if (pref.lokace && item.gps) {
				const [prefLat, prefLon] = pref.lokace.split(',').map(Number);
				const [itemLat, itemLon] = item.gps.split(',').map(Number);
				
				if (!isNaN(prefLat) && !isNaN(prefLon) && !isNaN(itemLat) && !isNaN(itemLon)) {
					const distance = calculateDistance(prefLat, prefLon, itemLat, itemLon);
					return distance <= pref.radius;
				}
			}

			// Pokud nemá GPS, projde jen pokud má správnou kategorii
			return categoryMatch;
		});
	}

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
			
			// Filtr podle uživatelských preferencí
			const matchesUserPrefs = matchesUserFilters(item);
			
			return matchesSearch && matchesCategory && matchesExpired && matchesUserPrefs;
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

	// Aplikace uživatelských filtrů
	function toggleUserFilter(index: number) {
		if (selectedUserFilters.includes(index)) {
			selectedUserFilters = selectedUserFilters.filter(i => i !== index);
		} else {
			selectedUserFilters = [...selectedUserFilters, index];
		}
	}

	// Odstranění konkrétního filtru
	function removeUserFilter(index: number) {
		selectedUserFilters = selectedUserFilters.filter(i => i !== index);
	}

	// Toggle dropdown
	function toggleUserFiltersDropdown() {
		showUserFiltersDropdown = !showUserFiltersDropdown;
	}

	// Reset filtrů
	function resetFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		showExpired = false;
		selectedUserFilters = [];
		showUserFiltersDropdown = false;
	}

	async function dismissAlert() {
		if (!user) return;
		
		showAlert = false;
		
		try {
			await fetch('/api/v1/auth/update-settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: user.email,
					seenAlert: true
				})
			});
			
			// Update local storage
			user.seenAlert = true;
			localStorage.setItem('user', JSON.stringify(user));
		} catch (err) {
			console.error('Error updating seenAlert:', err);
		}
	}

	async function goToSettings() {
		await dismissAlert();
		window.location.href = '/account';
	}
</script>

<Header />

<!-- Alert Banner -->
{#if showAlert}
	<div class="alert-banner">
		<div class="alert-banner-content">
			<div class="alert-banner-text">
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
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
					<line x1="12" y1="17" x2="12.01" y2="17"></line>
				</svg>
				<p>Víte, že si můžete nastavit personalizovaná oznámení?</p>
			</div>
			<div class="alert-banner-actions">
				<button onclick={dismissAlert} class="alert-button-secondary">
					Rozumím
				</button>
				<button onclick={goToSettings} class="alert-button-primary">
					Přejít do nastavení
				</button>
			</div>
		</div>
	</div>
{/if}

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
				</div>

				<div class="action-buttons">
					{#if user && userPreferences.length > 0}
						<div class="user-filters-dropdown-wrapper">
							<button onclick={toggleUserFiltersDropdown} class="user-filters-button">
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
									<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
									<circle cx="9" cy="7" r="4"></circle>
									<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
									<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
								</svg>
								Aplikovat moje filtry
								<span class="filter-count-badge" class:visible={selectedUserFilters.length > 0}>
									{selectedUserFilters.length || '0'}
								</span>
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
									class="dropdown-arrow"
									class:rotated={showUserFiltersDropdown}
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</button>
							
							{#if showUserFiltersDropdown}
								<div class="user-filters-dropdown">
									{#each userPreferences as pref, index}
										<button 
											onclick={() => toggleUserFilter(index)} 
											class="dropdown-item"
											class:selected={selectedUserFilters.includes(index)}
										>
											<div class="dropdown-item-content">
												<p class="dropdown-item-label">
													<strong>Zájmy:</strong> 
													<span class="filter-tags">
														{#each pref.zajmy as zajm}
															<span class="filter-tag">{zajm}</span>
														{/each}
													</span>
												</p>
												<p class="dropdown-item-label">
													<strong>Lokace:</strong> {pref.displayName || pref.lokace}
												</p>
												<p class="dropdown-item-label">
													<strong>Okruh:</strong> {pref.radius} km
												</p>
											</div>
											{#if selectedUserFilters.includes(index)}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													class="check-icon"
												>
													<polyline points="20 6 9 17 4 12"></polyline>
												</svg>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if searchQuery || selectedCategory !== 'all' || showExpired || selectedUserFilters.length > 0}
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
							Resetovat všechny filtry
						</button>
					{/if}
				</div>

				<div class="results-count">
					{#if selectedUserFilters.length > 0}
						<div class="active-filters">
							{#each selectedUserFilters as filterIndex}
								<span class="active-filter-badge">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
										<circle cx="9" cy="7" r="4"></circle>
										<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
										<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
									</svg>
									{userPreferences[filterIndex]?.displayName || 'Můj filtr'}
									<button 
										onclick={() => removeUserFilter(filterIndex)} 
										class="remove-filter-button"
										aria-label="Odstranit filtr"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="12"
											height="12"
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
								</span>
							{/each}
						</div>
					{/if}
					<span>Zobrazeno <strong>{filteredItems.length}</strong> z <strong>{data.items.length}</strong> oznámení</span>
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
	.alert-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--color-surface);
		border-top: 2px solid var(--color-brand-main);
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.alert-banner-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.25rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.alert-banner-text {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.alert-banner-text svg {
		color: var(--color-brand-main);
		flex-shrink: 0;
	}

	.alert-banner-text p {
		margin: 0;
		color: var(--color-text);
		font-size: 0.9375rem;
		font-weight: 500;
	}

	.alert-banner-actions {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.alert-button-primary,
	.alert-button-secondary {
		padding: 0.625rem 1.25rem;
		border: none;
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		text-decoration: none;
		display: inline-block;
		white-space: nowrap;
	}

	.alert-button-primary {
		background-color: var(--color-brand-main);
		color: var(--color-surface);
	}

	.alert-button-primary:hover {
		background-color: #082469;
		box-shadow: 0 2px 8px rgba(10, 47, 131, 0.2);
	}

	.alert-button-secondary {
		background-color: transparent;
		color: var(--color-text-hover);
		border: 1px solid var(--color-border);
	}

	.alert-button-secondary:hover {
		background-color: var(--color-hover);
		border-color: var(--color-text-hover);
		color: var(--color-text);
	}

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
		gap: 1rem;
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
		padding: 0.75rem 1rem;
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
		height: 100%;
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

	.action-buttons {
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
		height: 38px;
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
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: transparent;
		color: var(--color-text-hover);
		border: 1px solid var(--color-border);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		white-space: nowrap;
		height: 38px;
	}

	.reset-button:hover {
		background-color: var(--color-surface-hover);
		border-color: var(--color-text-hover);
		color: var(--color-text);
	}

	.user-filters-dropdown-wrapper {
		position: relative;
	}

	.user-filters-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: var(--color-brand-main);
		color: var(--color-surface);
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		height: 38px;
	}

	.user-filters-button:hover {
		background-color: #082469;
		box-shadow: 0 2px 8px rgba(10, 47, 131, 0.2);
	}

	.dropdown-arrow {
		transition: transform 0.2s ease;
	}

	.dropdown-arrow.rotated {
		transform: rotate(180deg);
	}

	.filter-count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		width: 24px;
		height: 24px;
		padding: 0;
		background-color: var(--color-surface);
		color: var(--color-brand-main);
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.user-filters-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		min-width: 300px;
		max-width: 400px;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 100;
		max-height: 400px;
		overflow-y: auto;
	}

	.dropdown-item {
		width: 100%;
		padding: 1rem;
		background-color: var(--color-surface);
		border: none;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		transition: background-color 0.2s ease;
		text-align: left;
		font-family: inherit;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover {
		background-color: var(--color-hover);
	}

	.dropdown-item.selected {
		background-color: rgba(10, 47, 131, 0.05);
		border-left: 3px solid var(--color-brand-main);
		padding-left: calc(1rem - 3px);
	}

	.check-icon {
		color: var(--color-brand-main);
		flex-shrink: 0;
	}

	.dropdown-item-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dropdown-item-label {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.filter-tag {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background-color: rgba(10, 47, 131, 0.1);
		color: var(--color-brand-main);
		border: 1px solid var(--color-brand-main);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.results-count {
		font-size: 0.875rem;
		color: var(--color-text-hover);
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.results-count strong {
		color: var(--color-brand-main);
		font-weight: 600;
	}

	.active-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.active-filter-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		background-color: rgba(10, 47, 131, 0.1);
		color: var(--color-brand-main);
		border: 1px solid var(--color-brand-main);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.remove-filter-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem;
		background: none;
		border: none;
		color: var(--color-brand-main);
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.remove-filter-button:hover {
		color: var(--color-danger);
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
		.alert-banner-content {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
			padding: 1rem;
		}

		.alert-banner-text {
			justify-content: center;
			text-align: center;
		}

		.alert-banner-actions {
			flex-direction: column;
			width: 100%;
		}

		.alert-button-primary,
		.alert-button-secondary {
			width: 100%;
			text-align: center;
			justify-content: center;
		}

		.main {
			padding: 1rem 0.75rem;
		}

		.filter-section {
			padding: 1rem;
			margin-bottom: 1rem;
			gap: 1rem;
		}

		.search-bar {
			width: 100%;
		}

		.filters {
			flex-direction: column;
			align-items: stretch;
		}

		.action-buttons {
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

		.user-filters-button {
			width: 100%;
			justify-content: center;
		}

		.reset-button {
			width: 100%;
			justify-content: center;
		}

		.user-filters-dropdown {
			left: 0;
			right: 0;
			min-width: auto;
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
			padding: 0.65rem 0.7rem;
		}
	}
</style>
