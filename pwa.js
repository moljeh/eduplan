/* =============================================================
   EDUPLAN AI — PWA DAN BANNER INSTAL
   Menggantikan pwa.js sebelumnya; tidak mengubah app.js.
   Memerlukan pwa-banner.css, manifest, sw.js, dan ikon yang sudah dipasang.
   ============================================================= */
'use strict';

(() => {
// Penutupan banner hanya berlaku pada halaman yang sedang terbuka.
// Nilainya kembali false ketika halaman di-refresh.
  let dismissedThisPage = false;
  let deferredPrompt = null;
  let banner = null;
  let installing = false;
  let installedThisPage = false;
  const displayMode = window.matchMedia('(display-mode: standalone)');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function standalone() {
    return installedThisPage || displayMode.matches || navigator.standalone === true;
  }

/* =====================================================
   PENUTUPAN BANNER — HANYA SELAMA HALAMAN INI TERBUKA
   ===================================================== */

function dismissed() {
  return dismissedThisPage;
}

function rememberDismissal() {
  dismissedThisPage = true;
}

  function removeBanner() {
    if (banner) { banner.remove(); banner = null; }
  }

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function showBanner() {
    if (!document.body || banner || standalone() || dismissed()) return;
    if (!deferredPrompt && !isIOS) return;
    const nativeInstall = Boolean(deferredPrompt);
    banner = make('section', 'edu-pwa-banner');
    banner.setAttribute('aria-label', 'Pemasangan aplikasi EduPlan AI');
    const icon = make('div', 'edu-pwa-icon');
    const fallback = make('span', '', '✦');
    fallback.setAttribute('aria-hidden', 'true');
    const image = make('img');
    image.src = new URL('./asset/logo.png', document.baseURI).href;
    image.alt = '';
    image.addEventListener('error', () => image.remove());
    icon.append(fallback, image);
    const content = make('div', 'edu-pwa-content');
    const title = make('h2', 'edu-pwa-title', 'EduPlan AI di layar utama');
    const message = make('p', 'edu-pwa-message', nativeInstall
      ? 'Akses ruang kerja guru lebih praktis melalui aplikasi.'
      : 'Tambahkan EduPlan AI ke layar utama perangkat Anda.');
    const actions = make('div', 'edu-pwa-actions');
    const install = make('button', 'edu-pwa-install', nativeInstall ? 'Instal aplikasi' : 'Cara memasang');
    const later = make('button', 'edu-pwa-later', 'Nanti saja');
    install.type = later.type = 'button';
    const help = make('p', 'edu-pwa-help');
    help.hidden = true;
    help.setAttribute('role', 'status');
    const helpId = 'edu-pwa-install-help';
    help.id = helpId;
    if (!nativeInstall) {
      install.setAttribute('aria-controls', helpId);
      install.setAttribute('aria-expanded', 'false');
    }
    install.addEventListener('click', async () => {
      if (installing) return;
      if (!deferredPrompt) {
        help.textContent = 'Di Safari: buka menu Bagikan, pilih Tambahkan ke Layar Utama, lalu ketuk Tambah. Jika pilihan itu tidak tersedia di browser ini, buka tautan aplikasi melalui Safari.';
        help.hidden = false;
        install.setAttribute('aria-expanded', 'true');
        return;
      }
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      installing = true;
      install.disabled = true;
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'dismissed') rememberDismissal();
        removeBanner();
      } catch (error) {
        console.warn('Dialog instal belum dapat dibuka:', error);
        help.textContent = 'Instalasi belum dapat dibuka. Periksa pilihan Pasang aplikasi pada menu browser atau muat ulang halaman.';
        help.hidden = false;
        install.hidden = true;
      } finally {
        installing = false;
      }
    });
    const close = make('button', 'edu-pwa-close', '×');
    close.type = 'button';
    close.setAttribute(
  'aria-label',
  'Tutup banner instal sampai halaman dimuat ulang'
);
    const dismiss = () => { rememberDismissal(); removeBanner(); };
    close.addEventListener('click', dismiss);
    later.addEventListener('click', dismiss);
    actions.append(install, later);
    content.append(title, message, actions, help);
    banner.append(icon, content, close);
    document.body.append(banner);
  }

  window.addEventListener('beforeinstallprompt', event => {
    // Jangan memanggil prompt saat halaman dimuat; tunggu klik pengguna.
    if (standalone() || dismissed()) return;
    event.preventDefault();
    deferredPrompt = event;
    removeBanner();
    showBanner();
  });

  window.addEventListener('appinstalled', () => {
    installedThisPage = true;
    deferredPrompt = null;
    removeBanner();
  });

  if (displayMode.addEventListener) {
    displayMode.addEventListener('change', () => { if (standalone()) removeBanner(); });
  }

  function ready() { if (isIOS) showBanner(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once: true});
  else ready();

  // Pendaftaran worker sama dengan paket PWA sebelumnya.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    async function registerWorker() {
      try {
        const worker = new URL('./sw.js', document.baseURI);
        await navigator.serviceWorker.register(worker.href, {
          scope: new URL('./', worker).href,
          updateViaCache: 'none'
        });
      } catch (error) {
        console.warn('PWA EduPlan AI belum terdaftar:', error);
      }
    }
    if (document.readyState === 'complete') registerWorker();
    else window.addEventListener('load', registerWorker, {once: true});
  }
})();
