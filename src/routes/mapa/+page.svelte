<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import maplibregl from 'maplibre-gl';

	let { data } = $props();

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let markers: maplibregl.Marker[] = [];
	let clusterPopup: maplibregl.Popup | null = null;

	onMount(() => {
		if (!mapContainer) return;

		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
			center: [15.83, 50.21], 
			zoom: 9,
			minZoom: 8,
			maxZoom: 18,
			maxBounds: [
				[14.5, 49.8],
				[17.2, 50.8]
			]
		});

		// Add navigation controls
		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		// Add markers for items with coordinates
		if (data.items && Array.isArray(data.items)) {
			// Group items by coordinates to detect overlaps
			const coordinateGroups = new Map<string, any[]>();
			
			data.items.forEach((item: any) => {
				if (item.guessedLatitude && item.guessedLongitude) {
					const key = `${item.guessedLatitude.toFixed(6)},${item.guessedLongitude.toFixed(6)}`;
					if (!coordinateGroups.has(key)) {
						coordinateGroups.set(key, []);
					}
					coordinateGroups.get(key)!.push(item);
				}
			});

			// Create markers with offsets for overlapping coordinates
			coordinateGroups.forEach((items, coordKey) => {
				const firstItem = items[0];
				const lng = firstItem.guessedLongitude;
				const lat = firstItem.guessedLatitude;

				const el = document.createElement('div');
				el.className = 'custom-marker';
				
				// Check if any item is expired for styling
				const hasExpired = items.some((item: any) => 
					item.relevantniDo && new Date(item.relevantniDo) < new Date()
				);
				
				if (hasExpired && items.length === 1) {
					el.classList.add('expired');
				}

				// If multiple items, show cluster marker
				if (items.length > 1) {
					el.classList.add('cluster');
					el.innerHTML = `
						<div class="cluster-circle">
							<span class="cluster-number">${items.length}</span>
						</div>
					`;
				} else {
					// Single item marker
					el.innerHTML = `
						<div class="pin-marker">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
								<circle cx="12" cy="10" r="3" fill="white"></circle>
							</svg>
						</div>
					`;
				}

				const marker = new maplibregl.Marker({
					element: el
				})
					.setLngLat([lng, lat])
					.addTo(map!);

				// Handle click for cluster or single item
				el.addEventListener('click', (e) => {
					e.stopPropagation();
					
					if (items.length === 1) {
						// Navigate directly to detail page
						goto(`/detail/${items[0].id}`);
					} else {
						// Show cluster popup with all items
						if (clusterPopup) {
							clusterPopup.remove();
						}

						let popupContent = '<div class="cluster-popup">';
						popupContent += `<div class="cluster-popup-header">${items.length} oznámení na tomto místě</div>`;
						popupContent += '<div class="cluster-popup-list">';
						
						items.forEach((item: any, index: number) => {
							const isExpired = item.relevantniDo && new Date(item.relevantniDo) < new Date();
							popupContent += `
								<div class="cluster-item ${isExpired ? 'expired' : ''}" data-item-id="${item.id}">
									<div class="cluster-item-category">${item.category}</div>
									<div class="cluster-item-title">${item.nazev}</div>
									${isExpired ? '<div class="cluster-item-badge">Neaktuální</div>' : ''}
								</div>
							`;
						});
						
						popupContent += '</div></div>';

						clusterPopup = new maplibregl.Popup({
							closeButton: true,
							closeOnClick: true,
							maxWidth: '400px',
							offset: 25
						})
							.setLngLat([lng, lat])
							.setHTML(popupContent)
							.addTo(map!);

						// Add click handlers to cluster items after popup is added to DOM
						setTimeout(() => {
							const clusterItems = document.querySelectorAll('.cluster-item');
							clusterItems.forEach((itemEl) => {
								itemEl.addEventListener('click', () => {
									const itemId = itemEl.getAttribute('data-item-id');
									if (itemId) {
										goto(`/detail/${itemId}`);
									}
								});
							});
						}, 0);
					}
				});

				// Hover preview for single items
				if (items.length === 1) {
					const hoverPopup = new maplibregl.Popup({
						closeButton: false,
						closeOnClick: false,
						offset: 25
					});

					el.addEventListener('mouseenter', () => {
						hoverPopup
							.setLngLat([lng, lat])
							.setHTML(`
								<div class="map-popup">
									<div class="popup-category">${firstItem.category}</div>
									<div class="popup-title">${firstItem.nazev}</div>
								</div>
							`)
							.addTo(map!);
					});

					el.addEventListener('mouseleave', () => {
						hoverPopup.remove();
					});
				}

				markers.push(marker);
			});
		}

		// Cleanup on unmount
		return () => {
			markers.forEach(marker => marker.remove());
			markers = [];
			if (clusterPopup) {
				clusterPopup.remove();
				clusterPopup = null;
			}
			if (map) {
				map.remove();
				map = null;
			}
		};
	});

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			history.back();
		} else {
			window.location.href = '/';
		}
	}
</script>

<div class="map-page">
	<!-- Header with back button -->
	<div class="map-header">
		<button onclick={goBack} class="back-button">
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
			<span>Zpět</span>
		</button>

		<h1 class="map-title">Mapa oznámení</h1>
	</div>

	<!-- Fullscreen map -->
	<div class="map-container" bind:this={mapContainer}></div>
</div>

<style>
	.map-page {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--color-bg);
	}

	.map-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background-color: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
		position: relative;
	}

	.back-button {
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
		position: absolute;
		left: 1.5rem;
	}

	.back-button:hover {
		background-color: var(--color-brand-main);
		color: var(--color-surface);
	}

	.map-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.map-container {
		flex: 1;
		width: 100%;
		background-color: var(--color-hover);
	}

	:global(.custom-marker) {
		cursor: pointer;
		color: var(--color-brand-main);
		transition: all 0.2s ease;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	:global(.pin-marker svg) {
		filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.5));
	}

	:global(.cluster-circle) {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: var(--color-brand-main);
		border: 2px solid var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(10, 47, 131, 0.3);
	}

	:global(.cluster-number) {
		color: var(--color-surface);
		font-weight: 700;
		font-size: 0.875rem;
		line-height: 1;
	}

	:global(.custom-marker:hover) {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	:global(.custom-marker.cluster:hover .cluster-circle) {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(10, 47, 131, 0.4);
	}

	:global(.custom-marker.expired) {
		color: var(--color-text-hover);
		opacity: 0.6;
	}

	:global(.map-popup) {
		padding: 0.5rem;
		min-width: 200px;
	}

	:global(.popup-category) {
		font-size: 0.75rem;
		color: var(--color-brand-main);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	:global(.popup-title) {
		font-size: 0.875rem;
		color: var(--color-text);
		font-weight: 500;
		line-height: 1.4;
	}

	:global(.cluster-popup) {
		max-width: 400px;
	}

	:global(.cluster-popup-header) {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-brand-main);
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	:global(.cluster-popup-list) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	:global(.cluster-item) {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		background-color: var(--color-hover);
		border: 1px solid var(--color-border);
		transition: all 0.2s ease;
		position: relative;
		cursor: pointer;
	}

	:global(.cluster-item:hover) {
		background-color: var(--color-surface);
		border-color: var(--color-brand-main);
		box-shadow: 0 2px 4px rgba(10, 47, 131, 0.1);
	}

	:global(.cluster-item.expired) {
		opacity: 0.6;
	}

	:global(.cluster-item-category) {
		font-size: 0.75rem;
		color: var(--color-brand-main);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	:global(.cluster-item-title) {
		font-size: 0.875rem;
		color: var(--color-text);
		font-weight: 500;
		line-height: 1.4;
	}

	:global(.cluster-item-badge) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		font-size: 0.625rem;
		color: var(--color-danger);
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		background-color: var(--color-danger-light);
		border: 1px solid var(--color-danger);
		text-transform: uppercase;
	}

	:global(.maplibregl-popup-content) {
		padding: 1rem;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-width: 400px;
	}

	:global(.maplibregl-popup-close-button) {
		font-size: 1.5rem;
		padding: 0.5rem;
		color: var(--color-text-hover);
	}

	:global(.maplibregl-popup-close-button:hover) {
		background-color: var(--color-hover);
		color: var(--color-text);
	}

	:global(.maplibregl-popup-tip) {
		border-top-color: var(--color-surface);
	}

	@media (max-width: 768px) {
		.map-header {
			padding: 0.75rem 1rem;
		}

		.back-button span {
			display: none;
		}

		.back-button {
			padding: 0.625rem;
			left: 1rem;
		}

		.map-title {
			flex: 1;
			text-align: center;
			margin-left: 2.625rem;
		}

		:global(.cluster-popup-list) {
			max-height: 250px;
		}

		:global(.cluster-item) {
			padding: 0.625rem;
		}
	}
</style>