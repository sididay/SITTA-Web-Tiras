/**
 * api.js — Data Service
 * Menangani akses data untuk aplikasi SITTA.
 * Bertanggung jawab untuk melakukan fetch JSON (data service).
 */
const DataService = {
  /**
   * Mengambil data dari dataBahanAjar.json
   * @returns {Promise<Object>} Object berisi data stok, tracking, dll.
   */
  async load() {
    try {
      const response = await fetch('./data/dataBahanAjar.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ada masalah dengan operasi fetch DataService:', error);
      throw error;
    }
  }
};
