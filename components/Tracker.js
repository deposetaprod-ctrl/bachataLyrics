import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Tracker() {
  const router = useRouter();

  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('tracker_session_id');
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      sessionStorage.setItem('tracker_session_id', sessionId);
    }

    const sendEvent = (type, data) => {
      fetch('/api/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          type,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: window.navigator.userAgent,
        }),
      }).catch(err => console.error("Tracking error:", err));
    };

    // 1. Track route changes
    const handleRouteChange = (url) => {
      sendEvent('page_view', { path: url });
    };

    // Track initial page load
    sendEvent('page_view', { path: router.asPath });

    router.events.on('routeChangeComplete', handleRouteChange);

    // 2. Track global clicks
    const handleClick = (e) => {
      const target = e.target;
      // Try to find the closest interactive element (button or link)
      const interactiveEl = target.closest('button, a, [role="button"]');
      
      let text = '';
      let href = '';
      let tagName = target.tagName;

      if (interactiveEl) {
        text = interactiveEl.innerText || interactiveEl.getAttribute('aria-label') || '';
        href = interactiveEl.getAttribute('href') || '';
        tagName = interactiveEl.tagName;
      } else {
        // If not an interactive element, we might still want to track it if it has meaningful text,
        // but to avoid spam, let's only track if it has some text or ID.
        text = target.innerText || target.value || '';
        if (text.length > 50) text = text.substring(0, 50) + '...'; // Truncate long text
      }

      // Avoid tracking empty clicks (like clicking on empty space)
      if (interactiveEl || text.trim()) {
         sendEvent('click', {
          tagName,
          text: text.trim().substring(0, 50),
          href,
          id: target.id || interactiveEl?.id || '',
          className: target.className || ''
        });
      }
    };

    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      document.removeEventListener('click', handleClick);
    };
  }, [router.asPath]); // Re-bind on path change is not strictly necessary but router might change. Actually, empty dependency array is better to attach listeners once, but we use router.events. Let's use router.

  return null;
}
