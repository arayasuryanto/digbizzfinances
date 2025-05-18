<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>Pengaturan</h2>
      <router-link to="/" class="back-button">Kembali ke Percakapan</router-link>
    </div>

    <div class="settings-grid">
      <div class="settings-section">
        <h3>Pengelolaan Data</h3>
        <div class="setting-card">
          <div class="setting-info">
            <h4>Ekspor Data</h4>
            <p>Unduh semua transaksi dan riwayat percakapan Anda sebagai file JSON</p>
          </div>
          <button @click="exportData" class="primary-button">Ekspor</button>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <h4>Hapus Semua Data</h4>
            <p>Hapus semua transaksi dan riwayat percakapan Anda</p>
          </div>
          <button @click="showClearConfirmation = true" class="danger-button">Hapus Data</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>Pemanfaatan AI untuk Analisis</h3>
        <div class="setting-card">
          <div class="setting-info">
            <h4>Fitur Konsultasi AI</h4>
            <p>Tanyakan tentang keuangan Anda atau minta saran berdasarkan transaksi Anda</p>
          </div>
          <button @click="askAI" class="primary-button">Konsultasi</button>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <h4>Perkiraan Pengeluaran Bulan Depan</h4>
            <p>Gunakan data historis untuk memprediksi pengeluaran Anda di bulan depan</p>
          </div>
          <button @click="predictNextMonth" class="primary-button">Prediksi</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>Pengaturan Tampilan</h3>
        <div class="setting-card">
          <div class="setting-info">
            <h4>Format Mata Uang</h4>
            <p>Pilih cara menampilkan jumlah mata uang</p>
          </div>
          <select v-model="currencyFormat" @change="saveSetting('currencyFormat', currencyFormat)">
            <option value="IDR">Rp (IDR)</option>
            <option value="USD">$ (USD)</option>
            <option value="EUR">€ (EUR)</option>
            <option value="GBP">£ (GBP)</option>
          </select>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <h4>Format Tanggal</h4>
            <p>Pilih cara menampilkan tanggal</p>
          </div>
          <select v-model="dateFormat" @change="saveSetting('dateFormat', dateFormat)">
            <option value="dd MMMM yyyy">31 Desember 2023</option>
            <option value="dd/MM/yyyy">31/12/2023</option>
            <option value="MM/dd/yyyy">12/31/2023</option>
            <option value="yyyy-MM-dd">2023-12-31</option>
          </select>
        </div>
      </div>

      <div class="settings-section full-width">
        <h3>Tentang Digbizz UMKM Doctor</h3>
        <div class="about-card">
          <p>
            Digbizz UMKM Doctor adalah aplikasi pencatatan keuangan konversasional yang membuat
            pengelolaan uang Anda semudah mengobrol. Cukup ketik transaksi Anda dalam bahasa alami,
            dan aplikasi kami akan mengkategorikan dan melacaknya untuk Anda.
          </p>
          <p>
            <strong>Versi:</strong> 1.0.0
          </p>
        </div>
      </div>
    </div>

    <!-- Confirmation modal -->
    <div v-if="showClearConfirmation" class="modal-overlay">
      <div class="modal-content">
        <h3>Hapus Semua Data?</h3>
        <p>Tindakan ini tidak dapat dibatalkan. Semua transaksi dan riwayat percakapan Anda akan dihapus secara permanen.</p>
        <div class="modal-actions">
          <button @click="showClearConfirmation = false" class="secondary-button">Batal</button>
          <button @click="clearAllData" class="danger-button">Ya, Hapus Semuanya</button>
        </div>
      </div>
    </div>

    <!-- AI Feedback Modal -->
    <div v-if="showAiFeedback" class="modal-overlay">
      <div class="modal-content ai-feedback">
        <h3>{{ aiModalTitle }}</h3>
        <div class="ai-response" v-if="aiResponse">
          <p v-for="(paragraph, index) in aiResponseParagraphs" :key="index">{{ paragraph }}</p>
        </div>
        <div class="loading" v-else>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Menganalisis data transaksi Anda...</p>
        </div>
        <div class="modal-actions">
          <button @click="closeAiFeedback" class="primary-button">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default {
  name: 'Settings',
  data() {
    return {
      showClearConfirmation: false,
      showAiFeedback: false,
      aiResponse: null,
      aiModalTitle: '',
      currencyFormat: localStorage.getItem('currencyFormat') || 'IDR',
      dateFormat: localStorage.getItem('dateFormat') || 'dd MMMM yyyy'
    }
  },
  computed: {
    aiResponseParagraphs() {
      return this.aiResponse ? this.aiResponse.split('\n\n') : [];
    }
  },
  methods: {
    exportData() {
      // Gather all data
      const data = {
        transactions: this.$store.state.transactions,
        messages: this.$store.state.messages,
        balance: this.$store.state.balance,
        exportDate: new Date().toISOString()
      };
      
      // Convert to JSON
      const jsonData = JSON.stringify(data, null, 2);
      
      // Create download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `digbizz-umkm-doctor-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    clearAllData() {
      this.$store.dispatch('clearAllData');
      this.showClearConfirmation = false;
    },
    saveSetting(key, value) {
      localStorage.setItem(key, value);
    },
    askAI() {
      this.aiModalTitle = 'Analisis Keuangan';
      this.showAiFeedback = true;
      this.aiResponse = null;
      
      // Simulate AI processing
      setTimeout(() => {
        const transactions = this.$store.state.transactions;
        if (transactions.length === 0) {
          this.aiResponse = "Anda belum memiliki transaksi yang tercatat. Mulailah mencatat transaksi Anda untuk mendapatkan analisis keuangan.";
          return;
        }
        
        // Calculate some statistics for the response
        const totalIncome = this.$store.getters.totalIncome;
        const totalExpenses = this.$store.getters.totalExpenses;
        const balance = this.$store.state.balance;
        
        // Get top expense category
        const expenses = transactions.filter(t => t.type === 'expense');
        const categories = {};
        expenses.forEach(t => {
          if (!categories[t.category]) categories[t.category] = 0;
          categories[t.category] += t.amount;
        });
        
        let topCategory = 'belum ada';
        let topAmount = 0;
        
        for (const [category, amount] of Object.entries(categories)) {
          if (amount > topAmount) {
            topCategory = category;
            topAmount = amount;
          }
        }
        
        const formatRupiah = (value) => {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        };
        
        this.aiResponse = `Berdasarkan analisis transaksi Anda, total pemasukan Anda adalah ${formatRupiah(totalIncome)} dan total pengeluaran Anda adalah ${formatRupiah(totalExpenses)}. Saldo Anda saat ini adalah ${formatRupiah(balance)}.

Kategori pengeluaran tertinggi Anda adalah "${topCategory}" dengan total ${formatRupiah(topAmount)}. Ini mewakili ${Math.round(topAmount/totalExpenses*100)}% dari total pengeluaran Anda.

Berdasarkan pola pengeluaran Anda, kami sarankan untuk membuat anggaran bulanan dan memonitor pengeluaran Anda pada kategori "${topCategory}" untuk mengontrol pengeluaran Anda lebih baik.`;
      }, 1500);
    },
    predictNextMonth() {
      this.aiModalTitle = 'Prediksi Bulan Depan';
      this.showAiFeedback = true;
      this.aiResponse = null;
      
      // Simulate AI processing
      setTimeout(() => {
        const transactions = this.$store.state.transactions;
        if (transactions.length < 5) {
          this.aiResponse = "Anda perlu memiliki lebih banyak data transaksi untuk prediksi yang akurat. Silakan lanjutkan mencatat transaksi Anda dan coba lagi nanti.";
          return;
        }
        
        // Calculate some statistics for the response
        const totalExpenses = this.$store.getters.totalExpenses;
        const totalPerWeek = totalExpenses / (transactions.length / 7 || 1);
        const predictedNextMonth = totalPerWeek * 4.3; // Approximate weeks in a month
        
        const formatRupiah = (value) => {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        };
        
        this.aiResponse = `Berdasarkan pola pengeluaran historis Anda, kami memperkirakan pengeluaran Anda untuk bulan depan akan sekitar ${formatRupiah(predictedNextMonth)}.

Prediksi ini didasarkan pada rata-rata pengeluaran mingguan Anda sebesar ${formatRupiah(totalPerWeek)}, dikalikan dengan 4,3 minggu dalam sebulan.

Ingat bahwa ini hanyalah perkiraan dan pengeluaran aktual Anda mungkin bervariasi tergantung pada peristiwa yang tidak terduga atau perubahan pola pengeluaran.`;
      }, 1500);
    },
    closeAiFeedback() {
      this.showAiFeedback = false;
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.settings-header h2 {
  color: var(--text-dark);
  font-size: 1.5rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: var(--text-dark);
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--primary-dark);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.settings-section {
  background-color: var(--light-gray);
  border-radius: 10px;
  padding: 1.5rem;
}

.settings-section.full-width {
  grid-column: 1 / -1;
}

.settings-section h3 {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.setting-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-card:last-child {
  border-bottom: none;
}

.setting-info h4 {
  font-size: 1rem;
  color: var(--text-dark);
  margin-bottom: 0.25rem;
}

.setting-info p {
  font-size: 0.85rem;
  color: var(--text-gray);
}

.primary-button, .danger-button, .secondary-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-button {
  background-color: var(--primary-color);
  color: var(--text-dark);
}

.primary-button:hover {
  background-color: var(--primary-dark);
}

.danger-button {
  background-color: var(--expense-color);
  color: white;
}

.danger-button:hover {
  background-color: #c82333;
}

.secondary-button {
  background-color: var(--text-gray);
  color: white;
}

.secondary-button:hover {
  background-color: #5a6268;
}

select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  outline: none;
  background-color: white;
}

.about-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  line-height: 1.6;
}

.about-card p {
  margin-bottom: 1rem;
}

.about-card p:last-child {
  margin-bottom: 0;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 10px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  color: var(--primary-dark);
  margin-bottom: 1rem;
}

.modal-content.ai-feedback {
  max-width: 600px;
}

.modal-content.ai-feedback h3 {
  color: var(--primary-dark);
  text-align: center;
  margin-bottom: 1.5rem;
}

.ai-response {
  background-color: var(--light-gray);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.ai-response p {
  margin-bottom: 1rem;
}

.ai-response p:last-child {
  margin-bottom: 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading p {
  margin-top: 1rem;
  color: var(--text-gray);
}

.typing-indicator {
  display: flex;
  align-items: center;
  column-gap: 0.3rem;
}

.typing-indicator span {
  height: 10px;
  width: 10px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-4px);
  }
  50% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(0);
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Responsive styles */
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>