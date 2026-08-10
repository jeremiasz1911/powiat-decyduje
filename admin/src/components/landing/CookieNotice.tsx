'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'pd_cookie_notice_dismissed';

/**
 * Informacyjny komunikat o niezbędnych mechanizmach.
 * Publiczna strona nie używa cookies analitycznych/marketingowych —
 * bez systemu „Akceptuję / Odrzuć opcjonalne”.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      // localStorage niedostępny — pokaż komunikat
    }
    setVisible(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-notice" role="dialog" aria-live="polite" aria-label="Informacja o cookies">
      <div className="cookie-notice-card">
        <button type="button" className="cookie-notice-close" onClick={dismiss} aria-label="Zamknij">
          <X className="h-4 w-4" />
        </button>
        <p className="cookie-notice-text">
          Ta strona wykorzystuje wyłącznie niezbędne mechanizmy techniczne do prawidłowego działania. Nie używamy
          opcjonalnych cookies analitycznych ani marketingowych.
        </p>
        <div className="cookie-notice-actions">
          <Link href="/cookies" className="cookie-notice-link">
            Więcej informacji
          </Link>
          <button type="button" className="cookie-notice-btn" onClick={dismiss}>
            Rozumiem
          </button>
        </div>
      </div>
    </div>
  );
}
