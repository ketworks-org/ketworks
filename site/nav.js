// Mobile toggle for the site navigation; shared by the homepage and the article pages.
const toggle = document.getElementById('nav-toggle'), nav = document.getElementById('site-nav');
if (toggle && nav) toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });

// Visitor counts: Cloudflare Web Analytics, which sets no cookies and stores no personal data. Loaded only on
// the published domain, so pull-request previews and local builds are not counted.
const CLOUDFLARE_ANALYTICS_TOKEN = '';
if (CLOUDFLARE_ANALYTICS_TOKEN && location.hostname === 'ketworks.org') {
  const beacon = document.createElement('script');
  beacon.defer = true; beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({token: CLOUDFLARE_ANALYTICS_TOKEN});
  document.head.append(beacon);
}
