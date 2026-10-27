/**
 * MADASA — CODE.GS LENGKAP / REVISI GARIS TEBAL–TIPIS
 * ============================================================
 * Spreadsheet > Ekstensi > Apps Script. Frontend GitHub Pages.
 * GANTI seluruh backend lama. Jangan menumpuk file patch.
 * DB_ID, FOLDER_ID, SESSION_SECRET dan schema tetap sama.
 * Tidak perlu setup ulang untuk database yang sudah berjalan.
 *
 * Revisi: kop satu kali di body, logo otomatis, kontak lengkap,
 * garis tebal–tipis, jarak soal, tabel, halaman kunci, teks kosong.
 * Logo PNG dan gambar pemisah transparan tertanam di source.
 *
 * Login email hanya whitelist, bukan verifikasi pemilik email.
 * Orang yang tahu email admin bisa masuk sebagai admin.
 * Key tetap teks biasa. Bukan untuk data rahasia/pribadi siswa.
 * Tata letak bukan pengesahan otomatis atau sertifikasi nasional.
 */

/* ==================== A. KONFIGURASI ==================== */
const CONFIG = Object.freeze({
  FOLDER_NAME: 'EduPlan AI Documents', TIME_ZONE: 'Asia/Jakarta',
  SESSION_HOURS: 6, LOCK_TIMEOUT_MS: 15000, GENERATE_BUSY_SECONDS: 600,
  MAX_BODY: 220000, MAX_TEXT: 150000, MAX_PROMPT_INPUT: 25000,
  MAX_OUTPUT_TOKENS: 6000, TEST_OUTPUT_TOKENS: 1024,
  MAX_EXPORT_BYTES: 7000000, DEFAULT_DAILY_LIMIT: 20,
  MAX_DAILY_LIMIT: 500, MAX_LOGS_DISPLAYED: 200
});

const PRINT_CONFIG = Object.freeze({
  FONT: 'Arial', BODY_SIZE: 12, TABLE_SIZE: 10, TITLE_SIZE: 14,
  LINE_SPACING: 1.15, QUESTION_SPACE_BEFORE: 14,
  OPTION_SPACE_AFTER: 3, STEP_SPACE_BEFORE: 9,
  MARGIN_TOP: 56.7, MARGIN_BOTTOM: 70.9,
  MARGIN_LEFT: 85, MARGIN_RIGHT: 56.7,

  // Nama mengikuti contoh terakhir yang dibahas; sesuaikan identitas sah.
  SCHOOL_NAME: 'SATUAN PENDIDIKAN MADASA',
  GOVERNMENT_LINE: '',
  SCHOOL_ADDRESS: 'Bandang Laok, Kokop, Bangkalan, Madura 69155',
  SCHOOL_PHONE: '087846666636',
  SCHOOL_EMAIL: 'aromwebapp@gmail.com',
  SCHOOL_WEBSITE: 'www.moljeh.web.id',
  // Jika diisi, mengganti kontak otomatis; gunakan \n untuk baris baru.
  SCHOOL_CONTACT: '',
  LOGO_FILE_ID: '', AUTO_CREATE_LOGO: true, LOGO_MAX_SIZE: 60,
  SHOW_RUNNING_HEADER: false, SHOW_SIMPLE_FOOTER: true,
  // Template Google Docs SATU TAB untuk header ringkas dan field nomor halaman.
  // Body diganti. Jangan menaruh kop besar pada header template.
  TEMPLATE_DOC_ID: '',
  SHOW_DRAFT_LABEL: true, USE_LANDSCAPE_FOR_WIDE_TABLES: true,
  MAX_TABLE_COLUMNS: 8, MAX_TABLE_ROWS: 250,
  ADD_SIGNATURE_BLOCK: false,
  SIGNATURE_TYPES: ['rpp', 'modul_ajar', 'prota', 'promes', 'silabus', 'atp'],
  PRINCIPAL_NAME: '', PRINCIPAL_ID: '', LOCATION_AND_DATE: '',
  TEACHER_IDS_BY_EMAIL: Object.freeze({})
});

const CATALOG = {
  "perencanaan": {
    "title": "Perencanaan",
    "icon": "▤",
    "items": [
      "rpp",
      "modul_ajar",
      "atp",
      "silabus",
      "cp_rujukan",
      "tp",
      "kktp"
    ]
  },
  "program": {
    "title": "Program",
    "icon": "▦",
    "items": [
      "prota",
      "promes",
      "kalender_pendidikan",
      "pemetaan_materi",
      "distribusi_tp",
      "rencana_mingguan",
      "rencana_harian"
    ]
  },
  "asesmen": {
    "title": "Asesmen",
    "icon": "✓",
    "items": [
      "kisi_kisi",
      "bank_soal",
      "kunci_penskoran",
      "rubrik",
      "asesmen_diagnostik",
      "asesmen_formatif",
      "asesmen_sumatif",
      "analisis_hasil"
    ]
  },
  "administrasi": {
    "title": "Administrasi",
    "icon": "▣",
    "items": [
      "jurnal_mengajar",
      "daftar_nilai",
      "daftar_hadir",
      "agenda_pembelajaran",
      "remedial_pengayaan",
      "catatan_perkembangan",
      "laporan_evaluasi"
    ]
  },
  "bahan_media": {
    "title": "Bahan & Media",
    "icon": "✧",
    "items": [
      "lkpd",
      "bahan_ajar",
      "ringkasan_materi",
      "media_pembelajaran",
      "presentasi",
      "modul_proyek",
      "lembar_aktivitas",
      "materi_pengayaan",
      "materi_remedial",
      "refleksi_guru",
      "refleksi_peserta_didik"
    ]
  }
};


const SCHEMA = Object.freeze({
  Email: [
    'id', 'email', 'name', 'role', 'active', 'school'
  ],

  Providers: [
    'id', 'model', 'apiKey', 'enabled'
  ],

  Documents: [
    'id', 'owner', 'title', 'type', 'provider',
    'created', 'updated', 'fileId',
    'favorite', 'deleted', 'revision'
  ],

  Sessions: [
    'id', 'userId', 'expires'
  ],

  Usage: [
    'id', 'userId', 'day', 'attempts'
  ],

  Settings: [
    'id', 'value'
  ],

  Logs: [
    'id', 'email', 'action', 'target', 'created'
  ],

  QuotaRules: [
    'userId',
    'dailyLimit',
    'monthlyAllowance',
    'updated',
    'updatedBy'
  ],

  QuotaOperations: [
    'id',
    'type',
    'status',
    'actorId',
    'targetId',
    'created',
    'committedAt',
    'note'
  ],

  QuotaLedger: [
    'id',
    'operationId',
    'accountId',
    'bucket',
    'period',
    'delta',
    'type',
    'actorId',
    'requestId',
    'created',
    'note'
  ],

  AIRequests: [
    'id',
    'userId',
    'provider',
    'model',
    'purpose',
    'status',
    'reservedTokens',
    'inputTokens',
    'outputTokens',
    'totalTokens',
    'usageSource',
    'created',
    'updated',
    'documentId',
    'errorCode'
  ]
});


const PROVIDER_IDS = Object.freeze(['gemini', 'openai', 'claude']);
const ROLES = Object.freeze(['guru', 'admin']);
const QUESTION_TYPES = Object.freeze(['bank_soal', 'asesmen_diagnostik', 'asesmen_formatif', 'asesmen_sumatif']);

const QUOTA_CONFIG = Object.freeze({
  VERSION: '1',
  VERSION_SETTING: 'quotaSchemaVersion',

  ADMIN_ACCOUNT_ID: '__ADMIN_STOCK__',

  // Belum diaktifkan sampai integrasi generate selesai.
  ENFORCEMENT_SETTING: 'quotaEnforcementEnabled',

  SHEETS: Object.freeze([
    'QuotaRules',
    'QuotaOperations',
    'QuotaLedger',
    'AIRequests'
  ])
});


// Aset gambar, bukan key. Jangan mengedit potongan base64 secara manual.
const MADASA_LOGO_PNG_BASE64 = [
  "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",
  "SUVORK5CYII="
].join('');
const MADASA_RULE_PNG_BASE64 = [
  "iVBORw0KGgoAAAANSUhEUgAABLAAAAAYCAYAAADqIQRfAAAAq0lEQVR4nO3YsQ3AIBAEwYP+e8YVQIT1LzRTwcabAAAAAAAAAAAAAAAAAAAPGk",
  "lWdQQAAAAA7MzqAAAAAAA4MbAAAAAAaM3AAgAAAKA1AwsAAACA1gwsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuGElWdQQAAAAA",
  "7MzqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICffdXCAg3GJ4OEAAAAAElFTkSuQmCC"
].join('');

/* ==================== B. UTILITAS DAN DATABASE ==================== */

// ------------------------------------------------------------
// FUNGSI 01 — assert_
// Kesalahan aplikasi terkontrol.
// ------------------------------------------------------------
function assert_(condition, message, code) {
  if (condition) return;
  const error = new Error(message); error.name = 'EduPlanError'; error.code = code || 'VALIDATION';
  throw error;
}

// ------------------------------------------------------------
// FUNGSI 02 — uuid_
// ID acak.
// ------------------------------------------------------------
function uuid_() {
  return Utilities.getUuid();
}

// ------------------------------------------------------------
// FUNGSI 03 — now_
// Waktu ISO.
// ------------------------------------------------------------
function now_() {
  return new Date().toISOString();
}

// ------------------------------------------------------------
// FUNGSI 04 — day_
// Tanggal WIB untuk kuota.
// ------------------------------------------------------------
function day_() {
  return Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, 'yyyy-MM-dd');
}

// ------------------------------------------------------------
// FUNGSI 05 — truth_
// Membaca TRUE boolean atau teks.
// ------------------------------------------------------------
function truth_(value) {
  return value === true || String(value).trim().toLowerCase() === 'true';
}

// ------------------------------------------------------------
// FUNGSI 06 — text_
// Membersihkan tepi dan panjang teks.
// ------------------------------------------------------------
function text_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max || 300);
}

// ------------------------------------------------------------
// FUNGSI 07 — email_
// Normalisasi email.
// ------------------------------------------------------------
function email_(value) {
  return text_(value, 254).toLowerCase();
}

// ------------------------------------------------------------
// FUNGSI 08 — validEmail_
// Validasi bentuk, bukan kepemilikan email.
// ------------------------------------------------------------
function validEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ------------------------------------------------------------
// FUNGSI 09 — isObject_
// Parameter objek selain null/array.
// ------------------------------------------------------------
function isObject_(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// ------------------------------------------------------------
// FUNGSI 10 — locked_
// Kunci penulisan untuk proses serentak.
// ------------------------------------------------------------
function locked_(callback) {
  const lock = LockService.getScriptLock();
  assert_(lock.tryLock(CONFIG.LOCK_TIMEOUT_MS), 'Server sibuk. Coba lagi.', 'BUSY');
  try { return callback(); } finally { lock.releaseLock(); }
}

// ------------------------------------------------------------
// FUNGSI 11 — sheet_
// Akses tab via DB_ID, termasuk saat web app.
// ------------------------------------------------------------
function sheet_(name) {
  assert_(Object.prototype.hasOwnProperty.call(SCHEMA, name), 'Nama tab tidak dikenal.');
  const id = PropertiesService.getScriptProperties().getProperty('DB_ID');
  assert_(id, 'Database belum disiapkan. Jalankan setup dari editor.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(name);
  assert_(sheet, 'Tab ' + name + ' tidak ditemukan.'); return sheet;
}

// ------------------------------------------------------------
// FUNGSI 12 — all_
// Membaca data tanpa menggeser nomor baris kosong.
// ------------------------------------------------------------
function all_(name) {
  const values = sheet_(name).getDataRange().getValues(), heads = values.shift();
  return values.map(function (data, index) {
    if (!data.some(function (v) { return v !== ''; })) return null;
    const row = {_row: index + 2};
    heads.forEach(function (key, col) {
      const v = data[col]; row[key] = v instanceof Date ? (name === 'Usage' && key === 'day' ?
        Utilities.formatDate(v, CONFIG.TIME_ZONE, 'yyyy-MM-dd') : v.toISOString()) : v;
    }); return row;
  }).filter(function (r) { return r !== null; });
}

// ------------------------------------------------------------
// FUNGSI 13 — safeCell_
// Mencegah teks menjadi formula.
// ------------------------------------------------------------
function safeCell_(value) {
  return typeof value === 'string' && /^[=+@\-]/.test(value) ? "'" + value : value;
}

// ------------------------------------------------------------
// FUNGSI 14 — rowValues_
// Urutan kolom sesuai schema.
// ------------------------------------------------------------
function rowValues_(name, row) {
  return SCHEMA[name].map(function (k) { return safeCell_(row[k] === undefined ? '' : row[k]); });
}

// ------------------------------------------------------------
// FUNGSI 15 — add_
// Menambah satu baris.
// ------------------------------------------------------------
function add_(name, row) {
  sheet_(name).appendRow(rowValues_(name, row));
}

// ------------------------------------------------------------
// FUNGSI 16 — put_
// Memperbarui baris berdasarkan _row.
// ------------------------------------------------------------
function put_(name, row) {
  assert_(Number.isInteger(row._row) && row._row >= 2, 'Nomor baris tidak valid.');
  sheet_(name).getRange(row._row, 1, 1, SCHEMA[name].length).setValues([rowValues_(name, row)]);
}

// ------------------------------------------------------------
// FUNGSI 17 — log_
// Aktivitas tanpa key/token.
// ------------------------------------------------------------
function log_(user, action, target) {
  add_('Logs', {id: uuid_(), email: user.email, action: action, target: target || '', created: now_()});
}

// ------------------------------------------------------------
// FUNGSI 18 — hash_
// Hash token sebelum disimpan.
// ------------------------------------------------------------
function hash_(token) {
  const secret = PropertiesService.getScriptProperties().getProperty('SESSION_SECRET');
  assert_(secret, 'Secret sesi belum tersedia.');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(token || ''), secret));
}

/* ==================== C. SETUP DAN PEMELIHARAAN ==================== */

// ------------------------------------------------------------
// FUNGSI 19 — jalankanSetup
// Setup pertama dari dropdown editor.
// ------------------------------------------------------------
function jalankanSetup() {
  setup_();
}

// ------------------------------------------------------------
// FUNGSI 20 — setup_
// Memakai Spreadsheet terikat dan menjaga konfigurasi lama.
// ------------------------------------------------------------
function setup_() {
  const db = SpreadsheetApp.getActiveSpreadsheet();
  assert_(db, 'Buka Spreadsheet > Ekstensi > Apps Script.');
  const email = email_(Session.getEffectiveUser().getEmail()); assert_(email, 'Email pemilik tidak terbaca.');
  return locked_(function () {
    const props = PropertiesService.getScriptProperties(), oldId = props.getProperty('DB_ID');
    assert_(!oldId || oldId === db.getId(), 'Proyek terhubung ke Spreadsheet lain. Setup dihentikan.');
    Object.keys(SCHEMA).forEach(function (name) {
      const sheet = db.getSheetByName(name); if (!sheet || !sheet.getLastRow()) return;
      const actual = sheet.getRange(1, 1, 1, SCHEMA[name].length).getValues()[0];
      assert_(SCHEMA[name].every(function (v,i) { return String(actual[i]).trim() === v; }) && sheet.getLastColumn() <= SCHEMA[name].length,
        'Header tab ' + name + ' tidak sesuai. Cadangkan dan periksa.');
    });
    Object.keys(SCHEMA).forEach(function (name) {
      const sheet = db.getSheetByName(name) || db.insertSheet(name);
      if (!sheet.getLastRow()) sheet.appendRow(SCHEMA[name]);
      sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, SCHEMA[name].length).setFontWeight('bold').setBackground('#eae7ff');
    });
    db.getSheetByName('Usage').getRange('C2:C').setNumberFormat('@');
    props.setProperties({DB_ID: db.getId(), FOLDER_ID: props.getProperty('FOLDER_ID') || DriveApp.createFolder(CONFIG.FOLDER_NAME).getId(),
      SESSION_SECRET: props.getProperty('SESSION_SECRET') || uuid_() + uuid_()});
    if (!oldId) {
      const u = all_('Email').find(function (r) { return email_(r.email) === email; });
      if (u) { Object.assign(u, {id: u.id || uuid_(), name: u.name || 'Administrator', role: 'admin', active: true}); put_('Email', u); }
      else add_('Email', {id: uuid_(), email: email, name: 'Administrator', role: 'admin', active: true, school: PRINT_CONFIG.SCHOOL_NAME});
    }
    const providers = all_('Providers');
    PROVIDER_IDS.forEach(function (id) {
      if (!providers.some(function (p) { return p.id === id; })) add_('Providers', {id: id, model: '', apiKey: '', enabled: false});
    });
    if (!all_('Settings').some(function (s) { return s.id === 'dailyLimit'; })) add_('Settings', {id: 'dailyLimit', value: String(CONFIG.DEFAULT_DAILY_LIMIT)});
    SpreadsheetApp.flush(); console.log('SETUP SELESAI\nAkun: ' + email + '\nDatabase: ' + db.getUrl());
  });
}

// ------------------------------------------------------------
// FUNGSI 21 — bersihkanSesiKedaluwarsa
// Menghapus sesi berakhir, bukan dokumen.
// ------------------------------------------------------------
function bersihkanSesiKedaluwarsa() {
  const count = locked_(function () {
    const sheet = sheet_('Sessions'); let n = 0;
    all_('Sessions').reverse().forEach(function (s) { if (Number(s.expires) <= Date.now()) { sheet.deleteRow(s._row); n++; } }); return n;
  }); console.log('Sesi dihapus: ' + count);
}

/* ==================== D. HTTP, LOGIN DAN PROFIL ==================== */

// ------------------------------------------------------------
// FUNGSI 22 — json_
// Respons JSON untuk frontend.
// ------------------------------------------------------------
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------
// FUNGSI 23 — doGet
// Status endpoint, bukan halaman frontend.
// ------------------------------------------------------------
function doGet() {
  return json_({success: true, data: {service: 'EduPlan AI', status: 'online'}});
}

// ------------------------------------------------------------
// FUNGSI 24 — parseRequest_
// Memvalidasi JSON, ukuran dan parameter.
// ------------------------------------------------------------
function parseRequest_(event) {
  const raw = event && event.postData && event.postData.contents;
  assert_(raw && raw.length <= CONFIG.MAX_BODY, 'Body kosong/terlalu besar.');
  let body; try { body = JSON.parse(raw); } catch (_) { assert_(false, 'JSON tidak valid.'); }
  assert_(isObject_(body), 'Body tidak valid.');
  const params = body.params == null ? {} : body.params; assert_(isObject_(params), 'Parameter tidak valid.');
  return {action: String(body.action || '').trim(), params: params, token: body.token};
}

// ------------------------------------------------------------
// FUNGSI 25 — doPost
// Memeriksa sesi dan mengirim kesalahan aman.
// ------------------------------------------------------------
function doPost(event) {
  try {
    const r = parseRequest_(event);
    if (r.action === 'login') return json_({success: true, data: login_(r.params)});
    const user = authenticate_(r.token);
    return json_({success: true, data: dispatch_(r.action, r.params, user, r.token)});
  } catch (error) {
    const known = error.name === 'EduPlanError';
       if (!known) {
      // Simpan jenis error dan lokasi kode, bukan pesan mentah
      // yang mungkin mengandung informasi sensitif.
      const frames = String(error.stack || '')
        .split('\n')
        .filter(function (line) {
          return /^\s*at\s/.test(line);
        })
        .slice(0, 8)
        .join('\n');

      console.error(
        'Operasi internal gagal; jenis: ' +
        String(error.name || 'Error') +
        '\nLokasi:\n' +
        (frames || 'Tidak tersedia')
      );
    }
    return json_({success: false, message: known ? error.message : 'Operasi server gagal. Periksa diagnostik dan izin layanan.', code: error.code || 'REQUEST_FAILED'});
  }
}


// ------------------------------------------------------------
// FUNGSI 26 — dispatch_
// Rute frontend dan kuota; akses admin diperiksa.
// ------------------------------------------------------------
function dispatch_(action, params, user, token) {
  const routes = {
    boot: function () {
      return boot_(user);
    },

    logout: function () {
      return logout_(token);
    },

    listDocuments: function () {
      return listDocuments_(user);
    },

    generate: function () {
      return generate_(user, params);
    },

    readDocument: function () {
      return readDocument_(user, params.id);
    },

    saveDocument: function () {
      return saveDocument_(user, params);
    },

    favoriteDocument: function () {
      return changeDocument_(user, params, 'favorite');
    },

    trashDocument: function () {
      return changeDocument_(user, params, 'deleted');
    },

    exportDocument: function () {
      return exportDocument_(user, params);
    },

    saveProfile: function () {
      return saveProfile_(user, params);
    },

    adminData: function () {
      requireAdmin_(user);
      return adminData_();
    },

    saveUser: function () {
      requireAdmin_(user);
      return saveUser_(user, params);
    },

    saveProvider: function () {
      requireAdmin_(user);
      return saveProvider_(user, params);
    },

    saveSettings: function () {
      requireAdmin_(user);
      return saveSettings_(user, params);
    },

    testProvider: function () {
      requireAdmin_(user);

      return {
        text: callAI_(
          params.id,
          'Jawab hanya: Koneksi berhasil.',
          CONFIG.TEST_OUTPUT_TOKENS,
          {
            userId: user.id,
            purpose: 'connection_test'
          }
        )
      };
    },

    // ==================== RUTE KUOTA ====================

    quotaMine: function () {
      return quotaMyBalance_(user);
    },

    quotaAdmin: function () {
      requireAdmin_(user);
      return quotaAdminOverview_(user);
    },

    quotaAddStock: function () {
      requireAdmin_(user);
      return quotaAddStock_(user, params);
    },

    quotaTransfer: function () {
      requireAdmin_(user);
      return quotaTransfer_(user, params);
    }
  };

  assert_(
    Object.prototype.hasOwnProperty.call(routes, action),
    'Aksi tidak tersedia.'
  );

  return routes[action]();
}


// ------------------------------------------------------------
// FUNGSI 27 — publicUser_
// Profil aman dikirim ke frontend.
// ------------------------------------------------------------
function publicUser_(u) {
  return {id: u.id, email: u.email, name: u.name, role: u.role, active: truth_(u.active), school: u.school};
}

// ------------------------------------------------------------
// FUNGSI 28 — login_
// Whitelist email dan sesi, bukan bukti identitas.
// ------------------------------------------------------------
function login_(params) {
  const email = email_(params.email); assert_(validEmail_(email), 'Format email tidak valid.');
  return locked_(function () {
    const matches = all_('Email').filter(function (u) { return email_(u.email) === email; });
    assert_(matches.length <= 1, 'Email duplikat; periksa database.');
    const u = matches[0]; assert_(u && truth_(u.active), 'Email tidak terdaftar atau akun tidak aktif.');
    assert_(u.id && ROLES.indexOf(u.role) >= 0, 'ID/peran akun tidak valid.');
    const token = uuid_() + uuid_(), expires = Date.now() + CONFIG.SESSION_HOURS * 3600000;
    add_('Sessions', {id: hash_(token), userId: u.id, expires: expires}); log_(u, 'login', '');
    return {token: token, expires: expires, user: publicUser_(u)};
  });
}

// ------------------------------------------------------------
// FUNGSI 29 — authenticate_
// Memeriksa token, kedaluwarsa, status dan peran.
// ------------------------------------------------------------
function authenticate_(token) {
  assert_(typeof token === 'string' && token.length >= 30 && token.length <= 200, 'Silakan login kembali.', 'AUTH');
  const digest = hash_(token), s = all_('Sessions').find(function (r) { return r.id === digest; });
  assert_(s && Number(s.expires) > Date.now(), 'Sesi berakhir. Login kembali.', 'AUTH');
  const u = all_('Email').find(function (r) { return r.id === s.userId; });
  assert_(u && truth_(u.active) && ROLES.indexOf(u.role) >= 0, 'Akun tidak aktif.', 'AUTH'); return u;
}

// ------------------------------------------------------------
// FUNGSI 30 — logout_
// Menghapus sesi yang sesuai token.
// ------------------------------------------------------------
function logout_(token) {
  return locked_(function () {
    const digest = hash_(token), r = all_('Sessions').find(function (s) { return s.id === digest; });
    if (r) sheet_('Sessions').deleteRow(r._row); return true;
  });
}

// ------------------------------------------------------------
// FUNGSI 31 — requireAdmin_
// Menolak akses admin dari guru.
// ------------------------------------------------------------
function requireAdmin_(u) {
  assert_(u && u.role === 'admin', 'Akses hanya untuk admin.', 'FORBIDDEN');
}

// ------------------------------------------------------------
// FUNGSI 32 — boot_
// Data dashboard sesuai akses.
// ------------------------------------------------------------
function boot_(u) {
  return {user: publicUser_(u), catalog: CATALOG, providers: activeProviders_(), documents: listDocuments_(u), usage: usage_(u)};
}

// ------------------------------------------------------------
// FUNGSI 33 — saveProfile_
// Menyimpan nama/sekolah tanpa mengubah email/peran.
// ------------------------------------------------------------
function saveProfile_(user, params) {
  return locked_(function () {
    const u = all_('Email').find(function (r) { return r.id === user.id; }); assert_(u, 'Akun tidak ditemukan.');
    assert_(text_(params.name, 100), 'Nama wajib diisi.');
    u.name = text_(params.name, 100); u.school = text_(params.school, 200);
    put_('Email', u); log_(user, 'profile', user.id); return publicUser_(u);
  });
}

/* ==================== E. DOKUMEN DAN KUOTA ==================== */

// ------------------------------------------------------------
// FUNGSI 34 — publicDocument_
// Metadata tanpa fileId privat.
// ------------------------------------------------------------
function publicDocument_(d) {
  return {id: d.id, owner: d.owner, title: d.title, type: d.type, provider: d.provider, created: d.created,
    updated: d.updated, favorite: truth_(d.favorite), deleted: truth_(d.deleted), revision: Number(d.revision || 1)};
}

// ------------------------------------------------------------
// FUNGSI 35 — listDocuments_
// Riwayat sendiri atau semua untuk admin.
// ------------------------------------------------------------
function listDocuments_(u) {
  return all_('Documents').filter(function (d) { return u.role === 'admin' || email_(d.owner) === email_(u.email); }).reverse().map(publicDocument_);
}

// ------------------------------------------------------------
// FUNGSI 36 — ownDocument_
// Memeriksa hak akses sebelum operasi dokumen.
// ------------------------------------------------------------
function ownDocument_(u, id) {
  const d = all_('Documents').find(function (r) { return r.id === id; });
  assert_(d && (u.role === 'admin' || email_(d.owner) === email_(u.email)), 'Dokumen tidak ditemukan.', 'NOT_FOUND'); return d;
}

// ------------------------------------------------------------
// FUNGSI 37 — readDocument_
// Membaca teks Drive setelah pemeriksaan akses.
// ------------------------------------------------------------
function readDocument_(u, id) {
  const d = ownDocument_(u, id); assert_(!truth_(d.deleted), 'Pulihkan dokumen dahulu.');
  return {doc: publicDocument_(d), text: DriveApp.getFileById(d.fileId).getBlob().getDataAsString('UTF-8')};
}

// ------------------------------------------------------------
// FUNGSI 38 — saveDocument_
// Menyimpan judul/isi dengan pemeriksaan konflik revisi.
// ------------------------------------------------------------
function saveDocument_(u, params) {
  assert_(typeof params.text === 'string' && params.text.length <= CONFIG.MAX_TEXT, 'Teks tidak valid/terlalu panjang.');
  return locked_(function () {
    const d = ownDocument_(u, params.id); assert_(!truth_(d.deleted), 'Dokumen di sampah.');
    assert_(Number(params.revision) === Number(d.revision || 1), 'Dokumen berubah di sesi lain. Salin perubahan lokal lalu buka ulang.', 'CONFLICT');
    const title = text_(params.title || d.title, 180); assert_(title, 'Judul wajib diisi.');
    DriveApp.getFileById(d.fileId).setContent(params.text);
    Object.assign(d, {title: title, updated: now_(), revision: Number(d.revision || 1) + 1});
    put_('Documents', d); log_(u, 'edit', d.id); return publicDocument_(d);
  });
}

// ------------------------------------------------------------
// FUNGSI 39 — changeDocument_
// Mengubah favorit/sampah sesuai akses.
// ------------------------------------------------------------
function changeDocument_(u, params, field) {
  assert_(['favorite', 'deleted'].indexOf(field) >= 0, 'Atribut tidak valid.');
  return locked_(function () {
    const d = ownDocument_(u, params.id); d[field] = params.value === true; put_('Documents', d);
    log_(u, field === 'deleted' ? (d.deleted ? 'trash' : 'restore') : 'favorite', d.id); return publicDocument_(d);
  });
}

// ------------------------------------------------------------
// FUNGSI 40 — dailyLimit_
// Membaca batas percobaan harian valid.
// ------------------------------------------------------------
function dailyLimit_() {
  const r = all_('Settings').find(function (s) { return s.id === 'dailyLimit'; }), n = r ? Number(r.value) : CONFIG.DEFAULT_DAILY_LIMIT;
  assert_(Number.isInteger(n) && n >= 1 && n <= CONFIG.MAX_DAILY_LIMIT, 'Kuota harian tidak valid.'); return n;
}

// ------------------------------------------------------------
// FUNGSI 41 — findUsage_
// Penggunaan akun per hari WIB.
// ------------------------------------------------------------
function findUsage_(u) {
  const day = day_(); return all_('Usage').find(function (r) { return r.userId === u.id && String(r.day) === day; });
}

// ------------------------------------------------------------
// FUNGSI 42 — usage_
// Pemakaian dan batas ke dashboard.
// ------------------------------------------------------------
function usage_(u) {
  const r = findUsage_(u); return {used: r ? Number(r.attempts) : 0, limit: dailyLimit_()};
}

// ------------------------------------------------------------
// FUNGSI 43 — reserveGenerate_
// Menghitung percobaan dan menandai proses berjalan.
// ------------------------------------------------------------
function reserveGenerate_(u) {
  return locked_(function () {
    const cache = CacheService.getScriptCache(), key = 'busy:' + u.id;
    assert_(!cache.get(key), 'Generate masih berjalan.', 'BUSY');
    const r = findUsage_(u); assert_(!r || Number(r.attempts) < dailyLimit_(), 'Batas generate harian tercapai.', 'DAILY_LIMIT');
    if (r) { r.attempts = Number(r.attempts) + 1; put_('Usage', r); }
    else add_('Usage', {id: uuid_(), userId: u.id, day: day_(), attempts: 1});
    cache.put(key, '1', CONFIG.GENERATE_BUSY_SECONDS);
  });
}

const TYPE_INSTRUCTIONS = Object.freeze({
  "rpp": "Identitas, tujuan, materi, metode, pembuka, inti, penutup, asesmen, diferensiasi, tindak lanjut.",
  "modul_ajar": "Identitas, kompetensi awal, tujuan, profil peserta didik, kegiatan, diferensiasi, asesmen, remedial, pengayaan, refleksi.",
  "atp": "Urutkan tujuan dengan materi, prasyarat, fase/kelas, waktu dan hubungan antartujuan.",
  "silabus": "Identitas, kompetensi/tujuan, materi, kegiatan, asesmen, waktu dan sumber yang diberikan.",
  "cp_rujukan": "Hanya CP resmi yang ditempel; tanpa sumber buat template, jangan mengarang kutipan/nomor regulasi.",
  "tp": "Tujuan teramati dari CP sumber. Tanpa CP tandai contoh draf, bukan kutipan resmi.",
  "kktp": "Kriteria, bukti, deskriptor dan tindak lanjut tanpa kebijakan sekolah rekaan.",
  "prota": "Peta tujuan/materi setahun; minggu efektif dari sumber atau placeholder.",
  "promes": "Peta tujuan/materi semester; minggu efektif dari sumber atau placeholder.",
  "kalender_pendidikan": "Hanya tanggal dari sumber; tanpa kalender resmi buat template tanpa hari libur rekaan.",
  "pemetaan_materi": "Materi, prasyarat, tujuan, fase/kelas, urutan, waktu, asesmen.",
  "distribusi_tp": "Distribusi tujuan antarunit/pertemuan, urutan, waktu, bukti asesmen.",
  "rencana_mingguan": "Fokus mingguan, tujuan, agenda harian, sumber, asesmen, tindak lanjut.",
  "rencana_harian": "Tujuan, waktu, pembuka, inti, penutup, alat, asesmen, refleksi.",
  "kisi_kisi": "Tabel indikator/tujuan, materi, level, bentuk, nomor soal; pecah jika lebih enam kolom.",
  "bank_soal": "Butir sesuai jumlah/bentuk, terpisah dari kunci, pembahasan, skor.",
  "kunci_penskoran": "Kunci cocok dengan soal sumber; tanpa soal buat template, bukan jawaban tebakan. Skor per butir.",
  "rubrik": "Kriteria, deskriptor, bobot, skor, penghitungan; pecah tabel jika lebar.",
  "asesmen_diagnostik": "Tujuan diagnosis, instrumen, interpretasi, tindak lanjut tanpa hasil siswa fiktif.",
  "asesmen_formatif": "Cek pemahaman, instrumen, bukti, umpan balik, penyesuaian kegiatan.",
  "asesmen_sumatif": "Cakupan tujuan, instrumen, kunci, skor, kriteria, tindak lanjut.",
  "analisis_hasil": "Hanya data anonim pengguna; tanpa data buat template/rumus, bukan hasil fiktif. Guru memeriksa hitungan.",
  "jurnal_mengajar": "Template tanggal, kelas, tujuan, materi, kegiatan, catatan, tindak lanjut tanpa kejadian rekaan.",
  "daftar_nilai": "Template nilai tanpa identitas/nilai rekaan yang diklaim nyata.",
  "daftar_hadir": "Template hadir tanpa nama/tanggal/status rekaan.",
  "agenda_pembelajaran": "Agenda, target, pelaksanaan, catatan, tindak lanjut; bedakan rencana/realisasi.",
  "remedial_pengayaan": "Dasar pemilihan, tujuan, kegiatan, asesmen ulang, pemantauan tanpa data siswa fiktif.",
  "catatan_perkembangan": "Template bukti perkembangan dan tindak lanjut tanpa pengamatan rekaan.",
  "laporan_evaluasi": "Temuan dari data; tanpa data buat template, bukan kesimpulan fiktif.",
  "lkpd": "Identitas, tujuan, alat/bahan, petunjuk, langkah, pertanyaan, penilaian, refleksi.",
  "bahan_ajar": "Tujuan, konsep, penjelasan bertahap, contoh, latihan, rangkuman, evaluasi.",
  "ringkasan_materi": "Ide pokok, istilah, hubungan konsep, contoh, cek pemahaman.",
  "media_pembelajaran": "Rancangan/storyboard, bahan, pembuatan, penggunaan; bukan gambar/video yang sudah dibuat.",
  "presentasi": "Outline tiap slide: judul, isi, catatan pembicara, saran visual; bukan PPTX.",
  "modul_proyek": "Pertanyaan pemantik, tujuan, tahapan, jadwal, sumber, produk, rubrik, refleksi.",
  "lembar_aktivitas": "Tujuan, petunjuk, tugas, kolom jawaban, bukti, refleksi.",
  "materi_pengayaan": "Tantangan lanjutan, pendalaman, tugas terbuka, kriteria berhasil.",
  "materi_remedial": "Kesulitan sasaran, penjelasan sederhana, contoh bertahap, latihan, cek ulang.",
  "refleksi_guru": "Pertanyaan, bukti, pembelajaran, perbaikan; tanpa pengalaman rekaan.",
  "refleksi_peserta_didik": "Instrumen sesuai usia: pemahaman, perasaan, kesulitan, bantuan."
});

// ------------------------------------------------------------
// FUNGSI 44 — kindInstructions_
// Arahan per jenis generator.
// ------------------------------------------------------------
function kindInstructions_(type) {
  return TYPE_INSTRUCTIONS[type] || 'Sesuaikan dengan jenis dan konteks kelas.';
}

// ------------------------------------------------------------
// FUNGSI 45 — buildPrompt_
// Instruksi formal, tabel, jarak soal dan halaman kunci.
// ------------------------------------------------------------
function buildPrompt_(u, params) {
  const lines = [
    'Anda asisten perangkat ajar Indonesia. Buat DRAF formal, ringkas, jelas dan konsisten untuk ditinjau guru.',
    'Jenis: ' + String(params.type).replace(/_/g, ' ').toUpperCase(),
    'Tanpa sapaan/promosi. Jangan mengarang siswa, nilai, pengalaman nyata, CP resmi, regulasi, sumber, pejabat, tanda tangan/pengesahan, nomor surat atau hari libur.',
    'Data kurang: [perlu diisi] atau [perlu diverifikasi]. Bedakan contoh/asumsi dari fakta. Jangan mengklaim disahkan.',
    'Baris pertama judul tanpa #; baris kedua DRAF UNTUK DITINJAU GURU. Jangan membuat kop/logo/alamat: sistem menambahkannya.',
    'Bagian A. IDENTITAS, B. ... judul kapital. Langkah utama 1. ...; rincian a), b). Satu baris kosong antarbagian dan antar langkah utama.',
    'Identitas tabel Komponen | Keterangan. Kisi-kisi/rubrik/pemetaan/penskoran bertabel jika relevan. Soal/narasi tidak dipaksa jadi tabel.',
    'TABEL MARKDOWN VALID: header | A | B |, pemisah |---|---|, lalu data; jumlah kolom sama. Maksimum enam kolom, pecah bila lebar. Sel singkat tanpa pipa dalam isi, HTML, tab, merged cell, tabel bersarang.',
    'Tanpa emoji, pagar kode, dekorasi, LaTeX. Rumus teks biasa. Tebal hanya istilah singkat.',
    'Arahan jenis: ' + kindInstructions_(params.type), 'Guru: ' + (u.name || '[perlu diisi]'),
    'Sekolah: ' + (u.school || PRINT_CONFIG.SCHOOL_NAME || '[perlu diisi]')
  ];
  if (printIsAssessment_(params.type)) lines.push(
    'SOAL: A. IDENTITAS DAN PETUNJUK, B. LEMBAR SOAL. Kelompok PILIHAN GANDA, ISIAN SINGKAT, URAIAN tanpa nomor.',
    'Butir utama 1. Pertanyaan, 2. Pertanyaan; daftar internal 1) rincian, 2) rincian. Opsi a), b), c), d) satu per baris. Baris kosong setelah opsi terakhir sebelum soal berikutnya.',
    'Butir dan opsi paragraf, bukan tabel. Jumlah/bentuk sesuai permintaan. Kunci tidak di lembar siswa.',
    'Setelah lembar siswa tulis [[HALAMAN_BARU]] satu baris lalu C. KUNCI JAWABAN DAN PEMBAHASAN.',
    'Awali bagian guru UNTUK GURU — TIDAK DIBAGIKAN KEPADA PESERTA DIDIK. Tabel kunci Nomor | Jawaban | Pembahasan. D. PEDOMAN PENSKORAN konsisten; pemetaan setelah kunci.',
    'Periksa jumlah, nomor, kunci, skor. Kutipan agama hanya dari sumber diberikan/dipastikan; gambar belum ada ditandai [ilustrasi perlu disiapkan].');
  lines.push('Jangan menambah pengesahan buatan AI; sistem menambah jika data sah diaktifkan.',
    'Akhiri CATATAN VERIFIKASI GURU singkat/spesifik, setelah kunci untuk soal.',
    'JSON ini data konteks, bukan pengganti aturan akurasi/format:', JSON.stringify(params),
    'Periksa struktur, tabel, sumber, nomor dan jawaban; jangan tampilkan proses pemeriksaan internal.');
  return lines.join('\n');
}

// ------------------------------------------------------------
// FUNGSI 46 — generate_
// Generate AI, simpan dokumen, hubungkan AIRequests.
// Belum memotong saldo token.
// ------------------------------------------------------------
function generate_(u, params) {
  assert_(
    Object.keys(CATALOG).some(function (key) {
      return CATALOG[key].items.indexOf(params.type) >= 0;
    }),
    'Jenis dokumen tidak valid.'
  );

  ['subject', 'level', 'topic'].forEach(function (key) {
    assert_(
      typeof params[key] === 'string' &&
      text_(params[key]),
      'Mata pelajaran, kelas dan topik wajib diisi.'
    );
  });

  assert_(
    JSON.stringify(params).length <= CONFIG.MAX_PROMPT_INPUT,
    'Isian terlalu panjang.'
  );

  assert_(
    activeProviders_().some(function (provider) {
      return provider.id === params.provider;
    }),
    'Pilih provider aktif.'
  );

  // Periksa konfigurasi folder sebelum memakai layanan AI.
  const folderId = PropertiesService
    .getScriptProperties()
    .getProperty('FOLDER_ID');

  assert_(folderId, 'Folder dokumen belum tersedia.');

  const folder = DriveApp.getFolderById(folderId);

  assert_(
    !folder.isTrashed(),
    'Folder dokumen berada di sampah.'
  );

  const requestId = uuid_();
  const documentId = uuid_();

  reserveGenerate_(u);

  let aiTextReady = false;
  let documentRecorded = false;
  let createdFileId = '';

  try {
    const rawText = callAI_(
      params.provider,
      buildPrompt_(u, params),
      CONFIG.MAX_OUTPUT_TOKENS,
      {
        requestId: requestId,
        userId: u.id,
        purpose: 'generate'
      }
    );

    aiTextReady = true;

    const text = normalizeGeneratedText_(rawText);

    assert_(
      text && text.length <= CONFIG.MAX_TEXT,
      'Hasil kosong/terlalu panjang.'
    );

    const timestamp = now_();

    const file = folder.createFile(
      documentId + '.txt',
      text,
      MimeType.PLAIN_TEXT
    );

    createdFileId = file.getId();

    const document = {
      id: documentId,
      owner: u.email,

      title: (
        params.type.replace(/_/g, ' ').toUpperCase() +
        ' — ' +
        text_(params.topic, 120)
      ).slice(0, 180),

      type: params.type,
      provider: params.provider,
      created: timestamp,
      updated: timestamp,
      fileId: createdFileId,
      favorite: false,
      deleted: false,
      revision: 1
    };

    // Catat dokumen terlebih dahulu.
    locked_(function () {
      add_('Documents', document);
      SpreadsheetApp.flush();
    });

    documentRecorded = true;

    // Gagal menulis log tidak membatalkan dokumen yang sudah tersimpan.
    try {
      locked_(function () {
        log_(u, 'generate', documentId);
        SpreadsheetApp.flush();
      });
    } catch (_) {
      console.error(
        'Dokumen tersimpan, log aktivitas gagal: ' +
        documentId
      );
    }

    // Gagal menghubungkan AIRequests juga tidak menghapus dokumen.
    try {
      aiMarkDocumentSaved_(requestId, documentId);
    } catch (_) {
      console.error(
        'Perlu rekonsiliasi AIRequests ' +
        requestId +
        ' dengan Documents ' +
        documentId
      );
    }

    return {
      doc: publicDocument_(document),
      text: text,
      usage: usage_(u)
    };

  } catch (error) {
    if (aiTextReady && !documentRecorded) {
      try {
        aiMarkDocumentFailed_(requestId, error);
      } catch (_) {
        console.error(
          'Gagal mencatat status penyimpanan: ' +
          requestId
        );
      }

      if (createdFileId) {
        // Jangan langsung hapus:
        // penulisan Documents mungkin sudah terjadi
        // meskipun proses konfirmasinya terputus.
        console.error(
          'Periksa file sebelum pembersihan: ' +
          createdFileId +
          '; calon Documents.id: ' +
          documentId
        );
      }

      assert_(
        false,
        'AI sudah menghasilkan teks, tetapi penyimpanan dokumen ' +
        'belum dapat dikonfirmasi. Periksa riwayat sebelum generate ulang. ' +
        'ID permintaan: ' + requestId,
        'DOCUMENT_SAVE_FAILED'
      );
    }

    throw error;

  } finally {
    CacheService
      .getScriptCache()
      .remove('busy:' + u.id);
  }
}

/* ==================== F. PROVIDER AI DAN PESAN ERROR ==================== */

// ------------------------------------------------------------
// FUNGSI 47 — normalizeModel_
// ID teknis, tanpa URL atau awalan models/ Gemini.
// ------------------------------------------------------------
function normalizeModel_(id, value) {
  let model = text_(value, 160); if (id === 'gemini') model = model.replace(/^models\//, '');
  assert_(!model || /^[A-Za-z0-9._:-]+$/.test(model), 'ID model bukan URL/spasi.'); return model;
}

// ------------------------------------------------------------
// FUNGSI 48 — activeProviders_
// Provider siap pakai tanpa key.
// ------------------------------------------------------------
function activeProviders_() {
  return all_('Providers').filter(function (p) { return truth_(p.enabled) && text_(p.apiKey, 2000) && text_(p.model, 160); })
    .map(function (p) { return {id: p.id, model: p.model}; });
}

// ------------------------------------------------------------
// FUNGSI 49 — configuredProvider_
// Konfigurasi lengkap hanya untuk server.
// ------------------------------------------------------------
function configuredProvider_(id, requireEnabled) {
  assert_(PROVIDER_IDS.indexOf(id) >= 0, 'Provider tidak dikenal.');
  const p = all_('Providers').find(function (r) { return r.id === id; });
  assert_(p && text_(p.apiKey, 2000) && text_(p.model, 160), 'ID model/API key belum lengkap.');
  assert_(!requireEnabled || truth_(p.enabled), 'Provider belum diaktifkan.');
  return Object.assign({}, p, {model: normalizeModel_(id, p.model), apiKey: text_(p.apiKey, 2000)});
}

// ------------------------------------------------------------
// FUNGSI 50 — providerRequest_
// Endpoint, header dan body provider.
// ------------------------------------------------------------
function providerRequest_(p, prompt, maxTokens) {
  const model = normalizeModel_(p.id, p.model);
  if (p.id === 'gemini') return {url: 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
    headers: {'x-goog-api-key': p.apiKey}, body: {contents: [{parts: [{text: prompt}]}], generationConfig: {maxOutputTokens: maxTokens}}};
  if (p.id === 'openai') return {url: 'https://api.openai.com/v1/responses', headers: {Authorization: 'Bearer ' + p.apiKey},
    body: {model: model, input: prompt, max_output_tokens: maxTokens, store: false}};
  if (p.id === 'claude') return {url: 'https://api.anthropic.com/v1/messages', headers: {'x-api-key': p.apiKey, 'anthropic-version': '2023-06-01'},
    body: {model: model, max_tokens: maxTokens, messages: [{role: 'user', content: prompt}]}};
  assert_(false, 'Provider tidak dikenal.');
}

// ------------------------------------------------------------
// FUNGSI 51 — fetchProvider_
// Panggilan API tanpa retry otomatis.
// ------------------------------------------------------------
function fetchProvider_(p, prompt, maxTokens) {
  const r = providerRequest_(p, prompt, maxTokens);
  try { return UrlFetchApp.fetch(r.url, {method: 'post', contentType: 'application/json', headers: r.headers, payload: JSON.stringify(r.body), muteHttpExceptions: true}); }
  catch (_) { assert_(false, 'Koneksi provider gagal/timeout. Periksa sebelum mengirim ulang.', 'API_NETWORK'); }
}

// ------------------------------------------------------------
// FUNGSI 52 — redactSecret_
// Menyembunyikan key pada diagnostik.
// ------------------------------------------------------------
function redactSecret_(value, secret) {
  let message = String(value || ''); if (secret) message = message.split(String(secret)).join('[KEY DISEMBUNYIKAN]');
  return message.replace(/AIza[0-9A-Za-z_-]+/g, '[KEY DISEMBUNYIKAN]');
}

// ------------------------------------------------------------
// FUNGSI 53 — providerError_
// Membedakan key, model, kuota, akses dan gangguan.
// ------------------------------------------------------------
function providerError_(p, status, data) {
  const e = data && data.error ? data.error : {}, raw = String(e.message || ''); let message, code;
  if (/api key not valid|invalid api key|invalid_api_key|incorrect api key|api key expired/i.test(raw) || status === 401) {
    message = 'API key ditolak. Simpan key yang masih berlaku.'; code = 'API_KEY_INVALID';
  } else if (status === 404) { message = 'Model/resource tidak ditemukan. Periksa ID dan endpoint.'; code = 'API_MODEL_NOT_FOUND';
  } else if (status === 429) { message = 'Kuota/batas permintaan provider tercapai.'; code = 'API_RATE_LIMIT';
  } else if (status === 503 || status === 529) { message = 'Layanan AI sedang sibuk. Tunggu lalu coba kembali. Konfigurasi tersimpan.'; code = 'API_UNAVAILABLE';
  } else if (status >= 500) { message = 'Gangguan provider sementara.'; code = 'API_SERVER_ERROR';
  } else if (status === 403) { message = 'Akses ditolak. Periksa izin, pembatasan key dan model.'; code = 'API_FORBIDDEN';
  } else if (status === 400) { message = e.status === 'FAILED_PRECONDITION' ? 'Persyaratan proyek belum terpenuhi; jalankan diagnostik.' : 'Parameter ditolak; periksa model/endpoint dan diagnostik.'; code = 'API_BAD_REQUEST';
  } else { message = 'Permintaan provider gagal; periksa konfigurasi.'; code = 'API_ERROR'; }
  return {message: p.id + ' (HTTP ' + status + '): ' + message, code: code};
}

// ------------------------------------------------------------
// FUNGSI 54 — parseAI_
// Membaca teks dan menolak jawaban kosong/terpotong.
// ------------------------------------------------------------
function parseAI_(id, data) {
  let text = '';
  if (id === 'gemini') {
    const c = (data.candidates || [])[0] || {};
    assert_(!c.finishReason || c.finishReason === 'STOP', 'Respons Gemini tidak lengkap/diblokir. Kurangi cakupan.', 'API_INCOMPLETE');
    text = ((c.content || {}).parts || []).filter(function (p) { return !p.thought; }).map(function (p) { return p.text || ''; }).join('\n');
  } else if (id === 'openai') {
    assert_(data.status !== 'incomplete' && data.status !== 'failed', 'Respons OpenAI tidak lengkap.', 'API_INCOMPLETE');
    text = (data.output || []).reduce(function (a, o) { return a.concat(o.content || []); }, [])
      .filter(function (p) { return p.type === 'output_text'; }).map(function (p) { return p.text || ''; }).join('\n');
  } else if (id === 'claude') {
    assert_(data.stop_reason !== 'max_tokens', 'Respons Claude terpotong.', 'API_INCOMPLETE');
    text = (data.content || []).filter(function (p) { return p.type === 'text'; }).map(function (p) { return p.text || ''; }).join('\n');
  }
  assert_(text.trim(), 'Provider tidak mengembalikan teks.', 'API_EMPTY'); return text;
}


// ------------------------------------------------------------
// FUNGSI 55 — callAI_
// Request AI, pencatatan metadata, dan pembacaan teks.
// Tetap mengembalikan string agar pemanggil lama kompatibel.
// ------------------------------------------------------------
function callAI_(id, prompt, maxTokens, context) {
  const p = configuredProvider_(id, true);
  const ctx = context || {};
  const requestId = ctx.requestId || uuid_();
  const timestamp = now_();

  assert_(
    typeof requestId === 'string' &&
    /^[A-Za-z0-9_-]{16,100}$/.test(requestId),
    'ID permintaan AI tidak valid.'
  );

  // Catat sebelum menghubungi provider.
  // Jika pencatatan awal gagal, API tidak dipanggil.
   locked_(function () {
    assert_(
      !all_('AIRequests').some(function (row) {
        return row.id === requestId;
      }),
      'ID permintaan AI sudah digunakan.',
      'CONFLICT'
    );

    add_('AIRequests', {
      id: requestId,
      userId: ctx.userId || '',
      provider: p.id,
      model: p.model,
      purpose: ctx.purpose || 'unspecified',
      status: 'started',
      reservedTokens: 0,
      inputTokens: '',
      outputTokens: '',
      totalTokens: '',
      usageSource: 'unavailable',
      created: timestamp,
      updated: timestamp,
      documentId: '',
      errorCode: ''
    });

    SpreadsheetApp.flush();
  });

  let stage = 'network';

  try {
    const response = fetchProvider_(p, prompt, maxTokens);
    const status = response.getResponseCode();

    stage = 'response';

    let data;

    try {
      data = JSON.parse(response.getContentText());
    } catch (_) {
      if (status >= 200 && status < 300) {
        assert_(
          false,
          'Respons bukan JSON. Permintaan perlu diperiksa sebelum dikirim ulang.',
          'API_RESPONSE'
        );
      }

      data = {};
    }

    if (status < 200 || status >= 300) {
      stage = 'http_error';

      const error = providerError_(p, status, data);
      assert_(false, error.message, error.code);
    }

    const usage = aiUsageMetadata_(id, data);

    // Simpan metadata sebelum parseAI_:
    // respons terpotong tetap dapat memiliki pemakaian token.
    stage = 'usage_log';

    aiUpdateRequest_(requestId, {
      status: 'response_received',
      inputTokens: usage.inputTokens === null
        ? ''
        : usage.inputTokens,
      outputTokens: usage.outputTokens === null
        ? ''
        : usage.outputTokens,
      totalTokens: usage.totalTokens === null
        ? ''
        : usage.totalTokens,
      usageSource: usage.usageSource
    });

    stage = 'parse';

    const text = parseAI_(id, data);

    stage = 'final_log';

    aiUpdateRequest_(requestId, {
      status: usage.totalTokens === null
        ? 'text_ready_usage_unknown'
        : 'text_ready',
      errorCode: ''
    });

    return text;

  } catch (error) {
    let requestStatus = 'needs_review';

    if (stage === 'http_error') {
      requestStatus = 'http_error';
    } else if (stage === 'parse') {
      requestStatus = 'text_rejected';
    }

    try {
      aiUpdateRequest_(requestId, {
        status: requestStatus,
        errorCode: text_(error.code || 'REQUEST_FAILED', 100)
      });
    } catch (_) {
      console.error(
        'Gagal memperbarui catatan AIRequests: ' + requestId
      );
    }

    // Jangan kirim ulang otomatis.
    throw error;
  }
}

/* ==================== G. JARAK, NOMOR DAN PARSER TABEL ==================== */

// ------------------------------------------------------------
// FUNGSI 56 — layoutSubheading_
// Judul kelompok tanpa angka yang menyerupai butir.
// ------------------------------------------------------------
function layoutSubheading_(value) {
  const m = String(value || '').trim().match(/^(?:(?:\d+|[IVX]+)[.)]\s*)?(Pilihan Ganda|Isian Singkat|Uraian|Benar Salah|Benar[–-]Salah|Menjodohkan)\s*:?$/i);
  return m ? m[1].toUpperCase() : '';
}

// ------------------------------------------------------------
// FUNGSI 57 — layoutSection_
// Judul kapital, bukan opsi.
// ------------------------------------------------------------
function layoutSection_(value) {
  const t = String(value || '').trim(); return /^[A-Z]\.\s+[A-Z0-9 /&(),:–—\-]+$/.test(t) || /^CATATAN VERIFIKASI GURU\s*:?$/i.test(t);
}

// ------------------------------------------------------------
// FUNGSI 58 — layoutOption_
// Mengenali opsi a) hingga e) atau a. hingga e.
// ------------------------------------------------------------
function layoutOption_(value) {
  return /^[a-eA-E][.)]\s+\S/.test(String(value || '').trim());
}

// ------------------------------------------------------------
// FUNGSI 59 — normalizeGeneratedText_
// Jarak nomor dan indentasi opsi tanpa merusak tabel.
// ------------------------------------------------------------
function normalizeGeneratedText_(value) {
  const result = [], lines = String(value || '').replace(/\r\n?/g, '\n').split('\n'); let previous = '';
  const gap = function () { if (result.length && result[result.length - 1] !== '') result.push(''); };
  lines.forEach(function (raw) {
    const end = raw.replace(/[ \t]+$/g, ''), t = end.trim(); if (!t) { gap(); return; }
    if (/^\|/.test(t)) { if (previous && !/^\|/.test(previous)) gap(); result.push(t); previous = t; return; }
    if (/^\|/.test(previous)) gap(); const sub = layoutSubheading_(t);
    if (sub) { gap(); result.push(sub, ''); previous = sub; return; }
    if (layoutSection_(t) || t === '[[HALAMAN_BARU]]') { gap(); result.push(t, ''); previous = t; return; }
    if (layoutOption_(t) || /^\d+\)\s+/.test(t) || /^[-•]\s+/.test(t)) { result.push('  ' + t); previous = t; return; }
    if (/^\d+\.\s+/.test(t)) { gap(); result.push(t); previous = t; return; }
    result.push(end); previous = t;
  }); return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ------------------------------------------------------------
// FUNGSI 60 — printIsAssessment_
// Jenis dokumen lembar siswa/kunci.
// ------------------------------------------------------------
function printIsAssessment_(type) {
  return QUESTION_TYPES.indexOf(type) >= 0;
}

// ------------------------------------------------------------
// FUNGSI 61 — printPlain_
// Membersihkan markup ringan sebelum cetak.
// ------------------------------------------------------------
function printPlain_(value) {
  return String(value || '').replace(/^\s{0,3}#{1,6}\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1').replace(/<br\s*\/?\s*>/gi, '; ').trim();
}

// ------------------------------------------------------------
// FUNGSI 62 — printSplitRow_
// Memisahkan sel dan pipa yang di-escape.
// ------------------------------------------------------------
function printSplitRow_(line) {
  let t = line.trim(); if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells = []; let cell = '';
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '\\' && t[i + 1] === '|') { cell += '|'; i++; }
    else if (t[i] === '|') { cells.push(printPlain_(cell)); cell = ''; } else cell += t[i];
  } cells.push(printPlain_(cell)); return cells;
}

// ------------------------------------------------------------
// FUNGSI 63 — printTableSeparator_
// Pemisah header tabel valid.
// ------------------------------------------------------------
function printTableSeparator_(line, count) {
  const cells = printSplitRow_(line); return cells.length === count && cells.every(function (c) { return /^:?-{3,}:?$/.test(c.replace(/\s/g, '')); });
}

// ------------------------------------------------------------
// FUNGSI 64 — printAnswerHeading_
// Judul kunci untuk halaman baru.
// ------------------------------------------------------------
function printAnswerHeading_(line) {
  return /^(?:[A-Z]\.\s*)?(?:KUNCI JAWABAN(?:\s+DAN\s+PEMBAHASAN)?|JAWABAN DAN PEMBAHASAN)\s*:?$/i.test(printPlain_(line));
}

// ------------------------------------------------------------
// FUNGSI 65 — printParse_
// Memecah teks menjadi paragraf, tabel dan page break.
// ------------------------------------------------------------
function printParse_(content) {
  const lines = String(content || '').replace(/\r\n?/g, '\n').split('\n'), blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim(); if (!raw || /^```/.test(raw) || /^[-*_]{3,}$/.test(raw)) continue;
    if (raw === '[[HALAMAN_BARU]]') { blocks.push({type: 'break'}); continue; }
    const cells = printSplitRow_(raw);
    if (raw.includes('|') && cells.length >= 2 && i + 1 < lines.length && printTableSeparator_(lines[i + 1], cells.length)) {
      assert_(cells.length <= PRINT_CONFIG.MAX_TABLE_COLUMNS, 'Tabel terlalu lebar; pecah tabel.');
      const rows = [cells]; i++;
      while (i + 1 < lines.length && lines[i + 1].trim().includes('|')) {
        const next = printSplitRow_(lines[i + 1]); assert_(next.length === cells.length, 'Jumlah kolom tabel tidak konsisten. Perbaiki di editor.');
        rows.push(next); i++; assert_(rows.length <= PRINT_CONFIG.MAX_TABLE_ROWS, 'Tabel terlalu panjang; pecah dokumen.');
      } blocks.push({type: 'table', rows: rows});
    } else {
      const t = printPlain_(raw); if (!t || (!PRINT_CONFIG.SHOW_DRAFT_LABEL && /^DRAF UNTUK DITINJAU GURU$/i.test(t))) continue;
      blocks.push({type: 'paragraph', text: t});
    }
  } return blocks;
}

/* ==================== H. ASET DAN IDENTITAS KOP ==================== */

// ------------------------------------------------------------
// FUNGSI 66 — printSchoolName_
// Nama sekolah konfigurasi atau profil.
// ------------------------------------------------------------
function printSchoolName_(owner) {
  return text_(PRINT_CONFIG.SCHOOL_NAME || owner.school, 300) || '[Nama sekolah perlu diisi]';
}

// ------------------------------------------------------------
// FUNGSI 67 — printContactLines_
// HP/email satu baris, website baris berikutnya.
// ------------------------------------------------------------
function printContactLines_() {
  if (PRINT_CONFIG.SCHOOL_CONTACT) return String(PRINT_CONFIG.SCHOOL_CONTACT).split(/\r?\n/).filter(Boolean);
  const first = []; if (PRINT_CONFIG.SCHOOL_PHONE) first.push('HP : ' + PRINT_CONFIG.SCHOOL_PHONE);
  if (PRINT_CONFIG.SCHOOL_EMAIL) first.push('E-mail : ' + PRINT_CONFIG.SCHOOL_EMAIL);
  const lines = first.length ? [first.join(' | ')] : [];
  if (PRINT_CONFIG.SCHOOL_WEBSITE) lines.push('Website : ' + PRINT_CONFIG.SCHOOL_WEBSITE); return lines;
}

// ------------------------------------------------------------
// FUNGSI 68 — printFindSavedLogo_
// Logo lama jika file masih tersedia.
// ------------------------------------------------------------
function printFindSavedLogo_(props) {
  const id = props.getProperty('MADASA_LOGO_FILE_ID'); if (!id) return null;
  try { const file = DriveApp.getFileById(id); return file.isTrashed() ? null : file; } catch (_) { return null; }
}

// ------------------------------------------------------------
// FUNGSI 69 — printLogoFile_
// Membuat PNG logo sekali di Drive, lalu memakai ID tersimpan.
// ------------------------------------------------------------
function printLogoFile_() {
  if (PRINT_CONFIG.LOGO_FILE_ID) return DriveApp.getFileById(PRINT_CONFIG.LOGO_FILE_ID);
  if (!PRINT_CONFIG.AUTO_CREATE_LOGO) return null;
  const props = PropertiesService.getScriptProperties(), existing = printFindSavedLogo_(props); if (existing) return existing;
  return locked_(function () {
    const found = printFindSavedLogo_(props); if (found) return found;
    const folderId = props.getProperty('FOLDER_ID'); assert_(folderId, 'Folder aplikasi belum tersedia untuk logo.');
    const blob = Utilities.newBlob(Utilities.base64Decode(MADASA_LOGO_PNG_BASE64), 'image/png', 'MADASA-logo.png');
    const file = DriveApp.getFolderById(folderId).createFile(blob); props.setProperty('MADASA_LOGO_FILE_ID', file.getId()); return file;
  });
}

// ------------------------------------------------------------
// FUNGSI 70 — siapkanLogoMadasa
// Opsional menyiapkan logo dari dropdown editor.
// ------------------------------------------------------------
function siapkanLogoMadasa() {
  const f = printLogoFile_(); console.log(f ? 'Logo siap. ID: ' + f.getId() : 'Logo otomatis dinonaktifkan.');
}

/* ==================== I. GAYA PARAGRAF DAN TABEL ASLI ==================== */

// ------------------------------------------------------------
// FUNGSI 71 — printParagraphStyle_
// Font, jarak, indentasi soal/opsi dan rincian.
// ------------------------------------------------------------
function printParagraphStyle_(p, text, kind) {
  assert_(p, 'Paragraf tidak tersedia.');
  p.setHeading(DocumentApp.ParagraphHeading.NORMAL); p.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  p.setLineSpacing(PRINT_CONFIG.LINE_SPACING); p.setSpacingBefore(0); p.setSpacingAfter(6);
  p.setIndentStart(0); p.setIndentEnd(0); p.setIndentFirstLine(0);
  const t = p.editAsText();
  if (text) t.setFontFamily(PRINT_CONFIG.FONT).setFontSize(PRINT_CONFIG.BODY_SIZE).setBold(false).setForegroundColor('#111111');
  if (kind === 'title') {
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); p.setSpacingBefore(6); p.setSpacingAfter(14);
    if (text) t.setFontSize(PRINT_CONFIG.TITLE_SIZE).setBold(true);
  } else if (kind === 'draft') {
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); p.setSpacingAfter(14); if (text) t.setFontSize(9).setForegroundColor('#666666');
  } else if (kind === 'section') {
    p.setSpacingBefore(16); p.setSpacingAfter(10); if (text) t.setFontSize(12).setBold(true);
  } else if (kind === 'subsection') {
    p.setSpacingBefore(12); p.setSpacingAfter(9); if (text) t.setBold(true);
  } else if (kind === 'question') {
    p.setSpacingBefore(PRINT_CONFIG.QUESTION_SPACE_BEFORE); p.setSpacingAfter(6); p.setIndentStart(18); p.setIndentFirstLine(0);
    const m = String(text).match(/^\d+\./); if (m) t.setBold(0, m[0].length - 1, true);
  } else if (kind === 'option' || kind === 'inner-list') {
    p.setSpacingBefore(0); p.setSpacingAfter(PRINT_CONFIG.OPTION_SPACE_AFTER); p.setIndentStart(34); p.setIndentFirstLine(18);
  } else if (kind === 'question-continuation') {
    p.setSpacingBefore(2); p.setSpacingAfter(5); p.setIndentStart(18); p.setIndentFirstLine(18);
  } else if (kind === 'step') {
    p.setSpacingBefore(PRINT_CONFIG.STEP_SPACE_BEFORE); p.setSpacingAfter(5); p.setIndentStart(18); p.setIndentFirstLine(0);
  } else if (kind === 'detail') {
    p.setSpacingBefore(0); p.setSpacingAfter(4); p.setIndentStart(28); p.setIndentFirstLine(14);
  } else if (kind === 'note') {
    p.setSpacingBefore(3); p.setSpacingAfter(7); if (text) t.setFontSize(9).setForegroundColor('#555555');
  }
}

// ------------------------------------------------------------
// FUNGSI 72 — printAppendParagraph_
// Paragraf aman: tanpa setText kosong dan tanpa assignment nilai balik.
// ------------------------------------------------------------
function printAppendParagraph_(container, text, kind, reuseFirst) {
  const raw = text == null ? '' : String(text), safe = raw.length > 0 ? raw : '\u00A0';
  let p;
  if (reuseFirst && container.getNumChildren() > 0 &&
      container.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH && !container.getChild(0).asParagraph().getText()) {
    p = container.getChild(0).asParagraph(); p.setText(safe);
  } else p = container.appendParagraph(safe);
  printParagraphStyle_(p, safe, kind); return p;
}

// ------------------------------------------------------------
// FUNGSI 73 — printCellStyle_
// Padding, warna header dan huruf tabel.
// ------------------------------------------------------------
function printCellStyle_(cell, header, fontSize) {
  cell.setPaddingTop(6); cell.setPaddingBottom(6); cell.setPaddingLeft(7); cell.setPaddingRight(7);
  cell.setBackgroundColor(header ? '#eeeeee' : '#ffffff');
  for (let i = 0; i < cell.getNumChildren(); i++) {
    const child = cell.getChild(i); if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    const p = child.asParagraph(); p.setLineSpacing(1.1); p.setSpacingBefore(0); p.setSpacingAfter(2);
    if (p.getText()) p.editAsText().setFontFamily(PRINT_CONFIG.FONT).setFontSize(fontSize).setBold(header).setForegroundColor('#111111');
  }
}

// ------------------------------------------------------------
// FUNGSI 74 — printTable_
// Tabel Docs asli dengan lebar proporsional.
// ------------------------------------------------------------
function printTable_(body, rows, width, borderless) {
  const table = body.appendTable(rows), cols = rows[0].length;
  table.setBorderWidth(borderless ? 0 : 0.5); table.setBorderColor('#555555');
  const weights = rows[0].map(function (_, col) {
    if (borderless && cols === 2) return 1;
    if (/^(no\.?|nomor|skor|bobot|nilai)$/i.test(rows[0][col])) return 0.65;
    let longest = 0; rows.forEach(function (row) { longest = Math.max(longest, String(row[col] || '').length); });
    return Math.min(3.5, Math.max(1.2, Math.sqrt(longest || 1) / 3));
  });
  const sum = weights.reduce(function (a,b) { return a+b; }, 0);
  weights.forEach(function (w,col) { table.setColumnWidth(col, width*w/sum); });
  for (let row = 0; row < table.getNumRows(); row++) {
    for (let col = 0; col < cols; col++) printCellStyle_(table.getCell(row,col), !borderless && row === 0,
      cols >= 6 ? Math.min(9, PRINT_CONFIG.TABLE_SIZE) : PRINT_CONFIG.TABLE_SIZE);
  } return table;
}

// ------------------------------------------------------------
// FUNGSI 75 — printOwner_
// Identitas pembuat, bukan admin yang mengunduh.
// ------------------------------------------------------------
function printOwner_(doc) {
  return all_('Email').find(function (u) { return email_(u.email) === email_(doc.owner); }) || {name: '[perlu diisi]', email: doc.owner, school: ''};
}

// ------------------------------------------------------------
// FUNGSI 76 — printCreateDocument_
// Dokumen baru atau salinan template header/footer.
// ------------------------------------------------------------
function printCreateDocument_(title) {
  if (PRINT_CONFIG.TEMPLATE_DOC_ID) {
    const copy = DriveApp.getFileById(PRINT_CONFIG.TEMPLATE_DOC_ID).makeCopy(title); return DocumentApp.openById(copy.getId());
  } return DocumentApp.create(title);
}

/* ==================== J. KOP PERTAMA DAN GARIS TEBAL–TIPIS ==================== */

// ------------------------------------------------------------
// FUNGSI 77 — printLetterheadText_
// Nama, alamat, HP/email dan website pada kop.
// ------------------------------------------------------------
function printLetterheadText_(container, owner) {
  const items = [
    {text: PRINT_CONFIG.GOVERNMENT_LINE, size: 10, bold: false},
    {text: printSchoolName_(owner).toUpperCase(), size: 14, bold: true},
    {text: PRINT_CONFIG.SCHOOL_ADDRESS, size: 10, bold: false}
  ];
  printContactLines_().forEach(function (s) { items.push({text: s, size: 9, bold: false}); });
  items.filter(function (item) { return Boolean(item.text); }).forEach(function (item,index) {
    const p = printAppendParagraph_(container, item.text, 'normal', index === 0);
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); p.setSpacingBefore(0); p.setSpacingAfter(2); p.setLineSpacing(1);
    p.editAsText().setFontFamily(PRINT_CONFIG.FONT).setFontSize(item.size).setBold(item.bold);
  });
}

// ------------------------------------------------------------
// FUNGSI 78 — printDoubleRule_
// Dua garis hitam tebal–tipis sebagai gambar transparan resolusi tinggi.
// ------------------------------------------------------------
// ------------------------------------------------------------
// FUNGSI — printDoubleRule_
// Menyesuaikan lebar garis dengan area teks dokumen.
// Area halaman: points. Ukuran gambar: pixels.
// ------------------------------------------------------------
function printDoubleRule_(body, width) {
  const widthPt = Number(width);

  assert_(
    Number.isFinite(widthPt) && widthPt > 1,
    'Lebar area cetak tidak valid.'
  );

  const blob = Utilities.newBlob(
    Utilities.base64Decode(MADASA_RULE_PNG_BASE64),
    'image/png',
    'MADASA-garis-tebal-tipis.png'
  );

  const paragraph = printAppendParagraph_(
    body,
    '\u00A0',
    'normal',
    false
  );

  paragraph.setAlignment(
    DocumentApp.HorizontalAlignment.LEFT
  );

  paragraph.setIndentStart(0);
  paragraph.setIndentEnd(0);
  paragraph.setIndentFirstLine(0);

  paragraph.setSpacingBefore(3);
  paragraph.setSpacingAfter(10);
  paragraph.setLineSpacing(1);
  paragraph.editAsText().setFontSize(1);

  const image = paragraph.appendInlineImage(blob);

  const originalWidthPx = image.getWidth();
  const originalHeightPx = image.getHeight();

  assert_(
    originalWidthPx > 0 && originalHeightPx > 0,
    'Ukuran gambar garis tidak valid.'
  );

  // Ruang kecil untuk karakter spasi pengaman.
  const drawableWidthPt = widthPt - 0.5;

  // Konversi ukuran halaman ke ukuran gambar.
  const pointsToPixels = 96 / 72;

  const targetWidthPx = Math.max(
    1,
    Math.floor(drawableWidthPt * pointsToPixels)
  );

  const targetHeightPx = Math.max(
    1,
    Math.round(
      originalHeightPx *
      targetWidthPx /
      originalWidthPx
    )
  );

  image.setWidth(targetWidthPx);
  image.setHeight(targetHeightPx);

  return paragraph;
}

// ------------------------------------------------------------
// FUNGSI 79 — printLetterhead_
// Kop logo kiri satu kali di body, diakhiri dua garis.
// ------------------------------------------------------------
function printLetterhead_(body, owner, width) {
  const logo = printLogoFile_();
  if (logo) {
    const table = printTable_(body, [['','']], width, true), logoWidth = Math.min(82, width*0.22);
    table.setColumnWidth(0, logoWidth); table.setColumnWidth(1, width-logoWidth);
    const p = printAppendParagraph_(table.getCell(0,0), '\u00A0', 'normal', true);
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const image = p.appendInlineImage(logo.getBlob()), w = image.getWidth(), h = image.getHeight();
    assert_(w > 0 && h > 0, 'Ukuran logo tidak valid.');
    const max = Math.min(PRINT_CONFIG.LOGO_MAX_SIZE, logoWidth-14), ratio = Math.min(max/w, max/h, 1);
    image.setWidth(Math.round(w*ratio)); image.setHeight(Math.round(h*ratio));
    printLetterheadText_(table.getCell(0,1), owner);
    if (body.getNumChildren() > 1 && body.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH &&
        !body.getChild(0).asParagraph().getText()) body.removeChild(body.getChild(0));
  } else printLetterheadText_(body, owner);
  printDoubleRule_(body, width);
}

// ------------------------------------------------------------
// FUNGSI 80 — printRunningHeader_
// Header ringkas default mati; template tidak ditimpa.
// ------------------------------------------------------------
function printRunningHeader_(document, owner, doc) {
  if (PRINT_CONFIG.TEMPLATE_DOC_ID) return;
  if (PRINT_CONFIG.SHOW_RUNNING_HEADER) {
    const p = printAppendParagraph_(document.addHeader(), printSchoolName_(owner).slice(0,70) + ' | ' + String(doc.title || '').slice(0,70), 'note', true);
    p.editAsText().setFontSize(8); p.setSpacingAfter(2);
  }
  if (PRINT_CONFIG.SHOW_SIMPLE_FOOTER) {
    const p = printAppendParagraph_(document.addFooter(), printSchoolName_(owner).slice(0,90), 'note', true);
    p.setAlignment(DocumentApp.HorizontalAlignment.RIGHT); p.setSpacingBefore(0); p.setSpacingAfter(0); p.editAsText().setFontSize(8);
  }
}

// ------------------------------------------------------------
// FUNGSI 81 — printSignature_
// Blok pengesahan opsional dari data yang diverifikasi.
// ------------------------------------------------------------
function printSignature_(body, owner, type, width) {
  if (!PRINT_CONFIG.ADD_SIGNATURE_BLOCK || PRINT_CONFIG.SIGNATURE_TYPES.indexOf(type) < 0) return;
  const teacherId = PRINT_CONFIG.TEACHER_IDS_BY_EMAIL[email_(owner.email)] || '';
  const rows = [['Mengetahui,', PRINT_CONFIG.LOCATION_AND_DATE || '[Tempat, tanggal]'],
    ['Kepala Sekolah', 'Guru Mata Pelajaran'], ['\u00A0', '\u00A0'],
    [PRINT_CONFIG.PRINCIPAL_NAME || '[Nama Kepala Sekolah]', owner.name || '[Nama Guru]'],
    [PRINT_CONFIG.PRINCIPAL_ID ? 'NIP/Identitas: ' + PRINT_CONFIG.PRINCIPAL_ID : '', teacherId ? 'NIP/Identitas: ' + teacherId : '']];
  printAppendParagraph_(body, '\u00A0', 'normal', false);
  const table = printTable_(body, rows, width, true);
  for (let row = 0; row < table.getNumRows(); row++) {
    for (let col = 0; col < 2; col++) {
      const cell = table.getCell(row,col); if (row === 2) cell.setPaddingTop(18).setPaddingBottom(18);
      for (let i = 0; i < cell.getNumChildren(); i++) {
        const child = cell.getChild(i);
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) child.asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
    }
  }
}

// ------------------------------------------------------------
// FUNGSI 82 — printRender_
// Kop pertama, tabel, jarak soal dan halaman kunci.
// ------------------------------------------------------------
function printRender_(document, doc, owner, content) {
  const blocks = printParse_(content), wide = PRINT_CONFIG.USE_LANDSCAPE_FOR_WIDE_TABLES && blocks.some(function (b) {
    return b.type === 'table' && b.rows[0].length >= 7;
  });
  const pageWidth = wide ? 841.89 : 595.28, pageHeight = wide ? 595.28 : 841.89;
  const width = pageWidth - PRINT_CONFIG.MARGIN_LEFT - PRINT_CONFIG.MARGIN_RIGHT, body = document.getBody();
  body.setPageWidth(pageWidth); body.setPageHeight(pageHeight); body.setMarginTop(PRINT_CONFIG.MARGIN_TOP);
  body.setMarginBottom(PRINT_CONFIG.MARGIN_BOTTOM); body.setMarginLeft(PRINT_CONFIG.MARGIN_LEFT); body.setMarginRight(PRINT_CONFIG.MARGIN_RIGHT);
  body.clear(); printRunningHeader_(document, owner, doc); printLetterhead_(body, owner, width);
  const assessment = printIsAssessment_(doc.type);
  let first = true, started = false, lastBreak = false, answerPage = false, student = false, inside = false;
  blocks.forEach(function (b) {
    if (b.type === 'break') { if (started && !lastBreak) { body.appendPageBreak(); lastBreak = true; } return; }
    if (b.type === 'table') { printTable_(body, b.rows, width, false); started = true; lastBreak = false; return; }
    let line = b.text;
    const sub = layoutSubheading_(line), section = layoutSection_(line), answer = assessment && printAnswerHeading_(line);
    if (answer && started && !answerPage && !lastBreak) body.appendPageBreak();
    if (answer) { answerPage = true; student = false; inside = false; }
    if (section) { inside = false; student = assessment && /LEMBAR SOAL|SOAL PILIHAN GANDA|SOAL ISIAN|SOAL URAIAN/i.test(line); }
    if (sub && assessment && !answerPage) { student = true; inside = false; }
    let kind = first ? 'title' : 'normal';
    if (!first) {
      if (/^DRAF UNTUK DITINJAU GURU$/i.test(line)) kind = 'draft';
      else if (section) kind = 'section'; else if (sub) { kind = 'subsection'; line = sub; }
      else if (/^UNTUK GURU/.test(line)) kind = 'note';
      else if (assessment && student && /^\d+\.\s+/.test(line)) { kind = 'question'; inside = true; }
      else if (inside && student && layoutOption_(line)) kind = 'option';
      else if (inside && student && /^\d+\)\s+/.test(line)) kind = 'inner-list';
      else if (inside && student) kind = 'question-continuation';
      else if (/^\d+[.)]\s+/.test(line)) kind = 'step';
      else if (layoutOption_(line) || /^[-•]\s+/.test(line)) kind = 'detail';
    }
    printAppendParagraph_(body, line, kind, false); first = false; started = true; lastBreak = false;
  });
  if (!started) printAppendParagraph_(body, doc.title, 'title', false);
  printSignature_(body, owner, doc.type, width);
}

/* ==================== K. EKSPOR DAN ADMINISTRASI ==================== */

// ------------------------------------------------------------
// FUNGSI 83 — printFetchExport_
// Ekspor Drive dengan token server.
// ------------------------------------------------------------
function printFetchExport_(id, mime) {
  return UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '/export?mimeType=' + encodeURIComponent(mime), {
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true});
}

// ------------------------------------------------------------
// FUNGSI 84 — exportDocument_
// PDF/Word dan pembersihan dokumen perantara.
// ------------------------------------------------------------
function exportDocument_(user, params) {
  const d = ownDocument_(user, params.id); assert_(!truth_(d.deleted), 'Pulihkan dokumen sebelum ekspor.');
  assert_(['pdf','docx'].indexOf(params.format) >= 0, 'Format ekspor tidak didukung.');
  let id = '', stage = 'membaca isi';
  try {
    const content = DriveApp.getFileById(d.fileId).getBlob().getDataAsString('UTF-8'), owner = printOwner_(d);
    stage = 'membuat dokumen'; const document = printCreateDocument_(d.title); id = document.getId();
    stage = 'menata logo, kop, garis, teks dan tabel'; printRender_(document, d, owner, content); document.saveAndClose();
    stage = 'mengekspor'; const mime = params.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const response = printFetchExport_(id, mime);
    assert_(response.getResponseCode() === 200, 'Ekspor ditolak (HTTP ' + response.getResponseCode() + '). Periksa izin Docs/Drive.', 'EXPORT_FAILED');
    const bytes = response.getBlob().getBytes(); assert_(bytes.length <= CONFIG.MAX_EXPORT_BYTES, 'File terlalu besar.');
    stage = 'mencatat ekspor'; log_(user, 'export_' + params.format, d.id);
    return {base64: Utilities.base64Encode(bytes), mime: mime, name: d.title + '.' + params.format};
  } catch (error) {
    console.error('Ekspor gagal saat ' + stage + '; jenis: ' + (error.name || 'Error'));
    if (error.name === 'EduPlanError') throw error;
    assert_(false, 'Ekspor gagal saat ' + stage + '. Jalankan ujiCetakProfesional dari editor.', 'EXPORT_FAILED');
  } finally { if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (_) { console.warn('Bersihkan dokumen perantara: ' + id); } } }
}

// ------------------------------------------------------------
// FUNGSI 85 — adminData_
// Data admin tanpa nilai API key.
// ------------------------------------------------------------
function adminData_() {
  return {users: all_('Email').map(publicUser_), providers: all_('Providers').map(function (p) {
    return {id: p.id, model: p.model, enabled: truth_(p.enabled), configured: !!p.apiKey};
  }), settings: {dailyLimit: dailyLimit_()}, logs: all_('Logs').slice(-CONFIG.MAX_LOGS_DISPLAYED).reverse().map(function (r) {
    return {email: r.email, action: r.action, target: r.target, created: r.created};
  })};
}

// ------------------------------------------------------------
// FUNGSI 86 — saveUser_
// Tambah/ubah akun tanpa mengganti email lama.
// ------------------------------------------------------------
function saveUser_(admin, params) {
  return locked_(function () {
    const email = email_(params.email), name = text_(params.name, 100);
    assert_(validEmail_(email) && name, 'Nama dan email valid wajib diisi.'); assert_(ROLES.indexOf(params.role) >= 0, 'Peran tidak valid.');
    const users = all_('Email'); let u = params.id ? users.find(function (r) { return r.id === params.id; }) : users.find(function (r) { return email_(r.email) === email; });
    assert_(!params.id || u, 'Akun tidak ditemukan.');
    assert_(!users.some(function (r) { return email_(r.email) === email && (!u || r.id !== u.id); }), 'Email dipakai akun lain.');
    if (u && u.id === admin.id) assert_(params.role === 'admin' && params.active === true && email === email_(admin.email), 'Tidak boleh menonaktifkan/menurunkan admin sendiri.');
    assert_(!u || email_(u.email) === email, 'Email akun lama tidak dapat diganti; buat akun baru.');
    const fresh = !u; if (fresh) u = {id: uuid_(), email: email};
    Object.assign(u, {name: name, role: params.role, active: params.active === true, school: text_(params.school, 200)});
    if (fresh) add_('Email', u); else put_('Email', u); log_(admin, 'save_user', email); return publicUser_(u);
  });
}

// ------------------------------------------------------------
// FUNGSI 87 — saveProvider_
// Simpan model/key; kosong mempertahankan key lama.
// ------------------------------------------------------------
function saveProvider_(admin, params) {
  return locked_(function () {
    assert_(PROVIDER_IDS.indexOf(params.id) >= 0, 'Provider tidak valid.');
    const p = all_('Providers').find(function (r) { return r.id === params.id; }); assert_(p, 'Provider tidak ditemukan.');
    p.model = normalizeModel_(params.id, params.model); const key = text_(params.key, 2000);
    assert_(!(params.clear === true && key), 'Pilih key baru ATAU hapus key lama.');
    if (params.clear === true) p.apiKey = ''; else if (key) p.apiKey = key;
    p.enabled = params.enabled === true; assert_(!p.enabled || p.model, 'Isi ID model sebelum mengaktifkan.');
    assert_(!p.enabled || text_(p.apiKey, 2000), 'Isi API key sebelum mengaktifkan.');
    put_('Providers', p); log_(admin, 'save_provider', p.id); return true;
  });
}

// ------------------------------------------------------------
// FUNGSI 88 — saveSettings_
// Kuota harian valid.
// ------------------------------------------------------------
function saveSettings_(admin, params) {
  return locked_(function () {
    const n = Number(params.dailyLimit); assert_(Number.isInteger(n) && n >= 1 && n <= CONFIG.MAX_DAILY_LIMIT, 'Kuota harus 1–' + CONFIG.MAX_DAILY_LIMIT + '.');
    const r = all_('Settings').find(function (s) { return s.id === 'dailyLimit'; }); assert_(r, 'Pengaturan tidak ditemukan.');
    r.value = String(n); put_('Settings', r); log_(admin, 'save_settings', 'dailyLimit'); return true;
  });
}

/* ==================== L. DIAGNOSTIK DARI EDITOR ==================== */

// ------------------------------------------------------------
// FUNGSI 89 — periksaKoneksiGemini
// Cek teks jawaban, bukan HTTP saja.
// ------------------------------------------------------------
function periksaKoneksiGemini() {
  const p = configuredProvider_('gemini', false), response = fetchProvider_(p, 'Jawab hanya: Koneksi berhasil.', CONFIG.TEST_OUTPUT_TOKENS);
  const status = response.getResponseCode(); console.log('Model: ' + p.model); console.log('HTTP: ' + status);
  let data; try { data = JSON.parse(response.getContentText()); } catch (_) { console.log('Respons bukan JSON.'); return; }
  if (status >= 200 && status < 300) {
    try { console.log('Tes berhasil. Balasan: ' + redactSecret_(parseAI_('gemini', data), p.apiKey).slice(0,500)); }
    catch (error) { console.log('HTTP sukses tetapi teks belum dapat dipakai: ' + error.message); }
  } else {
    const e = data.error || {}; console.log('Status: ' + (e.status || 'Tidak tersedia'));
    console.log('Pesan: ' + redactSecret_(e.message || 'Tidak ada detail.', p.apiKey).slice(0,1500));
  }
}

// ------------------------------------------------------------
// FUNGSI 90 — ujiCetakProfesional
// Tes logo, kop, garis ganda, teks kosong, tabel dan ekspor.
// ------------------------------------------------------------
function ujiCetakProfesional() {
  let id = '';
  try {
    const content = ['BANK SOAL — UJI CETAK', 'DRAF UNTUK DITINJAU GURU', 'A. IDENTITAS',
      '| Komponen | Keterangan |', '|---|---|', '| Kelas | V SD |', '| Materi | Data uji tata letak |',
      'B. LEMBAR SOAL', '1. Pilihan Ganda', '1. Contoh soal pertama untuk memeriksa jarak.',
      'a) Satu', 'b) Dua', 'c) Tiga', 'd) Empat', '2. Perhatikan daftar:', '1) Rincian satu', '2) Rincian dua', 'Kalimat lanjutan soal.',
      'a) Satu', 'b) Dua', 'c) Tiga', 'd) Empat', '[[HALAMAN_BARU]]', 'C. KUNCI JAWABAN DAN PEMBAHASAN',
      'UNTUK GURU — TIDAK DIBAGIKAN KEPADA PESERTA DIDIK', '| Nomor | Jawaban | Pembahasan |', '|---|---|---|',
      '| 1 | a) | Hanya data uji. |', '| 2 | b) | Bukan soal penilaian. |', 'CATATAN VERIFIKASI GURU',
      'Periksa nama, logo kiri, alamat/kontak, garis tebal–tipis, jarak soal dan halaman kunci.'].join('\n');
    const document = printCreateDocument_('Tes Kop MADASA — Garis Tebal Tipis'); id = document.getId();
    printRender_(document, {type: 'bank_soal', title: 'Uji Cetak'}, {name: 'Guru Uji', email: '', school: PRINT_CONFIG.SCHOOL_NAME}, content);
    document.saveAndClose();
    ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].forEach(function (mime) {
      const response = printFetchExport_(id,mime); console.log('Format: ' + mime + '; HTTP: ' + response.getResponseCode());
      assert_(response.getResponseCode() === 200, 'Tes ekspor gagal. Periksa izin Docs/Drive.');
    });
    console.log('TES BERHASIL. Periksa tampilan: https://docs.google.com/document/d/' + id + '/edit');
    console.log('Dokumen uji dipertahankan; hapus manual setelah diperiksa.');
  } catch (error) { console.error(error.stack || String(error)); if (id) console.log('ID dokumen uji: ' + id); throw error; }
}

// ------------------------------------------------------------
// FUNGSI 91 — periksaEksporDokumen
// Alias diagnostik lama.
// ------------------------------------------------------------
function periksaEksporDokumen() {
  return ujiCetakProfesional();
}

// ------------------------------------------------------------
// FUNGSI 92 — buatTemplateNomorHalaman
// Kerangka template; field nomor halaman dipasang manual.
// ------------------------------------------------------------
function buatTemplateNomorHalaman() {
  const doc = DocumentApp.create('Template Cetak MADASA — Nomor Halaman'), b = doc.getBody();
  b.setPageWidth(595.28); b.setPageHeight(841.89); b.setMarginTop(PRINT_CONFIG.MARGIN_TOP); b.setMarginBottom(PRINT_CONFIG.MARGIN_BOTTOM);
  b.setMarginLeft(PRINT_CONFIG.MARGIN_LEFT); b.setMarginRight(PRINT_CONFIG.MARGIN_RIGHT);
  b.setText('Isi contoh ini diganti saat ekspor. Kop lengkap dibuat sistem di body.');
  const p = printAppendParagraph_(doc.addHeader(), PRINT_CONFIG.SCHOOL_NAME, 'note', true); p.editAsText().setFontSize(8);
  printAppendParagraph_(doc.addFooter(), '\u00A0', 'note', true); doc.saveAndClose();
  console.log('Template: https://docs.google.com/document/d/' + doc.getId() + '/edit');
  console.log('Tambahkan field nomor halaman ASLI di footer melalui menu Google Docs, bukan ketik angka statis.');
  console.log('Opsional Different first page untuk header pertama kosong.');
  console.log('Setelah siap, isi TEMPLATE_DOC_ID dengan: ' + doc.getId());
  console.log('Fungsi ini belum memasang field nomor halaman dan tidak mengubah konfigurasi otomatis.');
}



/* ==================== M. MIGRASI DATABASE KUOTA ==================== */

/**
 * Jalankan dari editor Apps Script.
 * Tidak tersedia sebagai rute HTTP.
 *
 * Menambahkan struktur kuota tanpa:
 * - menghapus sheet lama;
 * - membuat saldo awal;
 * - mengalokasikan jatah;
 * - mengaktifkan pemotongan token.
 */
function migrasiDatabaseKuota() {
  const result = locked_(function () {
    const props = PropertiesService.getScriptProperties();
    const dbId = props.getProperty('DB_ID');

    assert_(
      dbId,
      'DB_ID belum tersedia. Migrasi dihentikan.'
    );

    const db = SpreadsheetApp.openById(dbId);
    const actorEmail = email_(
      Session.getEffectiveUser().getEmail()
    );

    assert_(
      actorEmail,
      'Email pelaksana migrasi tidak terbaca.'
    );

    // Periksa database lama sebelum membuat perubahan.
    const users = all_('Email');

    const matches = users.filter(function (user) {
      return email_(user.email) === actorEmail;
    });

    assert_(
      matches.length === 1,
      'Pelaksana harus memiliki tepat satu akun terdaftar.'
    );

    const actor = matches[0];

    assert_(
      actor.id &&
      actor.role === 'admin' &&
      truth_(actor.active),
      'Migrasi hanya boleh dijalankan oleh admin aktif.'
    );

    const settings = all_('Settings');
    const seenSettings = Object.create(null);

    settings.forEach(function (row) {
      const id = String(row.id || '');

      assert_(
        !seenSettings[id],
        'ID pengaturan duplikat: ' + id
      );

      seenSettings[id] = true;
    });

    const version = settings.find(function (row) {
      return row.id === QUOTA_CONFIG.VERSION_SETTING;
    });

    assert_(
      !version ||
      String(version.value) === QUOTA_CONFIG.VERSION,
      'Versi database kuota berbeda. Migrasi dihentikan.'
    );

    // Preflight seluruh header baru sebelum menulis apa pun.
    QUOTA_CONFIG.SHEETS.forEach(function (name) {
      const sheet = db.getSheetByName(name);
      if (!sheet || sheet.getLastRow() === 0) return;

      const expected = SCHEMA[name];

      assert_(
        sheet.getLastColumn() === expected.length,
        'Jumlah kolom tab ' + name +
        ' tidak sesuai. Periksa sebelum melanjutkan.'
      );

      const actual = sheet
        .getRange(1, 1, 1, expected.length)
        .getValues()[0];

      assert_(
        expected.every(function (key, index) {
          return String(actual[index]) === key;
        }),
        'Header tab ' + name +
        ' tidak sesuai. Tidak ada header yang ditimpa.'
      );
    });

    const created = [];

    QUOTA_CONFIG.SHEETS.forEach(function (name) {
      let sheet = db.getSheetByName(name);

      if (!sheet) {
        sheet = db.insertSheet(name);
        created.push(name);
      }

      const heads = SCHEMA[name];

      if (sheet.getMaxColumns() < heads.length) {
        sheet.insertColumnsAfter(
          sheet.getMaxColumns(),
          heads.length - sheet.getMaxColumns()
        );
      }

      if (sheet.getLastRow() === 0) {
        sheet
          .getRange(1, 1, 1, heads.length)
          .setValues([heads]);
      }

      sheet.setFrozenRows(1);

      sheet
        .getRange(1, 1, 1, heads.length)
        .setFontWeight('bold')
        .setBackground('#eae7ff');
    });

    // Default aman: kuota baru belum diberlakukan.
    if (!seenSettings[QUOTA_CONFIG.ENFORCEMENT_SETTING]) {
      add_('Settings', {
        id: QUOTA_CONFIG.ENFORCEMENT_SETTING,
        value: 'false'
      });
    }

    // Versi ditulis setelah struktur berhasil dibuat.
    if (!version) {
      add_('Settings', {
        id: QUOTA_CONFIG.VERSION_SETTING,
        value: QUOTA_CONFIG.VERSION
      });
    }

    SpreadsheetApp.flush();

    return {
      databaseId: dbId,
      version: QUOTA_CONFIG.VERSION,
      createdSheets: created,
      checkedSheets: QUOTA_CONFIG.SHEETS.slice(),
      actor: actorEmail
    };
  });

  console.log(JSON.stringify(result, null, 2));

  return result;
}

/**
 * Pemeriksaan struktur saja.
 * Tidak menambah atau mengubah saldo.
 */
function periksaStrukturKuota() {
  const props = PropertiesService.getScriptProperties();
  const dbId = props.getProperty('DB_ID');

  assert_(dbId, 'DB_ID belum tersedia.');

  const db = SpreadsheetApp.openById(dbId);

  const report = QUOTA_CONFIG.SHEETS.map(function (name) {
    const sheet = db.getSheetByName(name);

    if (!sheet || sheet.getLastRow() === 0) {
      return {
        sheet: name,
        valid: false,
        reason: 'Tab belum tersedia atau belum memiliki header.'
      };
    }

    const expected = SCHEMA[name];

    const actual = sheet
      .getRange(1, 1, 1, expected.length)
      .getValues()[0];

    const valid =
      sheet.getLastColumn() === expected.length &&
      expected.every(function (key, index) {
        return String(actual[index]) === key;
      });

    return {
      sheet: name,
      valid: valid,
      dataRows: Math.max(0, sheet.getLastRow() - 1)
    };
  });

  console.log(JSON.stringify(report, null, 2));

  assert_(
    report.every(function (item) {
      return item.valid;
    }),
    'Struktur kuota belum lengkap atau header tidak cocok.'
  );

  return report;
}


/* ==================== N. STOK DAN TRANSFER KUOTA ==================== */

/**
 * Validasi jumlah token.
 * Hanya menerima angka bulat positif yang aman.
 */
function quotaAmount_(value) {
  assert_(
    typeof value === 'number' || typeof value === 'string',
    'Jumlah token tidak valid.'
  );

  assert_(
    String(value).trim() !== '',
    'Jumlah token wajib diisi.'
  );

  const amount = Number(value);

  assert_(
    Number.isSafeInteger(amount) && amount > 0,
    'Jumlah token harus berupa bilangan bulat positif.'
  );

  return amount;
}

/**
 * Periode kuota bulanan berdasarkan WIB.
 */
function quotaMonth_() {
  return Utilities.formatDate(
    new Date(),
    CONFIG.TIME_ZONE,
    'yyyy-MM'
  );
}

/**
 * Snapshot saldo dari transaksi yang sudah committed.
 *
 * Harus dipanggil di dalam locked_() saat dipakai
 * untuk keputusan transfer atau pembaruan saldo.
 */
function quotaSnapshot_() {
  const committed = Object.create(null);

  all_('QuotaOperations').forEach(function (operation) {
    if (operation.status === 'committed') {
      committed[operation.id] = true;
    }
  });

  const balances = Object.create(null);

  all_('QuotaLedger').forEach(function (entry) {
    if (!committed[entry.operationId]) return;

    const delta = Number(entry.delta);

    assert_(
      Number.isSafeInteger(delta),
      'Data transaksi kuota tidak valid: ' + entry.id
    );

    const key = JSON.stringify([
      String(entry.accountId),
      String(entry.bucket),
      String(entry.period || '')
    ]);

    const next = (balances[key] || 0) + delta;

    assert_(
      Number.isSafeInteger(next),
      'Saldo kuota melebihi batas angka aman.'
    );

    balances[key] = next;
  });

  return {
    balance: function (accountId, bucket, period) {
      const key = JSON.stringify([
        String(accountId),
        String(bucket),
        String(period || '')
      ]);

      return balances[key] || 0;
    }
  };
}

/**
 * ID wajib berasal dari frontend dan digunakan kembali
 * jika mengulang permintaan yang sama.
 */
function quotaOperationId_(value) {
  assert_(
    typeof value === 'string' &&
    /^[A-Za-z0-9_-]{16,100}$/.test(value),
    'ID transaksi tidak valid.'
  );

  return value;
}

/**
 * Pembukuan operasi.
 *
 * Dipanggil hanya di dalam locked_().
 * Operasi pending tidak ikut dihitung sebagai saldo.
 */
function quotaCommit_(id, type, actor, targetId, note, entries) {
  const created = now_();

  const fingerprint = JSON.stringify({
    type: type,
    actorId: actor.id,
    targetId: targetId,
    note: note,
    entries: entries
  });

  const operation = {
    id: id,
    type: type,
    status: 'pending',
    actorId: actor.id,
    targetId: targetId,
    created: created,
    committedAt: '',

    // Fingerprint disimpan untuk memeriksa pengulangan identik.
    note: fingerprint
  };

  add_('QuotaOperations', operation);

  entries.forEach(function (entry) {
    add_('QuotaLedger', {
      id: uuid_(),
      operationId: id,
      accountId: entry.accountId,
      bucket: entry.bucket,
      period: entry.period || '',
      delta: entry.delta,
      type: type,
      actorId: actor.id,
      requestId: '',
      created: created,
      note: note
    });
  });

  // Semua baris ledger ditulis sebelum status committed.
  SpreadsheetApp.flush();

  const saved = all_('QuotaOperations').find(function (row) {
    return row.id === id;
  });

  assert_(saved, 'Operasi kuota tidak ditemukan.');

  saved.status = 'committed';
  saved.committedAt = now_();

  put_('QuotaOperations', saved);
  SpreadsheetApp.flush();

  return {
    operationId: id,
    status: 'committed',
    repeated: false
  };
}

/**
 * Mencegah permintaan yang sama dicatat dua kali.
 *
 * Dipanggil hanya di dalam locked_().
 */
function quotaCheckRepeat_(id, type, actor, targetId, note, entries) {
  const operations = all_('QuotaOperations');

  const matching = operations.filter(function (row) {
    return row.id === id;
  });

  assert_(
    matching.length <= 1,
    'ID operasi duplikat. Perlu pemeriksaan admin.',
    'QUOTA_REVIEW'
  );

  if (!matching.length) return null;

  const existing = matching[0];

  const fingerprint = JSON.stringify({
    type: type,
    actorId: actor.id,
    targetId: targetId,
    note: note,
    entries: entries
  });

  assert_(
    existing.type === type &&
    existing.actorId === actor.id &&
    existing.targetId === targetId &&
    existing.note === fingerprint,
    'ID transaksi sudah dipakai untuk isi transaksi berbeda.',
    'CONFLICT'
  );

  assert_(
    existing.status === 'committed',
    'Transaksi sebelumnya belum selesai. Jangan membuat transaksi pengganti sebelum diperiksa.',
    'QUOTA_REVIEW'
  );

  return {
    operationId: id,
    status: 'committed',
    repeated: true
  };
}

/**
 * Jangan lanjut menulis jika ada operasi belum selesai.
 * Pendekatan konservatif untuk tahap awal.
 */
function quotaAssertNoPending_() {
  const unresolved = all_('QuotaOperations').find(function (row) {
    return row.status !== 'committed' &&
      row.status !== 'cancelled';
  });

  assert_(
    !unresolved,
    'Ada transaksi kuota yang perlu diperiksa: ' +
      (unresolved ? unresolved.id : ''),
    'QUOTA_REVIEW'
  );
}

/**
 * Membaca saldo sendiri.
 * Belum menghitung cadangan AI karena belum diaktifkan.
 */
function quotaMyBalance_(user) {
  return locked_(function () {
    const snapshot = quotaSnapshot_();
    const period = quotaMonth_();

    const monthly = snapshot.balance(
      user.id, 'monthly', period
    );

    const topup = snapshot.balance(
      user.id, 'topup', ''
    );

    assert_(
      Number.isSafeInteger(monthly + topup),
      'Saldo melebihi batas angka aman.'
    );

    return {
      userId: user.id,
      period: period,
      monthlyRemaining: monthly,
      topupRemaining: topup,
      reservedTokens: 0,
      availableTokens: monthly + topup,
      enforcementEnabled: false
    };
  });
}

/**
 * Ringkasan admin.
 */
function quotaAdminOverview_(admin) {
  requireAdmin_(admin);

  return locked_(function () {
    const snapshot = quotaSnapshot_();
    const period = quotaMonth_();

    const users = all_('Email').filter(function (user) {
      return user.role === 'guru';
    }).map(function (user) {
      const monthly = snapshot.balance(
        user.id, 'monthly', period
      );

      const topup = snapshot.balance(
        user.id, 'topup', ''
      );

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        active: truth_(user.active),
        monthlyRemaining: monthly,
        topupRemaining: topup,
        availableTokens: monthly + topup
      };
    });

    return {
      period: period,
      adminStock: snapshot.balance(
        QUOTA_CONFIG.ADMIN_ACCOUNT_ID,
        'stock',
        ''
      ),
      users: users,
      unresolvedOperations: all_('QuotaOperations')
        .filter(function (row) {
          return row.status !== 'committed' &&
            row.status !== 'cancelled';
        })
        .map(function (row) {
          return {
            id: row.id,
            type: row.type,
            status: row.status,
            created: row.created
          };
        })
    };
  });
}

/**
 * Mencatat penambahan stok INTERNAL.
 * Bukan pembelian kredit provider.
 */
function quotaAddStock_(admin, params) {
  requireAdmin_(admin);

  const id = quotaOperationId_(params.operationId);
  const amount = quotaAmount_(params.amount);
  const note = text_(params.note, 500);

  assert_(note, 'Keterangan asal stok wajib diisi.');

  const entries = [{
    accountId: QUOTA_CONFIG.ADMIN_ACCOUNT_ID,
    bucket: 'stock',
    period: '',
    delta: amount
  }];

  return locked_(function () {
    const repeated = quotaCheckRepeat_(
      id, 'stock_in', admin,
      QUOTA_CONFIG.ADMIN_ACCOUNT_ID, note, entries
    );

    if (repeated) return repeated;

    quotaAssertNoPending_();

    const stock = quotaSnapshot_().balance(
      QUOTA_CONFIG.ADMIN_ACCOUNT_ID, 'stock', ''
    );

    assert_(
      Number.isSafeInteger(stock + amount),
      'Stok melebihi batas angka aman.'
    );

    return quotaCommit_(
      id, 'stock_in', admin,
      QUOTA_CONFIG.ADMIN_ACCOUNT_ID, note, entries
    );
  });
}

/**
 * Memindahkan stok admin ke saldo isi ulang guru.
 */
function quotaTransfer_(admin, params) {
  requireAdmin_(admin);

  const id = quotaOperationId_(params.operationId);
  const amount = quotaAmount_(params.amount);
  const targetId = text_(params.userId, 100);
  const note = text_(params.note, 500);

  assert_(targetId, 'Pilih guru penerima.');
  assert_(note, 'Keterangan transfer wajib diisi.');

  const entries = [
    {
      accountId: QUOTA_CONFIG.ADMIN_ACCOUNT_ID,
      bucket: 'stock',
      period: '',
      delta: -amount
    },
    {
      accountId: targetId,
      bucket: 'topup',
      period: '',
      delta: amount
    }
  ];

  return locked_(function () {
    const repeated = quotaCheckRepeat_(
      id, 'transfer_topup', admin, targetId, note, entries
    );

    if (repeated) return repeated;

    quotaAssertNoPending_();

    const matches = all_('Email').filter(function (user) {
      return user.id === targetId;
    });

    assert_(
      matches.length === 1 &&
      matches[0].role === 'guru' &&
      truth_(matches[0].active),
      'Penerima harus satu akun guru aktif yang valid.'
    );

    const snapshot = quotaSnapshot_();

    const stock = snapshot.balance(
      QUOTA_CONFIG.ADMIN_ACCOUNT_ID, 'stock', ''
    );

    assert_(
      stock >= amount,
      'Stok admin tidak mencukupi.',
      'QUOTA_INSUFFICIENT'
    );

    const topup = snapshot.balance(
      targetId, 'topup', ''
    );

    const monthly = snapshot.balance(
      targetId, 'monthly', quotaMonth_()
    );

    assert_(
      Number.isSafeInteger(topup + amount) &&
      Number.isSafeInteger(monthly + topup + amount),
      'Saldo penerima melebihi batas angka aman.'
    );

    return quotaCommit_(
      id, 'transfer_topup', admin,
      targetId, note, entries
    );
  });
}


/* ==================== P. HUBUNGAN PERMINTAAN DAN DOKUMEN ==================== */

/**
 * Menandai bahwa dokumen dan metadata Documents
 * sudah berhasil ditulis.
 */
function aiMarkDocumentSaved_(requestId, documentId) {
  return locked_(function () {
    const matches = all_('AIRequests').filter(function (row) {
      return row.id === requestId;
    });

    assert_(
      matches.length === 1,
      'Catatan permintaan AI tidak unik.',
      'AI_USAGE_LOG'
    );

    const row = matches[0];

    assert_(
      row.status === 'text_ready' ||
      row.status === 'text_ready_usage_unknown',
      'Status permintaan AI belum siap dihubungkan ke dokumen.',
      'AI_USAGE_LOG'
    );

    row.documentId = documentId;

    row.status =
      row.usageSource === 'provider_metadata' &&
      aiTokenNumber_(row.totalTokens) !== null
        ? 'document_saved'
        : 'document_saved_usage_unknown';

    row.updated = now_();
    row.errorCode = '';

    put_('AIRequests', row);
    SpreadsheetApp.flush();
  });
}

/**
 * Menandai kegagalan setelah AI menghasilkan teks.
 * Metadata token tidak dihapus.
 */
function aiMarkDocumentFailed_(requestId, error) {
  return aiUpdateRequest_(requestId, {
    status: 'document_save_failed',
    errorCode: text_(
      error.code || 'DOCUMENT_SAVE_FAILED',
      100
    )
  });
}