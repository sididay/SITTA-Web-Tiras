/**
 * order-form.js
 * Komponen: <order-form>
 * Template ID: #tpl-order
 * Ringkasan form pemesanan bahan ajar (tab Order)
 * Menampilkan paket tersedia + formulir ringkasan pemesanan
 */
Vue.component('order-form', {
  template: '#tpl-order',
  props: {
    paket:         { type: Array, required: true },
    pengirimanList:{ type: Array, required: true },
    stok:          { type: Array, required: true }
  },

  data() {
    return {
      selectedPaket: '',
      selectedPengiriman: '',
      nim:   '',
      nama:  '',
      alamat: '',
      orderErrors: {},
      orderSuccess: false,
      orderSummary: null
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
     * Detail paket yang dipilih (computed, cached)
     */
    paketDetail() {
      if (!this.selectedPaket) return null;
      return this.paket.find(p => p.kode === this.selectedPaket) || null;
    },

    /**
     * Detail pengiriman yang dipilih
     */
    pengirimanDetail() {
      if (!this.selectedPengiriman) return null;
      return this.pengirimanList.find(p => p.kode === this.selectedPengiriman) || null;
    },

    /**
     * Cek ketersediaan stok untuk setiap item dalam paket
     */
    stokCheck() {
      if (!this.paketDetail) return [];
      return this.paketDetail.isi.map(kode => {
        const s = this.stok.find(x => x.kode === kode);
        return {
          kode,
          judul: s ? s.judul : kode,
          qty:   s ? s.qty   : 0,
          cukup: s ? s.qty > 0 : false
        };
      });
    },

    /**
     * Apakah semua item dalam paket tersedia
     */
    semuaStokCukup() {
      return this.stokCheck.every(s => s.cukup);
    },

    formattedHarga() {
      if (!this.paketDetail) return 'Rp 0';
      return 'Rp ' + Number(this.paketDetail.harga).toLocaleString('id-ID');
    },

    tanggalHariIni() {
      const bulanList = [
        'Januari','Februari','Maret','April','Mei','Juni',
        'Juli','Agustus','September','Oktober','November','Desember'
      ];
      const now = new Date();
      return `${now.getDate()} ${bulanList[now.getMonth()]} ${now.getFullYear()}`;
    }
  },

  methods: {
    validateOrder() {
      const e = {};
      if (!this.nim.trim())              e.nim   = 'NIM wajib diisi';
      if (!this.nama.trim())             e.nama  = 'Nama wajib diisi';
      if (!this.alamat.trim())           e.alamat = 'Alamat wajib diisi';
      if (!this.selectedPaket)           e.paket = 'Pilih paket bahan ajar';
      if (!this.selectedPengiriman)      e.pengiriman = 'Pilih jenis pengiriman';
      if (!this.semuaStokCukup)          e.stok  = 'Beberapa item dalam paket tidak tersedia';
      this.orderErrors = e;
      return Object.keys(e).length === 0;
    },

    submitOrder() {
      if (!this.validateOrder()) return;
      this.orderSummary = {
        nim:       this.nim.trim(),
        nama:      this.nama.trim(),
        alamat:    this.alamat.trim(),
        paket:     this.paketDetail,
        pengiriman: this.pengirimanDetail,
        tanggal:   this.tanggalHariIni,
        total:     this.paketDetail.harga
      };
      this.orderSuccess = true;
      this.$emit('order-submit', this.orderSummary);
    },

    onOrderEnter(e) {
      if (e.key === 'Enter') this.submitOrder();
    },

    resetOrder() {
      this.selectedPaket = '';
      this.selectedPengiriman = '';
      this.nim   = '';
      this.nama  = '';
      this.alamat = '';
      this.orderErrors  = {};
      this.orderSuccess = false;
      this.orderSummary = null;
    }
  }
});
