/**
 * EduPlan AI — Notifikasi modern.
 * Load AFTER app.js. Tidak mengubah database atau Code.gs.
 * Cocok dengan app.js lengkap versi GitHub Pages pada percakapan ini.
 * Tidak menggunakan alert(), confirm(), prompt(), atau innerHTML untuk pesan.
 */
'use strict';

const EduNotify = (() => {
  let stack = null;
  let dialog = null;
  let activeResolve = null;
  let previousFocus = null;
  let previousOverflow = '';
  let queue = Promise.resolve();

  const types = {
    success: {title: 'Berhasil', icon: '✓'},
    error: {title: 'Terjadi kendala', icon: '!'},
    info: {title: 'Informasi', icon: 'i'},
    warning: {title: 'Perhatian', icon: '!'}
  };

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function toast(message, options = {}) {
    if (!stack) {
      stack = make('div', 'edu-toast-stack');
      stack.setAttribute('aria-label', 'Notifikasi aplikasi');
      document.body.appendChild(stack);
    }
    const type = types[options.type] ? options.type : 'success';
    const settings = types[type];
    const duration = Math.max(3000, Number(options.duration) || (type === 'error' ? 10000 : 6000));
    const card = make('section', 'edu-toast');
    card.dataset.type = type;
    card.setAttribute('role', type === 'error' ? 'alert' : 'status');
    card.setAttribute('aria-atomic', 'true');
    card.style.setProperty('--duration', `${duration}ms`);

    const icon = make('div', 'edu-toast-icon', settings.icon);
    icon.setAttribute('aria-hidden', 'true');
    const content = make('div');
    content.append(make('h3', 'edu-toast-title', options.title || settings.title));
    content.append(make('p', 'edu-toast-message', String(message)));
    const close = make('button', 'edu-icon-button', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Tutup notifikasi');
    const progress = make('div', 'edu-toast-progress');
    progress.setAttribute('aria-hidden', 'true');
    card.append(icon, content, close, progress);
    stack.prepend(card);

    let remaining = duration;
    let started = Date.now();
    let timer;
    const remove = () => { clearTimeout(timer); card.remove(); };
    const resume = () => { started = Date.now(); timer = setTimeout(remove, remaining); };
    const pause = () => { clearTimeout(timer); remaining = Math.max(0, remaining - (Date.now() - started)); };
    close.addEventListener('click', remove);
    card.addEventListener('mouseenter', pause);
    card.addEventListener('mouseleave', resume);
    card.addEventListener('focusin', () => { pause(); progress.style.animationPlayState = 'paused'; });
    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget)) { resume(); progress.style.animationPlayState = ''; }
    });
    resume();
    while (stack.children.length > 4) stack.lastElementChild.remove();
    return remove;
  }

  function finish(value) {
    if (!activeResolve) return;
    const resolve = activeResolve;
    activeResolve = null;
    dialog.close();
    document.body.style.overflow = previousOverflow;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    resolve(value);
  }

  function createDialog() {
    if (dialog) return;
    dialog = make('dialog', 'edu-dialog');
    dialog.setAttribute('aria-labelledby', 'edu-dialog-title');
    dialog.setAttribute('aria-describedby', 'edu-dialog-message');
    const body = make('div', 'edu-dialog-body');
    const top = make('div', 'edu-dialog-top');
    const icon = make('div', 'edu-dialog-icon', '?');
    icon.setAttribute('aria-hidden', 'true');
    const close = make('button', 'edu-icon-button', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Batalkan dan tutup');
    close.addEventListener('click', () => finish(false));
    top.append(icon, close);
    const title = make('h2'); title.id = 'edu-dialog-title';
    const message = make('p'); message.id = 'edu-dialog-message';
    body.append(top, title, message);
    const footer = make('div', 'edu-dialog-footer');
    const cancel = make('button', 'edu-dialog-button');
    cancel.type = 'button'; cancel.id = 'edu-dialog-cancel';
    const accept = make('button', 'edu-dialog-button edu-dialog-button-primary');
    accept.type = 'button'; accept.id = 'edu-dialog-accept';
    cancel.addEventListener('click', () => finish(false));
    accept.addEventListener('click', () => finish(true));
    footer.append(cancel, accept);
    dialog.append(body, footer);
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
    document.body.appendChild(dialog);
  }

  function ask(options = {}) {
    // Dialog berurutan, tidak saling menimpa.
    const job = () => new Promise(resolve => {
      createDialog();
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.dataset.danger = String(Boolean(options.danger));
      dialog.querySelector('.edu-dialog-icon').textContent = options.danger ? '!' : (options.icon || '?');
      dialog.querySelector('#edu-dialog-title').textContent = options.title || 'Konfirmasi tindakan';
      dialog.querySelector('#edu-dialog-message').textContent = options.message || 'Lanjutkan tindakan ini?';
      const cancel = dialog.querySelector('#edu-dialog-cancel');
      const accept = dialog.querySelector('#edu-dialog-accept');
      cancel.textContent = options.cancelText || 'Batal';
      accept.textContent = options.confirmText || 'Lanjutkan';
      activeResolve = resolve;
      dialog.showModal();
      cancel.focus();
    });
    const result = queue.then(job);
    queue = result.catch(() => false);
    return result;
  }

  return Object.freeze({toast, ask});
})();

/* ============================================================
 * Ganti fungsi UI app.js lama tanpa mengubah API backend.
 * Deklarasi global ini menggantikan fungsi dengan nama yang sama.
 * ============================================================ */

function showToast(message, error = false) {
  const legacy = document.querySelector('#toast');
  if (legacy) legacy.hidden = true;
  EduNotify.toast(message, {type: error ? 'error' : 'success'});
}

async function mayLeave() {
  if (!state.dirty) return true;
  const accepted = await EduNotify.ask({
    title: 'Perubahan belum disimpan',
    message: 'Dokumen ini memiliki perubahan yang belum disimpan. Jika Anda meninggalkan editor, perubahan tersebut akan hilang.',
    confirmText: 'Tinggalkan editor',
    cancelText: 'Kembali mengedit',
    danger: true
  });
  if (accepted) state.dirty = false;
  return accepted;
}

async function navigate(route, category = '') {
  if (!(await mayLeave())) return;
  if (route === 'dashboard') return renderDashboard();
  if (route === 'category') return renderCategory(category);
  if (route === 'profile') return renderProfile();
  if (route === 'help') return renderHelp();
  if (['history', 'favorites', 'trash'].includes(route)) {
    await run(async () => {
      state.documents = await api('listDocuments');
      state.filters = {query: '', type: '', provider: '', page: 1};
      renderHistory(route);
    }, 'Memuat dokumen...');
    return;
  }
  if (['users', 'settings', 'logs'].includes(route)) {
    await run(async () => {
      state.admin = await api('adminData');
      if (route === 'users') renderUsers();
      if (route === 'settings') renderSettings();
      if (route === 'logs') renderLogs();
    }, 'Memuat data admin...');
  }
}

async function logout() {
  if (!(await mayLeave())) return;
  const accepted = await EduNotify.ask({
    title: 'Keluar dari ruang kerja?',
    message: 'Dokumen yang sudah disimpan tetap tersedia saat Anda masuk kembali.',
    confirmText: 'Ya, keluar', cancelText: 'Tetap di sini', icon: '↪'
  });
  if (!accepted) return;
  await run(async () => {
    try { await api('logout'); }
    finally { clearSession(); renderLogin(); }
  }, 'Keluar...');
}

async function openDocument(id) {
  if (!(await mayLeave())) return;
  await run(async () => {
    state.editor = await api('readDocument', {id});
    state.dirty = false;
    renderEditor();
  }, 'Membuka dokumen...');
}

async function renderGenerator(type) {
  if (!(await mayLeave())) return;
  state.generatorType = type;
  setRoute('generator', `Generator / ${title(type)}`);
  const providers = state.providers.map(p => ({value: p.id, text: `${title(p.id)} · ${p.model}`}));
  const noProvider = providers.length === 0;
  document.querySelector('#content').innerHTML = `<div class="stack">
    ${pageHead(`Generator ${title(type)}`, 'Lengkapi konteks pembelajaran agar draf lebih relevan.')}
    <div class="notice">Isian dikirim ke provider pilihan Anda. Gunakan data anonim dan rujukan terverifikasi.</div>
    <form class="card" data-form="generate">
      <h2>Konteks dokumen</h2>
      <div class="form-grid">
        ${field('subject', 'Mata pelajaran *', '', {required: true, max: 150})}
        ${field('level', 'Jenjang / kelas / fase *', '', {required: true, max: 100})}
        ${field('topic', 'Materi / topik *', '', {required: true, max: 200})}
        ${field('year', 'Tahun ajaran', '', {max: 40})}
        ${selectField('semester', 'Semester', ['Ganjil', 'Genap'])}
        ${field('duration', 'Alokasi waktu / pertemuan', '', {max: 150})}
        ${field('curriculum', 'Kurikulum', '', {max: 150})}
        ${selectField('provider', 'Provider AI', providers)}
      </div>
      
	  ${textarea(
  'reference',
  'CP / TP / rujukan resmi / data anonim',
  getReferenceExample(type)
)}

<p class="muted">
  Contoh di dalam kolom hanya ilustrasi, bukan kutipan CP resmi.
  Sesuaikan dengan konteks Anda dan jangan masukkan identitas
  pribadi peserta didik.
</p>
	  
	  
      ${textarea('instructions', 'Format / kebutuhan khusus / jumlah soal / catatan', 'Contoh: 10 soal pilihan ganda beserta pembahasan.')}
      <p class="muted">Guru: ${escapeHTML(state.user.name)} · Sekolah: ${escapeHTML(state.user.school || '[belum diisi]')}</p>
      <div class="row"><button class="btn btn-primary" type="submit" ${noProvider ? 'disabled' : ''}>✦ Generate & simpan draf</button>
        ${button('Profil guru & sekolah', 'navigate', 'data-route="profile"', 'btn-outline')}</div>
      ${noProvider ? '<p class="notice mt-20">Belum ada provider aktif. Hubungi admin.</p>' : ''}
    </form>
  </div>`;
}

async function mutateDocument(action, id, value) {
  if (action === 'trashDocument') {
    const accepted = await EduNotify.ask({
      title: value ? 'Pindahkan ke sampah?' : 'Pulihkan dokumen?',
      message: value
        ? 'Dokumen akan dipindahkan ke sampah, bukan dihapus permanen. Anda dapat memulihkannya nanti.'
        : 'Dokumen akan dikembalikan ke riwayat dan dapat dibuka kembali.',
      confirmText: value ? 'Pindahkan ke sampah' : 'Pulihkan dokumen',
      cancelText: 'Batal', danger: value
    });
    if (!accepted) return;
  }
  await run(async () => {
    const doc = await api(action, {id, value});
    syncDocument(doc);
    renderDocumentResults();
    showToast(action === 'trashDocument'
      ? (value ? 'Dokumen dipindahkan ke sampah.' : 'Dokumen berhasil dipulihkan.')
      : (value ? 'Dokumen ditambahkan ke favorit.' : 'Dokumen dihapus dari favorit.'));
  }, 'Memperbarui dokumen...');
}

async function saveUser(form) {
  const values = formValues(form);
  values.active = form.elements.active.checked;
  const accepted = await EduNotify.ask({
    title: values.id ? 'Simpan perubahan akun?' : 'Tambahkan pengguna baru?',
    message: `Nama: ${values.name}\nEmail: ${values.email}\nPeran: ${values.role === 'admin' ? 'Administrator' : 'Guru'}\nStatus: ${values.active ? 'Aktif' : 'Nonaktif'}`,
    confirmText: values.id ? 'Simpan perubahan' : 'Tambahkan pengguna',
    cancelText: 'Periksa kembali', icon: '♙'
  });
  if (!accepted) return;
  await run(async () => {
    await api('saveUser', values);
    state.admin = await api('adminData');
    renderUsers();
    showToast(values.id ? 'Perubahan akun berhasil disimpan.' : 'Pengguna baru berhasil ditambahkan.');
  }, 'Menyimpan akun...');
}

async function saveProvider(form) {
  const values = formValues(form);
  values.enabled = form.elements.enabled.checked;
  values.clear = form.elements.clear.checked;
  const accepted = await EduNotify.ask({
    title: values.clear ? 'Hapus API key tersimpan?' : 'Simpan konfigurasi AI?',
    message: `Provider: ${title(values.id)}\nModel: ${values.model || '[belum diisi]'}\nStatus: ${values.enabled ? 'Aktif' : 'Nonaktif'}\n\n` +
      (values.clear ? 'API key lama akan dihapus. Jangan aktifkan provider tanpa key yang valid.' : 'Konfigurasi ini akan digunakan untuk permintaan AI berikutnya.'),
    confirmText: values.clear ? 'Hapus key & simpan' : 'Simpan konfigurasi',
    cancelText: 'Batal', danger: values.clear, icon: '⚙'
  });
  if (!accepted) return;
  await run(async () => {
    await api('saveProvider', values);
    form.elements.key.value = '';
    state.admin = await api('adminData');
    applyBoot(await api('boot'));
    renderSettings();
    showToast('Konfigurasi provider berhasil disimpan.');
  }, 'Menyimpan provider...');
}

async function saveSettings(form) {
  const values = formValues(form);
  const accepted = await EduNotify.ask({
    title: 'Ubah batas generate harian?',
    message: `Batas baru: ${values.dailyLimit} percobaan per akun per hari WIB.\nBatas ini bukan pembatas tagihan uang atau token provider.`,
    confirmText: 'Simpan kuota', cancelText: 'Batal', icon: '⚙'
  });
  if (!accepted) return;
  await run(async () => {
    await api('saveSettings', values);
    state.admin = await api('adminData');
    applyBoot(await api('boot'));
    renderSettings();
    showToast('Batas penggunaan berhasil diperbarui.');
  }, 'Menyimpan pengaturan...');
}

async function copyDocument() {
  try {
    await navigator.clipboard.writeText(document.querySelector('#editor-text').value);
    showToast('Teks dokumen berhasil disalin.');
  } catch (_) {
    document.querySelector('#editor-text').select();
    EduNotify.toast('Tekan Ctrl+C atau gunakan menu salin pada perangkat Anda.', {type: 'info'});
  }
}
