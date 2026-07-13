// Sovereign System Client Analytics Tracker
(function() {
    // Configuration - Change this to your deployed worker URL in production
    const WORKER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8787'
        : 'https://sovereign-backend.YOUR_SUBDOMAIN.workers.dev';

    // 1. Resolve Session ID
    let sessionId = localStorage.getItem('sovereign_session_id');
    if (!sessionId) {
        sessionId = 'ss-' + crypto.randomUUID();
        localStorage.setItem('sovereign_session_id', sessionId);
    }

    // 2. Resolve Campaign Source from query parameter (?source=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    let campaignSource = urlParams.get('source') || urlParams.get('utm_source');
    if (campaignSource) {
        sessionStorage.setItem('sovereign_campaign_source', campaignSource);
    } else {
        campaignSource = sessionStorage.getItem('sovereign_campaign_source') || 'direct';
    }

    // 3. Helper to send events to Worker
    function trackEvent(eventType, additionalData = {}) {
        const payload = {
            sessionId: sessionId,
            eventType: eventType,
            pagePath: window.location.pathname,
            referrer: document.referrer || '',
            campaignSource: campaignSource,
            ...additionalData
        };

        // Fire-and-forget fetch to minimize render latency
        fetch(`${WORKER_URL}/api/analytics/track`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('Analytics logging failed:', err));
    }

    // 4. Track Pageview on load
    if (document.readyState === 'complete') {
        trackEvent('pageview');
    } else {
        window.addEventListener('load', () => trackEvent('pageview'));
    }

    // 5. Intercept Affiliate Link Clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href) {
            // Check if link is outbound redirect card
            if (link.href.includes('recommends.html')) {
                const url = new URL(link.href);
                const offerKey = url.searchParams.get('offer') || 'unknown';
                
                trackEvent('click', {
                    pagePath: window.location.pathname,
                    referrer: offerKey // Log the product key clicked
                });
            }
        }
    });

    // Expose globally for manual event tracking
    window.SovereignTracker = {
        track: trackEvent,
        getSessionId: () => sessionId,
        getWorkerUrl: () => WORKER_URL
    };
})();
