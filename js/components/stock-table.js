/**
 * stock-table.js
 * Komponen: <ba-stock-table>
 * Template ID: #tpl-stock
 * Menampilkan daftar stok bahan ajar dengan fitur:
 * - Filter (UPBJJ, Kategori, Reorder)
 * - Sort (judul, qty, harga)
 * - CRUD (tambah, edit, hapus)
 * - Status badge (Aman / Menipis / Kosong)
 * - Tooltip catatanHTML saat hover kolom Status
 */
Vue.component('ba-stock-table', {
  template: '#tpl-stock',
  props: {
    stok: { type: Array, required: true },
    upbjjList: { type: Array, required: true },
    kategoriList: { type: Array, required: true }
  },

  data() {
    return {
      // --- Filter ---
      filterUpbjj: '',
      filterKategori: '',
      filterReorder: false,
      showKategoriFilter: false,

      // --- Sort ---
      sortBy: 'judul',
      sortDir: 'asc',

      // --- UI State ---
      showAddForm: false,
      showEditModal: false,
      showDeleteModal: false,
      deleteTarget: null,
      editTarget: null,
      hoveredKode: null,

      // --- Form tambah baru ---
      newItem: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: '',
        qty: '',
        safety: '',
        catatanHTML: ''
      },
      newErrors: {},

      // --- Form edit ---
      editItem: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: '',
        qty: '',
        safety: '',
        catatanHTML: ''
      },
      editErrors: {}
    };
  },

  computed: {
    /**
     * filteredSorted — computed property utama untuk list rendering.
     * Tidak perlu recompute apabila data & filter tidak berubah (Vue caching).
     */
    filteredSorted() {
      let list = [...this.stok];

      // Filter: UPBJJ
      if (this.filterUpbjj) {
        list = list.filter(item => item.upbjj === this.filterUpbjj);
      }

      // Filter: Kategori (dependent on filterUpbjj)
      if (this.filterKategori) {
        list = list.filter(item => item.kategori === this.filterKategori);
      }

      // Filter: Reorder (qty < safety ATAU qty === 0)
      if (this.filterReorder) {
        list = list.filter(item => item.qty < item.safety || item.qty === 0);
      }

      // Sort
      list.sort((a, b) => {
        let valA = a[this.sortBy];
        let valB = b[this.sortBy];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      return list;
    },

    /**
     * Kategori yang tersedia berdasarkan UPBJJ yang dipilih (dependent options)
     */
    availableKategori() {
      if (!this.filterUpbjj) return this.kategoriList;
      const fromStok = this.stok
        .filter(item => item.upbjj === this.filterUpbjj)
        .map(item => item.kategori);
      return [...new Set(fromStok)];
    },

    reorderCount() {
      return this.stok.filter(item => item.qty < item.safety || item.qty === 0).length;
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.renderCharts();
      if (window.lucide) window.lucide.createIcons();
    });
  },

  updated() {
    this.$nextTick(() => {
      if (window.lucide) window.lucide.createIcons();
    });
  },

  beforeDestroy() {
    if (this.statusChart) this.statusChart.destroy();
    if (this.upbjjChart) this.upbjjChart.destroy();
  },

  watch: {
    /**
     * Watcher 1: Saat filterUpbjj berubah,
     * tampilkan filter Kategori dan reset filterKategori.
     */
    filterUpbjj(newVal) {
      if (newVal) {
        this.showKategoriFilter = true;
      } else {
        this.showKategoriFilter = false;
      }
      this.filterKategori = '';
    },

    /**
     * Watcher 2: Pantau perubahan filterReorder,
     * log info untuk debugging & UX feedback.
     */
    filterReorder(newVal) {
      if (newVal) {
        console.log('[StockTable] Mode Reorder aktif. Total item perlu reorder:', this.reorderCount);
      } else {
        console.log('[StockTable] Mode Reorder dinonaktifkan.');
      }
    },

    /**
     * Watcher 3: Re-render charts when filteredSorted updates.
     */
    filteredSorted: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.renderCharts();
        });
      }
    }
  },

  methods: {
    // ─── Chart Rendering ─────────────────────────────────────────
    renderCharts() {
      // 1. Status Chart
      const ctxStatus = document.getElementById('stock-status-chart');
      if (ctxStatus) {
        const aman = this.filteredSorted.filter(s => s.qty >= s.safety).length;
        const menipis = this.filteredSorted.filter(s => s.qty > 0 && s.qty < s.safety).length;
        const kosong = this.filteredSorted.filter(s => s.qty === 0).length;

        if (this.statusChart) {
          this.statusChart.data.datasets[0].data = [aman, menipis, kosong];
          this.statusChart.update();
        } else {
          this.statusChart = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
              labels: ['Aman', 'Menipis', 'Kosong'],
              datasets: [{
                data: [aman, menipis, kosong],
                backgroundColor: ['#10b981', '#fbbf24', '#f43f5e'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: '#cbd5e1',
                    font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
                    padding: 8
                  }
                }
              },
              cutout: '70%'
            }
          });
        }
      }

      // 2. UPBJJ Chart
      const ctxUpbjj = document.getElementById('stock-upbjj-chart');
      if (ctxUpbjj) {
        const upbjjData = {};
        // Initialize all known UPBJJs to 0 so they always show on the chart
        this.upbjjList.forEach(u => {
          upbjjData[u] = 0;
        });
        
        this.filteredSorted.forEach(item => {
          upbjjData[item.upbjj] = (upbjjData[item.upbjj] || 0) + item.qty;
        });

        const labels = Object.keys(upbjjData);
        const data = Object.values(upbjjData);

        if (this.upbjjChart) {
          this.upbjjChart.data.labels = labels;
          this.upbjjChart.data.datasets[0].data = data;
          this.upbjjChart.update();
        } else {
          this.upbjjChart = new Chart(ctxUpbjj, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Total Qty Buku',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.65)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10 } }
                },
                y: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10 } },
                  beginAtZero: true
                }
              }
            }
          });
        }
      }
    },

    // ─── Sort ───────────────────────────────────────────────────
    setSort(field) {
      if (this.sortBy === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = field;
        this.sortDir = 'asc';
      }
    },

    sortIcon(field) {
      if (this.sortBy !== field) return '↕';
      return this.sortDir === 'asc' ? '↑' : '↓';
    },

    // ─── Filter Reset ────────────────────────────────────────────
    resetFilter() {
      this.filterUpbjj = '';
      this.filterKategori = '';
      this.filterReorder = false;
      this.showKategoriFilter = false;
      this.sortBy = 'judul';
      this.sortDir = 'asc';
    },

    // ─── Tooltip Hover ──────────────────────────────────────────
    showTooltip(kode) { this.hoveredKode = kode; },
    hideTooltip()     { this.hoveredKode = null; },

    // ─── Tambah Baru ─────────────────────────────────────────────
    validateNew() {
      const e = {};
      if (!this.newItem.kode.trim())       e.kode      = 'Kode wajib diisi';
      if (!this.newItem.judul.trim())      e.judul     = 'Judul wajib diisi';
      if (!this.newItem.kategori)          e.kategori  = 'Pilih kategori';
      if (!this.newItem.upbjj)             e.upbjj     = 'Pilih UPBJJ';
      if (!this.newItem.lokasiRak.trim())  e.lokasiRak = 'Lokasi rak wajib diisi';
      if (!this.newItem.harga || isNaN(Number(this.newItem.harga)) || Number(this.newItem.harga) < 0)
        e.harga = 'Harga harus angka positif';
      if (this.newItem.qty === '' || isNaN(Number(this.newItem.qty)) || Number(this.newItem.qty) < 0)
        e.qty = 'Stok harus angka ≥ 0';
      if (this.newItem.safety === '' || isNaN(Number(this.newItem.safety)) || Number(this.newItem.safety) < 0)
        e.safety = 'Safety stok harus angka ≥ 0';
      // Cek duplikasi kode
      if (this.stok.find(s => s.kode === this.newItem.kode.trim()))
        e.kode = 'Kode sudah ada, gunakan kode unik';
      this.newErrors = e;
      return Object.keys(e).length === 0;
    },

    saveNew() {
      if (!this.validateNew()) return;
      const item = {
        kode:        this.newItem.kode.trim().toUpperCase(),
        judul:       this.newItem.judul.trim(),
        kategori:    this.newItem.kategori,
        upbjj:       this.newItem.upbjj,
        lokasiRak:   this.newItem.lokasiRak.trim().toUpperCase(),
        harga:       Number(this.newItem.harga),
        qty:         Number(this.newItem.qty),
        safety:      Number(this.newItem.safety),
        catatanHTML: this.newItem.catatanHTML
      };
      this.$emit('stok-tambah', item);
      this.resetNewForm();
      this.showAddForm = false;
    },

    resetNewForm() {
      this.newItem = { kode:'', judul:'', kategori:'', upbjj:'', lokasiRak:'', harga:'', qty:'', safety:'', catatanHTML:'' };
      this.newErrors = {};
    },

    onNewEnter(e) {
      if (e.key === 'Enter') this.saveNew();
    },

    // ─── Edit ────────────────────────────────────────────────────
    startEdit(item) {
      this.editTarget = item;
      this.editItem = { ...item };
      this.editErrors = {};
      this.showEditModal = true;
    },

    validateEdit() {
      const e = {};
      if (!this.editItem.judul.trim())     e.judul     = 'Judul wajib diisi';
      if (!this.editItem.kategori)         e.kategori  = 'Pilih kategori';
      if (!this.editItem.upbjj)            e.upbjj     = 'Pilih UPBJJ';
      if (!this.editItem.lokasiRak.trim()) e.lokasiRak = 'Lokasi rak wajib diisi';
      if (!this.editItem.harga || isNaN(Number(this.editItem.harga)) || Number(this.editItem.harga) < 0)
        e.harga = 'Harga harus angka positif';
      if (this.editItem.qty === '' || isNaN(Number(this.editItem.qty)) || Number(this.editItem.qty) < 0)
        e.qty = 'Stok harus angka ≥ 0';
      if (this.editItem.safety === '' || isNaN(Number(this.editItem.safety)) || Number(this.editItem.safety) < 0)
        e.safety = 'Safety stok harus angka ≥ 0';
      this.editErrors = e;
      return Object.keys(e).length === 0;
    },

    saveEdit() {
      if (!this.validateEdit()) return;
      const updated = {
        ...this.editTarget,
        judul:       this.editItem.judul.trim(),
        kategori:    this.editItem.kategori,
        upbjj:       this.editItem.upbjj,
        lokasiRak:   this.editItem.lokasiRak.trim().toUpperCase(),
        harga:       Number(this.editItem.harga),
        qty:         Number(this.editItem.qty),
        safety:      Number(this.editItem.safety),
        catatanHTML: this.editItem.catatanHTML
      };
      this.$emit('stok-update', updated);
      this.showEditModal = false;
      this.editTarget = null;
    },

    onEditEnter(e) {
      if (e.key === 'Enter') this.saveEdit();
    },

    cancelEdit() {
      this.showEditModal = false;
      this.editTarget = null;
      this.editErrors = {};
    },

    // ─── Hapus ───────────────────────────────────────────────────
    confirmDelete(item) {
      this.deleteTarget = item;
      this.showDeleteModal = true;
    },

    doDelete() {
      if (!this.deleteTarget) return;
      this.$emit('stok-hapus', this.deleteTarget.kode);
      this.showDeleteModal = false;
      this.deleteTarget = null;
    },

    cancelDelete() {
      this.showDeleteModal = false;
      this.deleteTarget = null;
    }
  }
});
