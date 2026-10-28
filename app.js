/**
 * ============================================================================
 * EDUPLAN AI — FULL FRONTEND + FIREBASE (Versi Final dengan Pemformatan Resmi)
 * ============================================================================
 * 
 * DAFTAR ISI KELOMPOK FUNGSI:
 * F01          : Sistem Notifikasi (EduNotify)
 * F02 - F15    : Utilitas (DOM, Format, Elemen HTML)
 * F16          : Koneksi Database & Server (Firebase & Gemini API)
 * F17 - F21    : Autentikasi & Sesi (Login, Logout, Boot)
 * F22 - F28    : Antarmuka Utama & Navigasi (Shell, Menu, Breadcrumb)
 * F29 - F30    : Halaman Dashboard & Kategori
 * F31 - F33    : Fitur AI Generator (Borang & Proses Generate)
 * F34 - F42    : Editor Dokumen & Ekspor (Simpan, Unduh Word/PDF, Salin)
 * F43 - F45    : Pengelolaan Dokumen (Riwayat, Favorit, Sampah)
 * F46 - F47    : Pengaturan Profil Guru
 * F48 - F55    : Panel Administrator (Pengguna, Provider AI, Kuota, Log)
 * F56          : Halaman Bantuan
 * F57 - F62    : Penanganan Event (Klik, Input, Submit, Tema, Inisialisasi)
 * ============================================================================
 */

'use strict';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, increment, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAOx9xheoXL_pzhpmQvGS5ZGwE3VSc0W8",
  authDomain: "eduplan-ai-85e82.firebaseapp.com",
  projectId: "eduplan-ai-85e82",
  storageBucket: "eduplan-ai-85e82.firebasestorage.app",
  messagingSenderId: "267997672998",
  appId: "1:267997672998:web:e331c0531e65789cd518e7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const auth = getAuth(app);

const CONFIG = Object.freeze({
  SESSION_KEY: 'eduplan-session',
  THEME_KEY: 'eduplan-theme',
  PAGE_SIZE: 12
});

const TITLES = {
  rpp: 'RPP', modul_ajar: 'Modul Ajar', atp: 'ATP', cp_rujukan: 'CP Rujukan',
  tp: 'TP', kktp: 'KKTP', lkpd: 'LKPD', prota: 'Prota', promes: 'Promes',
  distribusi_tp: 'Distribusi TP'
};

const state = {
  token: sessionStorage.getItem(CONFIG.SESSION_KEY) || '',
  user: null,
  catalog: {},
  providers: [],
  documents: [],
  usage: {used: 0, limit: 0},
  route: 'dashboard',
  category: '',
  generatorType: '',
  editor: null,
  dirty: false,
  busy: false,
  admin: null,
  filters: {query: '', type: '', provider: '', page: 1},
  toastTimer: null,
  tempReference: ''
};

/* ==========================================================================
 * F01 | EduNotify
 * Deskripsi: Sistem kustom untuk menampilkan pop-up notifikasi (toast) 
 *            dan kotak dialog konfirmasi (modal) tanpa bawaan browser.
 * ========================================================================== */
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

/* ==========================================================================
 * KELOMPOK UTILITAS (F02 - F15)
 * Deskripsi: Fungsi-fungsi kecil pembantu untuk manipulasi teks, 
 *            pembuatan elemen HTML, dan pengelolaan *loading*.
 * ========================================================================== */
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const title = key => TITLES[key] || String(key || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const dateText = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('id-ID', {dateStyle: 'medium', timeStyle: 'short'});
};
const button = (text, action, attrs = '', kind = '') => `<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${text}</button>`;
const badge = (text, kind = '') => `<span class="badge ${kind}">${escapeHTML(text)}</span>`;
const field = (name, label, value = '', options = {}) => `
  <label class="field ${options.full ? 'span-2' : ''}">
    <span>${escapeHTML(label)}</span>
    <input name="${name}" type="${options.type || 'text'}" value="${escapeHTML(value)}"
      ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''}
      ${options.max ? `maxlength="${options.max}"` : ''}
      ${options.placeholder ? `placeholder="${escapeHTML(options.placeholder)}"` : ''}
      ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ''}>
  </label>`;
const selectField = (name, label, items, selected = '') => `
  <label class="field"><span>${escapeHTML(label)}</span><select name="${name}">
    ${items.map(item => {
      const value = typeof item === 'string' ? item : item.value;
      const text = typeof item === 'string' ? title(item) : item.text;
      return `<option value="${escapeHTML(value)}" ${value === selected ? 'selected' : ''}>${escapeHTML(text)}</option>`;
    }).join('')}
  </select></label>`;
const textarea = (name, label, placeholder = '') => `
  <label class="field"><span>${escapeHTML(label)}</span><textarea
    name="${escapeHTML(name)}"
    placeholder="${escapeHTML(placeholder)}"
    rows="${name === 'reference' ? 14 : 5}"
  ></textarea></label>`;
const check = (name, text, checked = false) => `
  <label class="check"><input name="${name}" type="checkbox" ${checked ? 'checked' : ''}>${escapeHTML(text)}</label>`;

function showToast(message, error = false) {
  const legacy = document.querySelector('#toast');
  if (legacy) legacy.hidden = true;
  EduNotify.toast(message, {type: error ? 'error' : 'success'});
}

function setBusy(value, message = 'Memproses...') {
  state.busy = value;
  $('#loading').hidden = !value;
  $('#loading-message').textContent = message;
  $('#app').setAttribute('aria-busy', String(value));
}

async function run(task, message) {
  if (state.busy) return null;
  setBusy(true, message);
  try { return await task(); }
  catch (error) {
    showToast(error.message, true);
    if (error.code === 'AUTH') { clearSession(); renderLogin(); }
    return null;
  } finally { setBusy(false); }
}

function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }

/* ==========================================================================
 * F16 | api (KONEKSI SERVER / DATABASE)
 * Deskripsi: Satu-satunya gerbang komunikasi antara aplikasi (Frontend) 
 *            dengan Firebase Firestore dan Server Gemini AI.
 * ========================================================================== */
async function api(action, params = {}) {
  try {
    switch (action) {
		
		
		case 'resetPassword':
        await sendPasswordResetEmail(auth, params.email);
        return true;
      
	 case 'register':
        // 1. Buat akun di sistem autentikasi Firebase (mengamankan password)
        const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);
        const newUser = userCredential.user;
        
        // 2. Simpan profil lengkapnya ke Firestore Database
        const registerData = { 
          email: params.email, 
          name: params.name, 
          school: params.school, 
          whatsapp: params.whatsapp,
          role: 'guru', // Default pendaftar baru adalah guru
          active: true, // Atau false jika butuh persetujuan admin dulu
          tokenBalance: 0, // Bonus token awal jika ada
          dailyQuota: 10
        };
        await setDoc(doc(db, "Users", params.email), registerData);
       return { token: params.email, user: registerData };

      case 'login':
        // 1. Verifikasi email dan password ke Firebase Auth
        const loginCredential = await signInWithEmailAndPassword(auth, params.email, params.password);
        
        // 2. Ambil data profilnya dari Firestore
        const userRefLogin = doc(db, "Users", params.email);
        const userSnapLogin = await getDoc(userRefLogin);
        
        if (!userSnapLogin.exists()) throw new Error("Profil pengguna tidak ditemukan di database.");
        const userData = userSnapLogin.data();
        if (userData.active === false) throw new Error("Akun ini belum diaktifkan atau dinonaktifkan admin.");
        
       return { token: params.email, user: userData };

      case 'boot':
        const userRef = doc(db, "Users", state.token);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("Sesi tidak valid. Silakan login ulang.");
        const bootUserData = userSnap.data();

        const provQ = query(collection(db, "Providers"), where("enabled", "==", true));
        const provSnap = await getDocs(provQ);
        const activeProviders = provSnap.docs.map(d => d.data());

        const docsRefBoot = collection(db, "Documents");
        const qDocsBoot = query(docsRefBoot, where("owner", "==", bootUserData.email));
        const docsSnapBoot = await getDocs(qDocsBoot);
        const userDocs = docsSnapBoot.docs.map(d => {
           const data = d.data();
           return { id: data.id, title: data.title, type: data.type, provider: data.provider, owner: data.owner, updated: data.updated, created: data.created, revision: data.revision, deleted: data.deleted || false, favorite: data.favorite || false };
        }).sort((a, b) => b.updated - a.updated);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const usedToday = userDocs.filter(d => d.created >= todayStart.getTime()).length;

        const settingsRefBoot = doc(db, "Settings", "global");
        const settingsSnapBoot = await getDoc(settingsRefBoot);
        const dailyLimit = settingsSnapBoot.exists() ? settingsSnapBoot.data().dailyLimit : 10;

        const appCatalog = {
          perencanaan: { 
            title: 'Perencanaan', 
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`, 
            items: ['rpp', 'modul_ajar', 'atp', 'tp', 'kktp', 'lkpd', 'distribusi_tp'] 
          },
          program: { 
            title: 'Program', 
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`, 
            items: ['prota', 'promes', 'program_literasi', 'program_ekstrakurikuler', 'program_remedial', 'program_pengayaan', 'kalender_pendidikan'] 
          },
          asesmen: { 
            title: 'Asesmen', 
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`, 
            items: ['bank_soal', 'kisi_kisi', 'asesmen_diagnostik', 'asesmen_formatif', 'asesmen_sumatif', 'rubrik_penilaian', 'lembar_observasi', 'jurnal_sikap'] 
          },
          administrasi: { 
            title: 'Administrasi', 
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`, 
            items: ['buku_tamu', 'buku_agenda', 'daftar_hadir', 'notulen_rapat', 'surat_tugas', 'surat_pemberitahuan', 'tata_tertib'] 
          },
          bahan_media: { 
            title: 'Bahan & Media', 
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`, 
            items: ['bahan_bacaan', 'skenario_video', 'naskah_podcast', 'slide_presentasi', 'ide_games', 'flashcard', 'poster_edukasi', 'teks_pidato', 'teks_puisi', 'cerita_pendek', 'skenario_roleplay'] 
          }
        };

        return {
          user: bootUserData,
          catalog: appCatalog,
          providers: activeProviders,
          documents: userDocs,
          usage: { used: usedToday, limit: dailyLimit }
        };

      case 'adminData':
        const usersListSnap = await getDocs(collection(db, "Users"));
        const usersList = usersListSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const allProvSnap = await getDocs(collection(db, "Providers"));
        const provList = allProvSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const defaultProv = ['gemini', 'openai', 'claude'];
        const finalProv = defaultProv.map(id => {
          return provList.find(p => p.id === id) || { id, model: '', key: '', enabled: false, configured: false };
        });

       const settingsSnapAdmin = await getDoc(doc(db, "Settings", "global"));
        const adminLimit = settingsSnapAdmin.exists() ? settingsSnapAdmin.data().dailyLimit : 10;

        // Ambil data log dari Firebase Firestore
        const logsSnap = await getDocs(collection(db, "Logs"));
        const logsList = logsSnap.docs.map(d => d.data()).sort((a, b) => b.created - a.created).slice(0, 200);

        return { users: usersList, providers: finalProv, settings: { dailyLimit: adminLimit }, logs: logsList };

      case 'saveProvider':
        const provRef = doc(db, "Providers", params.id);
        const provData = { id: params.id, model: params.model, enabled: params.enabled };
        if (params.key && !params.clear) {
          provData.key = params.key;
          provData.configured = true;
        } else if (params.clear) {
          provData.key = '';
          provData.configured = false;
        }
        await setDoc(provRef, provData, { merge: true });
        return true;
		
      case 'testProvider':
        const testProvRef = doc(db, "Providers", params.id);
        const testProvSnap = await getDoc(testProvRef);
        if (!testProvSnap.exists() || !testProvSnap.data().key) {
          throw new Error("API Key belum dikonfigurasi atau tidak ditemukan.");
        }
        const apiKey = testProvSnap.data().key;
        const modelName = testProvSnap.data().model || 'gemini-3.8-flash';
        
        if (params.id === 'gemini') {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Halo, balas dengan kalimat singkat: 'Koneksi ke Gemini berhasil!' jika kamu menerima pesan ini." }] }]
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || "Gagal menghubungi server Gemini.");
          return { text: data.candidates[0].content.parts[0].text };
        } else {
          throw new Error(`Tes koneksi untuk provider ${params.id} belum tersedia di versi ini.`);
        }
		
case 'generate':
        const genProvRef = doc(db, "Providers", params.provider || 'gemini');
        const genProvSnap = await getDoc(genProvRef);
        if (!genProvSnap.exists() || !genProvSnap.data().key) {
          throw new Error(`API Key untuk ${params.provider || 'gemini'} belum dikonfigurasi.`);
        }
        const apiKeyGen = genProvSnap.data().key;
        const modelNameGen = genProvSnap.data().model || (params.provider === 'openai' ? 'gpt-4o' : params.provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gemini-3.8-flash');

        const promptText = `Anda adalah asisten AI profesional untuk guru di Indonesia. Buat draf ${params.type.replace(/_/g, ' ')}.
Mata Pelajaran: ${params.subject || '-'}
Fase/Kelas: ${params.level || '-'}
Topik: ${params.topic || '-'}
Konteks/Referensi: ${params.reference || '-'}
Instruksi Khusus: ${params.instructions || '-'}
Berikan hasil langsung berupa isi dokumen yang terstruktur, rapi, dan siap digunakan tanpa basa-basi atau kalimat pembuka/penutup.`;

        let generatedText = "";
        const activeProvider = params.provider || 'gemini';

        // 1. JIKA PROVIDER GEMINI
        if (activeProvider === 'gemini') {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelNameGen}:generateContent?key=${apiKeyGen}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || "Gagal membuat dokumen dari server Gemini.");
          generatedText = data.candidates[0].content.parts[0].text;
        } 
        
        // 2. JIKA PROVIDER OPENAI (GPT)
        else if (activeProvider === 'openai') {
          const endpoint = 'https://api.openai.com/v1/chat/completions';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKeyGen}`
            },
            body: JSON.stringify({
              model: modelNameGen,
              messages: [{ role: 'user', content: promptText }],
              temperature: 0.7
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || "Gagal membuat dokumen dari server OpenAI.");
          generatedText = data.choices[0].message.content;
        } 
        
        // 3. JIKA PROVIDER CLAUDE (ANTHROPIC)
        else if (activeProvider === 'claude') {
          const endpoint = 'https://api.anthropic.com/v1/messages';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': apiKeyGen,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true' // Diperlukan agar fetch langsung dari browser PWA
            },
            body: JSON.stringify({
              model: modelNameGen,
              max_tokens: 4000,
              messages: [{ role: 'user', content: promptText }]
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message?.message || "Gagal membuat dokumen dari server Claude.");
          generatedText = data.content[0].text;
        } 
        
        else {
          throw new Error(`Provider ${activeProvider} tidak dikenali.`);
        }

        const newDocRef = doc(collection(db, "Documents"));
        const docData = {
          id: newDocRef.id,
          owner: state.user.email,
          title: `Draf ${params.type.replace(/_/g, ' ')} - ${params.topic || 'Baru'}`,
          type: params.type,
          provider: activeProvider,
          created: Date.now(),
          updated: Date.now(),
          revision: 1,
          deleted: false,
          favorite: false,
          content: generatedText
        };
        await setDoc(newDocRef, docData);

        return {
          doc: { id: docData.id, title: docData.title, type: docData.type, provider: docData.provider, owner: docData.owner, updated: docData.updated, revision: docData.revision, deleted: false, favorite: false },
          text: generatedText,
          usage: { used: state.usage.used + 1, limit: state.usage.limit }
        };

      case 'saveDocument':
        const updateRef = doc(db, "Documents", params.id);
        await setDoc(updateRef, {
          title: params.title,
          content: params.text,
          updated: Date.now(),
          revision: params.revision + 1
        }, { merge: true });
        const updatedSnap = await getDoc(updateRef);
        return updatedSnap.data();

       case 'listDocuments':
        const docsRef = collection(db, "Documents");
        const qDocs = query(docsRef, where("owner", "==", state.user.email));
        const docsSnap = await getDocs(qDocs);
        return docsSnap.docs.map(docSnap => {
          const data = docSnap.data();
          return { id: data.id, title: data.title, type: data.type, provider: data.provider, owner: data.owner, updated: data.updated, revision: data.revision, deleted: data.deleted || false, favorite: data.favorite || false };
        }).sort((a, b) => b.updated - a.updated);

      case 'readDocument':
        const readRef = doc(db, "Documents", params.id);
        const readSnap = await getDoc(readRef);
        if (!readSnap.exists()) throw new Error("Dokumen tidak ditemukan di database.");
        const readData = readSnap.data();
        return {
          doc: { id: readData.id, title: readData.title, type: readData.type, provider: readData.provider, owner: readData.owner, updated: readData.updated, revision: readData.revision, deleted: readData.deleted, favorite: readData.favorite },
          text: readData.content
        };

      case 'trashDocument':
        const trashRef = doc(db, "Documents", params.id);
        await setDoc(trashRef, { deleted: params.value, updated: Date.now() }, { merge: true });
        const trashSnap = await getDoc(trashRef);
        return trashSnap.data();

      case 'favoriteDocument':
        const favRef = doc(db, "Documents", params.id);
        await setDoc(favRef, { favorite: params.value, updated: Date.now() }, { merge: true });
        const favSnap = await getDoc(favRef);
        return favSnap.data();

      case 'saveProfile':
        const profileRef = doc(db, "Users", state.token);
        await setDoc(profileRef, { name: params.name, school: params.school }, { merge: true });
        const updatedProfileSnap = await getDoc(profileRef);
        return updatedProfileSnap.data();

      case 'saveUser':
        const userDocRef = params.id ? doc(db, "Users", params.id) : doc(collection(db, "Users"));
        const newUserData = { email: params.email, name: params.name, school: params.school || '', role: params.role, active: params.active };
        await setDoc(userDocRef, newUserData, { merge: true });
        return true;

      case 'saveSettings':
        const settingsRef = doc(db, "Settings", "global");
        await setDoc(settingsRef, { dailyLimit: Number(params.dailyLimit) }, { merge: true });
        return true;
		

     case 'logActivity':
        const logRef = doc(collection(db, "Logs"));
        await setDoc(logRef, {
          id: logRef.id,
          email: state.user.email,
          action: params.action,
          target: params.target,
          created: Date.now()
        });
        return true;

      case 'logout':
        return true;

      default:
        throw new Error(`Tindakan ${action} belum terhubung ke Firebase.`);
    }
  } catch (error) {
    throw error;
  }
}

/* ==========================================================================
 * KELOMPOK AUTENTIKASI & SESI (F17 - F21)
 * Deskripsi: Mengelola penyimpanan token pengguna di peramban, rendering
 *            layar login, verifikasi login, dan memuat data awal (boot).
 * ========================================================================== */
function clearSession() {
  sessionStorage.removeItem(CONFIG.SESSION_KEY);
  state.token = '';
  state.user = null;
  state.editor = null;
  state.dirty = false;
  document.body.classList.remove('menu-open');
}

function renderLogin() {
  $('#app').innerHTML = `
    <main class="login" id="content">
      <section class="login-hero">
        <div class="login-brand">
          <span class="brand-mark" aria-hidden="true">✦</span>
          <div class="login-brand-text">
            <span class="login-brand-name">EduPlan AI</span>
          </div>
        </div>
        <span class="eyebrow">✦ SMART EDUCATOR WORKSPACE</span>
        <h1>Lebih sedikit administrasi.<br>Lebih banyak inspirasi.</h1>
        <p>Susun perangkat ajar, rencanakan pembelajaran, dan kelola dokumen dalam satu ruang kerja.</p>
        <div class="login-points"><span>Keamanan Standar Industri</span><span>Sistem Multi-AI</span><span>Cloud Terenkripsi</span></div>
      </section>
      
      <section class="login-panel">
        <div class="login-box" id="login-form-container">
          <h1>Selamat datang 👋</h1>
          <p class="muted">Masuk ke ruang kerja dengan email dan sandi Anda.</p>
          <form data-form="login">
            ${field('email', 'Alamat email', '', {type: 'email', required: true, max: 254, autocomplete: 'email'})}
<label class="field" style="position: relative;">
  <span>Kata sandi</span>
  <input name="password" type="password" required maxlength="100" style="padding-right: 40px;">
  <button type="button" data-action="toggle-password" style="position: absolute; right: 10px; bottom: 8px; background: transparent; border: none; cursor: pointer; padding: 4px; color: #64748b; display: flex; align-items: center;" title="Lihat/Sembunyikan">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  </button>
</label>

<div style="text-align: right; margin-top: -8px; margin-bottom: 16px;">
  <button type="button" data-action="forgot-password" style="background: transparent; border: none; color: #4f46e5; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Lupa kata sandi?</button>
</div>


            <button type="submit" class="btn btn-primary full">Masuk ke ruang kerja →</button>
          </form>
          <div style="margin-top: 24px; text-align: center; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 20px;">
            <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px;">Belum memiliki akun?</p>
            <button type="button" class="btn btn-outline full" onclick="document.getElementById('login-form-container').style.display='none'; document.getElementById('register-form-container').style.display='block';">Daftar Akun Baru</button>
          </div>
        </div>

        <div class="login-box" id="register-form-container" style="display: none;">
          <h1>Buat Akun Baru 🚀</h1>
          <p class="muted">Lengkapi data diri Anda untuk membuat ruang kerja.</p>
          <form data-form="register">
            <div class="form-grid">
              ${field('name', 'Nama lengkap', '', {required: true, max: 100, full: true})}
              ${field('school', 'Nama instansi/sekolah', '', {required: true, max: 150})}
              ${field('whatsapp', 'No. WhatsApp', '', {type: 'tel', required: true, max: 20, placeholder: '08123...'})}
              ${field('email', 'Alamat email', '', {type: 'email', required: true, max: 254, full: true})}
<label class="field span-2" style="position: relative;">
  <span>Buat kata sandi</span>
  <input name="password" type="password" required maxlength="100" placeholder="Minimal 6 karakter" style="padding-right: 40px;">
  <button type="button" data-action="toggle-password" style="position: absolute; right: 10px; bottom: 8px; background: transparent; border: none; cursor: pointer; padding: 4px; color: #64748b; display: flex; align-items: center;" title="Lihat/Sembunyikan">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  </button>
</label>
            </div>
            <button type="submit" class="btn btn-primary full mt-20">Daftar Sekarang →</button>
          </form>
         <div style="margin-top: 24px; text-align: center; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 20px;">
  <span style="font-size: 0.9rem; color: #64748b;">Sudah memiliki akun?</span>
  <button type="button" style="background: transparent; border: none; color: #4f46e5; font-weight: 600; font-size: 0.9rem; cursor: pointer; padding: 0 0 0 4px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="document.getElementById('register-form-container').style.display='none'; document.getElementById('login-form-container').style.display='block';">Masuk di sini</button>
</div>
        </div>
      </section>
    </main>`;
}


async function register(form) {
  const values = formValues(form);
  if (values.password.length < 6) {
    EduNotify.toast('Kata sandi minimal 6 karakter.', {type: 'error'});
    return;
  }
  await run(async () => {
    const session = await api('register', {
      email: values.email.trim().toLowerCase(),
      password: values.password,
      name: values.name.trim(),
      school: values.school.trim(),
      whatsapp: values.whatsapp.trim()
    });
    // Otomatis masuk setelah daftar berhasil
    state.token = session.token;
    sessionStorage.setItem(CONFIG.SESSION_KEY, state.token);
    applyBoot(await api('boot'));
    renderShell();
    renderDashboard();
    window.Swal.fire('Pendaftaran Berhasil', 'Selamat datang di ruang kerja baru Anda!', 'success');
  }, 'Mendaftarkan akun Anda...');
}



async function login(form) {
  const values = formValues(form);
  await run(async () => {
    // Parameter password kini ditambahkan ke dalam pemanggilan API
    const session = await api('login', {
      email: values.email.trim().toLowerCase(),
      password: values.password
    });
    
    state.token = session.token;
    sessionStorage.setItem(CONFIG.SESSION_KEY, state.token);
    applyBoot(await api('boot'));
    renderShell();
    renderDashboard();
  }, 'Memverifikasi akun...');
}

function applyBoot(data) {
  Object.assign(state, {user: data.user, catalog: data.catalog, providers: data.providers, documents: data.documents, usage: data.usage});
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

/* ==========================================================================
 * KELOMPOK ANTARMUKA UTAMA & NAVIGASI (F22 - F28)
 * Deskripsi: Merender kerangka tata letak utama (bilah sisi, header), 
 *            mengatur ikon pengguna, dan mengontrol pindah halaman.
 * ========================================================================== */
/* ==========================================================================
 * KELOMPOK ANTARMUKA UTAMA & NAVIGASI (F22 - F28)
 * ========================================================================== */
function navItem(route, text, icon, extra = '') {
  return `<button type="button" class="nav-item" data-action="navigate" data-route="${route}" ${extra}>
    <span class="nav-icon" aria-hidden="true">${icon}</span>${escapeHTML(text)}</button>`;
}

function renderRoleAvatar(role) {
  const isAdmin = role === 'admin';
  const roleLabel = isAdmin ? 'Administrator' : 'Guru';
  const adminIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 6v5.2c0 4.3 3 7.8 7.5 9.8 4.5-2 7.5-5.5 7.5-9.8V6L12 3Z"/><path d="m8.5 11.8 2.3 2.3 4.7-4.8" /></svg>`;
  const teacherIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="5.5" r="2.5" /><path d="M7.5 11a5.5 5.5 0 0 1 9 0" /><path d="M3.5 12.5c3-.7 5.8-.1 8.5 1.7 2.7-1.8 5.5-2.4 8.5-1.7v7 c-3-.7-5.8-.1-8.5 1.5 -2.7-1.6-5.5-2.2-8.5-1.5v-7Z"/><path d="M12 14.2V21" /></svg>`;
  return `<span class="role-avatar ${isAdmin ? 'role-avatar-admin' : 'role-avatar-teacher'}" role="img" aria-label="${roleLabel}" title="${roleLabel}">${isAdmin ? adminIcon : teacherIcon}</span>`;
}

function renderShell() {
  const user = state.user;
  const categories = Object.entries(state.catalog).map(([key, value]) => navItem('category', value.title, value.icon, `data-category="${key}"`)).join('');
  const admin = user.role === 'admin' ? `
    <div class="nav-title">ADMINISTRATOR</div>
    ${navItem('users', 'Manajemen pengguna', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>')}
    ${navItem('settings', 'Pengaturan AI & kuota', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>')}
    ${navItem('logs', 'Log aktivitas', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>')}` : '';
  
  $('#app').innerHTML = `
    <button class="backdrop" type="button" data-action="close-menu" aria-label="Tutup menu"></button>
    <aside class="sidebar" aria-label="Menu utama">
      <div class="brand-block">
        <span class="brand-mark" aria-hidden="true">✦</span>
        <div class="brand-text">
          <span class="brand-name">EduPlan <span class="brand-ai">AI</span></span>
          <a class="developer-credit" href="https://www.tiktok.com/@putramadasa" target="_blank" rel="noopener noreferrer" aria-label="Buka TikTok Arom Kobama, @putramadasa">
            Developed by <span>Arom Kobama</span>
          </a>
        </div>
      </div>
      <nav>
        <div class="nav-title">RUANG KERJA</div>
        ${navItem('dashboard', 'Dashboard', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>')}
        ${categories}
        <div class="nav-title">DOKUMEN</div>
        ${navItem('history', 'Riwayat dokumen', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>')}
        ${navItem('favorites', 'Favorit', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>')}
        ${navItem('trash', 'Sampah', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>')}
        ${navItem('profile', 'Profil guru & sekolah', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>')}
        ${admin}
        <div class="nav-title">LAINNYA</div>
        ${navItem('help', 'Panduan penggunaan', '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>')}
        <button type="button" class="nav-item" data-action="theme"><span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></span>Ganti tema</button>
        <button type="button" class="nav-item" data-action="logout"><span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span>Keluar</button>
      </nav>
      <div class="sidebar-footer">Hasil AI adalah draf. Tinjau kembali isi dan rujukan sebelum digunakan.</div>
    </aside>
    
    <main class="main" style="display: flex; flex-direction: column; min-height: 100vh;">
      <header class="topbar">
        <div class="row">
          ${button('☰', 'toggle-menu', 'aria-label="Buka menu"', 'btn-outline btn-icon mobile-only')}
          <div class="breadcrumb">Workspace / <span id="breadcrumb">Dashboard</span></div>
        </div>
        <div class="user-chip">
          ${renderRoleAvatar(user.role)}
          <div class="user-label"><span>${escapeHTML(user.name)}</span><small>${user.role === 'admin' ? 'Administrator' : 'Guru'}</small></div>
        </div>
      </header>
      
      <div class="content" id="content" tabindex="-1" style="flex: 1;"></div>
      
      <div style="margin-top: auto; padding-top: 48px;">
        <footer style="padding: 24px 32px; border-top: 1px solid rgba(128, 128, 128, 0.15); background-color: rgba(128, 128, 128, 0.02); color: var(--muted-color, #64748b); font-size: 0.85rem;">
          <div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; max-width: 1200px; margin: 0 auto; gap: 28px;">
            
            <div style="display: flex; align-items: center; gap: 10px;">
               <span style="display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);" title="Sistem Aktif"></span>
               <span style="font-weight: 600; color: var(--text-color, #1e293b); letter-spacing: 0.3px;">EduPlan AI</span>
               <span>&copy; ${new Date().getFullYear()}</span>
            </div>
            
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
               <!-- Badge Versi dihapus sesuai permintaan -->
               
               <span style="display: flex; align-items: center; gap: 6px;">
                 Dirancang oleh 
                 <a href="https://www.tiktok.com/@putramadasa" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color, #4f46e5); text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 4px; transition: opacity 0.2s;">
                   Arom Kobama
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                 </a>
               </span>
            </div>
            
          </div>
        </footer>
      </div>
    </main>`;
}

function setRoute(route, text, category = '') {
  state.route = route;
  state.category = category;
  $('#breadcrumb').textContent = text;
  if (document.body.classList.contains('menu-open')) history.back();
  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    const active = item.dataset.route === route && (route !== 'category' || item.dataset.category === category);
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
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
  if (route === 'dashboard') {
    await run(async () => { applyBoot(await api('boot')); }, 'Menyinkronkan data...');
    return renderDashboard();
  }
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

function pageHead(heading, description) {
  return `<div class="page-head"><h1>${escapeHTML(heading)}</h1><p>${escapeHTML(description)}</p></div>`;
}

/* ==========================================================================
 * KELOMPOK HALAMAN DASHBOARD & KATEGORI (F29 - F30)
 * Deskripsi: Halaman beranda yang menampilkan statistik penggunaan AI, 
 *            dan halaman daftar menu untuk membuat perangkat ajar baru.
 * ========================================================================== */
function renderDashboard() {
  setRoute('dashboard', 'Dashboard');
  const documents = state.documents.filter(doc => !doc.deleted);
  const tokenBalance = state.user.tokenBalance || 0; 

  const stats = [
    ['Sisa Saldo Token', tokenBalance.toLocaleString('id-ID')],
    ['Dokumen tersimpan', documents.length],
    ['Provider AI aktif', state.providers.length],
    ['Percobaan generate hari ini', `${state.usage.used} / ${state.usage.limit}`]
  ];
  
  const cards = Object.entries(state.catalog).map(([key, category]) => `
    <button type="button" class="card tile" data-action="navigate" data-route="category" data-category="${key}">
      <span class="tile-icon">${category.icon}</span>
      <h2>${escapeHTML(category.title)}</h2>
      <p>${category.items.length} jenis dokumen untuk mendukung kegiatan pembelajaran.</p>
      <span class="tile-link">Buka generator →</span>
    </button>`).join('');
    
  $('#content').innerHTML = `<div class="stack">
    <section class="hero">
      <span class="eyebrow">✦ AI TEACHING CO-PILOT</span>
      <h1>Selamat berkarya, ${escapeHTML(state.user.name)}.</h1>
      <p>Mulai dari perencanaan hingga refleksi. Buat draf perangkat ajar, sesuaikan isinya, lalu simpan dalam satu ruang kerja.</p>
      
      <!-- TOMBOL BUAT DOKUMEN & TOP-UP DISEJAJARKAN DI SINI -->
      <div class="row" style="display: flex; gap: 10px; width: 100%; align-items: center;">
        <button type="button" class="btn btn-primary" data-action="navigate" data-route="category" data-category="perencanaan" style="flex: 1; justify-content: center; white-space: nowrap; padding: 12px 14px; font-size: 0.9rem;">
          ✦ Buat dokumen baru
        </button>
        
        <a href="https://wa.me/6287846666636?text=Halo%20Admin%20EduPlan%20AI,%20saya%20ingin%20top-up%20saldo%20token%20untuk%20akun:%20${state.user.email}" target="_blank" style="flex: 1; background: rgba(255, 255, 255, 0.15); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.4); padding: 12px 14px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; text-decoration: none; display: inline-flex; justify-content: center; align-items: center; gap: 6px; backdrop-filter: blur(5px); white-space: nowrap;" title="Top-Up Saldo Token">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 
          Top-Up Saldo
        </a>
      </div>
    </section>
    
    <!-- KARTU STATISTIK KEMBALI BERSIH 2x2 TANPA TOMBOL MENUTUPI TEKS -->
    <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 16px;">
      ${stats.map(([name, value]) => `
        <div class="card" style="margin-bottom: 0; padding: 16px;">
          <div class="stat-label" style="font-size: 0.8rem; margin-bottom: 6px; color: #64748b;">${name}</div>
          <div class="stat-number" style="font-size: 1.6rem; font-weight: bold; ${name === 'Sisa Saldo Token' ? 'color: #10b981;' : ''}">${escapeHTML(value)}</div>
        </div>
      `).join('')}
    </div>

    <section><h2 class="section-title">Apa yang ingin Anda buat?</h2><div class="grid">${cards}</div></section>
    <div class="notice">Verifikasi CP, regulasi, perhitungan, dan kalender pendidikan sebelum dipakai. Hindari memasukkan data pribadi siswa ke layanan AI.</div>
  </div>`;
}

function renderCategory(key) {
  const category = state.catalog[key];
  if (!category) return;
  setRoute('category', category.title, key);
  $('#content').innerHTML = `
    ${pageHead(category.title, 'Pilih jenis dokumen yang ingin disusun.')}
    <div class="toolbar mb-20"><input id="type-search" aria-label="Cari jenis dokumen" placeholder="Cari jenis dokumen..."></div>
    <div class="grid" id="type-grid">
      ${category.items.map(type => `
        <button type="button" class="card tile" data-action="generator" data-type="${type}" data-search="${escapeHTML(title(type).toLowerCase())}">
          <span class="tile-icon">✦</span><h2>${escapeHTML(title(type))}</h2>
          <p>Susun draf ${escapeHTML(title(type).toLowerCase())} berdasarkan materi dan konteks sekolah Anda.</p>
          <span class="tile-link">Buat sekarang →</span>
        </button>`).join('')}
    </div>`;
}

/* ==========================================================================
 * KELOMPOK FITUR AI GENERATOR (F31 - F33)
 * Deskripsi: Memuat formulir cerdas (berubah sesuai dokumen yang dipilih), 
 *            menyusun instruksi otomatis, dan mengirim permintaan ke Gemini.
 * ========================================================================== */
function getReferenceExample(type) {
  const examples = {
    "rpp": ["TP: Peserta didik mampu membandingkan dua pecahan dengan penyebut berbeda menggunakan gambar.", "Kondisi awal: Sebagian masih kesulitan membandingkan nilai pecahan.", "CP / sumber: [Tempelkan kutipan CP resmi]"],
    "modul_ajar": ["TP: Peserta didik mampu menjelaskan perubahan wujud benda.", "Data anonim: Dari 30 peserta didik, 10 masih memerlukan contoh konkret.", "Konteks: Pengamatan es yang mencair."],
    "atp": ["CP resmi: [Tempelkan kutipan CP sesuai mata pelajaran]", "Urutan TP awal:\n1. Mengenali pembilang\n2. Membandingkan pecahan penyebut sama", "Kemampuan awal: Peserta didik memahami pembagian benda."],
    "tp": ["CP resmi: [Tempelkan kutipan CP]", "Fokus materi: Pecahan sederhana.", "Kemampuan yang dituju: Membandingkan dua pecahan."],
    "bank_soal": ["Indikator Soal:\n1. Peserta didik dapat menghitung luas segitiga (HOTS C4).\n2. Peserta didik dapat menentukan keliling persegi panjang (C3).", "Konteks Bacaan: [Tempelkan teks bacaan singkat jika ada]", "Kondisi: Hindari soal yang terlalu teoritis, fokus pada soal cerita kontekstual."],
    "kisi_kisi": ["Tujuan Pembelajaran: Menganalisis sistem pencernaan manusia.", "Materi Pokok: Organ pencernaan dan fungsinya.", "Sebaran Kognitif: 30% C3 (Penerapan), 50% C4 (Analisis), 20% C5 (Evaluasi)."],
    "asesmen_diagnostik": ["Tujuan asesmen: Mengetahui pemahaman dasar siswa tentang operasi hitung campuran sebelum masuk materi Aljabar.", "Materi prasyarat: Penjumlahan, pengurangan, perkalian, dan pembagian bilangan bulat.", "Konteks siswa: Latar belakang siswa beragam, butuh instrumen yang tidak mengintimidasi."],
    "asesmen_formatif": ["TP yang dinilai: Menyajikan hasil observasi lingkungan sekitar.", "Bukti yang diharapkan: Jurnal singkat atau infografis sederhana.", "Catatan: Fokus pada instrumen untuk memberikan umpan balik (feedback), bukan sekadar nilai angka."],
    "asesmen_sumatif": ["Lingkup Materi: Bab 1 hingga Bab 3 (Tata Surya, Bumi, Gerhana).", "Kriteria Ketercapaian: Siswa mampu membedakan gerhana bulan dan matahari dengan minimal skor 75.", "Catatan: Sertakan kunci jawaban dan pedoman penskoran di akhir dokumen."],
    "prota": ["Mata pelajaran: Matematika\nKelas / fase: IV / B", "Lingkup materi: Bilangan, pengukuran, dan geometri.", "Kalender pendidikan: [Tempelkan data minggu efektif]"],
    "promes": ["Semester: Ganjil", "Materi / TP:\n1. Bilangan: [Alokasi waktu]\n2. Pecahan: [Alokasi waktu]", "Kegiatan sekolah: Jeda tengah semester di minggu ke-8."]
  };
  const fallback = ['Rujukan/Konteks:', 'Silakan tempelkan referensi materi, indikator, atau data pendukung lainnya yang relevan dengan dokumen ini.', 'Contoh: [Kutipan materi / TP / Catatan khusus / Kondisi kelas]'];
  const parts = Object.prototype.hasOwnProperty.call(examples, type) ? examples[type] : fallback;
  return [`Contoh isian untuk ${title(type)}:`, ...parts, 'Contoh ini hanya ilustrasi. Ganti dengan konteks Anda; jangan masukkan identitas pribadi peserta didik.'].join('\n\n');
}

function getFormConfig(type, providers) {
  const classOptions = ['PAUD / TK', 'Kelas 1 SD/MI (Fase A)', 'Kelas 2 SD/MI (Fase A)', 'Kelas 3 SD/MI (Fase B)', 'Kelas 4 SD/MI (Fase B)', 'Kelas 5 SD/MI (Fase C)', 'Kelas 6 SD/MI (Fase C)', 'Kelas 7 SMP/MTs (Fase D)', 'Kelas 8 SMP/MTs (Fase D)', 'Kelas 9 SMP/MTs (Fase D)', 'Kelas 10 SMA/SMK/MA (Fase E)', 'Kelas 11 SMA/SMK/MA (Fase F)', 'Kelas 12 SMA/SMK/MA (Fase F)', 'Lainnya / Umum'];
  const baseFields = `
    ${field('subject', 'Mata pelajaran *', '', {required: true, max: 150})}
    <label class="field">
      <span>Jenjang / kelas / fase *</span>
      <select name="level_select" id="level-select" required>
        ${classOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
      </select>
    </label>
    <div id="custom-level-container" style="display: none;">
      ${field('level_custom', 'Ketikkan jenjang/kelas spesifik *', '', {max: 100})}
    </div>
    ${field('topic', 'Materi / topik *', '', {required: true, max: 200})}
  `;
  const providerField = selectField('provider', 'Provider AI', providers);
  let grid = '', textareas = '';

  switch (type) {
    case 'rpp':
    case 'modul_ajar':
    case 'rencana_harian':
    case 'rencana_mingguan':
    case 'tp':
    case 'atp':
      grid = `${field('duration', 'Alokasi waktu (JP/Menit)', '', {max: 150})}${field('curriculum', 'Kurikulum (Merdeka/K13)', '', {max: 150})}`;
      textareas = `${textarea('reference', 'Rujukan Materi', getReferenceExample(type))}${textarea('instructions', 'Kebutuhan Khusus (Misal: Gunakan metode Problem Based Learning)', 'Contoh: Rancang dengan metode PBL dan masukkan asesmen formatif.')}`;
      break;
    case 'bank_soal':
    case 'kisi_kisi':
    case 'asesmen_sumatif':
    case 'asesmen_formatif':
    case 'asesmen_diagnostik':
      grid = `${field('jumlah_soal', 'Jumlah Soal', '', {type: 'number', max: 100})}${selectField('bentuk_soal', 'Bentuk Soal', ['Pilihan Ganda', 'Uraian', 'Isian Singkat', 'Campuran'])}`;
      textareas = `${textarea('reference', 'Indikator Soal / Kisi-kisi / Teks Bacaan', getReferenceExample(type))}${textarea('instructions', 'Level Kognitif / Format (Misal: Buat soal HOTS C4-C6)', 'Contoh: 10 soal pilihan ganda level HOTS beserta kunci jawaban.')}`;
      break;
    case 'prota':
    case 'promes':
    case 'kalender_pendidikan':
    case 'distribusi_tp':
      grid = `${field('year', 'Tahun ajaran', '', {max: 40})}${selectField('semester', 'Semester', ['Ganjil', 'Genap'])}`;
      textareas = `${textarea('reference', 'Data Kalender Pendidikan / Total Minggu Efektif', getReferenceExample(type))}${textarea('instructions', 'Catatan Libur / Jadwal Ujian', 'Contoh: Masukkan jadwal PTS di minggu ke-8 dan libur nasional.')}`;
      break;
    default:
      grid = `${field('year', 'Tahun ajaran', '', {max: 40})}${selectField('semester', 'Semester', ['Ganjil', 'Genap'])}${field('duration', 'Keterangan waktu / Periode', '', {max: 150})}`;
      textareas = `${textarea('reference', 'Rujukan resmi / Data mentah (opsional)', getReferenceExample(type))}${textarea('instructions', 'Format laporan / Kebutuhan khusus', 'Contoh: Buatkan dalam bentuk tabel yang mudah dibaca.')}`;
      break;
  }
  return { formGrid: baseFields + grid + providerField, textareas: textareas };
}

async function renderGenerator(type) {
  if (!(await mayLeave())) return;
  state.generatorType = type;
  setRoute('generator', `Generator / ${title(type)}`);
  
  const providers = state.providers.map(p => ({value: p.id, text: `${title(p.id)} · ${p.model}`}));
  const noProvider = providers.length === 0;
  const config = getFormConfig(type, providers);

  document.querySelector('#content').innerHTML = `<div class="stack">
    ${pageHead(`Generator ${title(type)}`, 'Lengkapi konteks pembelajaran agar draf lebih relevan.')}
    <div class="notice">Isian dikirim ke provider pilihan Anda. Gunakan data anonim dan rujukan terverifikasi.</div>
    <form class="card" data-form="generate">
      <h2>Konteks dokumen</h2>
      <div class="form-grid">${config.formGrid}</div>
      ${config.textareas}
      <p class="muted">Contoh di dalam kolom hanya ilustrasi. Guru: ${escapeHTML(state.user.name)} · Sekolah: ${escapeHTML(state.user.school || '[belum diisi]')}</p>
      <div class="row">
        <button class="btn btn-primary" type="submit" ${noProvider ? 'disabled' : ''}>✦ Generate & simpan draf</button>
        ${button('Profil guru & sekolah', 'navigate', 'data-route="profile"', 'btn-outline')}
      </div>
      ${noProvider ? '<p class="notice mt-20">Belum ada provider aktif. Hubungi admin.</p>' : ''}
    </form>
  </div>`;
  
  if (state.tempReference) {
    const referenceField = document.querySelector('textarea[name="reference"]');
    if (referenceField) referenceField.value = state.tempReference;
    state.tempReference = '';
  }
}


async function generate(form) {
  const values = formValues(form);
  let finalLevel = values.level_select || values.level;
  if (finalLevel === 'Lainnya / Umum') finalLevel = values.level_custom;
  
  const params = { ...values, level: finalLevel, type: state.generatorType };
  delete params.level_select;
  delete params.level_custom;

  await run(async () => {
    // 1. TENTUKAN TARIF TOKEN BERDASARKAN JENIS DOKUMEN
    let tokenCost = 500; 
    const docType = state.generatorType;

    if (docType === 'rpp' || docType === 'modul_ajar') {
      tokenCost = 1500; 
    } else if (docType === 'prota' || docType === 'promes' || docType === 'atp' || docType === 'silabus') {
      tokenCost = 1200;
    } else if (docType === 'bank_soal' || docType === 'kisi_kisi' || docType === 'asesmen_sumatif') {
      tokenCost = 1000;
    } else if (docType === 'bahan_bacaan' || docType === 'slide_presentasi') {
      tokenCost = 800;
    }

    // 2. CEK KETERSEDIAAN API KEY ADMIN
    const providerId = params.provider || 'gemini';
    const provRef = doc(db, "Providers", providerId);
    const provSnap = await getDoc(provRef);
    if (!provSnap.exists() || !provSnap.data().key) {
       await window.Swal.fire('Sistem AI Belum Siap', `API Key untuk provider ${providerId} belum dikonfigurasi. Hubungi Admin.`, 'error');
       return;
    }

    // 3. AMBIL DATA USER BERDASARKAN SESI TOKEN YANG AKTIF (Mencegah error akun tidak ditemukan)
    const userIdentifier = state.token || state.user?.email;
    const userRef = doc(db, 'Users', userIdentifier);
    let userSnap = await getDoc(userRef);

    // Cadangan: Jika tidak ketemu lewat token, cari berdasarkan email
    if (!userSnap.exists() && state.user?.email) {
       const altUserRef = doc(db, 'Users', state.user.email);
       userSnap = await getDoc(altUserRef);
    }

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentBalance = data.tokenBalance || 0;
      
      if (currentBalance < tokenCost) {
        await window.Swal.fire('Saldo Tidak Mencukupi', `Pembuatan dokumen ini memerlukan ${tokenCost} token.\nSaldo Anda saat ini: ${currentBalance.toLocaleString('id-ID')}.\n\nSilakan klik tombol Beli / Top-Up di Dashboard.`, 'warning');
        return; 
      }
    } else {
        await window.Swal.fire('Akses Ditolak', 'Akun tidak ditemukan di database. Silakan keluar (logout) lalu masuk kembali dengan email terdaftar.', 'error');
        return;
    }

    // 4. CEK KUOTA KLIK HARIAN
    const canGenerate = await checkQuotaBeforeGenerate(userIdentifier);
    if (!canGenerate) return;

    // 5. MINTA AI MEMBUAT DOKUMEN
    const result = await api('generate', params);
    
    // 6. POTONG SALDO TOKEN
    await deductTokenAfterGenerate(userIdentifier, tokenCost);

    // 7. TAMPILKAN HASIL
    state.editor = {doc: result.doc, text: result.text};
    state.usage = result.usage;
    state.documents.unshift(result.doc);
    state.dirty = false;
    renderEditor();
    
    window.Swal.fire('Berhasil', `Draf sukses dibuat! Saldo dipotong ${tokenCost} token.`, 'success');
  }, 'Memeriksa kuota & menyusun dokumen...');
}


/* ==========================================================================
 * KELOMPOK EDITOR DOKUMEN & EKSPOR (F34 - F42)
 * Deskripsi: Layar untuk menyunting hasil teks AI, fungsi penyimpanan, 
 *            serta mesin utama untuk mencetak PDF dan Word resmi.
 * ========================================================================== */
async function openDocument(id) {
  if (!(await mayLeave())) return;
  await run(async () => {
    state.editor = await api('readDocument', {id});
    state.dirty = false;
    renderEditor();
  }, 'Membuka dokumen...');
}

function renderEditor() {
  setRoute('editor', 'Editor dokumen');
  const doc = state.editor.doc;
  $('#content').innerHTML = `<div class="stack">
    <div class="row between">
      <div><h1>Editor dokumen</h1><p class="muted mb-0">${escapeHTML(title(doc.type))} · ${escapeHTML(doc.provider)} · ${escapeHTML(doc.owner)}</p></div>
      ${button('← Riwayat', 'navigate', 'data-route="history"', 'btn-outline')}
    </div>
    <div class="notice">Ekspor menggunakan teks sederhana. Tabel kompleks, kop surat, dan slide tidak diformat otomatis. Simpan perubahan sebelum menutup halaman.</div>
    <form class="card" data-form="save-document">
      ${field('title', 'Judul dokumen', doc.title, {required: true, max: 180})}
      <div class="row mb-20">
        <button class="btn btn-primary" type="submit">Simpan perubahan</button>
        ${button('Unduh PDF', 'export', 'data-format="pdf"')}
        ${button('Unduh Word', 'export', 'data-format="docx"')}
        ${button('Salin teks', 'copy', '', 'btn-outline')}
        ${button('✦ Jadikan Rujukan AI', 'use-as-reference', 'title="Buat dokumen lanjutan (misal: soal) dari isi ini"', 'btn-outline')}
      </div>
      <label class="field"><span>Isi dokumen</span><textarea class="editor" name="text" id="editor-text" maxlength="150000"></textarea></label>
      <div class="row between"><small id="editor-status" class="muted">Tersimpan · revisi ${doc.revision}</small><small class="muted">Maksimum 150.000 karakter</small></div>
    </form>
  </div>`;
  $('#editor-text').value = state.editor.text;
}

function editorValues() {
  const values = formValues($('[data-form="save-document"]'));
  return {id: state.editor.doc.id, revision: state.editor.doc.revision, title: values.title, text: values.text};
}

function syncDocument(doc) {
  const index = state.documents.findIndex(d => d.id === doc.id);
  if (index >= 0) state.documents[index] = doc;
}

async function persistEditor() {
  const values = editorValues();
  const doc = await api('saveDocument', values);
  state.editor = {doc, text: values.text};
  state.dirty = false;
  syncDocument(doc);
  $('#editor-status').textContent = `Tersimpan · revisi ${doc.revision}`;
}

async function saveDocument() {
  await run(async () => { await persistEditor(); showToast('Perubahan disimpan.'); }, 'Menyimpan dokumen...');
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name.replace(/[\\/:*?"<>|]/g, '-');
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* -----------------------------------------------------------------
 * F41 | exportDocument (Optimasi Ekspor - Rapi Layaknya Google Docs)
 * ----------------------------------------------------------------- */
async function exportDocument(format) {
  await run(async () => {
    if (state.dirty) await persistEditor();
    
    const docTitle = state.editor.doc.title;
    const title = docTitle.replace(/[\\/:*?"<>|]/g, '-');
    const rawText = state.editor.text;

    if (format === 'txt') {
      downloadBlob(new Blob([rawText], {type: 'text/plain;charset=utf-8'}), `${title}.txt`);
      return;
    }

    // 1. SOLUSI LOGO: Word memblokir Base64 (silang merah), jadi khusus MS Word kita gunakan URL Asli.
    // Catatan: Jika dibuka di localhost tanpa koneksi internet, logo di Word tetap tidak muncul 
    // sampai aplikasi ini di-hosting secara online (seperti di GitHub Pages).
    const logoUrl = window.location.origin + '/asset/logo.png';
    let logoBase64 = logoUrl; 
    
    // Hanya gunakan Base64 untuk cetak PDF agar aman di HP
    if (format === 'pdf') {
      try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        logoBase64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Logo Base64 gagal, menggunakan URL normal.");
      }
    }

    const finalLogo = format === 'pdf' ? logoBase64 : logoUrl;
    const schoolName = escapeHTML(state.user.school || 'TK - RA DARUSSALAM'); 
    const userEmail = escapeHTML(state.user.email || 'aromwebapp@gmail.com');

    const rows = rawText.split('\n');
    let htmlRows = [];
    let inTable = false;
    let isHeaderRow = true;
    let skipSignatureLines = false; 
    let inKvTable = false; 
    let forcePageBreak = false; 

    for (let row of rows) {
      let tRow = row.trim();
      
      if (tRow === '---' || tRow === '***' || tRow === '___' || tRow.startsWith('$')) continue;

      if (skipSignatureLines) {
        if (tRow.match(/Kepala|NIP|Guru|Pelajaran|____|\.\.\.\.|\[Nama/i) || tRow.match(/^[\W_]+$/) || tRow === '') {
          continue; 
        } else {
          skipSignatureLines = false; 
        }
      }

      if (tRow.match(/^Mengetahui,?/i)) {
        skipSignatureLines = true;
        forcePageBreak = true; 
        // Perbaikan Tabel TTD: border="0" agar Word tidak memunculkan garis putus-putus
        htmlRows.push(`
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border: none; margin-top: 30px; margin-bottom: 20px; border-collapse: collapse; page-break-inside: avoid;">
            <tr>
              <td width="50%" style="width: 50%; text-align: center; border: none; font-size: 12pt; font-family: 'Times New Roman', Times, serif; vertical-align: top; line-height: 1.5;">
                Mengetahui,<br>
                Kepala Sekolah<br>
                <br><br><br><br>
                <b><u>..................................................</u></b><br>
                NIP. ..............................................
              </td>
              <td width="50%" style="width: 50%; text-align: center; border: none; font-size: 12pt; font-family: 'Times New Roman', Times, serif; vertical-align: top; line-height: 1.5;">
                Bangkalan, ..............................<br>
                Guru Mata Pelajaran<br>
                <br><br><br><br>
                <b><u>..................................................</u></b><br>
                NIP. ..............................................
              </td>
            </tr>
          </table>
        `);
        continue;
      }

      if (tRow.startsWith('|') && tRow.endsWith('|')) {
        if (tRow.match(/^\|[\s\-\:]+\|/)) continue;
        if (!inTable) {
          // Perbaikan Tabel Data: Atribut border="1" murni untuk Word
          htmlRows.push('<table width="100%" border="1" cellspacing="0" cellpadding="4" style="width: 100%; border-collapse: collapse; border: 1pt solid black; margin-top: 10px; margin-bottom: 15px;">');
          inTable = true;
          isHeaderRow = true;
        }
        
let cells = tRow.split('|').slice(1, -1);
        let rowHtml = '<tr>' + cells.map((c) => {
          let cellContent = escapeHTML(c.trim())
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>');
          if (!cellContent || cellContent === '---') cellContent = '&nbsp;';
          let tag = isHeaderRow ? 'th' : 'td';
          let style = tag === 'th' 
            ? 'padding: 6px 8px; border: 1pt solid black; background-color: #f2f2f2; text-align: left; font-weight: bold; font-size: 11pt; vertical-align: middle; font-family: \'Times New Roman\', Times, serif;' 
            : 'padding: 6px 8px; border: 1pt solid black; font-size: 11pt; vertical-align: top; text-align: left; font-family: \'Times New Roman\', Times, serif;';
          return `<${tag} style="${style}">${cellContent}</${tag}>`;
        }).join('') + '</tr>';

        // [PERBAIKAN] Tambahkan thead dan tbody agar header tabel otomatis berulang di halaman baru
        if (isHeaderRow) {
          htmlRows.push('<thead>' + rowHtml + '</thead><tbody>');
          isHeaderRow = false;
        } else {
          htmlRows.push(rowHtml);
        }

      } else {
        if (inTable) {
          htmlRows.push('</tbody></table>'); // Tutup tbody
          inTable = false;
          isHeaderRow = true;
        }

       let cleanRow = tRow.replace(/^([#>\s]+)/g, '').trim(); 
        
        // [PERBAIKAN FINAL] Hapus tanda > yang menempel setelah bullet/angka SEBELUM diconvert ke HTML
        cleanRow = cleanRow.replace(/^([0-9]+\.|[a-z][\.\)]|\-|\*)\s*>\s*/i, '$1 ');

        let kvMatch = cleanRow.match(/^[\-\*\>]\s*(?:>\s*)?(?:\*\*)?([^:\*]{2,50})(?:\*\*)?\s*:\s*(.+)$/i);
        
        // 2. SOLUSI BINGKAI IDENTITAS: Dibungkus dengan DIV Box, lalu isi kolom tanpa border. 
        // Ini adalah satu-satunya cara agar MS Word membuat bingkai penuh tanpa garis putus-putus di dalamnya.
      // [PERBAIKAN] Bungkus menggunakan Tabel 1x1 agar MS Word tidak membelah bingkai
        if (kvMatch && !cleanRow.includes('|')) {
            if (!inKvTable) {
                htmlRows.push(`
                  <table width="100%" border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1pt solid black; margin-top: 5px; margin-bottom: 15px;">
                    <tr style="page-break-inside: avoid;">
                      <td style="padding: 6px 10px; border: 1pt solid black; vertical-align: top;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border: none; border-collapse: collapse;">
                `);
                inKvTable = true;
            }
			
            let key = escapeHTML(kvMatch[1].trim());
            let val = escapeHTML(kvMatch[2].trim())
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.*?)\*/g, '<i>$1</i>');
                
            htmlRows.push(`
                      <tr>
                        <td width="26%" style="width: 26%; padding: 2px 4px; border: none; font-size: 12pt; font-family: 'Times New Roman', Times, serif; vertical-align: top;">${key}</td>
                        <td width="3%" style="width: 3%; padding: 2px 0; border: none; font-size: 12pt; font-family: 'Times New Roman', Times, serif; vertical-align: top; text-align: center;">:</td>
                        <td width="71%" style="width: 71%; padding: 2px 4px; border: none; font-size: 12pt; font-family: 'Times New Roman', Times, serif; vertical-align: top; text-align: justify; line-height: 1.5;">${val}</td>
                      </tr>
            `);
            continue; 
        
		} else {
            if (inKvTable) {
                htmlRows.push(`
                        </table>
                      </td>
                    </tr>
                  </table>
                `);
                inKvTable = false;
            }
        }


let listMatch = cleanRow.match(/^([0-9]+\. |[a-z][\.\)] |\- |\* )/i);

        if (cleanRow.match(/^([A-Z]|[IVX]+)\.\s+/) || cleanRow.match(/^(LAMPIRAN|ASESMEN|RUBRIK|KISI-KISI|LEMBAR KERJA)/i)) {
          let pageBreakHtml = '';
          if (forcePageBreak || cleanRow.match(/^(LAMPIRAN|ASESMEN|RUBRIK|KISI-KISI|LEMBAR KERJA)/i)) {
            pageBreakHtml = '<div style="page-break-before: always;"></div>';
            forcePageBreak = false; 
          }
          let formattedRow = escapeHTML(cleanRow).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
          htmlRows.push(`${pageBreakHtml}<h3 style="margin-top: 16px; margin-bottom: 8px; font-size: 12pt; font-weight: bold; font-family: 'Times New Roman', Times, serif; text-align: left; text-transform: uppercase;">${formattedRow}</h3>`);
        
        } else if (listMatch) {
          let marker = listMatch[0].trim(); 
          if (marker === '-' || marker === '*') marker = '&#8226;'; 
          
          // [SOLUSI FINAL] Ambil teks aslinya dulu, bersihkan sisa '>', BARU di-convert ke HTML
          let rawListText = cleanRow.substring(listMatch[0].length).trim();
          rawListText = rawListText.replace(/^>\s*/, '');
          
          let listText = escapeHTML(rawListText).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
          
          htmlRows.push(`<div style="margin-left: 28px; text-indent: -28px; margin-bottom: 4px; text-align: justify; font-size: 12pt; font-family: 'Times New Roman', Times, serif; line-height: 1.5;">${marker}&nbsp;&nbsp;${listText}</div>`);
        
        } else if (cleanRow === '') {
          htmlRows.push('<div style="height: 8px;"></div>');
        } else {
          let formattedRow = escapeHTML(cleanRow).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
          let isAllCaps = cleanRow === cleanRow.toUpperCase() && cleanRow.match(/[A-Z]/);
          let pStyle = isAllCaps 
            ? 'margin-top: 12px; margin-bottom: 12px; text-align: center; font-weight: bold;'
            : 'margin-bottom: 6px; text-align: justify;'; 
          htmlRows.push(`<div style="${pStyle} font-size: 12pt; font-family: 'Times New Roman', Times, serif; line-height: 1.5;">${formattedRow}</div>`);
        }


      }
    }
    if (inTable) htmlRows.push('</table>');
    if (inKvTable) htmlRows.push('</table></div>'); 

    const processedHTML = htmlRows.join('\n');

    // 3. SOLUSI KOP SURAT: Menggunakan border tebal pada DIV agar dibaca sempurna oleh Word
    const kopSurat = `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-bottom: 0px; border-collapse: collapse; border: none;">
        <tr>
          <td width="15%" style="width: 15%; text-align: center; vertical-align: middle; border: none;">
            <img src="${finalLogo}" width="90" height="90" alt="Logo" style="width: 90px; height: 90px; display: block; margin: 0 auto;">
          </td>
          <td width="85%" style="width: 85%; text-align: center; vertical-align: middle; border: none; line-height: 1.2;">
            <div style="font-size: 16pt; font-family: 'Times New Roman', Times, serif; font-weight: bold; text-transform: uppercase;">PEMERINTAH PROVINSI / KABUPATEN<br>${schoolName}</div>
            <div style="font-size: 10pt; font-family: 'Times New Roman', Times, serif; margin-top: 4px;">Alamat : Jalan Pendidikan No. 7, Bangkalan, Madura 69155<br>Kontak : 087846666636, E-mail : ${userEmail}</div>
          </td>
        </tr>
      </table>
      
      <div style="border-bottom: 3pt solid black; margin-top: 10px; margin-bottom: 2px; width: 100%; font-size: 0px; line-height: 0px;">&nbsp;</div>
      <div style="border-bottom: 1pt solid black; margin-bottom: 20px; width: 100%; font-size: 0px; line-height: 0px;">&nbsp;</div>
      
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0 0 5px 0; font-size: 14pt; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; font-weight: bold;">${escapeHTML(docTitle)}</h2>
        <div style="font-size: 10pt; font-family: 'Times New Roman', Times, serif; color: #555; text-transform: uppercase;">DRAF UNTUK DITINJAU GURU</div>
      </div>
    `;

    // 4. SOLUSI XML (mso): Memberitahu MS Word bahwa ini dokumen untuk diprint (Tampilan Print Layout)
    const finalHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
        <style>
          @page { size: A4; margin: 2cm 2.5cm 2.5cm 2.5cm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: black; background: white; margin: 0; padding: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        </style>
      </head>
      <body>
        ${kopSurat}
        ${processedHTML}
      </body>
      </html>
    `;

    if (format === 'pdf') {
      const printWin = window.open('', '_blank');
      printWin.document.write(finalHTML);
      printWin.document.close();
      printWin.focus();
      printWin.onload = function() { printWin.print(); };
      setTimeout(() => { if (printWin.document.readyState === 'complete') printWin.print(); }, 800);
      return;
    }

    if (format === 'docx' || format === 'doc') {
      downloadBlob(new Blob([finalHTML], {type: 'application/msword;charset=utf-8'}), `${title}.doc`);
    }
  }, 'Menyiapkan dokumen resmi...');
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

/* ==========================================================================
 * KELOMPOK PENGELOLAAN DOKUMEN (F43 - F45)
 * Deskripsi: Merender daftar tabel untuk Riwayat, Favorit, dan Sampah, 
 *            serta melakukan tindakan hapus sementara dan pemulihan.
 * ========================================================================== */
function renderHistory(mode) {
  const names = {history: 'Riwayat dokumen', favorites: 'Favorit', trash: 'Sampah'};
  setRoute(mode, names[mode]);
  const types = Object.values(state.catalog).flatMap(category => category.items);
  $('#content').innerHTML = `<div class="stack">
    ${pageHead(names[mode], state.user.role === 'admin' ? 'Admin dapat mengelola dokumen seluruh pengguna.' : 'Kelola dokumen milik akun Anda.')}
    <div class="toolbar">
      <input id="doc-search" aria-label="Cari dokumen" placeholder="Cari judul, pemilik, atau jenis...">
      <select id="doc-type" aria-label="Filter jenis"><option value="">Semua jenis</option>${types.map(type => `<option value="${type}">${escapeHTML(title(type))}</option>`).join('')}</select>
      <select id="doc-provider" aria-label="Filter provider"><option value="">Semua provider</option><option value="gemini">Gemini</option><option value="openai">OpenAI</option><option value="claude">Claude</option></select>
      ${button('↻ Muat ulang', 'refresh-documents', '', 'btn-outline')}
    </div>
    <div id="document-results"></div>
  </div>`;
  $('#doc-search').value = state.filters.query;
  $('#doc-type').value = state.filters.type;
  $('#doc-provider').value = state.filters.provider;
  renderDocumentResults();
}

function renderDocumentResults() {
  const f = state.filters;
  const mode = state.route;
  const docs = state.documents.filter(doc => {
    const visible = mode === 'trash' ? doc.deleted : !doc.deleted;
    return visible && (mode !== 'favorites' || doc.favorite) && (!f.type || doc.type === f.type) &&
      (!f.provider || doc.provider === f.provider) &&
      [doc.title, doc.owner, title(doc.type)].join(' ').toLowerCase().includes(f.query.toLowerCase());
  });
  const pages = Math.max(1, Math.ceil(docs.length / CONFIG.PAGE_SIZE));
  f.page = Math.min(Math.max(1, f.page), pages);
  const shown = docs.slice((f.page - 1) * CONFIG.PAGE_SIZE, f.page * CONFIG.PAGE_SIZE);
  if (!shown.length) {
    $('#document-results').innerHTML = '<div class="card empty"><div class="empty-icon">▤</div><h2>Belum ada dokumen</h2><p>Dokumen yang sesuai akan muncul di sini.</p></div>';
    return;
  }
  const rows = shown.map(doc => `
    <tr>
      <td class="doc-title"><strong>${escapeHTML(doc.title)}</strong><br><small class="muted">${escapeHTML(doc.owner)}</small></td>
      <td>${badge(title(doc.type))}<br><small class="muted">${escapeHTML(title(doc.provider))}</small></td>
      <td class="nowrap"><small>${escapeHTML(dateText(doc.updated))}</small></td>
      <td><div class="actions">
        ${mode === 'trash'
          ? button('Pulihkan', 'trash-document', `data-id="${doc.id}" data-value="false"`, 'btn-small')
          : `${button('Buka', 'open-document', `data-id="${doc.id}"`, 'btn-small')}
             ${button(doc.favorite ? '★' : '☆', 'favorite-document', `data-id="${doc.id}" data-value="${!doc.favorite}" aria-label="Ubah favorit"`, 'btn-small')}
             ${button('Sampah', 'trash-document', `data-id="${doc.id}" data-value="true"`, 'btn-small btn-danger')}`}
      </div></td>
    </tr>`).join('');
  $('#document-results').innerHTML = `
    <div class="card table-wrap"><table>
      <thead><tr><th>DOKUMEN</th><th>JENIS / PROVIDER</th><th>DIPERBARUI</th><th>AKSI</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="row between pager"><small class="muted">${docs.length} dokumen · Halaman ${f.page} dari ${pages}</small>
      <div class="row">${button('←', 'page', `data-page="${f.page - 1}" ${f.page <= 1 ? 'disabled' : ''}`, 'btn-small')}
      ${button('→', 'page', `data-page="${f.page + 1}" ${f.page >= pages ? 'disabled' : ''}`, 'btn-small')}</div>
    </div></div>`;
}

async function mutateDocument(action, id, value) {
  if (action === 'trashDocument') {
    const accepted = await EduNotify.ask({
      title: value ? 'Pindahkan ke sampah?' : 'Pulihkan dokumen?',
      message: value ? 'Dokumen akan dipindahkan ke sampah, bukan dihapus permanen. Anda dapat memulihkannya nanti.' : 'Dokumen akan dikembalikan ke riwayat dan dapat dibuka kembali.',
      confirmText: value ? 'Pindahkan ke sampah' : 'Pulihkan dokumen',
      cancelText: 'Batal', danger: value
    });
    if (!accepted) return;
  }
  await run(async () => {
    const doc = await api(action, {id, value});
    syncDocument(doc);
    renderDocumentResults();
    showToast(action === 'trashDocument' ? (value ? 'Dokumen dipindahkan ke sampah.' : 'Dokumen berhasil dipulihkan.') : (value ? 'Dokumen ditambahkan ke favorit.' : 'Dokumen dihapus dari favorit.'));
  }, 'Memperbarui dokumen...');
}

/* ==========================================================================
 * KELOMPOK PENGATURAN PROFIL GURU (F46 - F47)
 * Deskripsi: Halaman untuk guru mengubah data pribadi (Nama, Sekolah).
 * ========================================================================== */
function renderProfile() {
  setRoute('profile', 'Profil guru & sekolah');
  $('#content').innerHTML = `<div class="stack">
    ${pageHead('Profil guru & sekolah', 'Identitas ini digunakan sebagai konteks saat membuat dokumen.')}
    <form class="card" data-form="profile">
      <div class="form-grid">
        ${field('name', 'Nama guru', state.user.name, {required: true, max: 100})}
        ${field('school', 'Nama sekolah', state.user.school, {max: 200})}
        ${field('email', 'Email akun', state.user.email, {disabled: true})}
        ${field('role', 'Peran', state.user.role, {disabled: true})}
      </div>
      <p class="muted">Email akun tidak dapat diganti. Peran dan status akun dikelola admin.</p>
      <button class="btn btn-primary" type="submit">Simpan profil</button>
    </form>
  </div>`;
}

async function saveProfile(form) {
  await run(async () => {
    state.user = await api('saveProfile', formValues(form));
    renderShell(); renderProfile(); showToast('Profil disimpan.');
  }, 'Menyimpan profil...');
}


/* ==========================================================================
 * KELOMPOK PANEL ADMINISTRATOR (F48 - F55)
 * Deskripsi: Area khusus admin untuk memanajemen pengguna, menyimpan 
 *            API Key, mengubah model, dan melihat log/kuota.
 * ========================================================================== */
async function renderUsers() {
  $('#content').innerHTML = `<div style="padding: 40px; text-align: center; color: #666;">Sedang memuat data pengguna...</div>`;
  setRoute('users', 'Manajemen pengguna');

  try {
    const usersSnap = await getDocs(collection(db, 'Users'));
    let tableRows = '';
    let no = 1;

    usersSnap.forEach(docSnap => {
      const u = docSnap.data();
      const email = docSnap.id;
      
      const roleBadge = u.role === 'admin' 
        ? '<span style="background: #e0e7ff; color: #4f46e5; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Admin</span>' 
        : '<span style="background: #f3f4f6; color: #4b5563; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">Guru</span>';
      
      const quota = u.dailyQuota !== undefined ? u.dailyQuota : 20; 
      const token = u.tokenBalance || 0;
      const statusBadge = badge(u.active ? 'Aktif' : 'Nonaktif', u.active ? 'badge-success' : 'badge-danger');
      
      tableRows += `
        <tr style="border-bottom: 1px solid #f3f4f6; transition: background 0.2s;">
          <td style="padding: 16px 12px;">${no++}</td>
          <td style="padding: 16px 12px;">
             <strong style="color: #111;">${escapeHTML(u.name || 'Tanpa Nama')}</strong><br>
             <small style="color: #6b7280;">${email}</small>
          </td>
          <td style="padding: 16px 12px;">${roleBadge}<br><div style="margin-top:4px;">${statusBadge}</div></td>
          <td style="padding: 16px 12px; font-weight: 500;">${quota}x / Hari</td>
          <td style="padding: 16px 12px; font-weight: bold; color: #10b981;">${token.toLocaleString('id-ID')}</td>
          <td style="padding: 16px 12px; text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap;">
              ${button('Ubah', 'edit-user', `data-id="${email}"`, 'btn-small')}
              <button type="button" onclick="editUserQuota('${email}', ${quota})" style="padding: 6px 12px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
                Edit Kuota
              </button>
              <button type="button" onclick="topUpUserToken('${email}')" style="padding: 6px 12px; background: #ecfdf5; color: #10b981; border: 1px solid #10b981; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
                + Top-Up
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    $('#content').innerHTML = `
      <div class="stack">
        ${pageHead('Manajemen pengguna', 'Kelola batas klik harian, saldo token AI, dan daftarkan pengguna baru.')}
        <div class="notice">Login tidak memverifikasi kepemilikan email. Orang yang mengetahui email admin dapat masuk sebagai admin. Gunakan hanya untuk lingkungan tepercaya.</div>
        
        <form class="card" data-form="user" id="user-form">
          <h2 id="user-form-heading">Tambah akun</h2>
          <input type="hidden" name="id" value="">
          <div class="form-grid">
            ${field('email', 'Email', '', {type: 'email', required: true, max: 254})}
            ${field('name', 'Nama', '', {required: true, max: 100})}
            ${selectField('role', 'Peran', ['guru', 'admin'])}
            ${field('school', 'Sekolah', '', {max: 200})}
          </div>
          ${check('active', 'Akun aktif', true)}
          <div class="row"><button class="btn btn-primary" type="submit">Simpan akun</button>${button('Form baru', 'new-user', '', 'btn-outline')}</div>
        </form>

        <div class="card table-wrap" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead style="background: #f9fafb; border-bottom: 2px solid #e5e7eb; color: #374151;">
              <tr>
                <th style="padding: 16px 12px;">No</th>
                <th style="padding: 16px 12px;">Identitas Pengguna</th>
                <th style="padding: 16px 12px;">Status</th>
                <th style="padding: 16px 12px;">Batas Klik</th>
                <th style="padding: 16px 12px;">Saldo AI</th>
                <th style="padding: 16px 12px; text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align:center; padding: 32px; color: #6b7280;">Belum ada akun terdaftar.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Gagal memuat pengguna:", error);
    $('#content').innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Gagal memuat data pengguna.</div>`;
  }
}

window.editUserQuota = async function(email, currentQuota) {
  const { value: amount } = await Swal.fire({
    title: 'Edit Kuota Harian',
    text: `Tentukan batas klik generate harian untuk ${email}:`,
    input: 'number',
    inputValue: currentQuota,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    inputValidator: (value) => {
      if (value === '' || value < 0) return 'Masukkan angka yang valid!';
    }
  });

  if (amount !== undefined) {
    try {
      await updateDoc(doc(db, 'Users', email), { dailyQuota: Number(amount) });
      Swal.fire('Tersimpan!', 'Batas klik harian diperbarui.', 'success');
      renderUsers(); 
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Terjadi kendala saat menyimpan.', 'error');
    }
  }
};

window.topUpUserToken = async function(userEmail) {
  const { value: amount } = await Swal.fire({
    title: 'Top-Up Saldo Token',
    html: `
      <div style="text-align: left; margin-bottom: 8px; font-size: 0.9rem; color: #555;">Masukkan jumlah token untuk ${userEmail}:</div>
      <input id="swal-input-token" class="swal2-input" placeholder="Contoh: 50000" style="margin: 0 auto; width: 80%;" autofocus>
      <div id="swal-token-preview" style="margin-top: 8px; font-weight: bold; color: #10b981; font-size: 0.95rem;"></div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Top-Up',
    cancelButtonText: 'Batal',
    didOpen: () => {
      // Fitur Auto-Format Titik Ribuan Secara Real-Time
      const input = document.getElementById('swal-input-token');
      const preview = document.getElementById('swal-token-preview');
      
      input.addEventListener('input', (e) => {
        // Hapus semua karakter selain angka
        let rawValue = e.target.value.replace(/\D/g, '');
        if (rawValue) {
          // Format ke bentuk ribuan dengan titik (ID Locale)
          let formatted = Number(rawValue).toLocaleString('id-ID');
          input.value = formatted;
          preview.textContent = `Akan ditambahkan: ${formatted} Token`;
        } else {
          input.value = '';
          preview.textContent = '';
        }
      });
    },
    preConfirm: () => {
      const input = document.getElementById('swal-input-token').value;
      // Bersihkan titik sebelum dikirim ke database angka murni
      const rawNumber = Number(input.replace(/\./g, ''));
      if (!rawNumber || rawNumber <= 0) {
        Swal.showValidationMessage('Masukkan jumlah token yang valid!');
      }
      return rawNumber;
    }
  });

  if (amount) {
    try {
      await updateDoc(doc(db, 'Users', userEmail), { tokenBalance: increment(Number(amount)) });
      Swal.fire('Berhasil!', `Saldo ${Number(amount).toLocaleString('id-ID')} token berhasil ditambahkan.`, 'success');
      renderUsers();
    } catch (error) {
      console.error(error);
      Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
    }
  }
};

async function checkQuotaBeforeGenerate(userEmail) {
  try {
    const userRef = doc(db, 'Users', userEmail);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const tokenBalance = data.tokenBalance || 0;
      const dailyQuota = data.dailyQuota || 20; 
      let usedToday = data.usedToday || 0;
      const lastResetDate = data.lastResetDate || '';
      const today = new Date().toLocaleDateString('id-ID');

      // Reset kuota otomatis jika hari berganti
      if (lastResetDate !== today) {
         await updateDoc(userRef, { usedToday: 0, lastResetDate: today });
         usedToday = 0; 
      }
      if (usedToday >= dailyQuota) {
         await window.Swal.fire('Batas Harian', 'Batas klik harian Anda sudah habis. Silakan coba besok.', 'warning');
         return false;
      }
      if (tokenBalance <= 0) {
         await window.Swal.fire('Saldo Habis', 'Saldo token AI habis. Silakan hubungi admin untuk Top-Up.', 'error');
         return false;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Gagal cek kuota:", error);
    return false;
  }
}

async function deductTokenAfterGenerate(userEmail, usedTokens) {
  try {
    await updateDoc(doc(db, 'Users', userEmail), {
      tokenBalance: increment(-usedTokens),
      usedToday: increment(1)
    });
  } catch (error) {
    console.error("Gagal memotong token:", error);
  }
}

function editUser(id) {
  // Dalam setup baru kita, ID dokumen pengguna adalah email mereka
  const user = state.admin.users.find(item => item.id === id || item.email === id);
  if (!user) return;
  const form = $('#user-form');
  ['id', 'email', 'name', 'school', 'role'].forEach(key => { form.elements[key].value = user[key] || ''; });
  form.elements.email.readOnly = true;
  form.elements.active.checked = user.active;
  $('#user-form-heading').textContent = 'Ubah akun';
  form.scrollIntoView({behavior: 'smooth', block: 'start'});
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
    // Pada skema baru, pastikan id sama dengan email
    if(!values.id) values.id = values.email; 
    await api('saveUser', values);
    state.admin = await api('adminData');
    renderUsers();
    showToast(values.id ? 'Perubahan akun berhasil disimpan.' : 'Pengguna baru berhasil ditambahkan.');
  }, 'Menyimpan akun...');
}

function renderSettings() {
  setRoute('settings', 'Pengaturan AI & kuota');
  const providers = state.admin.providers.map(provider => {
    let modelOptions = [];
    if (provider.id === 'gemini') {
      modelOptions = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-2.5-flash', 'Lainnya'];
    } else if (provider.id === 'openai') {
      modelOptions = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'Lainnya'];
    } else if (provider.id === 'claude') {
      modelOptions = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'Lainnya'];
    }

    const isCustomModel = provider.model && !modelOptions.includes(provider.model);
    const selectValue = isCustomModel ? 'Lainnya' : (provider.model || '');

    return `
    <form class="card" data-form="provider">
      <input type="hidden" name="id" value="${provider.id}">
      <div class="row between mb-20"><h2 class="mb-0">${escapeHTML(title(provider.id))}</h2>${badge(provider.configured ? 'Key tersimpan' : 'Belum diisi', provider.configured ? 'badge-success' : '')}</div>
      <label class="field">
        <span>ID model</span>
        <select name="model_select" class="provider-model-select">
          <option value="">-- Pilih Model --</option>
          ${modelOptions.map(opt => `<option value="${opt}" ${opt === selectValue ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      </label>
      <div class="custom-model-container" style="display: ${isCustomModel ? 'block' : 'none'};">
        ${field('model_custom', 'Ketikkan ID model spesifik', isCustomModel ? provider.model : '', {max: 160})}
      </div>
      ${field('key', 'API key baru', '', {type: 'password', max: 2000, autocomplete: 'new-password', placeholder: 'Kosong = pertahankan key lama'})}
      ${check('enabled', 'Aktifkan provider', provider.enabled)}
      ${check('clear', 'Hapus key tersimpan')}
      <div class="row mt-20"><button class="btn btn-primary" type="submit">Simpan</button>${button('Tes koneksi', 'test-provider', `data-id="${provider.id}"`, 'btn-outline')}</div>
    </form>`;
  }).join('');

  $('#content').innerHTML = `<div class="stack">
    ${pageHead('Pengaturan AI & kuota', 'Kunci API hanya disimpan di backend. Pilih ID model yang tersedia pada akun provider Anda.')}
    <div class="notice">API key disimpan dengan aman di Firestore. Tes koneksi dapat dikenai biaya oleh provider.</div>
    <div class="provider-grid">${providers}</div>
    <form class="card" data-form="settings">
      <h2>Kuota percobaan generate</h2>
      ${field('dailyLimit', 'Maksimum percobaan per akun per hari WIB (1–500)', state.admin.settings.dailyLimit, {type: 'number', required: true})}
      <p class="muted">Percobaan yang gagal tetap dihitung. Kuota ini bukan batas tagihan uang/token. Tes koneksi hanya tersedia bagi admin dan tidak masuk hitungan generate guru.</p>
      <button class="btn btn-primary" type="submit">Simpan pengaturan</button>
    </form>
  </div>`;
}

async function saveProvider(form) {
  const values = formValues(form);
  let finalModel = values.model_select;
  if (finalModel === 'Lainnya') finalModel = values.model_custom;
  values.model = finalModel;
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

async function testProvider(id) {
  await run(async () => {
    const result = await api('testProvider', {id});
    showToast(`${title(id)}: ${result.text}`);
  }, 'Menguji koneksi. Pengaturan yang diuji adalah yang sudah disimpan...');
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
    
    // Kirim catatan ke Log Aktivitas
    await api('logActivity', { 
      action: 'Ubah Pengaturan', 
      target: `Batas generate harian diubah menjadi ${values.dailyLimit}` 
    });
    
    state.admin = await api('adminData');
    applyBoot(await api('boot'));
    renderSettings();
    showToast('Batas penggunaan berhasil diperbarui.');
  }, 'Menyimpan pengaturan...');
}

function renderLogs() {
  setRoute('logs', 'Log aktivitas');
  const rows = state.admin.logs.map(log => `<tr>
    <td class="nowrap">${escapeHTML(dateText(log.created))}</td><td>${escapeHTML(log.email)}</td>
    <td>${badge(log.action)}</td><td><small>${escapeHTML(log.target)}</small></td>
  </tr>`).join('');
  $('#content').innerHTML = `<div class="stack">
    ${pageHead('Log aktivitas', '200 aktivitas terbaru. Catatan aktivitas bukan bukti identitas karena login cukup email.')}
    <div>${button('↻ Muat ulang', 'navigate', 'data-route="logs"', 'btn-outline')}</div>
    <div class="card table-wrap"><table><thead><tr><th>WAKTU</th><th>EMAIL</th><th>AKTIVITAS</th><th>TARGET</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Belum ada aktivitas.</td></tr>'}</tbody></table></div>
  </div>`;
}



/* ==========================================================================
 * F56 | HALAMAN BANTUAN
 * Deskripsi: Halaman informasi panduan alur penggunaan aplikasi EduPlan AI.
 * ========================================================================== */
function renderHelp() {
  setRoute('help', 'Panduan penggunaan');
  $('#content').innerHTML = `<div class="stack">
    ${pageHead('Panduan penggunaan', 'Alur singkat untuk menyusun perangkat ajar dengan EduPlan AI.')}
    <section class="card"><h2>Mulai membuat dokumen</h2><ol class="help-list">
      <li>Isi nama dan sekolah di menu Profil.</li><li>Pilih kategori dan jenis generator.</li>
      <li>Isi materi, kelas/fase, waktu, serta rujukan terverifikasi.</li><li>Pilih provider AI yang telah diaktifkan admin.</li>
      <li>Generate, tinjau, dan perbaiki draf pada editor.</li><li>Simpan, lalu unduh PDF, Word, atau TXT.</li>
    </ol></section>
    <section class="card"><h2>Batasan hasil</h2><ul class="help-list">
      <li>CP resmi dan kalender daerah tidak diambil otomatis.</li><li>Daftar hadir/nilai tanpa data menghasilkan template, bukan data nyata.</li>
      <li>Analisis hasil perlu data anonim; verifikasi semua hitungan secara terpisah.</li>
      <li>Presentasi berupa outline slide, bukan PPTX. Media berupa naskah/rancangan, bukan gambar/video.</li>
      <li>PDF/Word berbasis teks sederhana; belum pemformatan tabel kompleks atau kop surat.</li>
      <li>Riwayat mendukung favorit dan sampah yang dapat dipulihkan. Belum tersedia hapus permanen atau versi historis dokumen.</li>
    </ul></section>
    <div class="notice">Tanpa verifikasi login, alamat email bukan bukti identitas. Jangan gunakan aplikasi ini untuk data rahasia atau data pribadi siswa. Segera hubungi pemilik aplikasi jika ada aktivitas tidak wajar.</div>
  </div>`;
}

/* ==========================================================================
 * KELOMPOK PENANGANAN EVENT & INISIALISASI (F57 - F62)
 * Deskripsi: Pengendali utama (*Event Listener*) saat tombol diklik, 
 *            formulir dikirim, ketikan diinput, serta fungsi muat awal.
 * ========================================================================== */
async function onClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target || state.busy) return;
  const data = target.dataset;
  
  switch (data.action) { // <-- TAMBAHKAN BARIS INI
  
  
  
  case 'forgot-password': return resetPasswordHandler();
  
    case 'toggle-password':
      const pwdInput = target.parentElement.querySelector('input[name="password"]');
      if (pwdInput) {
        const isHidden = pwdInput.type === 'password';
        pwdInput.type = isHidden ? 'text' : 'password';
        
        const iconEye = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        const iconEyeOff = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        
        target.innerHTML = isHidden ? iconEyeOff : iconEye;
      }
      return;
    case 'generator': return renderGenerator(data.type);
    case 'logout': return logout();
    case 'theme': return toggleTheme();
    case 'toggle-menu': 
      if (document.body.classList.contains('menu-open')) {
        history.back(); 
      } else {
        history.pushState({ menu: 'open' }, '');
        document.body.classList.add('menu-open'); 
      }
      return;
    case 'close-menu': 
      if (document.body.classList.contains('menu-open')) history.back(); 
      return;
    case 'open-document': return openDocument(data.id);
    case 'export': return exportDocument(data.format);
    case 'copy': return copyDocument();
    case 'favorite-document': return mutateDocument('favoriteDocument', data.id, data.value === 'true');
    case 'trash-document': return mutateDocument('trashDocument', data.id, data.value === 'true');
    case 'refresh-documents': return navigate(state.route);
    case 'page': state.filters.page = Number(data.page); renderDocumentResults(); return;
    case 'edit-user': return editUser(data.id);
    case 'new-user': return renderUsers();
    case 'test-provider': return testProvider(data.id);
    case 'use-as-reference': 
      state.tempReference = document.querySelector('#editor-text').value;
      showToast('Isi dokumen disimpan ke memori AI. Silakan pilih jenis dokumen selanjutnya (misal: Bank Soal).');
      return navigate('dashboard');
    default: return;
  }
}

function onSubmit(event) {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  if (state.busy) return;
 // Ganti baris handlers menjadi:
  const handlers = {login, register, 'save-document': saveDocument, profile: saveProfile, user: saveUser, provider: saveProvider, settings: saveSettings};
  const handler = handlers[form.dataset.form];
  if (handler) handler(form);
}

function onInput(event) {
  const target = event.target;
  if (target.closest('[data-form="save-document"]')) {
    state.dirty = true;
    $('#editor-status').textContent = 'Perubahan belum disimpan';
  }
  if (target.id === 'type-search') {
    const query = target.value.toLowerCase();
    document.querySelectorAll('#type-grid [data-search]').forEach(card => { card.hidden = !card.dataset.search.includes(query); });
  }
  if (target.id === 'doc-search') {
    state.filters.query = target.value;
    state.filters.page = 1;
    renderDocumentResults();
  }
}

function onChange(event) {
  if (event.target.name === 'level_select') {
    const customContainer = document.getElementById('custom-level-container');
    const customInput = document.querySelector('input[name="level_custom"]');
    if (event.target.value === 'Lainnya / Umum') {
      customContainer.style.display = 'block';
      customInput.required = true;
    } else {
      customContainer.style.display = 'none';
      customInput.required = false;
      customInput.value = '';
    }
    return;
  }
  if (event.target.name === 'model_select') {
    const form = event.target.closest('form');
    const customContainer = form.querySelector('.custom-model-container');
    const customInput = form.querySelector('input[name="model_custom"]');
    if (event.target.value === 'Lainnya') {
      customContainer.style.display = 'block';
      customInput.required = true;
    } else {
      customContainer.style.display = 'none';
      customInput.required = false;
      customInput.value = '';
    }
    return;
  }
  if (event.target.id === 'doc-type') state.filters.type = event.target.value;
  else if (event.target.id === 'doc-provider') state.filters.provider = event.target.value;
  else return;
  
  state.filters.page = 1;
  renderDocumentResults();
}

function toggleTheme() {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem(CONFIG.THEME_KEY, dark ? 'dark' : 'light');
}

async function init() {
  document.documentElement.dataset.theme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
  window.addEventListener('popstate', () => {
    if (document.body.classList.contains('menu-open')) document.body.classList.remove('menu-open');
  });
  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.body.classList.remove('menu-open'); });
  window.addEventListener('beforeunload', event => {
    if (!state.dirty) return;
    event.preventDefault(); event.returnValue = '';
  });
  renderLogin();
  if (!state.token) return;
  await run(async () => {
    applyBoot(await api('boot'));
    renderShell(); renderDashboard();
  }, 'Memulihkan sesi...');
}


async function resetPasswordHandler() {
  const { value: email } = await Swal.fire({
    title: 'Reset Kata Sandi',
    text: 'Masukkan alamat email Anda untuk menerima tautan pemulihan.',
    input: 'email',
    inputPlaceholder: 'nama@sekolah.sch.id',
    showCancelButton: true,
    confirmButtonText: 'Kirim Tautan',
    cancelButtonText: 'Batal'
  });

  if (email) {
    await run(async () => {
      await api('resetPassword', { email: email.trim().toLowerCase() });
      Swal.fire('Terkirim!', 'Tautan reset sandi telah dikirim. Silakan cek kotak masuk atau folder spam email Anda.', 'success');
    }, 'Mengirim email pemulihan...');
  }
}

init();