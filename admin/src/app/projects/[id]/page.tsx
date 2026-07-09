import { Suspense } from 'react';

import ProjectDetailsPage from './page.client';

export default function ProjectDetailsWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Ładowanie projektu…</div>}>
      <ProjectDetailsPage />
    </Suspense>
  );
}
