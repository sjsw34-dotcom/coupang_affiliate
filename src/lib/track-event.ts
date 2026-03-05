'use client';

import type { TrackEvent } from '@/lib/types';

export function trackEvent(event: TrackEvent) {
  const body = JSON.stringify(event);

  if (event.type === 'outbound' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/events', blob);
    return;
  }

  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {
    // silently fail
  });
}
