/**
 * do-tracking.js
 * Komponen: <do-tracking>
 * Template ID: #tpl-tracking
 * Fitur:
 * - Pencarian DO berdasarkan Nomor DO atau NIM (Enter = search, Esc = clear)
 * - Tambah DO baru dengan auto-generate nomor DO
 * - Tambah progress perjalanan pengiriman
 * - Watcher untuk live search & perubahan paket yang dipilih
 */
Vue.component('do-tracking', {
  template: '#tpl-tracking',
  props: {
    tracking: { type: Array, required: true },
    paket:    { type: Array, required: true },
    pengirimanList: { type: Array, required: true }
  },

  data() {
    const now = new Date();
    return {
      // ─── Search ─────────────────────────────────
      searchQuery: '',
      searchResult: null,
      searchNotFound: false,

      // ─── UI State ───────────────────────────────
      showAddDO: false,
      activeDetailDO: null,   // nomor DO yang sedang ditampilkan detail-nya
      progressInput: '',
      progressError: '',

      // ─── Form tambah DO baru ─────────────────────
      newDO: {
        nim: '',
        nama: '',
        ekspedisi: '',
        paketKode: '',
        tanggalKirim: this._formatDateInput(now)
      },
      doErrors: {},
      selectedPaketInfo: null
    };
  },

  mounted() {
    this.$nextTick(() => {
      if (window.lucide) window.lucide.createIcons();
    });
  },

  updated() {
    this.$nextTick(() => {
      if (window.lucide) window.lucide.createIcons();
    });
  },

  computed: {
    /**
     * Auto-generate nomor DO berdasarkan tahun berjalan + sequence terakhir
     */
    nextDONumber() {
      const tahun = new Date().getFullYear();
      const prefix = `DO${tahun}-`;
      const existing = this.tracking
        .map(t => t.noDO)
        .filter(n => n && n.startsWith(prefix))
        .map(n => parseInt(n.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
      const seq = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      return prefix + String(seq).padStart(4, '0');
    },

    /**
     * Detail paket yang dipilih pengguna di form tambah DO
     */
    selectedPaketDetail() {
      if (!this.newDO.paketKode) return null;
      return this.paket.find(p => p.kode === this.newDO.paketKode) || null;
    },

    /**
     * Format total harga paket dipilih (Rp xxx)
     */
    formattedTotal() {
      if (!this.selectedPaketDetail) return 'Rp 0';
      return 'Rp ' + Number(this.selectedPaketDetail.harga).toLocaleString('id-ID');
    },

    /**
     * Semua tracking yang diurutkan terbaru dulu
     */
    allTracking() {
      return [...this.tracking].reverse();
    }
  },

  watch: {
    /**
     * Watcher 3: Live search — saat searchQuery berubah, langsung cari.
     * Jika kosong, clear hasil.
     */
    searchQuery(newVal) {
      if (!newVal.trim()) {
        this.searchResult = null;
        this.searchNotFound = false;
        return;
      }
      this.doSearch(newVal.trim());
    },

    /**
     * Watcher 4: Pantau paket yang dipilih di form DO baru,
     * update info paket secara reaktif.
     */
    'newDO.paketKode'(newVal) {
      if (newVal) {
        this.selectedPaketInfo = this.paket.find(p => p.kode === newVal) || null;
        console.log('[DOTracking] Paket dipilih:', this.selectedPaketInfo);
      } else {
        this.selectedPaketInfo = null;
      }
    }
  },

  methods: {
    // ─── Search ──────────────────────────────────────────────────
    doSearch(query) {
      const q = query.toLowerCase();
      const found = this.tracking.find(
        t => (t.noDO && t.noDO.toLowerCase() === q) ||
             (t.nim  && t.nim.toLowerCase() === q)
      );
      if (found) {
        this.searchResult  = found;
        this.searchNotFound = false;
      } else {
        this.searchResult  = null;
        this.searchNotFound = true;
      }
    },

    onSearchKeyup(e) {
      if (e.key === 'Enter') {
        this.doSearch(this.searchQuery.trim());
      } else if (e.key === 'Escape') {
        this.clearSearch();
      }
    },

    clearSearch() {
      this.searchQuery   = '';
      this.searchResult  = null;
      this.searchNotFound = false;
    },

    // ─── Detail Toggle ───────────────────────────────────────────
    toggleDetail(noDO) {
      this.activeDetailDO = this.activeDetailDO === noDO ? null : noDO;
      this.progressInput  = '';
      this.progressError  = '';
    },

    // ─── Tambah DO baru ──────────────────────────────────────────
    validateDO() {
      const e = {};
      if (!this.newDO.nim.trim())       e.nim       = 'NIM wajib diisi';
      if (!this.newDO.nama.trim())      e.nama      = 'Nama wajib diisi';
      if (!this.newDO.ekspedisi)        e.ekspedisi = 'Pilih ekspedisi';
      if (!this.newDO.paketKode)        e.paketKode = 'Pilih paket bahan ajar';
      if (!this.newDO.tanggalKirim)     e.tanggalKirim = 'Tanggal kirim wajib diisi';
      this.doErrors = e;
      return Object.keys(e).length === 0;
    },

    saveDO() {
      if (!this.validateDO()) return;
      const paketDipilih = this.selectedPaketDetail;
      const newEntry = {
        noDO:         this.nextDONumber,
        nim:          this.newDO.nim.trim(),
        nama:         this.newDO.nama.trim(),
        status:       'Dalam Perjalanan',
        ekspedisi:    this.newDO.ekspedisi,
        tanggalKirim: this.newDO.tanggalKirim,
        paket:        this.newDO.paketKode,
        total:        paketDipilih ? paketDipilih.harga : 0,
        perjalanan: [
          {
            waktu:      this._formatDateTime(new Date()),
            keterangan: 'DO dibuat — menunggu proses pengiriman'
          }
        ]
      };
      this.$emit('do-tambah', newEntry);
      this.resetDOForm();
      this.showAddDO = false;
    },

    onDOEnter(e) {
      if (e.key === 'Enter') this.saveDO();
    },

    resetDOForm() {
      this.newDO = {
        nim: '', nama: '', ekspedisi: '', paketKode: '',
        tanggalKirim: this._formatDateInput(new Date())
      };
      this.doErrors = {};
      this.selectedPaketInfo = null;
    },

    cancelAddDO() {
      this.showAddDO = false;
      this.resetDOForm();
    },

    // ─── Tambah Progress ─────────────────────────────────────────
    addProgress(noDO) {
      if (!this.progressInput.trim()) {
        this.progressError = 'Keterangan progress wajib diisi';
        return;
      }
      this.progressError = '';
      const entry = {
        waktu:      this._formatDateTime(new Date()),
        keterangan: this.progressInput.trim()
      };
      this.$emit('do-progress', { noDO, entry });
      this.progressInput = '';
    },

    onProgressEnter(e, noDO) {
      if (e.key === 'Enter') this.addProgress(noDO);
    },

    // ─── Helper Tanggal ──────────────────────────────────────────
    _formatDateInput(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    _formatDateTime(date) {
      const y  = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const d  = String(date.getDate()).padStart(2, '0');
      const h  = String(date.getHours()).padStart(2, '0');
      const mi = String(date.getMinutes()).padStart(2, '0');
      const s  = String(date.getSeconds()).padStart(2, '0');
      return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
    },

    getNamaPaket(kode) {
      const p = this.paket.find(x => x.kode === kode);
      return p ? `${p.kode} – ${p.nama}` : kode;
    },

    getPaketIsi(kode) {
      const p = this.paket.find(x => x.kode === kode);
      return p ? p.isi : [];
    },

    statusClass(status) {
      if (status === 'Terkirim')          return 'status-terkirim';
      if (status === 'Dalam Perjalanan')  return 'status-perjalanan';
      if (status === 'Dikembalikan')      return 'status-kembali';
      return 'status-default';
    }
  }
});
