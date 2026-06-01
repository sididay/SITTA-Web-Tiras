/**
 * status-badge.js
 * Komponen: <status-badge>
 * Template ID: #tpl-status-badge
 * Menampilkan status stok bahan ajar dengan warna dan ikon
 */
Vue.component('status-badge', {
  template: '#tpl-status-badge',
  props: {
    qty: {
      type: Number,
      required: true
    },
    safety: {
      type: Number,
      required: true
    },
    catatanHTML: {
      type: String,
      default: ''
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
  computed: {
    statusInfo() {
      if (this.qty === 0) {
        return {
          label: 'Kosong',
          kelas: 'badge-kosong',
          ikon: '🚫'
        };
      } else if (this.qty < this.safety) {
        return {
          label: 'Menipis',
          kelas: 'badge-menipis',
          ikon: '⚠️'
        };
      } else {
        return {
          label: 'Aman',
          kelas: 'badge-aman',
          ikon: '✅'
        };
      }
    }
  }
});
