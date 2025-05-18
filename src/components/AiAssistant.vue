<template>
  <div class="ai-assistant" :class="{ 'expanded': isExpanded }">
    <!-- Chat toggle button -->
    <button class="toggle-button" @click="toggleChat" :title="isExpanded ? 'Tutup Asisten' : 'Buka Asisten AI'">
      <span v-if="!isExpanded" class="icon">🤖</span>
      <span v-else class="icon">✕</span>
    </button>
    
    <!-- Chat container -->
    <div class="chat-container" v-show="isExpanded">
      <!-- Chat header -->
      <div class="chat-header">
        <div class="assistant-info">
          <div class="assistant-avatar">🤖</div>
          <div class="assistant-name">Asisten Digbizz</div>
        </div>
        <div class="chat-actions">
          <button class="action-button" @click="clearChat" title="Hapus Riwayat Chat">🗑️</button>
        </div>
      </div>
      
      <!-- Chat messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <p>Halo! Saya <strong>Asisten Digbizz</strong> siap membantu UMKM Anda. Saya dapat menganalisis data keuangan Anda dan memberikan rekomendasi yang relevan.
             Silakan bertanya tentang:</p>
          <ul>
            <li>Analisis transaksi & arus kas Anda</li>
            <li>Tips optimasi keuangan berdasarkan data</li>
            <li>Rekomendasi bisnis sesuai pola transaksi</li>
            <li>Trend keuangan & prediksi bisnis</li>
          </ul>
        </div>
        
        <div v-for="(message, index) in messages" :key="index" class="message" :class="message.sender">
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="isLoading" class="message assistant loading">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Chat input -->
      <div class="chat-input">
        <input 
          type="text" 
          v-model="inputText" 
          @keyup.enter="sendMessage"
          placeholder="Tanyakan sesuatu..."
          :disabled="isLoading"
        />
        <button class="send-button" @click="sendMessage" :disabled="!inputText || isLoading">
          <span class="send-icon">➤</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useStore } from 'vuex';

export default {
  name: 'AiAssistant',
  setup() {
    // Store for financial data
    const store = useStore();
    
    // UI state
    const isExpanded = ref(false);
    const inputText = ref('');
    const messages = ref([]);
    const isLoading = ref(false);
    const messagesContainer = ref(null);
    
    // Financial data from store
    const transactions = computed(() => store.getters.sortedTransactions);
    const totalIncome = computed(() => store.getters.totalIncome);
    const totalExpenses = computed(() => store.getters.totalExpenses);
    const categoryTotals = computed(() => store.getters.categoryTotals);
    
    // Toggle chat visibility
    const toggleChat = () => {
      isExpanded.value = !isExpanded.value;
      if (isExpanded.value) {
        nextTick(scrollToBottom);
      }
    };
    
    // Clear chat history
    const clearChat = async () => {
      if (confirm('Apakah Anda yakin ingin menghapus semua riwayat chat?')) {
        // Get user ID for storage key
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const userId = user.id;
        const storageKey = userId ? `aiAssistantChat_${userId}` : 'aiAssistantChat';
        
        // Clear messages in UI
        messages.value = [];
        
        // Clear messages in user-specific localStorage
        localStorage.setItem(storageKey, JSON.stringify([]));
        
        // Clear messages on server
        try {
          await store.dispatch('clearMessages');
          console.log('Chat history cleared from server');
        } catch (error) {
          console.error('Error clearing chat history from server:', error);
        }
      }
    };
    
    // Format timestamp
    const formatTime = (timestamp) => {
      return format(new Date(timestamp), 'HH:mm', { locale: id });
    };
    
    // Helper function to format currency
    const formatRupiah = (amount) => {
      return 'Rp' + Math.abs(amount).toLocaleString('id-ID');
    };
    
    // Main function to generate AI response based on user query
    const generateAIResponse = (userQuery, financialData) => {
      const query = userQuery.toLowerCase();
      
      // Basic greeting responses
      if (query === 'hello' || query === 'hi' || query === 'halo' || query === 'hai') {
        return "Halo! Saya Asisten Digbizz yang siap membantu Anda dengan informasi keuangan UMKM. Ada yang bisa saya bantu hari ini?";
      }
      
      if (query.includes('terima kasih') || query === 'thanks' || query === 'makasih') {
        return "Sama-sama! Senang bisa membantu Anda. Jangan ragu untuk bertanya lagi jika ada hal lain yang ingin Anda ketahui.";
      }
      
      if (query.includes('siapa kamu') || query.includes('siapa namamu')) {
        return "Saya adalah Asisten Digbizz, asisten AI yang dirancang untuk membantu UMKM dengan analisis keuangan, tips bisnis, dan saran finansial. Saya dapat mengakses data keuangan bisnis Anda dan memberikan wawasan yang bermanfaat.";
      }
      
      // Financial data responses
      if (query.includes('saldo') || query.includes('balance') || query.includes('uang') || 
          (query.includes('total') && query.includes('keuangan'))) {
        return `Saldo Anda saat ini adalah ${formatRupiah(financialData.income - financialData.expenses)}.\n\nTotal Pemasukan: ${formatRupiah(financialData.income)}\nTotal Pengeluaran: ${formatRupiah(financialData.expenses)}\n\nRasio pengeluaran terhadap pemasukan: ${financialData.income > 0 ? Math.round((financialData.expenses / financialData.income) * 100) : 0}%\n\nRekomendasi pengelolaan saldo:\n1. Sisihkan minimal 10-15% dari pemasukan untuk dana darurat\n2. Investasikan 20-30% untuk pengembangan bisnis\n3. Pastikan cash flow tetap positif dengan memonitor rasio pendapatan-pengeluaran`;
      }
      
      if (query.includes('transaksi') || query.includes('terbaru') || query.includes('terakhir')) {
        const trx = financialData.transactions[0];
        if (trx) {
          return `Transaksi terakhir Anda: ${trx.text} (${trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} sebesar ${formatRupiah(trx.amount)})\n\nRiwayat transaksi memberikan wawasan tentang pola pengeluaran dan pendapatan Anda. Dengan menganalisis data ini, Anda dapat mengidentifikasi tren, peluang penghematan, dan potensi pengembangan bisnis.\n\nRekomendasi penggunaan data transaksi:\n1. Lakukan analisis tren bulanan\n2. Identifikasi pengeluaran berulang yang dapat dioptimalkan\n3. Lacak sumber pendapatan utama untuk memprioritaskan fokus bisnis`;
        }
      }
      
      if (query.includes('kategori') || query.includes('pengeluaran terbesar')) {
        const topCategories = Object.entries(financialData.categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        
        if (topCategories.length > 0) {
          return `Kategori pengeluaran terbesar Anda:\n${topCategories
            .map(([category, amount], index) => `${index + 1}. ${category}: ${formatRupiah(amount)}`)
            .join('\n')}\n\nStrategi optimasi pengeluaran per kategori:\n1. Lakukan audit mendalam untuk kategori dengan pengeluaran tertinggi\n2. Negosiasikan dengan vendor/supplier untuk mendapatkan harga lebih baik\n3. Cari alternatif yang lebih efisien dalam biaya tanpa mengorbankan kualitas\n4. Implementasikan sistem kontrol budget per kategori`;
        }
      }
      
      // Financial analysis and efficiency
      if (query.includes('analisis') || query.includes('analisa') || query.includes('laporan')) {
        return `Berdasarkan ${financialData.transactions.length} transaksi yang ada:\n\n1. Total Pemasukan: ${formatRupiah(financialData.income)}\n2. Total Pengeluaran: ${formatRupiah(financialData.expenses)}\n3. Saldo: ${formatRupiah(financialData.income - financialData.expenses)}\n\nRasio pengeluaran terhadap pemasukan: ${financialData.income > 0 ? Math.round((financialData.expenses / financialData.income) * 100) : 0}%`;
      }
      
      if (query.includes('efisiensi') || query.includes('menghemat') || query.includes('hemat') || 
          query.includes('kurangi pengeluaran') || query.includes('mengurangi biaya') || 
          query.includes('bahan baku') || query.includes('efektif')) {
        
        return `Berikut beberapa strategi untuk efisiensi pengeluaran bahan baku UMKM Anda:

1. Inventarisasi yang Terukur
   - Pantau stok bahan baku dengan sistem pencatatan yang rapi
   - Beli bahan baku sesuai kebutuhan produksi (just-in-time)
   - Hindari pembelian berlebih yang berisiko kadaluarsa

2. Negosiasi dengan Pemasok
   - Bandingkan harga dari beberapa pemasok
   - Minta diskon untuk pembelian dalam jumlah besar
   - Jalin kemitraan jangka panjang dengan pemasok terpercaya

3. Minimalisasi Limbah Produksi
   - Optimalkan penggunaan bahan baku untuk mengurangi sisa
   - Tingkatkan keterampilan karyawan dalam pengolahan bahan
   - Manfaatkan sisa produksi untuk produk sampingan jika memungkinkan

4. Perbaiki Proses Produksi
   - Evaluasi alur kerja untuk mengurangi inefisiensi
   - Pertimbangkan investasi pada teknologi/peralatan yang lebih efisien
   - Lakukan pelatihan karyawan tentang penggunaan bahan yang optimal

Berdasarkan data keuangan Anda dengan saldo ${formatRupiah(financialData.income - financialData.expenses)}, efisiensi bahan baku dapat meningkatkan profitabilitas secara signifikan.`;
      }
      
      // Investment and business strategies
      if (query.includes('investasi') || query.includes('invest')) {
        return `Untuk investasi UMKM, ada beberapa opsi yang bisa dipertimbangkan:

1. Reinvestasi ke dalam bisnis:
   - Peningkatan kapasitas produksi
   - Perluasan lokasi bisnis
   - Teknologi dan otomatisasi
   - Pengembangan produk baru

2. Investasi eksternal:
   - Deposito sebagai dana darurat (3-6 bulan pengeluaran operasional)
   - Reksadana dengan profil risiko sesuai dengan kebutuhan likuiditas bisnis
   - Properti untuk diversifikasi aset

Dengan saldo bisnis Anda saat ini ${formatRupiah(financialData.income - financialData.expenses)}, pertimbangkan untuk mengalokasikan 60% untuk reinvestasi ke bisnis, 30% untuk dana darurat, dan 10% untuk investasi jangka panjang.`;
      }
      
      if (query.includes('pemasaran') || query.includes('marketing') || query.includes('promosi')) {
        return `Untuk strategi pemasaran UMKM dengan budget terbatas, berikut beberapa pendekatan cost-effective:

1. Digital Marketing
   - Media sosial organik (Instagram, Facebook, TikTok)
   - Email marketing untuk pelanggan yang sudah ada
   - Konten marketing berbasis nilai (blog, video tutorial)
   - Google My Business untuk optimasi pencarian lokal

2. Pemasaran Komunitas
   - Program referral untuk pelanggan yang sudah ada
   - Kolaborasi dengan bisnis komplementer
   - Partisipasi dalam event komunitas lokal
   - Testimonial dan ulasan pelanggan

3. Mengukur Efektivitas
   - Tetapkan budget marketing maksimal 15-20% dari pendapatan
   - Hitung Customer Acquisition Cost (CAC)
   - Ukur Return on Ad Spend (ROAS)

Berdasarkan data Anda dengan pendapatan ${formatRupiah(financialData.income)}, estimasi budget pemasaran yang sehat adalah sekitar ${formatRupiah(financialData.income * 0.15)}-${formatRupiah(financialData.income * 0.2)}.`;
      }
      
      // Financial concepts and tools
      if (query.includes('npv') || query.includes('net present value')) {
        return `Net Present Value (NPV) adalah metode untuk menghitung nilai sekarang dari arus kas masa depan dikurangi investasi awal.

Formula: NPV = -I₀ + (CF₁/(1+r)¹) + (CF₂/(1+r)²) + ... + (CFₙ/(1+r)ⁿ)

Dimana:
- I₀ = Investasi awal
- CF = Arus kas per periode
- r = Tingkat diskonto (biaya modal)
- n = Jumlah periode

Aturan keputusan NPV:
- NPV > 0: Proyek layak dijalankan
- NPV < 0: Proyek sebaiknya ditolak
- NPV = 0: Netral, perlu pertimbangan lain

Untuk menghitung NPV bisnis Anda, Anda perlu membuat proyeksi arus kas detail yang saat ini belum tersedia dalam sistem.`;
      }
      
      // Financial updates and reporting
      if (query.includes('update') || query.includes('laporan') || query.includes('kondisi') || 
          query.includes('finansial') || query.includes('finasial') || query.includes('keuangan')) {
        return `Berikut update kondisi keuangan bisnis Anda:

Ringkasan Keuangan:
• Total Saldo: ${formatRupiah(financialData.income - financialData.expenses)}
• Total Pemasukan: ${formatRupiah(financialData.income)}
• Total Pengeluaran: ${formatRupiah(financialData.expenses)}
• Jumlah Transaksi: ${financialData.transactions.length}

Kinerja Keuangan:
• Rasio Pengeluaran/Pemasukan: ${financialData.income > 0 ? Math.round((financialData.expenses / financialData.income) * 100) : 0}%
• Cash Flow: ${financialData.income > financialData.expenses ? "Positif" : "Negatif"}

${financialData.transactions.length > 0 ? `Transaksi Terakhir: ${financialData.transactions[0].text} (${financialData.transactions[0].type === 'income' ? 'Pemasukan' : 'Pengeluaran'} sebesar ${formatRupiah(financialData.transactions[0].amount)})` : ""}

Rekomendasi:
• ${financialData.income > financialData.expenses ? "Pertahankan" : "Tingkatkan"} manajemen arus kas
• Evaluasi kategori pengeluaran terbesar untuk efisiensi
• Pantau tren pendapatan dan pengeluaran secara berkala`;
      }
      
      // Default response for unrecognized queries
      return `Terima kasih atas pertanyaan Anda tentang "${userQuery}".

Berdasarkan data keuangan Anda dengan total transaksi ${financialData.transactions.length} dan saldo ${formatRupiah(financialData.income - financialData.expenses)}, saya merekomendasikan untuk:

1. Memantau arus kas secara rutin
2. Menganalisis kategori pengeluaran untuk efisiensi
3. Merencanakan reinvestasi untuk pengembangan bisnis

Apakah ada informasi spesifik lain yang ingin Anda ketahui tentang keuangan atau strategi bisnis UMKM Anda?`;
    };
    
    // Send message function
    const sendMessage = async () => {
      if (!inputText.value.trim() || isLoading.value) return;
      
      // Create financial data object
      const financialData = {
        transactions: transactions.value,
        income: totalIncome.value,
        expenses: totalExpenses.value,
        categories: categoryTotals.value
      };
      
      // Add user message to chat
      const userMessage = {
        sender: 'user',
        text: inputText.value,
        timestamp: new Date()
      };
      
      // Clear input and set loading state
      messages.value.push(userMessage);
      inputText.value = '';
      isLoading.value = true;
      
      // Scroll to bottom after sending
      nextTick(scrollToBottom);
      
      try {
        // Save user message to server
        try {
          // Get user ID to ensure proper message association
          const user = JSON.parse(localStorage.getItem('user')) || {};
          const userId = user.id;
          
          // Add user ID to message for proper association
          if (userId) {
            userMessage.userId = userId;
          }
          
          // Use try-catch with retries
          let retries = 3;
          let success = false;
          
          while (retries > 0 && !success) {
            try {
              await store.dispatch('createMessage', userMessage);
              success = true;
            } catch (err) {
              retries--;
              // Only log after final retry
              if (retries === 0) {
                console.error('Error saving user message to server (all retries failed):', err);
              } else {
                console.warn(`Error saving message, retrying... (${retries} left)`);
                // Wait a bit before retrying
                await new Promise(r => setTimeout(r, 500));
              }
            }
          }
          
          // Save to localStorage regardless of server success
          const storageKey = userId ? `aiAssistantChat_${userId}` : 'aiAssistantChat';
          localStorage.setItem(storageKey, JSON.stringify(messages.value));
        } catch (saveError) {
          console.error('Error saving user message:', saveError);
        }
        
        // Simulate thinking delay (500-1500ms)
        const thinkingTime = Math.floor(Math.random() * 1000) + 500;
        await new Promise(resolve => setTimeout(resolve, thinkingTime));
        
        // Generate AI response using our local function
        const aiResponse = generateAIResponse(userMessage.text, financialData);
        
        // Create the assistant message
        const assistantMessage = {
          sender: 'assistant',
          text: aiResponse,
          timestamp: new Date()
        };
        
        // Add AI response to chat
        messages.value.push(assistantMessage);
        
        // Save assistant message to server
        try {
          // Get user ID to ensure proper message association
          const user = JSON.parse(localStorage.getItem('user')) || {};
          const userId = user.id;
          
          // Add user ID to message for proper association
          if (userId) {
            assistantMessage.userId = userId;
          }
          
          // Use try-catch with retries
          let retries = 3;
          let success = false;
          
          while (retries > 0 && !success) {
            try {
              await store.dispatch('createMessage', assistantMessage);
              success = true;
            } catch (err) {
              retries--;
              // Only log after final retry
              if (retries === 0) {
                console.error('Error saving assistant message to server (all retries failed):', err);
              } else {
                console.warn(`Error saving message, retrying... (${retries} left)`);
                // Wait a bit before retrying
                await new Promise(r => setTimeout(r, 500));
              }
            }
          }
          
          // Even if server save fails, continue with the conversation
        } catch (saveError) {
          console.error('Error saving assistant message:', saveError);
        }
        
        // Also save to user-specific localStorage as backup
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const userId = user.id;
        const storageKey = userId ? `aiAssistantChat_${userId}` : 'aiAssistantChat';
        localStorage.setItem(storageKey, JSON.stringify(messages.value));
      } catch (error) {
        console.error('Error generating response:', error);
        
        // Ultra simple fallback
        const fallbackMessage = {
          sender: 'assistant',
          text: `Saldo Anda saat ini adalah ${formatRupiah(totalIncome.value - totalExpenses.value)}. Total transaksi: ${transactions.value.length}. Ada yang bisa saya bantu lainnya?`,
          timestamp: new Date()
        };
        
        messages.value.push(fallbackMessage);
        
        // Try to save fallback message to server
        try {
          await store.dispatch('createMessage', fallbackMessage);
        } catch (saveError) {
          console.error('Error saving fallback message to server:', saveError);
        }
        
        // Save to user-specific localStorage as backup
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const userId = user.id;
        const storageKey = userId ? `aiAssistantChat_${userId}` : 'aiAssistantChat';
        localStorage.setItem(storageKey, JSON.stringify(messages.value));
      } finally {
        // Always set loading to false and scroll to bottom
        isLoading.value = false;
        nextTick(scrollToBottom);
      }
    };
    
    // Scroll to bottom of messages
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // Load saved chat history from server on component mount
    onMounted(async () => {
      // Get current user ID for proper message association
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const userId = user.id;
      
      // Use a user-specific key for localStorage
      const storageKey = userId ? `aiAssistantChat_${userId}` : 'aiAssistantChat';

      try {
        // First try to load from server (should be user-specific due to auth token)
        const response = await store.dispatch('fetchMessages');
        if (response && response.length > 0) {
          console.log('Loaded messages from server:', response.length);
          messages.value = response;
        } else {
          // If no messages on server, try localStorage as fallback
          const savedChat = localStorage.getItem(storageKey);
          if (savedChat) {
            try {
              const parsedChat = JSON.parse(savedChat);
              if (Array.isArray(parsedChat) && parsedChat.length > 0) {
                messages.value = parsedChat;
                
                // Only try to save to server if we have a user ID
                if (userId) {
                  try {
                    // Ensure each message has the current user ID
                    const messagesWithUserId = parsedChat.map(msg => ({
                      ...msg,
                      userId: userId
                    }));
                    
                    await store.dispatch('createBatchMessages', messagesWithUserId);
                    console.log('Saved localStorage messages to server');
                  } catch (err) {
                    console.error('Failed to save localStorage messages to server:', err);
                  }
                }
              }
            } catch (e) {
              console.error('Error loading chat history from localStorage:', e);
              localStorage.removeItem(storageKey);
            }
          }
        }
      } catch (error) {
        console.error('Error loading messages from server:', error);
        // Fall back to localStorage
        const savedChat = localStorage.getItem(storageKey);
        if (savedChat) {
          try {
            const parsedChat = JSON.parse(savedChat);
            if (Array.isArray(parsedChat)) {
              messages.value = parsedChat;
            }
          } catch (e) {
            console.error('Error loading chat history from localStorage:', e);
            localStorage.removeItem(storageKey);
          }
        }
      }
    });
    
    // Auto-scroll when new messages are added
    watch(() => messages.value.length, () => {
      nextTick(scrollToBottom);
    });
    
    return {
      isExpanded,
      inputText,
      messages,
      isLoading,
      messagesContainer,
      toggleChat,
      sendMessage,
      clearChat,
      formatTime
    };
  }
};
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 100%;
}

.toggle-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--primary-color);
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 1001;
}

.toggle-button:hover {
  transform: scale(1.05);
  background-color: var(--primary-dark);
}

.icon {
  font-size: 28px;
}

.chat-container {
  position: absolute;
  bottom: 75px;
  right: 0;
  width: 350px;
  max-width: 100vw;
  height: 500px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  background-color: var(--primary-color);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.assistant-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assistant-avatar {
  font-size: 24px;
}

.assistant-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.chat-actions {
  display: flex;
  gap: 10px;
}

.action-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f5f7f9;
}

.message {
  display: flex;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  justify-content: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
  white-space: pre-line;
}

.user .message-content {
  background-color: var(--primary-color);
  border-bottom-right-radius: 4px;
}

.assistant .message-content {
  background-color: white;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
}

.message-time {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 5px;
  text-align: right;
}

.welcome-message {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.4;
}

.welcome-message p {
  margin-bottom: 8px;
}

.welcome-message ul {
  padding-left: 20px;
  margin: 5px 0;
}

.welcome-message li {
  margin-bottom: 5px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  column-gap: 3px;
  padding: 5px 10px;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  background-color: #B0BEC5;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.1s ease infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.1s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.chat-input {
  display: flex;
  padding: 12px;
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e1e4e8;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input input:focus {
  border-color: var(--primary-color);
}

.send-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  border: none;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: var(--primary-dark);
}

.send-button:disabled {
  background-color: #e1e4e8;
  cursor: not-allowed;
}

.send-icon {
  font-size: 14px;
  margin-left: 2px;
  color: var(--text-dark);
}

/* Loading animation */
.message.loading .message-content {
  min-width: 60px;
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-container {
    width: calc(100vw - 40px);
    height: 450px;
    bottom: 70px;
  }
  
  .toggle-button {
    width: 55px;
    height: 55px;
  }
  
  .icon {
    font-size: 26px;
  }
  
  .message {
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .chat-container {
    width: calc(100vw - 30px);
    height: 400px;
    bottom: 65px;
    right: 0;
  }
  
  .toggle-button {
    width: 50px;
    height: 50px;
    right: 10px;
    bottom: 10px;
  }
  
  .icon {
    font-size: 24px;
  }
  
  .chat-header {
    padding: 12px;
  }
  
  .assistant-name {
    font-size: 15px;
  }
  
  .message-text {
    font-size: 13px;
  }
  
  .welcome-message {
    font-size: 13px;
  }
  
  .welcome-message li {
    margin-bottom: 3px;
  }
  
  .chat-input input {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .chat-container {
    width: calc(100vw - 20px);
    height: 380px;
    right: 0;
  }
  
  .toggle-button {
    width: 45px;
    height: 45px;
  }
  
  .icon {
    font-size: 20px;
  }
  
  .message-text {
    font-size: 12px;
  }
  
  .message {
    max-width: 95%;
  }
}
</style>