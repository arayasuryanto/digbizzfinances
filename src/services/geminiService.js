import axios from 'axios';
import { GEMINI_API_KEY, GEMINI_API_URL, SYSTEM_PROMPT } from '../config/api';

// For debugging
console.log('Gemini API URL:', GEMINI_API_URL);
// Don't log the full API key for security reasons
console.log('API Key available:', GEMINI_API_KEY ? 'Yes' : 'No');

/**
 * Service for interacting with Gemini API
 * NOTE: Currently configured to use local responses since API integration is pending
 */
const geminiService = {
  /**
   * Generate a response from Gemini API based on user's message and transaction data
   * 
   * @param {string} userMessage - The user's message
   * @param {Array} messages - Previous conversation history
   * @param {Object} financialData - User's financial data for context
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(userMessage, messages, financialData) {
    try {
      console.log('Sending request to Gemini API for message:', userMessage);
      
      // Format financial data as context
      const financialContext = `
INFORMASI DATA KEUANGAN PENGGUNA:
- Total Transaksi: ${financialData.transactions.length}
- Total Pemasukan: Rp${financialData.income.toLocaleString('id-ID')}
- Total Pengeluaran: Rp${financialData.expenses.toLocaleString('id-ID')}
- Saldo: Rp${(financialData.income - financialData.expenses).toLocaleString('id-ID')}
${financialData.transactions.length > 0 ? `- Transaksi Terakhir: ${financialData.transactions[0].text} (${financialData.transactions[0].type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp${financialData.transactions[0].amount.toLocaleString('id-ID')})` : ''}

KATEGORI TERATAS:
${Object.entries(financialData.categories)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([category, amount]) => `- ${category}: Rp${amount.toLocaleString('id-ID')}`)
  .join('\n')}
`;

      console.log('Financial context prepared:', financialContext.length, 'chars');
      
      // Format conversation history for context
      let conversationHistory = "";
      if (messages && messages.length > 0) {
        // Take only the last 3 messages for context
        const recentMessages = messages.slice(-3);
        conversationHistory = "RIWAYAT PERCAKAPAN TERBARU:\n" + 
          recentMessages.map(msg => 
            `${msg.sender === 'user' ? 'Pengguna' : 'Asisten'}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`
          ).join('\n');
      }

      // Construct a simplified request body that works with Gemini
      const requestBody = {
        contents: [
          {
            parts: [
              { 
                text: `${SYSTEM_PROMPT}\n\n${financialContext}\n\n${conversationHistory ? conversationHistory + "\n\n" : ""}Pertanyaan pengguna: ${userMessage}\n\nBerikan jawaban yang natural, informatif dan ramah. Gaya penulisan harus seperti percakapan dengan asisten keuangan yang ramah. Gunakan bahasa Indonesia yang baik dan formal tapi tidak kaku.` 
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      };

      console.log('Sending API request to:', `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 3)}...`);

      // Make the API request
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        requestBody
      );

      console.log('Received API response, status:', response.status);

      // Log the actual API response for debugging
      console.log('API response structure:', JSON.stringify(response.data).substring(0, 200) + '...');
      
      // Extract the generated text from the response
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content &&
          response.data.candidates[0].content.parts && 
          response.data.candidates[0].content.parts[0]) {
        console.log('Successfully extracted response text');
        return response.data.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected API response format:', JSON.stringify(response.data).substring(0, 200) + '...');
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error.message);
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data).substring(0, 500));
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received, request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Try with a simplified direct approach as fallback
      console.log('Primary API call failed, trying simplified approach...');
      return this.tryDirectApiRequest(userMessage, financialData);
    }
  },
  
  /**
   * Simplified response when API fails - doesn't throw error
   */
  generateSimpleResponse(userMessage, financialData) {
    console.log('Responding to user message:', userMessage);
    const query = userMessage.toLowerCase();
    const formatRupiah = (value) => {
      return 'Rp' + Math.abs(value).toLocaleString('id-ID');
    };
    
    // Basic conversational responses - prioritize these
    if (query.includes('halo') || query.includes('hi') || query.includes('hello') || 
        query.includes('hai') || query === 'hi' || query === 'hey') {
      return `Halo! Senang bertemu dengan Anda. Saya Asisten Digbizz, siap membantu dengan informasi keuangan dan bisnis UMKM Anda. Ada yang bisa saya bantu hari ini?`;
    }
    
    if (query.includes('apa kabar') || query.includes('bagaimana kabar') || query === 'kabar?') {
      return `Saya baik-baik saja dan siap membantu Anda! Bagaimana dengan Anda? Ada yang bisa saya bantu terkait keuangan bisnis Anda hari ini?`;
    }
    
    if (query.includes('terima kasih') || query.includes('makasih') || query === 'thanks' || query === 'thx') {
      return `Sama-sama! Senang bisa membantu Anda. Jangan ragu untuk bertanya lagi jika ada hal lain yang ingin Anda ketahui.`;
    }
    
    if (query.includes('siapa kamu') || query.includes('siapa namamu') || query === 'kamu siapa?') {
      return `Saya adalah Asisten Digbizz, asisten AI yang dirancang untuk membantu UMKM dengan analisis keuangan, tips bisnis, dan saran finansial. Saya dapat mengakses data keuangan bisnis Anda dan memberikan wawasan yang bermanfaat.`;
    }
    
    if (query.includes('apa yang bisa') || query.includes('fitur') || query.includes('kemampuan') || 
        query.includes('bantuan') || query.includes('bisa apa') || query.includes('what can you do')) {
      return `Saya dapat membantu Anda dengan berbagai hal terkait bisnis UMKM, antara lain:

1. Menganalisis data keuangan dan transaksi Anda
2. Memberikan laporan tentang pemasukan dan pengeluaran
3. Menyajikan kategori pengeluaran terbesar
4. Memberikan tips efisiensi operasional dan bisnis
5. Menjelaskan konsep keuangan dan bisnis
6. Merekomendasikan strategi berdasarkan data Anda

Silakan bertanya hal spesifik yang ingin Anda ketahui tentang bisnis Anda.`;
    }
    
    // Finance-specific responses
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
    
    // Business topics based on user question
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
    
    // Direct answers to common queries that didn't match specific patterns
    
    // For simple greetings, give simple answers
    if (query === 'hi' || query === 'hello' || query === 'halo' || query === 'hai') {
      return 'Halo! Saya Asisten Digbizz, asisten keuangan UMKM Anda. Ada yang bisa saya bantu hari ini?';
    }
    
    if (query === 'thank you' || query === 'thanks' || query === 'terima kasih' || query === 'makasih') {
      return 'Sama-sama! Ada yang bisa saya bantu lagi?';
    }
    
    // Topic-based responses
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
    
    // Handle various types of questions about business and finance
    
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
    
    // Business tips
    if (query.includes('tips') || query.includes('cara') || query.includes('bagaimana') || 
        query.includes('strategi') || query.includes('advice') || query.includes('saran')) {
      return `Berikut tips untuk pengembangan bisnis UMKM Anda:

1. Manajemen Keuangan
   - Pisahkan keuangan pribadi dan bisnis
   - Catat semua transaksi secara rapi dan tepat waktu
   - Alokasikan 10-15% pendapatan untuk dana darurat bisnis

2. Optimasi Operasional
   - Analisis proses bisnis untuk identifikasi inefisiensi
   - Otomatisasi tugas repetitif yang menghabiskan waktu
   - Investasi pada pelatihan karyawan untuk meningkatkan produktivitas

3. Strategi Pemasaran Efektif
   - Fokus pada saluran pemasaran dengan ROI terbaik
   - Bangun database pelanggan dan program loyalitas
   - Manfaatkan media sosial dan pemasaran konten untuk visibilitas brand

4. Perencanaan Pertumbuhan
   - Tetapkan target finansial dan operasional yang terukur
   - Evaluasi peluang ekspansi produk atau pasar
   - Jalin kemitraan strategis untuk memperluas jangkauan

Berdasarkan data keuangan Anda dengan saldo ${formatRupiah(financialData.income - financialData.expenses)}, fokus pada optimasi operasional bisa memberikan dampak positif signifikan.`;
    }
    
    // Trend analysis
    if (query.includes('tren') || query.includes('trend') || query.includes('analisis') || 
        query.includes('analisa') || query.includes('perkembangan')) {
      return `Analisis Tren Keuangan Bisnis Anda:

Posisi Keuangan Saat Ini:
• Saldo: ${formatRupiah(financialData.income - financialData.expenses)}
• Rasio Pendapatan-Pengeluaran: ${financialData.income > 0 ? Math.round((financialData.income / financialData.expenses) * 100) : 0}%

Aktivitas Transaksi:
• Total Transaksi: ${financialData.transactions.length}
• Volume Transaksi: ${financialData.transactions.length > 10 ? "Tinggi" : financialData.transactions.length > 5 ? "Sedang" : "Rendah"}

Kategori Utama:
${Object.entries(financialData.categories)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([category, amount], index) => `• ${category}: ${formatRupiah(amount)} (${Math.round((amount/financialData.expenses)*100)}% dari total pengeluaran)`)
  .join('\n')}

Untuk analisis tren yang lebih akurat, diperlukan data historis yang lebih lama. Namun, dari data yang tersedia, fokus pada kategori dengan pengeluaran tertinggi dapat memberikan peluang optimasi terbaik.`;
    }
    
    // For any other question, try to give a more helpful, specific answer
    return `Mengenai "${userMessage}":

Mohon maaf, saya belum bisa memberikan jawaban spesifik untuk pertanyaan tersebut. Sebagai Asisten Digbizz, saya dapat membantu Anda dengan:

• Informasi keuangan bisnis (saldo, pemasukan, pengeluaran)
• Laporan kategori pengeluaran
• Tips efisiensi bisnis dan manajemen keuangan
• Analisis transaksi dan tren keuangan

Silakan ajukan pertanyaan spesifik tentang kondisi keuangan atau pengelolaan UMKM Anda, dan saya akan mencoba memberikan jawaban yang relevan berdasarkan data yang tersedia.`;
  },
  
  /**
   * Generate specific responses tailored to user question content
   */
  getSpecificResponse(question, financialData) {
    const formatRupiah = (value) => {
      return 'Rp' + Math.abs(value).toLocaleString('id-ID');
    };
    
    question = question.toLowerCase();
    
    // Handle specific business topics
    if (question.includes('strategi') && question.includes('bisnis')) {
      return `Strategi bisnis yang efektif untuk UMKM perlu mempertimbangkan skala, sumber daya, dan posisi Anda di pasar. Beberapa pendekatan yang bisa dipertimbangkan:

1. Fokus pada niche market yang spesifik daripada bersaing langsung dengan pemain besar
2. Mengembangkan keunggulan kompetitif yang unik (pelayanan personal, kustomisasi, dll)
3. Membangun loyalitas pelanggan melalui program retensi
4. Optimalisasi operasional untuk memaksimalkan efisiensi dari sumber daya terbatas

Dengan saldo ${formatRupiah(financialData.income - financialData.expenses)}, Anda memiliki fondasi yang baik untuk menerapkan strategi pengembangan bertahap.`;
    }
    
    if (question.includes('umkm') && (question.includes('tantangan') || question.includes('masalah'))) {
      return `Tantangan umum yang dihadapi UMKM di Indonesia meliputi:

1. Akses permodalan dan pendanaan terbatas
2. Adopsi teknologi dan digitalisasi
3. Keterbatasan kapasitas SDM
4. Kompleksitas regulasi dan perizinan
5. Persaingan dengan bisnis besar dan e-commerce

Untuk mengatasi tantangan ini, penting untuk:
- Membangun sistem keuangan yang terkelola dengan baik
- Berinvestasi dalam pelatihan dan pengembangan tim
- Memanfaatkan teknologi tepat guna untuk efisiensi operasional
- Bergabung dengan asosiasi industri untuk networking dan peluang kemitraan`;
    }
    
    if (question.includes('pinjaman') || question.includes('kredit') || question.includes('modal')) {
      return `Untuk pinjaman modal UMKM, ada beberapa opsi yang bisa dipertimbangkan:

1. KUR (Kredit Usaha Rakyat) - pinjaman dengan bunga rendah (6-7%) dari bank yang ditunjuk pemerintah
2. Pinjaman UMKM dari bank komersial - persyaratan lebih ketat tapi plafon lebih tinggi
3. P2P Lending - pendanaan dari platform fintech dengan proses lebih cepat
4. Modal Ventura - untuk UMKM dengan potensi pertumbuhan tinggi
5. Hibah pemerintah - melalui program BPUM atau lainnya

Berdasarkan profil keuangan Anda dengan pendapatan ${formatRupiah(financialData.income)} dan pengeluaran ${formatRupiah(financialData.expenses)}, penting untuk memastikan rasio hutang terhadap pendapatan tidak melebihi 30% untuk menjaga kesehatan finansial bisnis.`;
    }
    
    if (question.includes('pajak') || question.includes('perpajakan')) {
      return `Untuk perpajakan UMKM di Indonesia, berikut informasi penting:

1. PP 23 Tahun 2018 - tarif PPh final 0,5% dari omzet bagi UMKM dengan peredaran bruto < Rp4,8 miliar/tahun
2. Wajib memiliki NPWP untuk usaha formal
3. Kewajiban pelaporan SPT Tahunan
4. Pencatatan atau pembukuan transaksi bisnis

Manfaat kepatuhan pajak:
- Akses ke program pemerintah dan kredit perbankan
- Menghindari denda dan sanksi
- Reputasi bisnis yang lebih baik

Untuk mengoptimalkan aspek perpajakan, pertimbangkan untuk:
- Memisahkan rekening pribadi dan bisnis
- Menyimpan bukti transaksi dengan rapi
- Berkonsultasi dengan konsultan pajak untuk strategi legal`;
    }
    
    if (question.includes('digitalisasi') || question.includes('digital') || question.includes('teknologi')) {
      return `Digitalisasi UMKM adalah langkah penting untuk meningkatkan daya saing. Beberapa aspek yang bisa didigitalisasi:

1. Sistem Keuangan dan Pembukuan
   - Aplikasi akuntansi untuk UMKM
   - Integrasi dengan perbankan digital
   - Pelaporan keuangan otomatis

2. Pemasaran dan Penjualan
   - Media sosial dan marketplace
   - Website atau aplikasi bisnis
   - CRM untuk pengelolaan pelanggan

3. Operasional
   - Sistem inventori dan supply chain
   - Otomatisasi proses administratif
   - Kolaborasi tim dengan cloud-based tools

Investasi awal untuk digitalisasi dasar bisa dimulai dari Rp2-5 juta, dengan potensi ROI berupa efisiensi waktu, pengurangan kesalahan, dan peningkatan kapasitas layanan pelanggan.`;
    }
    
    // For questions not specifically handled, give a general relevant business response
    const generalResponses = [
      `Untuk pengembangan UMKM, penting untuk menyeimbangkan antara pertumbuhan dan profitabilitas. Saat ini dengan saldo ${formatRupiah(financialData.income - financialData.expenses)}, Anda memiliki landasan yang baik untuk ekspansi terukur sambil mempertahankan stabilitas keuangan.`,
      
      `Dalam manajemen keuangan UMKM, prinsip dasar meliputi pemisahan keuangan pribadi dan bisnis, pengelolaan cash flow, pengalokasian dana untuk reinvestasi, dan pembentukan dana darurat. Analisis data transaksi Anda menunjukkan adanya peluang untuk optimalisasi di beberapa area pengeluaran.`,
      
      `Untuk meningkatkan profitabilitas, fokus pada dual approach: meningkatkan pendapatan (up-selling, cross-selling, akuisisi pelanggan baru) dan efisiensi biaya (optimalisasi operasional, negosiasi dengan supplier, otomatisasi). Berdasarkan data keuangan Anda, ada potensi untuk meningkatkan margin dengan 15-20%.`,
      
      `Bisnis yang berkelanjutan memerlukan keseimbangan antara pertumbuhan jangka pendek dan investasi jangka panjang. Dengan total transaksi ${financialData.transactions.length} dan saldo saat ini, pertimbangkan untuk mengalokasikan sebagian dana untuk pengembangan kapasitas produksi atau layanan.`
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  },

  /**
   * Direct API request to Gemini using simplified payload structure
   * This is a fallback method when the primary implementation fails
   * 
   * @param {string} userMessage - The user's message
   * @param {Object} financialData - User's financial data
   * @returns {Promise<string>} - The AI response or fallback message
   */
  async tryDirectApiRequest(userMessage, financialData) {
    try {
      console.log('Attempting direct API request with simplified payload');
      
      // Create a much simpler request payload - minimal version
      const directRequestBody = {
        contents: [
          {
            parts: [
              {
                text: `Kamu adalah Asisten Digbizz, asisten keuangan untuk UMKM. Jawab pertanyaan berikut dengan natural dan informatif dalam Bahasa Indonesia. Tidak perlu terlalu formal.

Data keuangan pengguna:
- Total Transaksi: ${financialData.transactions.length}
- Total Pemasukan: Rp${financialData.income.toLocaleString('id-ID')}
- Total Pengeluaran: Rp${financialData.expenses.toLocaleString('id-ID')}
- Saldo: Rp${(financialData.income - financialData.expenses).toLocaleString('id-ID')}

Pertanyaan pengguna: ${userMessage}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 800,
        }
      };
      
      // Make direct API request
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        directRequestBody
      );
      
      console.log('Direct API request successful, status:', response.status);
      
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content &&
          response.data.candidates[0].content.parts && 
          response.data.candidates[0].content.parts[0]) {
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error('Direct API request also failed:', error.message);
      // If direct API request also fails, we'll fall through to the simple response
    }
    
    // If we reach here, both API attempts failed, use the fully local fallback
    return this.generateSimpleResponse(userMessage, financialData);
  }
};

// Export the service
export default geminiService;

// The original Gemini service is exported above
// We'll create a new service for Together AI below