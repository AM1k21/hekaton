<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import { geocodePlace, reverseGeocode, isCoordinateFormat } from '$lib/geocoding';

	interface User {
		id: string;
		email: string;
	}

	let user: User | null = $state(null);
	let isLoading = $state(true);
	let successMessage = $state('');
	let errorMessage = $state('');
	let showPasswordForm = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);
	let notifications = $state(false);
	let emailNotifications = $state(false);
	let showNotificationParams = $state(false);
	let notificationPreferences = $state<Array<{ zajmy: string[]; lokace: string; radius: number }>>([]);
	let newZajmy = $state<string[]>([]);
	let newLokace = $state('');
	let newRadius = $state(10);
	let isLoadingGeolocation = $state(false);
	let locationDisplayNames = $state<Map<string, string>>(new Map());

	onMount(async () => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			user = JSON.parse(storedUser);
			
			// Load user settings from server
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
					notifications = settings.notifications;
					emailNotifications = settings.emailNotifications;
					notificationPreferences = settings.notificationPreferences;
					
					// Load display names for all locations
					await loadLocationDisplayNames();
				}
			} catch (err) {
				console.error('Error loading settings:', err);
			}
		} else {
			goto('/auth/login');
		}
		isLoading = false;
	});

	async function loadLocationDisplayNames() {
		const newMap = new Map<string, string>();
		
		for (const pref of notificationPreferences) {
			if (isCoordinateFormat(pref.lokace)) {
				const displayName = await reverseGeocode(pref.lokace);
				newMap.set(pref.lokace, displayName);
			} else {
				newMap.set(pref.lokace, pref.lokace);
			}
		}
		
		locationDisplayNames = newMap;
	}

	async function handleLogout() {
		localStorage.removeItem('user');
		goto('/');
	}

	async function handlePasswordChange() {
		errorMessage = '';
		successMessage = '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			errorMessage = 'Všechna pole jsou povinná';
			return;
		}

		if (newPassword !== confirmPassword) {
			errorMessage = 'Nová hesla se neshodují';
			return;
		}

		if (newPassword.length < 6) {
			errorMessage = 'Nové heslo musí mít alespoň 6 znaků';
			return;
		}

		if (newPassword === currentPassword) {
			errorMessage = 'Nové heslo musí být jiné než staré';
			return;
		}

		isChangingPassword = true;

		try {
			const response = await fetch('/api/v1/auth/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: user?.email,
					currentPassword,
					newPassword
				})
			});

			const data = await response.json();

			if (!response.ok) {
				errorMessage = data.message || 'Změna hesla selhala';
				return;
			}

			successMessage = 'Heslo úspěšně změněno!';
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			showPasswordForm = false;

			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (err) {
			errorMessage = 'Chyba při komunikaci se serverem';
			console.error(err);
		} finally {
			isChangingPassword = false;
		}
	}

	async function handleGetGeolocation() {
		errorMessage = '';
		successMessage = '';
		isLoadingGeolocation = true;

		// Check if geolocation is available
		if (!navigator.geolocation) {
			errorMessage = 'Geolokace není v tomto prohlížeči podporována';
			isLoadingGeolocation = false;
			setTimeout(() => {
				errorMessage = '';
			}, 3000);
			return;
		}

		// Check if we're on HTTPS or localhost
		if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
			errorMessage = 'Geolokace vyžaduje zabezpečené připojení (HTTPS)';
			isLoadingGeolocation = false;
			setTimeout(() => {
				errorMessage = '';
			}, 3000);
			return;
		}

		try {
			// Check current permission state
			if ('permissions' in navigator) {
				const permission = await navigator.permissions.query({ name: 'geolocation' });
				console.log('Geolocation permission state:', permission.state);
				
				if (permission.state === 'denied') {
					errorMessage = 'Přístup k poloze je zablokován. Povolte jej v nastavení prohlížeče.';
					isLoadingGeolocation = false;
					setTimeout(() => {
						errorMessage = '';
					}, 5000);
					return;
				}
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					newLokace = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
					successMessage = 'Změny uloženy';
					isLoadingGeolocation = false;
					setTimeout(() => {
						successMessage = '';
					}, 2000);
				},
				(error) => {
					console.error('Geolocation error:', error);
					isLoadingGeolocation = false;
					
					switch (error.code) {
						case error.PERMISSION_DENIED:
							errorMessage = 'Přístup k poloze byl zamítnut. Klikněte na ikonu zámku v adresním řádku a povolte přístup k poloze.';
							break;
						case error.POSITION_UNAVAILABLE:
							errorMessage = 'Informace o poloze nejsou dostupné. Zkuste to prosím znovu.';
							break;
						case error.TIMEOUT:
							errorMessage = 'Vypršel časový limit při získávání polohy. Zkuste to prosím znovu.';
							break;
						default:
							errorMessage = 'Nelze načíst geolokaci. Zkontrolujte oprávnění.';
							break;
					}
					
					setTimeout(() => {
						errorMessage = '';
					}, 5000);
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0
				}
			);
		} catch (err) {
			console.error('Error checking geolocation permission:', err);
			isLoadingGeolocation = false;
			errorMessage = 'Chyba při kontrole oprávnění geolokace';
			setTimeout(() => {
				errorMessage = '';
			}, 3000);
		}
	}

	async function handleAddNotificationPreference() {
		errorMessage = '';

		if (newZajmy.length === 0 || !newLokace.trim()) {
			errorMessage = 'Vyberte prosím kategorii a lokaci';
			return;
		}

		if (newRadius < 1 || newRadius > 1000) {
			errorMessage = 'Vzdálenost musí být mezi 1 a 1000 km';
			return;
		}

		let locationToSave = newLokace.trim();

		// If the location is not in coordinate format, geocode it
		if (!isCoordinateFormat(locationToSave)) {
			successMessage = 'Převádím lokaci na souřadnice...';
			const coordinates = await geocodePlace(locationToSave);
			
			if (!coordinates) {
				errorMessage = `Nepodařilo se najít souřadnice pro: ${locationToSave}`;
				successMessage = '';
				setTimeout(() => {
					errorMessage = '';
				}, 3000);
				return;
			}
			
			locationToSave = coordinates;
			successMessage = '';
		}

		notificationPreferences = [
			...notificationPreferences,
			{
				zajmy: newZajmy,
				lokace: locationToSave,
				radius: newRadius
			}
		];

		// Update display name for the new location
		if (isCoordinateFormat(locationToSave)) {
			const displayName = await reverseGeocode(locationToSave);
			locationDisplayNames.set(locationToSave, displayName);
			locationDisplayNames = new Map(locationDisplayNames); // Trigger reactivity
		}

		newZajmy = [];
		newLokace = '';
		newRadius = 10;
		
		await saveSettings();
	}

	async function handleRemoveNotificationPreference(index: number) {
		notificationPreferences = notificationPreferences.filter((_, i) => i !== index);
		await saveSettings();
	}

	async function saveSettings() {
		if (!user) return;

		try {
			const response = await fetch('/api/v1/auth/update-settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: user.email,
					notifications,
					emailNotifications,
					notificationPreferences
				})
			});

			if (response.ok) {
				successMessage = 'Změny uloženy';
				setTimeout(() => {
					successMessage = '';
				}, 2000);
			} else {
				errorMessage = 'Chyba při ukládání nastavení';
			}
		} catch (err) {
			console.error('Error saving settings:', err);
			errorMessage = 'Chyba při ukládání nastavení';
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

<div class="container">
	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Načítám...</p>
		</div>
	{:else if user}
		<div class="account-wrapper">
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
			<div class="account-header">
				<h1>Můj účet</h1>
				<p>Spravujte své údaje a nastavení</p>
			</div>

			<div class="account-grid">
				<div class="account-columns">
					<!-- Left Column -->
					<div class="account-column">
						<!-- User Info Section -->
						<div class="account-section">
							<div class="section-header">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
									<circle cx="12" cy="7" r="4"></circle>
								</svg>
								<h2>Informace o účtu</h2>
							</div>

							<div class="info-group">
								<div class="info-label">Email</div>
								<div class="info-value">{user.email}</div>
							</div>

							<div class="info-group">
								<div class="info-label">ID účtu</div>
								<div class="info-value info-monospace">{user.id}</div>
							</div>
						</div>

						<!-- Password Section -->
						<div class="account-section">
							<div class="section-header">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
									<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
								</svg>
								<h2>Bezpečnost</h2>
							</div>

							{#if !showPasswordForm}
								<button onclick={() => (showPasswordForm = true)} class="action-button">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline>
										<line x1="12" y1="12" x2="20" y2="7.5"></line>
										<line x1="12" y1="12" x2="12" y2="21"></line>
										<line x1="12" y1="12" x2="4" y2="7.5"></line>
									</svg>
									Změnit heslo
								</button>
							{:else}
								<form onsubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} class="password-form">
									<div class="form-group">
										<label for="current">Staré heslo</label>
										<input
											id="current"
											type="password"
											bind:value={currentPassword}
											placeholder="Zadejte své staré heslo"
											disabled={isChangingPassword}
											required
										/>
									</div>

									<div class="form-group">
										<label for="new">Nové heslo</label>
										<input
											id="new"
											type="password"
											bind:value={newPassword}
											placeholder="Alespoň 6 znaků"
											disabled={isChangingPassword}
											required
										/>
									</div>

									<div class="form-group">
										<label for="confirm">Potvrzení nového hesla</label>
										<input
											id="confirm"
											type="password"
											bind:value={confirmPassword}
											placeholder="Zopakujte nové heslo"
											disabled={isChangingPassword}
											required
										/>
									</div>

									<div class="form-buttons">
										<button type="submit" disabled={isChangingPassword} class="submit-button">
											{#if isChangingPassword}
												<span class="spinner"></span>
												Mění se...
											{:else}
												Uložit
											{/if}
										</button>
										<button
											type="button"
											onclick={() => {
												showPasswordForm = false;
												currentPassword = '';
												newPassword = '';
												confirmPassword = '';
											}}
											disabled={isChangingPassword}
											class="cancel-button"
										>
											Zrušit
										</button>
									</div>
								</form>
							{/if}
						</div>
					</div>

					<!-- Right Column -->
					<div class="account-column">
						<!-- Settings Section -->
						<div class="account-section">
					<div class="section-header">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="3"></circle>
							<path
								d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m6.08 0l4.24 4.24"
							></path>
						</svg>
						<h2>Nastavení</h2>
					</div>

					<div class="setting-item">
						<div class="setting-info">
							<p class="setting-name">Oznámení</p>
							<p class="setting-description">Přijímejte upozornění o důležitých změnách</p>
						</div>
						<label class="toggle">
							<input type="checkbox" bind:checked={notifications} onchange={saveSettings} />
							<span class="toggle-slider"></span>
						</label>
					</div>

					<div class="setting-item">
						<div class="setting-info">
							<p class="setting-name">Oznámení novinek na email</p>
							<p class="setting-description">Dostávejte novinky a aktualizace na email</p>
						</div>
						<label class="toggle">
							<input type="checkbox" bind:checked={emailNotifications} onchange={saveSettings} />
							<span class="toggle-slider"></span>
						</label>
					</div>

					<!-- Notification Parameters Section -->
					<div class="notification-params-section">
						<button onclick={() => (showNotificationParams = !showNotificationParams)} class="action-button">
							{#if showNotificationParams}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
							{/if}
							{showNotificationParams ? 'Skrýt parametry oznámení' : 'Zobrazit parametry oznámení'}
						</button>

						{#if showNotificationParams}
							<form onsubmit={(e) => { e.preventDefault(); handleAddNotificationPreference(); }} class="params-form">
								<div class="form-group">
									<label for="zajmy">Kategorie</label>
									<div class="custom-select-wrapper">
										<select
											id="zajmy"
											onchange={(e) => {
												const value = e.currentTarget.value;
												if (value && !newZajmy.includes(value)) {
													newZajmy = [...newZajmy, value];
												}
												e.currentTarget.value = '';
											}}
											class="custom-select"
										>
											<option value="">Vyberte kategorii...</option>
											{#if !newZajmy.includes('Ekonomika A Trh Práce')}
												<option value="Ekonomika A Trh Práce">Ekonomika A Trh Práce</option>
											{/if}
											{#if !newZajmy.includes('Investice Kraje')}
												<option value="Investice Kraje">Investice Kraje</option>
											{/if}
											{#if !newZajmy.includes('Izs A Bezpečnost')}
												<option value="Izs A Bezpečnost">Izs A Bezpečnost</option>
											{/if}
											{#if !newZajmy.includes('Kraj A Dotace')}
												<option value="Kraj A Dotace">Kraj A Dotace</option>
											{/if}
											{#if !newZajmy.includes('Kultura A Cestovní Ruch')}
												<option value="Kultura A Cestovní Ruch">Kultura A Cestovní Ruch</option>
											{/if}
											{#if !newZajmy.includes('Lidé A Sociální Služby')}
												<option value="Lidé A Sociální Služby">Lidé A Sociální Služby</option>
											{/if}
											{#if !newZajmy.includes('Školství A Výzkum')}
												<option value="Školství A Výzkum">Školství A Výzkum</option>
											{/if}
											{#if !newZajmy.includes('Veřejná Doprava A Silnice')}
												<option value="Veřejná Doprava A Silnice">Veřejná Doprava A Silnice</option>
											{/if}
											{#if !newZajmy.includes('Zdravotnictví A Zdraví')}
												<option value="Zdravotnictví A Zdraví">Zdravotnictví A Zdraví</option>
											{/if}
											{#if !newZajmy.includes('Životní Prostředí')}
												<option value="Životní Prostředí">Životní Prostředí</option>
											{/if}
										</select>
									</div>
									
									{#if newZajmy.length > 0}
										<div class="selected-categories">
											{#each newZajmy as category (category)}
												<div class="category-blob">
													<span class="category-text">{category}</span>
													<button
														type="button"
														class="category-remove"
														onclick={() => {
															newZajmy = newZajmy.filter(c => c !== category);
														}}
														title="Odebrat kategorii"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="14"
															height="14"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2.5"
															stroke-linecap="round"
															stroke-linejoin="round"
														>
															<line x1="18" y1="6" x2="6" y2="18"></line>
															<line x1="6" y1="6" x2="18" y2="18"></line>
														</svg>
													</button>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<div class="form-group">
									<label for="lokace">Lokace</label>
									<div class="location-input">
										<input
											id="lokace"
											type="text"
											bind:value={newLokace}
											placeholder="Zadejte lokaci nebo použijte geolokaci"
											required
										/>
										<button 
											type="button" 
											onclick={handleGetGeolocation} 
											class="geo-button" 
											title="Načíst aktuální lokaci"
											disabled={isLoadingGeolocation}
										>
											{#if isLoadingGeolocation}
												<span class="spinner-small"></span>
											{:else}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<circle cx="12" cy="12" r="9"></circle>
													<circle cx="12" cy="12" r="3"></circle>
												</svg>
											{/if}
										</button>
									</div>
								</div>

								<div class="form-group">
									<label for="radius">Vzdálenost (okruh v km)</label>
									<div class="radius-input-wrapper">
										<input
											id="radius"
											type="range"
											bind:value={newRadius}
											min="1"
											max="100"
											step="1"
											class="radius-slider"
										/>
										<input
											type="number"
											bind:value={newRadius}
											min="1"
											max="100"
											step="1"
											class="radius-number-input"
											placeholder="km"
										/>
									</div>
								</div>

								<button type="submit" class="submit-button">
									Přidat parametr
								</button>
							</form>
						{/if}

						<!-- Notification Preferences List -->
						{#if notificationPreferences.length > 0}
							<div class="preferences-list">
								<h4 class="preferences-title">Vaše parametry oznámení</h4>
								{#each notificationPreferences as pref, index (index)}
									<div class="preference-item">
										<div class="preference-content">
											<p class="preference-label"><strong>Zájmy:</strong> {pref.zajmy.join(', ')}</p>
											<p class="preference-label"><strong>Lokace:</strong> {locationDisplayNames.get(pref.lokace) || pref.lokace}</p>
											<p class="preference-label"><strong>Vzdálenost:</strong> {pref.radius || 10} km</p>
										</div>
										<button 
											type="button"
											onclick={() => handleRemoveNotificationPreference(index)} 
											class="remove-button"
											title="Odebrat"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"></path>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

				<!-- Logout Section -->
				<div class="account-section logout-section">
					<div class="section-header">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
							<polyline points="16 17 21 12 16 7"></polyline>
							<line x1="21" y1="12" x2="9" y2="12"></line>
						</svg>
						<h2>Odhlášení</h2>
					</div>

					<p>Odhlašte se ze své relace</p>
					<button onclick={handleLogout} class="logout-button">
						Odhlásit se
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Notification Banners -->
{#if successMessage}
	<div class="notification-banner success-banner">
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
		<span>{successMessage}</span>
	</div>
{/if}

{#if errorMessage}
	<div class="notification-banner error-banner">
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
		<span>{errorMessage}</span>
	</div>
{/if}

<style>
	.container {
		min-height: 100vh;
		background-color: var(--color-bg);
		padding: 2rem 1rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: 1rem;
	}

	.spinner {
		display: inline-block;
		width: 40px;
		height: 40px;
		border: 3px solid rgba(10, 47, 131, 0.2);
		border-top-color: var(--color-brand-main);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.account-wrapper {
		max-width: 900px;
		margin: 0 auto;
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

	.account-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.account-header h1 {
		font-size: 2rem;
		font-weight: 600;
		color: var(--color-brand-main);
		margin: 0 0 0.5rem 0;
	}

	.account-header p {
		font-size: 1rem;
		color: var(--color-text-hover);
		margin: 0;
	}

	/* Notification Banners */
	.notification-banner {
		position: fixed;
		top: 80px;
		right: 2rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		border: 1px solid;
		font-size: 0.9rem;
		font-weight: 500;
		z-index: 1000;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		animation: slideInDown 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
		width: fit-content;
	}

	@keyframes slideInDown {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(-20px);
			opacity: 0;
		}
	}

	.success-banner {
		background-color: var(--color-success-light);
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.error-banner {
		background-color: var(--color-danger-light);
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.notification-banner svg {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
	}

	.account-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.account-columns {
		display: flex;
		gap: 1.5rem;
	}

	.account-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.account-section {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.section-header svg {
		width: 24px;
		height: 24px;
		color: var(--color-brand-main);
		flex-shrink: 0;
	}

	.section-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.info-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background-color: var(--color-hover);
	}

	.info-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-hover);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 1rem;
		color: var(--color-text);
		word-break: break-all;
	}

	.info-monospace {
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		letter-spacing: 0.025em;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--color-brand-main);
		color: white;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		width: 100%;
		justify-content: center;
	}

	.action-button:hover {
		background-color: #081d52;
	}

	.password-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
		background-color: var(--color-hover);
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

	.form-group select {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-hover);
		color: var(--color-text);
		font-size: 1rem;
		transition: all 0.2s ease;
		font-family: inherit;
		cursor: pointer;
	}

	.form-group select:focus {
		outline: none;
		border-color: var(--color-brand-main);
		box-shadow: 0 0 0 3px rgba(10, 47, 131, 0.1);
	}

	.custom-select-wrapper {
		position: relative;
	}

	.custom-select {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-hover);
		color: var(--color-text);
		font-size: 1rem;
		transition: all 0.2s ease;
		font-family: inherit;
		cursor: pointer;
	}

	.custom-select:focus {
		outline: none;
		border-color: var(--color-brand-main);
		box-shadow: 0 0 0 3px rgba(10, 47, 131, 0.1);
	}

	.selected-categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.category-blob {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background-color: var(--color-brand-main);
		color: var(--color-surface);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.category-text {
		line-height: 1;
	}

	.category-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		color: var(--color-surface);
		cursor: pointer;
		transition: all 0.2s ease;
		opacity: 0.8;
		line-height: 1;
	}

	.category-remove:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.category-remove svg {
		display: block;
	}

	.form-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.submit-button {
		flex: 1;
		padding: 0.75rem 1rem;
		background-color: var(--color-brand-main);
		color: white;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #081d52;
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-button {
		flex: 1;
		padding: 0.75rem 1rem;
		background-color: var(--color-hover);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-button:hover:not(:disabled) {
		background-color: var(--color-border);
	}

	.cancel-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background-color: var(--color-hover);
		gap: 1rem;
	}

	.setting-info {
		flex: 1;
	}

	.setting-name {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text);
		margin: 0;
	}

	.setting-description {
		font-size: 0.8rem;
		color: var(--color-text-hover);
		margin: 0.25rem 0 0 0;
	}

	.toggle {
		position: relative;
		display: inline-flex;
		width: 50px;
		height: 28px;
		cursor: pointer;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-border);
		border-radius: 34px;
		transition: all 0.3s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 24px;
		height: 24px;
		left: 2px;
		bottom: 2px;
		background-color: var(--color-surface);
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.toggle input:checked + .toggle-slider {
		background-color: var(--color-brand-main);
	}

	.toggle input:checked + .toggle-slider::before {
		left: 24px;
	}

	.logout-section {
		width: 100%;
	}

	.logout-section p {
		color: var(--color-text-hover);
		margin: 0 0 1rem 0;
		font-size: 0.95rem;
	}

	.logout-button {
		padding: 0.875rem 1rem;
		background-color: var(--color-danger);
		color: white;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
	}

	.logout-button:hover {
		background-color: #dc2626;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
	}

	.notification-params-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.params-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--color-hover);
		border: 1px solid var(--color-border);
	}

	.location-input {
		display: flex;
		gap: 0.5rem;
	}

	.location-input input {
		flex: 1;
	}

	.geo-button {
		padding: 0.75rem;
		background-color: var(--color-brand-main);
		color: white;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.geo-button:hover:not(:disabled) {
		background-color: #081d52;
	}

	.geo-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner-small {
		display: inline-block;
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.radius-input-wrapper {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.radius-slider {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--color-border);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.radius-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-brand-main);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.radius-slider::-webkit-slider-thumb:hover {
		background: #081d52;
		transform: scale(1.1);
	}

	.radius-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--color-brand-main);
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.radius-slider::-moz-range-thumb:hover {
		background: #081d52;
		transform: scale(1.1);
	}

	.radius-slider::-moz-range-track {
		background: var(--color-border);
		border-radius: 3px;
	}

	.radius-number-input {
		width: 80px;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-hover);
		color: var(--color-text);
		font-size: 0.95rem;
		font-weight: 600;
		text-align: center;
		transition: all 0.2s ease;
	}

	.radius-number-input:focus {
		outline: none;
		border-color: var(--color-brand-main);
		box-shadow: 0 0 0 3px rgba(10, 47, 131, 0.1);
	}

	/* Remove spinner arrows in number input */
	.radius-number-input::-webkit-inner-spin-button,
	.radius-number-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.radius-number-input[type="number"] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.preferences-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.preferences-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.preference-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: var(--color-hover);
		border: 1px solid var(--color-border);
		gap: 1rem;
	}

	.preference-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preference-label {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0;
	}

	.remove-button {
		padding: 0.5rem;
		background-color: transparent;
		color: var(--color-danger);
		border: 1px solid var(--color-danger);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.remove-button:hover {
		background-color: rgba(239, 68, 68, 0.1);
	}

	@media (max-width: 768px) {
		.back-button-inline span {
			display: none;
		}

		.back-button-inline {
			padding: 0.625rem;
			margin-bottom: 1rem;
		}

		.container {
			padding: 1rem;
		}

		.account-header h1 {
			font-size: 1.5rem;
		}

		.account-columns {
			flex-direction: column;
		}

		/* Reorder columns on mobile */
		.account-column:first-child {
			display: flex;
			flex-direction: column;
		}

		/* Move user info to top */
		.account-column:first-child .account-section:first-child {
			order: 1;
		}

		/* Move security/password section to bottom (after notifications) */
		.account-column:first-child .account-section:last-child {
			order: 3;
		}

		/* Notifications section appears second */
		.account-column:last-child {
			order: 2;
		}

		.notification-banner {
			top: 70px;
			right: 1rem;
			left: 1rem;
			width: auto;
		}
	}
</style>
