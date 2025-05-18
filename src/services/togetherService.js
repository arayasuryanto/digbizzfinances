import axios from 'axios';

// Together AI API Configuration
const TOGETHER_API_KEY = 'a3214ceb1e321f20dd6e282228927a0c8bda0e9199ad71eecabe7259aa5e8516';
const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
// Use the free Llama 3.3 70B model that's available for everyone
const TOGETHER_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';

// For debugging
console.log('Together AI service initialized');

/**
 * Service for interacting with Together AI's Llama model
 */
const togetherService = {
  /**
   * Generate a response based on user's message and transaction data
   * 
   * @param {string} userMessage - The user's message
   * @param {Array} messages - Previous conversation history
   * @param {Object} financialData - User's financial data for context
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(userMessage, messages, financialData) {
    try {
      console.log('Sending request to Together AI for message:', userMessage);
      
      // Simplified financial context to reduce prompt size
      const financialContext = `
- Total Transaksi: ${financialData.transactions.length}
- Total Pemasukan: Rp${financialData.income.toLocaleString('id-ID')}
- Total Pengeluaran: Rp${financialData.expenses.toLocaleString('id-ID')}
- Saldo: Rp${(financialData.income - financialData.expenses).toLocaleString('id-ID')}
${financialData.transactions.length > 0 ? `- Transaksi Terakhir: ${financialData.transactions[0].text}` : ''}
`;
      
      // Use a more minimal and direct approach for messages
      // Single user message with system instructions embedded
      const combinedPrompt = `
Kamu adalah Asisten Digbizz, asisten keuangan untuk UMKM Indonesia.

DATA KEUANGAN USER:
${financialContext}

Jawab dengan Bahasa Indonesia yang natural dan ramah. Berikan detail spesifik berdasarkan data finansial. 
Jangan memberikan disclaimer yang panjang. Jawab dengan ringkas. Jangan gunakan template.

PESAN USER: ${userMessage}
`;
      
      // Create simplified request with just one message
      const requestBody = {
        model: TOGETHER_MODEL,
        messages: [
          {
            role: "user",
            content: combinedPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      };
      
      console.log('Sending API request to Together AI');
      
      // Make the API request
      const response = await axios.post(
        TOGETHER_API_URL,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${TOGETHER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Received Together AI response');
      
      // Extract the response text
      if (response.data && 
          response.data.choices && 
          response.data.choices[0] && 
          response.data.choices[0].message) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error calling Together AI:', error.message);
      
      // Fall back to simple responses
      return this.generateSimpleResponse(userMessage, financialData);
    }
  },
  
  /**
   * Fallback response generator when API fails
   */
  generateSimpleResponse(userMessage, financialData) {
    console.log('Using simple response generator for:', userMessage);
    const query = userMessage.toLowerCase();
    const formatRupiah = (value) => {
      return 'Rp' + Math.abs(value).toLocaleString('id-ID');
    };
    
    // Basic conversational responses
    if (query === 'hello' || query === 'hi' || query === 'halo' || query === 'hai') {
      return "Halo! Saya asisten Digbizz yang siap membantu Anda dengan informasi keuangan. Ada yang bisa saya bantu hari ini?";
    } 
    
    if (query.includes('terima kasih') || query === 'thanks' || query === 'makasih') {
      return "Sama-sama! Senang bisa membantu. Jangan ragu untuk bertanya lagi jika ada yang Anda butuhkan.";
    }
    
    if (query.includes('siapa kamu') || query.includes('siapa namamu')) {
      return "Saya adalah Asisten Digbizz, asisten AI yang dirancang untuk membantu UMKM dengan pertanyaan keuangan dan bisnis. Saya bisa memberi Anda informasi tentang saldo, transaksi, serta tips bisnis berdasarkan data keuangan Anda.";
    }
    
    // Financial update/reports
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
    
    // Generic response for other queries
    return `Mengenai "${userMessage}":

Mohon maaf, saya belum bisa memberikan jawaban spesifik untuk pertanyaan tersebut. Sebagai Asisten Digbizz, saya dapat membantu Anda dengan:

• Informasi keuangan bisnis (saldo, pemasukan, pengeluaran)
• Laporan kategori pengeluaran
• Tips efisiensi bisnis dan manajemen keuangan
• Analisis transaksi dan tren keuangan

Silakan ajukan pertanyaan spesifik tentang kondisi keuangan atau pengelolaan UMKM Anda.`;
  }
};

// Export the service
export default togetherService;