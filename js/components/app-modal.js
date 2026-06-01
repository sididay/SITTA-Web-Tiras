/**
 * app-modal.js
 * Komponen: <app-modal>
 * Template ID: #tpl-modal
 * Modal dialog konfirmasi generik (delete, dsb.)
 */
Vue.component('app-modal', {
  template: '#tpl-modal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Konfirmasi'
    },
    message: {
      type: String,
      default: 'Apakah Anda yakin?'
    },
    confirmText: {
      type: String,
      default: 'Ya, Hapus'
    },
    cancelText: {
      type: String,
      default: 'Batal'
    },
    confirmClass: {
      type: String,
      default: 'btn-danger'
    }
  },
  methods: {
    onConfirm() {
      this.$emit('confirm');
    },
    onCancel() {
      this.$emit('cancel');
    }
  }
});
