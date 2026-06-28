import { Suspense } from 'react';

import LoginPage from './page.client';

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Ładowanie…</div>}>
      <LoginPage />
    </Suspense>
  );
}
