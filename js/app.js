/**
 * app.js
 * Root Vue instance — SITTA Bahan Ajar UT
 * Tab routing: 'stok' | 'tracking' | 'order'
 * Global filters: rupiah, buah, tanggal
 * Memuat data via DataService (api.js) dan me-load HTML templates
 */

// ════════════════════════════════════════════
// GLOBAL FILTERS
// ════════════════════════════════════════════

Vue.filter('rupiah', function(value) {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  return 'Rp ' + Number(value).toLocaleString('id-ID');
});

Vue.filter('buah', function(value) {
  if (value === null || value === undefined) return '0 buah';
  return Number(value).toLocaleString('id-ID') + ' buah';
});

Vue.filter('tanggal', function(value) {
  if (!value) return '-';
  const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dateStr = String(value).split(' ')[0];
  const parts   = dateStr.split('-');
  if (parts.length < 3) return value;
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parts[0];
  return `${d} ${bulanList[m]} ${y}`;
});

// ════════════════════════════════════════════
// TEMPLATE LOADER (Memuat file .html dari /templates)
// ════════════════════════════════════════════
async function loadTemplates() {
  const templates = [
    { file: 'status-badge.html', id: 'tpl-status-badge' },
    { file: 'app-modal.html', id: 'tpl-modal' },
    { file: 'stock-table.html', id: 'tpl-stock' },
    { file: 'do-tracking.html', id: 'tpl-tracking' },
    { file: 'order-form.html', id: 'tpl-order' }
  ];

  for (const t of templates) {
    try {
      const response = await fetch(`./templates/${t.file}`);
      const text = await response.text();
      const script = document.createElement('script');
      script.type = 'text/x-template';
      script.id = t.id;
      script.innerHTML = text;
      document.body.appendChild(script);
    } catch (err) {
      console.error(`Gagal memuat template: ${t.file}`, err);
    }
  }
}

// ════════════════════════════════════════════
// ROOT VUE INSTANCE
// ════════════════════════════════════════════
loadTemplates().then(() => {
  new Vue({
    el: '#app',
    data: {
      tab: 'stok',          // Routing: 'stok' | 'tracking' | 'order'
      isLoading: true,
      loadError: null,

      // Data dari JSON
      stok:          [],
      upbjjList:     [],
      kategoriList:  [],
      paket:         [],
      pengirimanList:[],
      tracking:      [],

      // Notifikasi global
      notif: { show: false, message: '', type: 'success' }
    },

    async created() {
      try {
        const data = await DataService.load();
        this.upbjjList      = data.upbjjList     || [];
        this.kategoriList   = data.kategoriList  || [];
        this.pengirimanList = data.pengirimanList || [];
        this.paket          = data.paket         || [];
        this.stok           = data.stok          || [];
        
        // Normalisasi tracking: Handle format [{ "DO2025-0001": {...} }]
        this.tracking = (data.tracking || []).map(t => {
          if (t.noDO) return t;
          const key = Object.keys(t)[0];
          return { noDO: key, ...t[key] };
        });
      } catch (err) {
        this.loadError = 'Gagal memuat data. Pastikan server lokal berjalan.';
      } finally {
        this.isLoading = false;
      }
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

    methods: {
      setTab(tab) {
        this.tab = tab;
      },
      onStokTambah(item) {
        this.stok.push(item);
        this.showNotif('✅ Data bahan ajar berhasil ditambahkan!', 'success');
      },
      onStokUpdate(updated) {
        const idx = this.stok.findIndex(s => s.kode === updated.kode);
        if (idx !== -1) {
          this.$set(this.stok, idx, updated);
          this.showNotif('✏️ Data bahan ajar berhasil diperbarui!', 'success');
        }
      },
      onStokHapus(kode) {
        const idx = this.stok.findIndex(s => s.kode === kode);
        if (idx !== -1) {
          this.stok.splice(idx, 1);
          this.showNotif('🗑️ Data bahan ajar berhasil dihapus!', 'warning');
        }
      },
      onDoTambah(newDO) {
        this.tracking.push(newDO);
        this.showNotif('📦 Delivery Order baru berhasil dibuat: ' + newDO.noDO, 'success');
      },
      onDoProgress({ noDO, entry }) {
        const t = this.tracking.find(x => x.noDO === noDO);
        if (t) {
          t.perjalanan.push(entry);
          if (entry.keterangan.toLowerCase().includes('diterima')) {
            t.status = 'Terkirim';
          }
          this.showNotif('🚚 Progress pengiriman berhasil ditambahkan!', 'success');
        }
      },
      onOrderSubmit(summary) {
        this.showNotif(`🎉 Pesanan ${summary.nama} berhasil diproses!`, 'success');
      },
      showNotif(message, type = 'success') {
        this.notif = { show: true, message, type };
        setTimeout(() => { this.notif.show = false; }, 3500);
      }
    }
  });
});
