<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <h1>Selamat Datang di Finance Chat</h1>
      <p class="welcome-text">
        <span class="user-greeting">
          {{ getGreeting() }}, 
          <b>{{ getDisplayName() }}</b>
        </span>
        <span class="date-info">{{ getCurrentDate() }}</span>
      </p>
    </div>
    
    <div class="cards-container">
      <div class="dashboard-card finance-summary">
        <h2>Ringkasan Keuangan</h2>
        <div class="finance-stats">
          <div class="stat-item">
            <span class="stat-label">Saldo</span>
            <span class="stat-value">{{ formatRupiah($store.state.balance) }}</span>
          </div>
          <div class="stat-item income">
            <span class="stat-label">Pemasukan</span>
            <span class="stat-value">{{ formatRupiah($store.getters.totalIncome) }}</span>
          </div>
          <div class="stat-item expense">
            <span class="stat-label">Pengeluaran</span>
            <span class="stat-value">{{ formatRupiah($store.getters.totalExpenses) }}</span>
          </div>
        </div>
        <router-link to="/reports?tab=analisis" class="card-link">Lihat Analisis</router-link>
      </div>
      
      <div class="dashboard-card quick-actions">
        <h2>Aksi Cepat</h2>
        <div class="actions-buttons">
          <router-link to="/conversation" class="action-button">
            <span class="action-icon">💬</span>
            <span class="action-label">Catat Transaksi</span>
          </router-link>
          <router-link to="/reports?tab=analisis" class="action-button">
            <span class="action-icon">📊</span>
            <span class="action-label">Lihat Analisis</span>
          </router-link>
          <router-link to="/settings" class="action-button">
            <span class="action-icon">⚙️</span>
            <span class="action-label">Pengaturan</span>
          </router-link>
        </div>
      </div>
      
      <div class="dashboard-card recent-transactions">
        <div class="card-header">
          <h2>Transaksi Terbaru</h2>
          <router-link to="/reports?tab=mutasi" class="view-all">Lihat Semua</router-link>
        </div>
        <div v-if="$store.getters.sortedTransactions.length === 0" class="empty-state">
          Belum ada transaksi. Mulai dengan catat transaksi pertama Anda.
        </div>
        <ul v-else class="transactions-list">
          <li v-for="transaction in recentTransactions" :key="transaction.id" 
              :class="transaction.type">
            <div class="transaction-details">
              <span class="transaction-category">{{ transaction.category }}</span>
              <span class="transaction-date">{{ transaction.formatted_date }}</span>
            </div>
            <span class="transaction-amount">{{ formatRupiah(transaction.amount) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { formatRupiah } from '../utils/formatting';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default {
  name: 'Dashboard',
  data() {
    return {
      
    }
  },
  computed: {
    businessInfo() {
      return this.$store.state.business || {};
    },
    userInfo() {
      return this.$store.state.auth.user || { name: '' };
    },
    recentTransactions() {
      return this.$store.getters.sortedTransactions.slice(0, 5);
    }
  },
  methods: {
    formatRupiah,
    getCurrentDate() {
      return format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id });
    },
    getGreeting() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Selamat Pagi';
      if (hour < 15) return 'Selamat Siang';
      if (hour < 19) return 'Selamat Sore';
      return 'Selamat Malam';
    },
    getDisplayName() {
      const businessType = this.businessInfo.type;
      const userName = this.userInfo.name || 'User';
      const businessName = this.businessInfo.name;
      
      if (businessType === 'personal') {
        return userName;
      } else if (businessType && businessName) {
        return `${userName} dari ${businessName}`;
      } else {
        return userName;
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.welcome-section h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--text-dark);
}

.welcome-text {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  color: var(--text-gray);
  font-size: 1rem;
}

.date-info {
  color: var(--text-gray);
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.dashboard-card h2 {
  font-size: 1.25rem;
  margin-bottom: 1.25rem;
  color: var(--text-dark);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.finance-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: var(--light-gray);
}

.stat-item.income {
  background-color: rgba(40, 167, 69, 0.1);
}

.stat-item.expense {
  background-color: rgba(220, 53, 69, 0.1);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-gray);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-dark);
}

.stat-item.income .stat-value {
  color: var(--income-color);
}

.stat-item.expense .stat-value {
  color: var(--expense-color);
}

.card-link {
  display: block;
  text-align: center;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: var(--text-dark);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.2s;
}

.card-link:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.actions-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: var(--light-gray);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-dark);
  transition: transform 0.2s, background-color 0.2s;
}

.action-button:hover {
  background-color: var(--primary-color);
  transform: translateX(5px);
}

.action-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.action-label {
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.view-all {
  font-size: 0.85rem;
  color: var(--primary-dark);
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

.transactions-list {
  list-style: none;
  padding: 0;
}

.transactions-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.transactions-list li:last-child {
  border-bottom: none;
}

.transaction-details {
  display: flex;
  flex-direction: column;
}

.transaction-category {
  font-weight: 500;
  color: var(--text-dark);
}

.transaction-date {
  font-size: 0.8rem;
  color: var(--text-gray);
}

.transaction-amount {
  font-weight: 600;
}

li.income .transaction-amount {
  color: var(--income-color);
}

li.expense .transaction-amount {
  color: var(--expense-color);
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-gray);
  font-style: italic;
  background-color: var(--light-gray);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .welcome-section h1 {
    font-size: 1.5rem;
  }
  
  .welcome-text {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .cards-container {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  
  .dashboard-card {
    padding: 1.25rem;
  }
  
  .dashboard-card h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 0.75rem;
  }
  
  .welcome-section {
    margin-bottom: 1.25rem;
  }
  
  .welcome-section h1 {
    font-size: 1.3rem;
  }
  
  .welcome-text {
    font-size: 0.9rem;
  }
  
  .cards-container {
    gap: 1rem;
  }
  
  .dashboard-card {
    padding: 1rem;
    border-radius: 8px;
  }
  
  .dashboard-card h2 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
  }
  
  .stat-item {
    padding: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .action-button {
    padding: 0.8rem;
  }
  
  .action-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }
  
  .action-label {
    font-size: 0.9rem;
  }
  
  .transaction-category {
    font-size: 0.9rem;
  }
  
  .transaction-date {
    font-size: 0.75rem;
  }
  
  .transaction-amount {
    font-size: 0.9rem;
  }
}
</style>