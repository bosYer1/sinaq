'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ClubWithDistance } from '@/types/database';
import type { UserLocation } from '@/hooks/useUserLocation';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { formatDistance } from '@/lib/geo';
import { formatPriceRange, isClubOpenNow, isPremiumActive } from '@/lib/utils';

interface ClubMapProps {
  clubs: ClubWithDistance[];
  activeClubId?: string | null;
  onSelectClub?: (id: string) => void;
  userLocation?: UserLocation | null;
  locationFocusRequest?: number;
}

function createClubIcon(club: ClubWithDistance, isActive: boolean) {
  const typeSlugs = inferClubTypeSlugs(club);
  const hasPC = typeSlugs.includes('pc');
  const hasPlayStation = typeSlugs.includes('playstation');
  const hasHours = club.opening_hours.length > 0;
  const isOpen = hasHours ? isClubOpenNow(club.opening_hours) : false;
  const premiumActive = isPremiumActive(club);
  const size = isActive ? 40 : 34;
  const fill = hasPC && hasPlayStation
    ? 'url(#gameyer-dual)'
    : hasPlayStation
      ? '#06AED4'
      : hasPC
        ? '#7C5CFC'
        : '#6B7280';
  const outline = premiumActive ? '#B8860B' : '#ffffff';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="gameyer-dual" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7C5CFC" />
          <stop offset="100%" stop-color="#06AED4" />
        </linearGradient>
      </defs>
      ${isActive ? '<circle cx="20" cy="20" r="19" fill="#ffffff" stroke="#14161c" stroke-width="1.5" />' : ''}
      <path d="M20 4C13.4 4 8 9.4 8 16c0 8.6 12 20 12 20s12-11.4 12-20C32 9.4 26.6 4 20 4Z" fill="${fill}" stroke="${outline}" stroke-width="${premiumActive ? 2.5 : 2}" />
      <circle cx="20" cy="16" r="4" fill="#ffffff" />
      ${isOpen ? '<circle cx="30.5" cy="8.5" r="4.5" fill="#16A34A" stroke="#ffffff" stroke-width="2" />' : ''}
    </svg>
  `;

  return L.divIcon({
    className: 'gameyer-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function appendText(parent: HTMLElement, tag: keyof HTMLElementTagNameMap, className: string, text: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function createPopupContent(club: ClubWithDistance) {
  const root = document.createElement('div');
  root.className = 'min-w-[210px]';

  const title = document.createElement('a');
  title.href = `/klub/${encodeURIComponent(club.slug)}`;
  title.className = 'font-display text-sm font-semibold text-ink no-underline hover:text-primary';
  title.textContent = club.name;
  root.appendChild(title);

  appendText(root, 'div', 'mt-1 text-xs text-muted', club.district?.name ?? 'Rayon göstərilməyib');
  if (club.address) appendText(root, 'div', 'mt-0.5 text-xs text-muted', club.address);
  if (club.distanceKm != null) {
    appendText(root, 'div', 'mt-1 text-xs font-semibold text-primary', `Səndən ${formatDistance(club.distanceKm)}`);
  }

  const typeSlugs = inferClubTypeSlugs(club);
  if (typeSlugs.length > 0) {
    const types = document.createElement('div');
    types.className = 'mt-2 flex flex-wrap gap-1 text-[11px] text-muted';
    for (const slug of typeSlugs) {
      appendText(types, 'span', 'rounded bg-surface-alt px-1.5 py-0.5', slug === 'pc' ? 'PC' : 'PlayStation');
    }
    root.appendChild(types);
  }

  const hasHours = club.opening_hours.length > 0;
  const openNow = hasHours ? isClubOpenNow(club.opening_hours) : false;
  const statusLabel = !hasHours ? 'İş saatı məlum deyil' : openNow ? 'Açıqdır' : 'Bağlıdır';
  const cheapest = [...club.pricing]
    .filter((pricing) => pricing.price_from > 0)
    .sort((a, b) => a.price_from - b.price_from)[0];

  const meta = document.createElement('div');
  meta.className = 'mt-2 flex items-center justify-between gap-3';
  appendText(
    meta,
    'span',
    cheapest ? 'text-xs font-bold text-[#0F9F5D]' : 'text-xs text-muted',
    cheapest ? formatPriceRange(cheapest.price_from, cheapest.price_to, cheapest.unit) : 'Qiymət məlum deyil'
  );
  appendText(
    meta,
    'span',
    !hasHours ? 'text-xs font-medium text-muted' : openNow ? 'text-xs font-semibold text-live' : 'text-xs font-semibold text-red-500',
    statusLabel
  );
  root.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'mt-3 grid grid-cols-2 gap-2';

  const detailsLink = document.createElement('a');
  detailsLink.href = `/klub/${encodeURIComponent(club.slug)}`;
  detailsLink.className = 'flex h-9 items-center justify-center rounded-control border border-border bg-surface px-2 text-center text-xs font-semibold text-ink no-underline transition hover:border-primary hover:text-primary';
  detailsLink.textContent = 'Kluba bax';
  actions.appendChild(detailsLink);

  const routeLink = document.createElement('a');
  routeLink.href = `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`;
  routeLink.target = '_blank';
  routeLink.rel = 'noopener noreferrer';
  routeLink.className = 'flex h-9 items-center justify-center rounded-control bg-[#1A73E8] px-2 text-center text-xs font-semibold no-underline transition hover:opacity-90';
  routeLink.style.backgroundColor = '#1A73E8';
  routeLink.style.color = '#ffffff';
  routeLink.textContent = 'Google Maps';
  actions.appendChild(routeLink);

  root.appendChild(actions);
  return root;
}

export function ClubMap({
  clubs,
  activeClubId,
  onSelectClub,
  userLocation,
  locationFocusRequest = 0,
}: ClubMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const clubRefs = useRef<Map<string, ClubWithDistance>>(new Map());
  const activeClubIdRef = useRef<string | null>(activeClubId ?? null);
  const onSelectClubRef = useRef(onSelectClub);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    onSelectClubRef.current = onSelectClub;
  }, [onSelectClub]);

  useEffect(() => {
    activeClubIdRef.current = activeClubId ?? null;
  }, [activeClubId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const markerRegistry = markerRefs.current;
    const clubRegistry = clubRefs.current;
    const map = L.map(container, {
      center: [40.4093, 49.8671],
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerLayerRef.current = markerLayer;

    const invalidate = () => window.requestAnimationFrame(() => map.invalidateSize(false));
    const timer = window.setTimeout(invalidate, 100);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null;
    observer?.observe(container);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      map.remove();
      markerRegistry.clear();
      clubRegistry.clear();
      mapRef.current = null;
      markerLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    markerRefs.current.clear();
    clubRefs.current.clear();

    for (const club of clubs) {
      if (club.latitude == null || club.longitude == null) continue;

      const isActive = club.id === activeClubIdRef.current;
      const marker = L.marker([club.latitude, club.longitude], {
        icon: createClubIcon(club, isActive),
        zIndexOffset: isActive ? 1000 : 0,
        title: club.name,
      });
      marker.bindPopup(createPopupContent(club), { minWidth: 210, maxWidth: 280, className: 'gameyer-map-popup' });
      marker.on('click', () => onSelectClubRef.current?.(club.id));
      marker.addTo(layer);
      markerRefs.current.set(club.id, marker);
      clubRefs.current.set(club.id, club);
    }
  }, [clubs]);

  useEffect(() => {
    for (const [clubId, marker] of markerRefs.current) {
      const club = clubRefs.current.get(clubId);
      if (!club) continue;
      const isActive = clubId === activeClubId;
      marker.setIcon(createClubIcon(club, isActive));
      marker.setZIndexOffset(isActive ? 1000 : 0);
    }
  }, [activeClubId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.removeFrom(map);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563EB',
        fillOpacity: 1,
      })
        .bindTooltip('Sənin konumun', { direction: 'top', offset: [0, -8] })
        .addTo(map);
    }
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation && locationFocusRequest > 0) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.45 });
      return;
    }

    const clubsWithCoords = clubs.filter(
      (club) => club.latitude != null && club.longitude != null
    );

    if (clubsWithCoords.length === 0) {
      map.setView([40.4093, 49.8671], 12);
      return;
    }

    const activeClub = clubsWithCoords.find((club) => club.id === activeClubId);
    if (activeClub?.latitude != null && activeClub.longitude != null) {
      map.flyTo(
        [activeClub.latitude, activeClub.longitude],
        Math.max(map.getZoom(), 14),
        { duration: 0.45 }
      );
      return;
    }

    if (clubsWithCoords.length === 1) {
      const club = clubsWithCoords[0];
      map.setView([club.latitude!, club.longitude!], 14);
      return;
    }

    const bounds = L.latLngBounds(
      clubsWithCoords.map((club) => [club.latitude!, club.longitude!] as [number, number])
    );
    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 14,
      animate: false,
    });
  }, [clubs, activeClubId, userLocation, locationFocusRequest]);

  return <div ref={containerRef} className="h-full w-full" aria-label="GameYer klub xəritəsi" />;
}
