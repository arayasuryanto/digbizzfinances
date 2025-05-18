<template>
  <div class="home-container">
    <!-- Category Edit Dialog -->
    <div v-if="categoryDialog.show" class="category-edit-overlay">
      <div class="category-edit-dialog">
        <div class="dialog-header">
          <h3>Ubah Kategori</h3>
          <button class="close-btn" @click="categoryDialog.show = false">×</button>
        </div>
        <div class="dialog-content">
          <div class="category-options">
            <button 
              v-for="(category, index) in categoryDialog.categories" 
              :key="index" 
              class="category-option" 
              :class="{selected: categoryDialog.transaction && category === categoryDialog.transaction.category}"
              @click="updateCategory(category)">
              {{ getCategoryTranslation(category) }}
            </button>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="categoryDialog.show = false">Tutup</button>
        </div>
      </div>
    </div>
    
    <div class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-toggle" @click="toggleSidebar">
        <span v-if="sidebarCollapsed">⟩</span>
        <span v-else>⟨</span>
      </div>
      
      <div class="sidebar-content" v-show="!sidebarCollapsed">
        <div class="sidebar-header">
          <h2>Ringkasan Transaksi</h2>
        </div>
        
        <div class="totals-section">
          <div class="total-widget income">
            <h4>Total Pemasukan</h4>
            <p>{{ formatRupiah($store.getters.totalIncome) }}</p>
          </div>
          
          <div class="total-widget expenses">
            <h4>Total Pengeluaran</h4>
            <p>{{ formatRupiah($store.getters.totalExpenses) }}</p>
          </div>
        </div>

        <div class="recent-transactions">
          <h3>Transaksi Terbaru</h3>
          <div v-if="$store.getters.sortedTransactions.length === 0" class="empty-state">
            Belum ada transaksi
          </div>
          <ul v-else>
            <li v-for="transaction in $store.getters.sortedTransactions.slice(0, 5)" :key="transaction.id"
                :class="transaction.type">
              <div class="transaction-details">
                <span class="transaction-category" @click="editCategory(transaction)">{{ getCategoryTranslation(transaction.category) }} <span class="edit-icon">✏️</span></span>
                <span class="transaction-date">{{ transaction.formatted_date }}</span>
              </div>
              <span class="transaction-amount">{{ formatRupiah(transaction.amount) }}</span>
            </li>
          </ul>
          <router-link to="/reports" class="view-all-link">Lihat Semua Transaksi</router-link>
        </div>
      </div>
    </div>
    
    <div class="chat-section">
      <div class="messages-container" ref="messagesContainer">
        <div v-if="$store.state.messages.length === 0" class="welcome-message">
          <h2>Selamat Datang di Digbizz UMKM Doctor!</h2>
          <p>Cukup ketik transaksi keuangan Anda di bawah ini dan saya akan mencatatnya untuk Anda.</p>
          <div class="examples">
            <h3>Contoh:</h3>
            <ul>
              <li>"Saya belanja di pasar Rp 250.000"</li>
              <li>"Menerima pembayaran dari klien Rp 1.500.000"</li>
              <li>"Bayar listrik Rp 350rb"</li>
              <li>"Dapat uang kembalian dari toko Rp 75.000"</li>
            </ul>
          </div>
        </div>
        
        <div v-for="message in $store.state.messages" :key="message.id"
             class="message" :class="message.sender">
          <div class="message-bubble">
            {{ message.text }}
          </div>
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
        
        <div v-if="$store.state.loading" class="message assistant loading">
          <div class="message-bubble">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="input-container">
        <input
          type="text"
          v-model="messageText"
          @keyup.enter="sendMessage"
          placeholder="Ketik transaksi Anda di sini..."
          :disabled="$store.state.loading"
        />
        <button @click="sendMessage" :disabled="!messageText || $store.state.loading">
          Kirim
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CATEGORY_TRANSLATIONS, SUBCATEGORIES } from '../utils/transactionParser';
import { getAvailableCategories } from '../utils/businessCategories';
import { formatRupiah } from '../utils/formatting';

export default {
  name: 'Home',
  data() {
    return {
      messageText: '',
      sidebarCollapsed: window.innerWidth < 768, // Collapse on mobile by default
      categoryDialog: {
        show: false,
        transaction: null,
        categories: []
      }
    }
  },
  methods: {
    editCategory(transaction) {
      // Get categories based on transaction type and business type
      const businessInfo = this.$store.state.business;
      const businessType = businessInfo.type || 'personal';
      const availableCategories = getAvailableCategories(
        businessType,
        transaction.type,
        businessInfo.transactionCategories
      );
      
      // Show modal with category options
      this.categoryDialog = {
        show: true,
        transaction: transaction,
        categories: availableCategories
      };
    },
    
    updateCategory(newCategory) {
      if (!this.categoryDialog.transaction || newCategory === this.categoryDialog.transaction.category) return;
      
      // Create updated transaction
      const updatedTransaction = {
        ...this.categoryDialog.transaction,
        category: newCategory
      };
      
      // Update transaction in store
      this.$store.dispatch('updateTransaction', updatedTransaction);
      
      // Close dialog
      this.categoryDialog.show = false;
    },
    
    sendMessage() {
      if (!this.messageText.trim() || this.$store.state.loading) return;
      
      this.$store.dispatch('processMessage', this.messageText);
      this.messageText = '';
      
      // Scroll to bottom after messages update
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    formatTime(timestamp) {
      return format(new Date(timestamp), 'HH:mm', { locale: id });
    },
    formatRupiah,
    getCategoryTranslation(category) {
      return CATEGORY_TRANSLATIONS[category] || category;
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    handleResize() {
      // Auto-collapse on mobile
      this.sidebarCollapsed = window.innerWidth < 768;
    }
  },
  mounted() {
    this.scrollToBottom();
    window.addEventListener('resize', this.handleResize);
  },
  updated() {
    this.scrollToBottom();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: calc(100vh - 120px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
  position: relative;
  box-sizing: border-box;
  max-width: 100%;
}

.sidebar {
  width: 28%;
  min-width: 240px;
  max-width: 300px;
  background-color: var(--light-gray);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  box-sizing: border-box;
}

.sidebar.collapsed {
  width: 30px;
}

.sidebar-toggle {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background-color: var(--primary-color);
  color: var(--text-dark);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 4px 0 0 4px;
  z-index: 10;
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
}

.sidebar-content {
  padding: 0.875rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  box-sizing: border-box;
  width: 100%;
}

.sidebar-header {
  margin-bottom: 0.5rem;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  color: var(--text-dark);
  font-weight: 600;
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.positive {
  color: var(--income-color);
}

.negative {
  color: var(--expense-color);
}

.totals-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.total-widget {
  flex: 1;
  padding: 0.875rem 0.625rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.2s;
  min-width: 0; /* Prevents widget from overflowing */
  box-sizing: border-box;
}

.total-widget:hover {
  transform: translateY(-3px);
}

.total-widget h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: var(--text-gray);
}

.total-widget p {
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.income {
  background-color: #e8f5e9;
}

.income p {
  color: var(--income-color);
}

.expenses {
  background-color: #ffebee;
}

.expenses p {
  color: var(--expense-color);
}

.recent-transactions {
  background-color: var(--white);
  padding: 0.875rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-grow: 1;
  max-height: calc(100% - 140px);
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.recent-transactions h3 {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  text-align: center;
}

.empty-state {
  color: var(--text-gray);
  text-align: center;
  padding: 1rem;
  font-style: italic;
}

.recent-transactions ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  overflow-y: auto;
}

.recent-transactions li {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid var(--border-color);
  transition: transform 0.15s;
  box-sizing: border-box;
  width: 100%;
}

.recent-transactions li:hover {
  transform: translateX(3px);
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding-left: 5px;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  max-width: 65%;
  margin-right: 0.5rem;
}

.transaction-category {
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.edit-icon {
  font-size: 0.75rem;
  margin-left: 0.3rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.transaction-category:hover .edit-icon {
  opacity: 0.7;
}

.transaction-date {
  font-size: 0.8rem;
  color: var(--text-gray);
}

.transaction-amount {
  font-weight: 600;
  margin-left: 0.25rem;
  white-space: nowrap;
  text-align: right;
  min-width: 80px;
}

li.income .transaction-amount {
  color: var(--income-color);
}

li.expense .transaction-amount {
  color: var(--expense-color);
}

.view-all-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: var(--primary-dark);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  background-color: var(--light-gray);
}

.view-all-link:hover {
  background-color: var(--primary-color);
  color: var(--text-dark);
  transform: translateY(-2px);
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  min-width: 0;
  margin-left: 16px;
  padding-left: 4px;
  box-sizing: border-box;
}

.messages-container {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}

.welcome-message {
  background-color: var(--light-gray);
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.welcome-message h2 {
  margin-bottom: 0.5rem;
  color: var(--primary-dark);
}

.examples {
  margin-top: 1rem;
}

.examples h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.examples ul {
  padding-left: 1.5rem;
}

.examples li {
  margin-bottom: 0.5rem;
  color: var(--text-gray);
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  width: auto;
}

.message.user {
  align-self: flex-end;
  max-width: 75%;
}

.message.assistant {
  align-self: flex-start;
  max-width: 75%;
}

.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
  word-break: break-word;
}

.message.user .message-bubble {
  background-color: var(--primary-color);
  color: var(--text-dark);
  border-bottom-right-radius: 0;
}

.message.assistant .message-bubble {
  background-color: var(--light-gray);
  color: var(--text-dark);
  border-bottom-left-radius: 0;
}

.message-time {
  font-size: 0.7rem;
  color: var(--text-gray);
  margin-top: 0.25rem;
  align-self: flex-end;
}

.message.user .message-time {
  align-self: flex-end;
}

.message.assistant .message-time {
  align-self: flex-start;
}

.input-container {
  display: flex;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: var(--primary-color);
}

button {
  background-color: var(--primary-color);
  color: var(--text-dark);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  margin-left: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

button:hover {
  background-color: var(--primary-dark);
}

button:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/* Loading indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  column-gap: 0.3rem;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  background-color: var(--text-gray);
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

/* Responsive styles */
/* Medium screens */
@media (max-width: 992px) {
  .sidebar {
    width: 32%;
    min-width: 220px;
    max-width: 280px;
  }
  
  .total-widget p {
    font-size: 0.95rem;
  }
  
  .total-widget h4 {
    font-size: 0.85rem;
  }
  
  .recent-transactions h3 {
    font-size: 1rem;
  }
  
  .transaction-category {
    font-size: 0.9rem;
  }
  
  .sidebar-toggle {
    right: -14px;
  }
  
  .chat-section {
    margin-left: 18px;
  }
}

/* Category Edit Dialog */
.category-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-edit-dialog {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #212529;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.dialog-content {
  padding: 1rem;
}

.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-option {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 0.9rem;
}

.category-option:hover {
  background-color: #e9ecef;
}

.category-option.selected {
  background-color: var(--primary-color);
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.transaction-category {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.edit-icon {
  font-size: 0.75rem;
  margin-left: 0.3rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.transaction-category:hover .edit-icon {
  opacity: 0.7;
}

/* Small screens */
@media (max-width: 768px) {
  .home-container {
    flex-direction: column-reverse;
    height: auto;
    min-height: calc(100vh - 120px);
  }
  
  .sidebar {
    width: 100%;
    max-width: 100%;
    position: relative;
    height: auto;
    border-right: none;
    border-top: 1px solid var(--border-color);
  }
  
  .sidebar.collapsed {
    height: 30px;
    overflow: hidden;
    width: 100%;
  }
  
  .sidebar-toggle {
    top: 15px;
    right: 15px;
    transform: rotate(90deg);
  }
  
  .sidebar.collapsed .sidebar-toggle {
    transform: rotate(-90deg);
  }
  
  .chat-section {
    min-height: 60vh;
    margin-left: 0;
    padding-left: 0;
  }
  
  .totals-section {
    gap: 0.75rem;
  }
  
  .recent-transactions {
    max-height: none;
  }
  
  .sidebar-content {
    padding: 1rem 1.25rem;
  }
  
  /* Ensure edit icon is more visible on touch devices */
  .edit-icon {
    opacity: 0.5;
    font-size: 0.8rem;
  }
  
  /* Add more padding for better touch targets */
  .transaction-category {
    padding: 4px 0;
  }
  
  .recent-transactions li {
    padding: 0.85rem 0.35rem;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .totals-section {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .total-widget {
    width: 100%;
    padding: 0.75rem;
  }
  
  .message {
    max-width: 90%;
  }
  
  .message.user, .message.assistant {
    max-width: 85%;
  }
  
  /* Mobile-specific category edit dialog improvements */
  .category-edit-dialog {
    width: 95%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .dialog-header h3 {
    font-size: 1.1rem;
  }
  
  .dialog-content {
    padding: 0.75rem;
    max-height: 50vh;
    overflow-y: auto;
  }
  
  .category-options {
    gap: 0.35rem;
  }
  
  .category-option {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
    flex-basis: calc(50% - 0.35rem);
    text-align: center;
  }
  
  .close-btn, .cancel-btn {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Optimize chat input for mobile */
  .input-container {
    padding: 0.75rem;
  }
  
  input {
    padding: 0.8rem;
    font-size: 16px; /* Prevent iOS zoom on focus */
  }
  
  button {
    min-width: 70px;
    padding: 0.8rem 1rem;
  }
  
  /* Improve welcome message for mobile */
  .welcome-message {
    padding: 1.2rem;
  }
  
  .welcome-message h2 {
    font-size: 1.3rem;
  }
  
  .examples ul {
    padding-left: 1.2rem;
  }
  
  .examples li {
    margin-bottom: 0.7rem;
    font-size: 0.9rem;
  }
}

/* Category Edit Dialog */
.category-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-edit-dialog {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #212529;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.dialog-content {
  padding: 1rem;
}

.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-option {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 0.9rem;
}

.category-option:hover {
  background-color: #e9ecef;
}

.category-option.selected {
  background-color: var(--primary-color);
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}
</style>