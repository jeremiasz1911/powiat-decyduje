'use client';

import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useState } from 'react';

import { AdminShell } from '@/components/admin-shell';
import { StatusBadge } from '@/components/status-badge';
import { getProjectCoordinates, type AdminProject } from '@/lib/types';

const CENTER = { lat: 53.1126, lng: 20.3843 };

export default function AdminMapPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [selected, setSelected] = useState<AdminProject | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  useEffect(() => {
    void fetch('/api/projects')
      .then((res) => res.json())
      .then((json: { projects?: AdminProject[] }) => setProjects(json.projects ?? []));
  }, []);

  const mappable = useMemo(
    () =>
      projects
        .map((project) => ({ project, coordinates: getProjectCoordinates(project) }))
        .filter((entry): entry is { project: AdminProject; coordinates: { latitude: number; longitude: number } } =>
          Boolean(entry.coordinates)
        ),
    [projects]
  );

  if (!apiKey) {
    return (
      <AdminShell title="Mapa">
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ustaw `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` w zmiennych środowiskowych panelu admina.
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Mapa projektów">
      <div className="card overflow-hidden">
        <APIProvider apiKey={apiKey}>
          <Map defaultCenter={CENTER} defaultZoom={11} mapId="powiat-decyduje-admin-map" style={{ width: '100%', height: '70vh' }}>
            {mappable.map(({ project, coordinates }) => (
              <AdvancedMarker
                key={project.id}
                position={{ lat: coordinates.latitude, lng: coordinates.longitude }}
                onClick={() => setSelected(project)}>
                <Pin background={project.markerColor ?? '#E30613'} borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            ))}

            {selected ? (
              <InfoWindow
                position={{
                  lat: getProjectCoordinates(selected)!.latitude,
                  lng: getProjectCoordinates(selected)!.longitude,
                }}
                onCloseClick={() => setSelected(null)}>
                <div className="max-w-xs space-y-2 p-1">
                  <p className="font-bold text-ink">{selected.title}</p>
                  <p className="text-xs text-ink-muted line-clamp-3">{selected.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={selected.status} />
                    <span>{selected.votesCount} głosów</span>
                  </div>
                  <a href={`/projects/${selected.id}`} className="text-sm font-semibold text-brand">
                    Szczegóły projektu
                  </a>
                </div>
              </InfoWindow>
            ) : null}
          </Map>
        </APIProvider>
      </div>
    </AdminShell>
  );
}
