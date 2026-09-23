(function () {
  const measurementId = String(window.TNP_GA_MEASUREMENT_ID || '').trim();
  const isValidMeasurementId = /^G-[A-Z0-9]+$/i.test(measurementId);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.trackTnpEvent = function trackTnpEvent(eventName, params = {}) {
    if (!isValidMeasurementId || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      app_name: 'TNP Studio',
      app_version: document.body?.dataset?.appVersion || '',
      ...params
    });
  };

  if (!isValidMeasurementId) {
    console.info('Google Analytics 비활성 상태: analytics-config.js에 GA4 측정 ID를 입력하면 활성화됩니다.');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_title: document.title,
    page_path: `${window.location.pathname}${window.location.search}`,
    app_name: 'TNP Studio',
    app_version: document.body?.dataset?.appVersion || ''
  });
})();
