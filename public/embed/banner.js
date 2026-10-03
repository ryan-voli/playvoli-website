/*! VOLI partner banner — served from https://playvoli.com/embed/banner.js
 * Usage on a partner site:
 *   <div data-voli-banner="evollve"></div>
 *   <script src="https://playvoli.com/embed/banner.js" async></script>
 */
(function () {
  'use strict';

  var CONFIG = {
    appStoreUrl: 'https://apps.apple.com/us/app/voli-the-volleyball-hub/id6749812982',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.playvoli.app',
    partners: {
      evollve: { text: 'Evollve analytics, now in the', highlight: 'VOLI app', utm: 'evollve' }
    },
    defaultPartner: 'evollve',
    stackBelow: 640
  };

  var script = document.currentScript || (function () {
    var s = document.querySelectorAll('script[src*="banner.js"]');
    return s[s.length - 1];
  })();
  var BASE = script && script.src ? script.src.replace(/[^/]*$/, '') : 'https://playvoli.com/embed/';

  function injectFonts() {
    if (document.getElementById('voli-banner-fonts')) return;
    var st = document.createElement('style');
    st.id = 'voli-banner-fonts';
    st.textContent =
      "@font-face{font-family:'VoliBannerInter';font-weight:300 800;font-display:swap;src:url('" + BASE + "fonts/inter-latin.woff2') format('woff2')}" +
      "@font-face{font-family:'VoliBannerDesigner';font-display:swap;src:url('" + BASE + "fonts/Designer.otf') format('opentype')}";
    document.head.appendChild(st);
  }

  function withUtm(url, partner) {
    try {
      var u = new URL(url);
      u.searchParams.set('utm_source', partner);
      u.searchParams.set('utm_medium', 'partner_banner');
      return u.toString();
    } catch (e) { return url; }
  }

  var APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>';

  var CSS = [
    ':host{all:initial;display:block;width:100%;container-type:inline-size}',
    '.b{position:relative;overflow:hidden;background:#0F1314;color:#fff;font-family:VoliBannerInter,system-ui,-apple-system,sans-serif;box-sizing:border-box}',
    '.aur{position:absolute;inset:-60px -80px;filter:blur(28px);pointer-events:none;background:',
    'radial-gradient(circle at 5% 8%,#125960 0%,transparent 32%),',
    'radial-gradient(circle at 88% 79%,#56172F 0%,transparent 30%),',
    'radial-gradient(circle at 48% 4%,#271C49 0%,transparent 30%),',
    'radial-gradient(circle at 18% 84%,#0C3332 0%,transparent 26%),',
    'radial-gradient(circle at 60% 95%,#1D1833 0%,transparent 22%),',
    'radial-gradient(circle at 98% 18%,#102C2F 0%,transparent 14%),',
    'radial-gradient(circle at 74% 28%,#1E2314 0%,transparent 16%),#0F1314}',
    '.scr{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.4))}',
    '.in{position:relative;max-width:1400px;margin:0 auto;height:64px;padding:0 40px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:24px}',
    '.brand{display:flex;align-items:center;gap:18px;min-width:0;text-decoration:none;color:inherit}',
    '.mark{width:30px;height:30px;display:block;object-fit:contain;flex:none}',
    '.word{font-family:VoliBannerDesigner,VoliBannerInter,sans-serif;font-size:24px;line-height:1;transform:translateY(.076em);flex:none}',
    '.div{width:1px;height:24px;background:rgba(255,255,255,.2);flex:none}',
    '.txt{font-weight:600;font-size:19px;line-height:1.3;color:rgba(255,255,255,.62);white-space:nowrap}',
    '.txt b{color:#fff;font-weight:600}',
    '.btns{display:flex;gap:10px;flex:none}',
    '.btn{height:38px;padding:0 16px;border-radius:9px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;gap:9px;font-weight:600;font-size:14px;line-height:1;color:#fff;text-decoration:none;white-space:nowrap;transition:background .2s ease}',
    '.btn:hover{background:rgba(255,255,255,.18)}',
    '.btn:focus-visible{outline:2px solid #fff;outline-offset:2px}',
    '.btn svg{width:17px;height:17px;fill:#fff;flex:none}',
    '.btn.play svg{width:15px;height:15px}',
    '@container (max-width:' + (CONFIG.stackBelow - 1) + 'px){',
    '.in{height:auto;flex-direction:column;align-items:stretch;gap:12px;padding:20px}',
    '.brand{justify-content:center;gap:12px}',
    '.mark{width:28px;height:28px}.word{font-size:22px}.div{height:32px}',
    '.txt{font-size:15px;white-space:normal;text-wrap:balance}',
    '.btn{flex:1;height:40px;padding:0 14px;gap:8px}',
    '}'
  ].join('');

  function render(host) {
    if (host.__voliBanner) return;
    host.__voliBanner = true;
    var key = (host.getAttribute('data-voli-banner') || CONFIG.defaultPartner).toLowerCase();
    var p = CONFIG.partners[key] || CONFIG.partners[CONFIG.defaultPartner];
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="b" role="complementary" aria-label="VOLI app">' +
        '<div class="aur"></div><div class="scr"></div>' +
        '<div class="in">' +
          '<div class="brand">' +
            '<img class="mark" src="' + BASE + 'voli-mark.webp" alt="">' +
            '<span class="word">VOLI</span>' +
            '<span class="div"></span>' +
            '<span class="txt">' + p.text + ' <b>' + p.highlight + '</b></span>' +
          '</div>' +
          '<div class="btns">' +
            '<a class="btn" href="' + withUtm(CONFIG.appStoreUrl, p.utm) + '" target="_blank" rel="noopener">' + APPLE + 'App Store</a>' +
            '<a class="btn play" href="' + withUtm(CONFIG.playStoreUrl, p.utm) + '" target="_blank" rel="noopener">' + PLAY + 'Google Play</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function init() {
    injectFonts();
    var els = document.querySelectorAll('[data-voli-banner]');
    for (var i = 0; i < els.length; i++) render(els[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
