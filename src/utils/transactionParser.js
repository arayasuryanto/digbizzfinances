import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getCategoriesByBusinessType } from './businessCategories';

// Base business categories (used for NLP analysis)
export const CATEGORIES = {
  // Kategori income/pemasukan untuk UMKM
  INCOME: [
    'penjualan_produk', 
    'jasa_layanan', 
    'pendapatan_online', 
    'piutang_masuk', 
    'pendanaan_investasi', 
    'refund_pengembalian',
    'pendapatan_lain'
  ],
  // Kategori outcome/pengeluaran untuk UMKM
  EXPENSE: [
    'bahan_baku_stok', 
    'kemasan_packaging',
    'gaji_upah', 
    'sewa_operasional', 
    'transportasi_pengiriman', 
    'peralatan_inventaris', 
    'iklan_promosi', 
    'pembayaran_utang', 
    'biaya_platform',
    'pengeluaran_lain'
  ]
};

// Get current business type from localStorage
// Personal account expense categories
const PERSONAL_EXPENSE_CATEGORIES = {
  'makan_minum': {
    keywords: ['jajan', 'beli makan', 'makan siang', 'nongkrong', 'ngopi', 'beli nasi padang', 'makan malam', 'beli cemilan', 'makan bareng', 'beli makanan', 'jajan online', 'gofood', 'grabfood', 'pesen makan', 'delivery', 'beli snack', 'makan di luar', 'brunch', 'makan di kantor', 'sarapan', 'beli kopi', 'makan di cafe', 'lunch', 'dinner', 'kulineran', 'food court', 'makan di restoran', 'beli minuman', 'ice cream', 'beli gorengan', 'belanja makanan']
  },
  'transportasi': {
    keywords: ['naik gojek', 'grabcar', 'bayar bensin', 'ongkos kerja', 'ojek pangkalan', 'isi bensin', 'transport harian', 'bayar angkot', 'parkir motor', 'naik travel', 'biaya jalan', 'naik taksi', 'transport ke kampus', 'beli BBM', 'mobilan', 'tarif jalan', 'naik bus', 'perjalanan keluar', 'sewa motor', 'transport pribadi', 'antar jemput', 'pertamax', 'solar', 'servis motor', 'ganti oli', 'biaya toll', 'tiket kereta', 'ongkos pulang', 'naik pesawat', 'biaya parkir']
  },
  'belanja_harian': {
    keywords: ['beli sabun', 'beli shampoo', 'detergen', 'sabun cuci', 'belanja mingguan', 'kebutuhan rumah', 'beli tissue', 'belanja bulanan', 'isi ulang gas', 'beli perlengkapan mandi', 'ke supermarket', 'belanja warung', 'isi galon', 'beli makanan kucing', 'ke minimarket', 'belanja kebutuhan', 'isi ulang kebutuhan', 'kebutuhan pribadi', 'sabun habis', 'isi ulang rumah', 'beli beras', 'belanja di pasar', 'beli telur', 'keperluan rumah', 'belanja harian', 'keperluan dapur', 'belanja di warung', 'belanja di minimarket', 'belanja di indomaret', 'belanja di alfamart']
  },
  'pulsa_internet': {
    keywords: ['beli pulsa', 'isi paket data', 'bayar wifi', 'beli kuota', 'isi ulang pulsa', 'bayar internet', 'bayar indihome', 'bayar firstmedia', 'beli voucher', 'bayar tagihan hp', 'isi pulsa bulanan', 'bayar paket internet', 'tagihan wifi', 'kuota habis', 'bayar myrepublic', 'beli paket data', 'perpanjang langganan', 'tagihan telkom', 'beli token internet', 'isi ulang data', 'perpanjang wifi', 'paket data habis', 'ganti paket', 'isi paket telepon', 'biaya internet']
  },
  'cicilan': {
    keywords: ['bayar kredit', 'cicilan bulanan', 'bayar kpr', 'bayar pinjaman', 'angsuran', 'bayar kartu kredit', 'kredit motor', 'cicilan hp', 'utang bank', 'bayar cicilan', 'tagihan kredit', 'hutang bulanan', 'bayar leasing', 'bayar mortgage', 'angsuran mobil', 'bayar utang', 'installment', 'kredit macet', 'tagihan bank', 'cicilan rumah', 'bayar hutang', 'tagihan kartu', 'bayar biaya cicilan', 'kredit pendidikan', 'bayar angsuran']
  },
  'tabungan': {
    keywords: ['nabung', 'setor tabungan', 'transfer ke savings', 'menabung bulanan', 'deposit', 'simpan uang', 'transfer ke reksadana', 'beli emas', 'investasi saham', 'saving bulanan', 'alokasi tabungan', 'setor ke rekening', 'nabung buat liburan', 'nabung buat nikah', 'saving', 'dana darurat', 'dana pensiun', 'dana pendidikan', 'deposito', 'asuransi', 'premi asuransi', 'nabung emas', 'alokasi investasi', 'simpanan', 'menabung']
  },
  'hiburan': {
    keywords: ['nonton bioskop', 'beli game', 'main ke mall', 'tiket konser', 'karaoke', 'biaya rekreasi', 'liburan', 'tiket wisata', 'belanja baju', 'belanja online', 'shopee haul', 'bayar netflix', 'bayar spotify', 'beli buku', 'main game', 'bayar subscription', 'tiket event', 'nonton live', 'main ke tempat wisata', 'jalan-jalan', 'weekend', 'hang out', 'beli mainan', 'beli hobi', 'koleksi', 'bayar disney+', 'bayar VOD', 'biaya hobi', 'olahraga', 'gym']
  },
  'kesehatan': {
    keywords: ['beli obat', 'periksa dokter', 'ke rumah sakit', 'medical check up', 'beli vitamin', 'konsultasi dokter', 'biaya dokter gigi', 'beli obat batuk', 'beli obat flu', 'cek darah', 'apotek', 'klinik', 'biaya melahirkan', 'biaya operasi', 'beli masker', 'hand sanitizer', 'beli skincare', 'beli suplemen', 'rawat inap', 'check up', 'biaya kacamata', 'beli lensa kontak', 'biaya fisioterapi', 'beli alat kesehatan', 'perawatan medis', 'bayar bpjs', 'asuransi kesehatan', 'biaya imunisasi', 'terapi', 'konsultasi psikolog']
  },
  'donasi': {
    keywords: ['sumbangan', 'donasi', 'zakat', 'infaq', 'sedekah', 'charity', 'bantuan sosial', 'donasi bencana', 'sumbang yatim', 'infak jumat', 'donasi masjid', 'bantu tetangga', 'sumbang kemanusiaan', 'amal', 'bantuan pendidikan', 'donasi online', 'program sosial', 'santunan', 'bantuan fakir', 'donasi palestina', 'dana sosial', 'jariyah', 'wakaf', 'bantuan dhuafa', 'korban bencana', 'donasi rumah sakit', 'bantuan kesehatan', 'donasi panti', 'sumbangan kampung', 'bagi-bagi sembako']
  },
  'sewa_kontrakan': {
    keywords: ['bayar kos', 'bayar kontrakan', 'uang sewa', 'bayar apartemen', 'bayar mess', 'bayar rumah', 'uang deposit', 'sewa bulanan', 'perpanjang kontrak', 'uang muka sewa', 'bayar indekos', 'biaya tempat tinggal', 'bayar guest house', 'sewa kamar', 'bayar asrama', 'uang booking tempat', 'bayar homestay', 'kontrak rumah', 'bayar penginapan', 'bayar tempat', 'sewa tahunan', 'bayar kosan', 'biaya hunian', 'bayar rusunawa', 'sewa rumah', 'sewa apartment', 'perpanjang sewa', 'bayar ke pemilik', 'bayar kamar', 'jatuh tempo sewa']
  },
  'listrik_air': {
    keywords: ['bayar listrik', 'tagihan pln', 'bayar pdam', 'tagihan air', 'token listrik', 'beli token', 'bayar utilitas', 'tagihan bulanan', 'bayar gas', 'tagihan pam', 'meteran listrik', 'bayar tagihan rumah', 'tagihan pdam', 'bayar bill', 'pemakaian listrik', 'biaya utilitas', 'bayar air', 'bayar lingkungan', 'tagihan sampah', 'tagihan gas', 'bayar utilities', 'bayar ipl', 'bayar bpjs', 'biaya lingkungan', 'service charge', 'maintenance fee', 'listrik mati', 'bayar tagihan', 'biaya hidup', 'bayar rekening']
  }
};

import { loadBusinessInfo } from './storage';
import { isAuthenticated } from './syncUtils';

export function getCurrentBusinessType() {
  try {
    // Only try to load business info if user is authenticated
    if (isAuthenticated()) {
      const businessInfo = loadBusinessInfo();
      if (businessInfo) {
        return businessInfo.type || 'personal';
      }
    } else {
      // If not authenticated, check if there's any business info in localStorage directly
      // This is a fallback for when users haven't logged in yet
      const businessInfo = localStorage.getItem('finance-chat-business-info');
      if (businessInfo) {
        try {
          const parsed = JSON.parse(businessInfo);
          return parsed.type || 'personal';
        } catch (e) {
          console.error('Error parsing business info:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error getting business type:', error);
  }
  return 'personal';
}

// Get all business categories from localStorage
export function getBusinessCategories() {
  try {
    // Only try to load business info if user is authenticated
    if (isAuthenticated()) {
      const businessInfo = loadBusinessInfo();
      if (businessInfo) {
        return businessInfo.transactionCategories || {
          income: [],
          expense: []
        };
      }
    } else {
      // If not authenticated, check if there's any business info in localStorage directly
      // This is a fallback for when users haven't logged in yet
      const businessInfo = localStorage.getItem('finance-chat-business-info');
      if (businessInfo) {
        try {
          const parsed = JSON.parse(businessInfo);
          return parsed.transactionCategories || {
            income: [],
            expense: []
          };
        } catch (e) {
          console.error('Error parsing business info:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error getting business categories:', error);
  }
  return {
    income: [],
    expense: []
  };
}

// Subcategories for transactions
export const SUBCATEGORIES = {
  // Income subcategories untuk UMKM
  'penjualan_produk': ['retail', 'grosir', 'dropship', 'pre_order'],
  'jasa_layanan': ['service', 'konsultasi', 'custom_order', 'instalasi'],
  'pendapatan_online': ['marketplace', 'social_media', 'website', 'aplikasi'],
  'piutang_masuk': ['pelunasan', 'cicilan', 'dp'],
  'pendanaan_investasi': ['modal', 'pinjaman', 'investor', 'koperasi'],
  'refund_pengembalian': ['supplier', 'customer', 'platform'],
  
  // Expense subcategories untuk UMKM
  'bahan_baku_stok': ['material', 'inventory', 'packaging', 'supplies'],
  'gaji_upah': ['full_time', 'part_time', 'bonus', 'komisi'],
  'sewa_operasional': ['tempat', 'listrik', 'air', 'internet', 'maintenance'],
  'transportasi_pengiriman': ['ongkir', 'bensin', 'kurir', 'ekspedisi'],
  'peralatan_inventaris': ['mesin', 'elektronik', 'furniture', 'tools'],
  'iklan_promosi': ['online_ads', 'offline_ads', 'endorsement', 'sponsor'],
  'pembayaran_utang': ['pinjaman', 'supplier', 'cicilan', 'leasing'],
  'biaya_platform': ['komisi', 'subscription', 'layanan_premium']
};

// Terjemahan kategori (untuk UI)
export const CATEGORY_TRANSLATIONS = {
  // Pendapatan UMKM
  'penjualan_produk': 'Penjualan Produk',
  'jasa_layanan': 'Jasa/Layanan',
  'pendapatan_online': 'Pendapatan Online',
  'piutang_masuk': 'Piutang Masuk',
  'pendanaan_investasi': 'Pendanaan/Investasi Masuk',
  'refund_pengembalian': 'Refund/Pengembalian Dana',
  'pendapatan_lain': 'Pendapatan Lainnya',
  
  // Pengeluaran UMKM
  'bahan_baku_stok': 'Bahan Baku/Stok Barang',
  'gaji_upah': 'Gaji/Upah Karyawan',
  'sewa_operasional': 'Sewa/Operasional Toko',
  'transportasi_pengiriman': 'Transportasi/Pengiriman',
  'peralatan_inventaris': 'Peralatan/Inventaris',
  'iklan_promosi': 'Iklan/Promosi',
  'pembayaran_utang': 'Pembayaran Utang/Cicilan',
  'biaya_platform': 'Biaya Platform',
  'pengeluaran_lain': 'Pengeluaran Lainnya'
};

/**
 * Kategorisasi transaksi berdasarkan analisis teks
 * @param {string} text - Teks deskripsi transaksi
 * @returns {Object} Object berisi tipe dan kategori
 */
/**
 * Kategorisasi transaksi berdasarkan analisis teks untuk UMKM
 * @param {string} text - Teks deskripsi transaksi
 * @returns {Object} Object berisi tipe, kategori, dan sub-kategori
 */
export function categorizeTransaction(text) {
  // Default ke "pengeluaran lain"
  let category = 'pengeluaran_lain';
  let type = 'expense';
  let subCategories = [];
  
  // Get current business type
  const businessType = getCurrentBusinessType();
  
  const lowerText = text.toLowerCase();
  
  // Dictionary of UMKM category keywords and their associated subcategories
  const categoryKeywords = {
    // Income categories untuk UMKM
    'penjualan_produk': {
      keywords: ['jual', 'terjual', 'laku', 'penjualan', 'orderan', 'dapet uang', 'dagangan laku', 'hasil jualan', 'barang laku', 'produk', 'pembeli', 'toko', 'store', 'pcs', 'lusin', 'item', 'stok lama', 'display', 
        // Food business specific keywords
        'jual makanan', 'dagangan habis', 'jualan laku', 'orderan rame', 'jualan hari ini', 'makanan udah habis', 'pelanggan beli', 'ada pembeli datang', 'rame banget warungnya', 'dapet order 20 porsi', 'hasil jualan hari ini', 'masakan habis', 'pesanan habis', 'alhamdulillah rame', 'dagangan laris', 'jualan 1 juta hari ini', 'pembeli banyak', 'warung rame banget', 'dapet 10 orderan baru', 'makanan sold out',
        // Product business specific keywords
        'jual baju', 'dagangan laku', 'order masuk', 'pesanan dari WA', 'pembeli checkout', 'transfer dari pembeli', 'ada yang beli', 'laku satu set', 'pelanggan bayar', 'dapet orderan baru', 'pesanan dari Shopee', 'jualan rame', 'dagangan habis', 'barang udah dikirim', 'customer transfer', 'transaksi masuk', 'pesanan cair', 'kirim ke pembeli', 'dapet 3 pesanan hari ini', 'barang udah laku'
      ],
      subcategories: {
        'retail': ['eceran', 'retail', 'satuan', 'customer', 'pembeli langsung'],
        'grosir': ['grosir', 'reseller', 'wholesale', 'partai besar', 'partai', 'borongan'],
        'dropship': ['dropship', 'titip jual', 'direct shipping'],
        'pre_order': ['pre order', 'po', 'booking', 'pesan', 'pre-order']
      }
    },
    'jasa_layanan': {
      keywords: ['jasa', 'service', 'servis', 'layanan', 'konsultasi', 'install', 'desain', 'design', 'pelanggan bayar', 'ongkos', 'biaya jasa', 'upah kerja', 'proyek selesai', 'fee', 'charge', 'klien',
        // Service business specific keywords
        'jasa servis dapet bayaran', 'pelanggan bayar', 'order jasa masuk', 'fee dari pelanggan', 'hasil jasa', 'penghasilan hari ini', 'customer transfer', 'servis selesai dibayar', 'dapet uang servis', 'dapet kerjaan hari ini', 'penghasilan dari jasa', 'pelanggan selesaiin pembayaran', 'jasa cair', 'dapet orderan service', 'dapet fee jasa', 'order baru masuk', 'klien bayar', 'kerjaan servis lunas', 'dapet 150rb servis', 'dapet proyek kecil'
      ],
      subcategories: {
        'service': ['servis', 'service', 'perbaikan', 'reparasi', 'benerin', 'fixing'],
        'konsultasi': ['konsultasi', 'konsultan', 'consult', 'advise', 'saran'],
        'custom_order': ['custom', 'pesanan khusus', 'made by order', 'personalized', 'tailor'],
        'instalasi': ['pasang', 'install', 'instalasi', 'setup', 'setting']
      }
    },
    'pendapatan_online': {
      keywords: ['shopee', 'tokopedia', 'tokped', 'whatsapp', 'wa order', 'pesanan online', 'marketplace', 'checkout', 'transferan', 'gojek', 'gofood', 'grab', 'online', 'digital', 'internet', 'website', 'aplikasi', 'lazada', 'blibli', 'bukalapak',
        // Food business specific keywords for online orders
        'order masuk dari gofood', 'pesanan grabfood masuk', 'jualan di shopeefood', 'pelanggan dari platform', 'order dari aplikasi', 'dapet pesanan dari online', 'orderan masuk dari grab', 'customer order via app', 'dapet transferan dari shopeefood', 'pesanan online cair', 'pembeli dari marketplace', 'pesanan dari tokopedia', 'makanan dikirim via ojol', 'bayar dari gojekfood', 'penjualan via app masuk', 'hasil penjualan di marketplace', 'customer checkout online', 'dapet pesanan shopee', 'ada pembeli online', 'jualan online rame'
      ],
      subcategories: {
        'marketplace': ['shopee', 'tokopedia', 'tokped', 'lazada', 'blibli', 'bukalapak', 'zalora', 'jd.id'],
        'social_media': ['instagram', 'facebook', 'ig', 'fb', 'tiktok', 'whatsapp', 'wa', 'dm', 'direct message'],
        'website': ['website', 'web', 'toko online', 'ecommerce', 'landing page', 'online store'],
        'aplikasi': ['aplikasi', 'app', 'gojek', 'grabfood', 'shopeefood', 'mobile app']
      }
    },
    'piutang_masuk': {
      keywords: ['bayar utang', 'bayar hutang', 'utang dilunasi', 'hutang dilunasi', 'customer lunas', 'pelunasan', 'bayar tempo', 'cicilan masuk', 'pembayaran cicilan', 'dp', 'uang muka', 'bon', 'nyicil', 'faktur', 'invoice', 'tagihan'],
      subcategories: {
        'pelunasan': ['lunas', 'pelunasan', 'bayar penuh', 'full payment', 'melunasi'],
        'cicilan': ['cicil', 'nyicil', 'angsuran', 'installment', 'pembayaran sebagian', 'partial'],
        'dp': ['dp', 'uang muka', 'down payment', 'booking fee', 'tanda jadi']
      }
    },
    'pendanaan_investasi': {
      keywords: ['dikasih modal', 'pinjaman', 'suntikan dana', 'investor', 'tambahan modal', 'dana usaha', 'capital', 'funding', 'hibah', 'grant', 'subsidi', 'penyertaan modal'],
      subcategories: {
        'modal': ['modal', 'capital', 'dana usaha', 'bisnis funding'],
        'pinjaman': ['pinjaman', 'loan', 'kridit', 'kredit', 'kta', 'pinjol'],
        'investor': ['investor', 'angel investor', 'venture capital', 'vc', 'saham', 'equity'],
        'koperasi': ['koperasi', 'arisan', 'simpan pinjam', 'credit union']
      }
    },
    'refund_pengembalian': {
      keywords: ['refund', 'retur', 'kembalian', 'dikembalikan', 'dana kembali', 'uang balik', 'pembatalan order', 'dibatalkan', 'cancel order', 'pengembalian dana', 'reimburse', 'reimbursement'],
      subcategories: {
        'supplier': ['supplier', 'vendor', 'distributor', 'pabrik', 'agen'],
        'customer': ['customer', 'pelanggan', 'konsumen', 'client', 'klien'],
        'platform': ['platform', 'marketplace', 'bank', 'payment gateway', 'payment processor']
      }
    },
    'pendapatan_lain': {
      keywords: ['pendapatan lain', 'misc income', 'lain-lain', 'pemasukan tambahan', 'passive income', 'sampingan', 'bonus', 'rejeki',
        // Service business tip keywords
        'dikasih tips', 'pelanggan kasih uang tambahan', 'dapet bonus', 'customer ngasih lebih', 'dikasih extra fee', 'dapet uang tip', 'pelanggan baik kasih tip', 'bonus tambahan dari customer', 'dapet 20rb tip', 'fee tambahan cair', 'dapat uang lebih', 'dikasih uang terima kasih', 'dapet uang ekstra', 'tambahan penghasilan dari pelanggan', 'bonus jasa', 'uang apresiasi', 'tip dari customer', 'dapat 50rb tambahan', 'fee tambahan masuk', 'pelanggan ngasih uang',
        // Product business reseller commission keywords
        'komisi reseller masuk', 'fee dropship cair', 'komisi dari supplier', 'dapet hasil jualan', 'uang afiliasi masuk', 'penghasilan dari dropship', 'fee jualan produk orang', 'komisi per penjualan', 'dapet komisi bulanan', 'cashback dari supplier', 'dapet transfer fee', 'hasil dari grup reseller', 'uang insentif penjualan', 'dapet bonus komisi', 'affiliate income cair', 'hasil dropship hari ini', 'keuntungan reseller', 'uang sharing profit', 'fee afiliasi', 'komisi sudah ditransfer',
        // Personal account - salary keywords
        'gajian', 'terima gaji', 'gaji cair', 'gaji bulanan masuk', 'gaji kerjaan', 'gaji dari kantor', 'gaji udah masuk', 'uang dari perusahaan', 'transfer dari HRD', 'slip gaji masuk', 'penghasilan tetap', 'gaji karyawan masuk', 'upah kerja cair', 'duit gaji', 'penghasilan bulanan', 'dapet uang gaji', 'masuk dana gaji', 'uang kerjaan', 'duit masuk dari kantor', 'hasil kerja',
        // Personal account - allowance/bonus keywords
        'dapet bonus', 'THR masuk', 'uang lebaran', 'bonus kerja cair', 'uang tambahan dari kantor', 'transfer bonus', 'tambahan penghasilan', 'bonus akhir tahun', 'dapat THR', 'THR cair', 'insentif kerja masuk', 'bonus tahunan', 'bonus mingguan', 'hadiah kerja', 'insentif kantor', 'tambahan dari perusahaan', 'uang reward', 'bonus project', 'uang apresiasi', 'THR udah masuk',
        // Personal account - selling items keywords
        'jual hp', 'barang bekas dijual', 'hasil jual motor', 'jual sepatu', 'jual jam tangan', 'dapet uang dari jualan pribadi', 'jual barang lama', 'dapet duit dari jual TV', 'ada yang beli barangku', 'lakuin barang bekas', 'dapet uang jual laptop', 'barang second sold', 'dapet hasil barang bekas', 'jual kamera', 'dapet duit dari OLX', 'jualan pribadi', 'hasil jual dompet', 'barang rumah laku', 'jual sofa', 'jual kulkas',
        // Personal account - incoming transfer keywords
        'transfer masuk', 'uang dikirim', 'dikasih uang', 'masuk duit', 'transfer dari teman', 'dikirimin kakak', 'dana masuk', 'dapet uang dari orang', 'uang masuk ke rekening', 'dapet uang kejutan', 'kiriman masuk', 'dapet dana', 'dikasih tiba-tiba', 'dapet kiriman', 'transfer ke rekeningku', 'dana dari temen', 'masuk saldo', 'dapet dari dompet digital', 'dapet uang dadakan', 'saldo masuk',
        // Personal account - side income keywords
        'freelance cair', 'kerja tambahan', 'proyek selesai', 'hasil freelance', 'side job cair', 'tambahan pemasukan', 'dapet kerja sampingan', 'fee masuk', 'dapat insentif', 'penghasilan tambahan', 'proyek pribadi cair', 'kerja malam hasilnya masuk', 'fee content', 'duit hasil desain', 'freelance dapet', 'dapet dari klien', 'hasil dari proyek', 'kerja ekstra', 'penghasilan baru', 'job tambahan'
      ],
      subcategories: {}
    },
    
    // Expense categories untuk UMKM
    'bahan_baku_stok': {
      keywords: ['beli bahan', 'beli kain', 'beli stok', 'beli barang', 'beli material', 'kulakan', 'restock', 'belanja bahan', 'supplier', 'bahan baku', 'stok baru', 'grosir', 'material', 'inventory', 'persediaan', 'belanja modal', 'barang dagangan', 'stok barang', 'supplies', 'pembelian',
        // Food business ingredients keywords
        'belanja bahan', 'beli sayur', 'beli ayam', 'beli daging', 'beli beras', 'beli bumbu dapur', 'stok bahan habis', 'kulakan bahan', 'beli minyak goreng', 'belanja di pasar', 'beli telur', 'beli mie', 'beli tahu tempe', 'bahan habis', 'stok bahan masak', 'bahan utama habis', 'beli kentang', 'beli santan', 'belanja buat masak', 'bahan baku ludes',
        // Service business operational supplies
        'beli alat kerja', 'beli sabun laundry', 'beli minyak pijat', 'beli kain lap', 'beli alat gunting rambut', 'alat rusak diganti', 'beli bahan spa', 'beli cream', 'beli semir sepatu', 'alat pijat rusak', 'beli shampoo', 'alat operasional baru', 'beli botol spray', 'beli kain baru', 'beli bahan untuk service', 'beli alat potong', 'beli peralatan kerja', 'sabun abis beli lagi', 'isi ulang bahan', 'peralatan ganti',
        // Product business inventory keywords
        'beli barang jualan', 'kulakan baju', 'restock produk', 'beli stok baru', 'belanja ke supplier', 'isi ulang dagangan', 'belanja barang dagang', 'beli produk buat upload', 'beli sepatu', 'stok habis isi lagi', 'beli dari grosir', 'nambah dagangan', 'beli barang via WA', 'belanja buat toko', 'kulakan fashion', 'beli produk dropship', 'ambil barang dari supplier', 'ambil stok ke gudang', 'isi toko', 'belanja modal',
        // Personal - food/meal keywords
        'jajan', 'beli makan', 'makan siang', 'nongkrong', 'ngopi', 'beli nasi padang', 'makan malam', 'beli cemilan', 'makan bareng', 'beli makanan', 'jajan online', 'gofood', 'grabfood', 'pesen makan', 'delivery', 'beli snack', 'makan di luar', 'brunch', 'makan di kantor', 'sarapan',
        // Personal - daily shopping keywords
        'beli sabun', 'beli shampoo', 'detergen', 'sabun cuci', 'belanja mingguan', 'kebutuhan rumah', 'beli tissue', 'belanja bulanan', 'isi ulang gas', 'beli perlengkapan mandi', 'ke supermarket', 'belanja warung', 'isi galon', 'beli makanan kucing', 'ke minimarket', 'belanja kebutuhan', 'isi ulang kebutuhan', 'kebutuhan pribadi', 'sabun habis', 'isi ulang rumah'
      ],
      subcategories: {
        'material': ['bahan baku', 'bahan mentah', 'raw material', 'material', 'supplies'],
        'inventory': ['barang jadi', 'inventory', 'stok', 'stock', 'persediaan', 'barang dagangan', 'finished goods'],
        'packaging': ['packaging', 'kemasan', 'packing', 'kotak', 'tas', 'wrapping', 'kertas', 'plastik', 'label'],
        'supplies': ['supplies', 'alat tulis', 'atk', 'kertas', 'tinta', 'printer', 'perlengkapan']
      }
    },
    'gaji_upah': {
      keywords: ['gaji', 'upah', 'bayar karyawan', 'honor', 'fee', 'kasih gaji', 'payroll', 'salary', 'wage', 'upahan', 'thr', 'komisi', 'bonus', 'insentif', 'uang lembur',
        // Food business employee keywords
        'bayar gaji', 'kasih upah', 'upah karyawan', 'gaji harian', 'fee mingguan', 'honor tukang masak', 'bayar mbak warung', 'gaji anak bantu', 'kasih uang kerja', 'transfer ke helper', 'gaji karyawan bulanan', 'fee orang dapur', 'uang makan karyawan', 'bonus mingguan', 'uang jaga toko', 'bayar staff', 'gaji pegawai', 'kasih bonus helper', 'tambahan gaji', 'uang tambahan kerja',
        // Service business employee keywords
        'bayar tukang', 'kasih gaji helper', 'fee freelance', 'honor harian', 'gaji bulanan pegawai', 'gaji mingguan', 'upah kerja', 'bonus staf', 'kasih uang harian', 'bayar orang bantu', 'gaji mitra', 'kasih fee partner', 'upah bantu servis', 'uang lembur', 'honor tambahan', 'bayar orang semprot', 'kasih uang ke helper', 'gaji teknisi', 'honor freelance', 'tambahan untuk staff',
        // Product business employee keywords
        'bayar admin toko', 'kasih gaji anak packing', 'fee staf online', 'honor karyawan', 'upah packing', 'gaji bulanan staf', 'uang bantu toko', 'bonus helper toko', 'fee kasir', 'upah tim operasional', 'uang bantu jualan', 'gaji mingguan', 'fee harian staf', 'bayar tim dropship', 'bonus karyawan', 'kasih uang jaga toko', 'upah admin', 'uang karyawan packing', 'gaji gudang', 'honor bulanan'
      ],
      subcategories: {
        'full_time': ['full time', 'tetap', 'bulanan', 'staff', 'permanent', 'karyawan tetap'],
        'part_time': ['part time', 'paruh waktu', 'freelance', 'magang', 'internship', 'kontrak', 'harian', 'borongan'],
        'bonus': ['bonus', 'insentif', 'reward', 'thr', 'hari raya', 'lebaran', 'natalan'],
        'komisi': ['komisi', 'commission', 'sales', 'marketing', 'penjualan']
      }
    },
    'sewa_operasional': {
      keywords: ['sewa', 'bayar tempat', 'rental', 'listrik', 'pln', 'tagihan air', 'pdam', 'wifi', 'internet', 'gas', 'telepon', 'biaya operasional', 'biaya tetap', 'maintenance', 'perawatan', 'service rutin', 'kebersihan', 'keamanan', 'toko', 'ruko', 'kios', 'lapak', 'kontrak',
        // Food business rent keywords
        'sewa tempat jualan', 'bayar kontrakan warung', 'sewa lapak bulanan', 'bayar ruko', 'uang tempat usaha', 'kontrak ruko', 'bayar lapak', 'sewa ruko bulanan', 'uang sewa habis', 'kontrakan usaha', 'biaya bulanan tempat', 'sewa harian tempat', 'sewa lokasi', 'perpanjang tempat jualan', 'bayar kios', 'uang sewa dapur', 'tempat usaha bayar', 'sewa gerobak', 'sewa tempat jualan malam', 'kontrakan diperpanjang',
        // Service business rent keywords
        'sewa tempat usaha', 'bayar kontrakan', 'biaya listrik bulanan', 'bayar air', 'sewa ruangan pijat', 'bayar kios service', 'sewa lokasi', 'kontrak tempat', 'bayar tempat kerja', 'bayar ruko jasa', 'perpanjang tempat', 'uang bulanan tempat', 'tagihan listrik', 'bayar air bulanan', 'sewa bulanan', 'biaya sewa jasa', 'sewa untuk treatment', 'bayar tempat tukang', 'biaya bulanan lokasi', 'listrik dan air',
        // Product business place/rent keywords
        'bayar sewa toko', 'sewa ruko jualan', 'kontrakan kios', 'biaya tempat', 'sewa lapak fashion', 'perpanjang ruko', 'uang kontrak bulanan', 'tempat usaha bayar', 'bayar tempat offline', 'biaya lokasi usaha', 'sewa bulanan toko', 'kontrak jualan diperpanjang', 'sewa etalase', 'sewa tempat di pasar', 'bayar kios', 'tempat jualan bayar', 'kontrak space mall', 'sewa booth', 'sewa lokasi bazar', 'bayar stand jualan'
      ],
      subcategories: {
        'tempat': ['sewa', 'rent', 'kontrak', 'tempat', 'gedung', 'bangunan', 'ruko', 'kios', 'lapak', 'stand', 'toko', 'store'],
        'listrik': ['listrik', 'pln', 'token', 'meteran', 'electricity'],
        'air': ['air', 'pdam', 'water', 'tagihan air', 'bill'],
        'internet': ['internet', 'wifi', 'data', 'indihome', 'firstmedia', 'biznet', 'koneksi'],
        'maintenance': ['perawatan', 'maintenance', 'service', 'jaga', 'cleaning', 'keamanan', 'security']
      }
    },
    'transportasi_pengiriman': {
      keywords: ['transportasi', 'ongkir', 'kirim barang', 'ongkos kirim', 'ekspedisi', 'logistik', 'jne', 'j&t', 'sicepat', 'anteraja', 'ninja', 'gosend', 'grab send', 'kurir', 'bensin', 'bbm', 'parkir', 'tol', 'grab', 'gojek',
        // Food business shipping keywords
        'kirim bahan', 'ongkir dari pasar', 'bayar kurir', 'antar bahan ke warung', 'ongkos belanja', 'jasa angkut bahan', 'transport belanja', 'ojek bahan', 'biaya antar bahan', 'kirim stok', 'antar barang ke dapur', 'ongkos mobil pasar', 'biaya logistik bahan', 'bayar ojek', 'bayar angkut belanjaan', 'delivery bahan', 'sewa motor bahan', 'antar bahan kulakan', 'ongkos harian', 'kirim bahan via ojek',
        // Service business shipping keywords
        'ongkos kirim alat', 'antar barang ke tempat customer', 'bayar driver', 'ongkos mobilin barang', 'biaya logistik alat', 'antar jemput barang', 'bayar kurir barang servis', 'kirim alat ke pelanggan', 'transportasi alat', 'kirim barang via ojek', 'ambil alat ke gudang', 'biaya antar ke tempat servis', 'jemput sparepart', 'antar bahan jasa', 'biaya kirim peralatan', 'logistik teknisi', 'jasa antar pickup', 'kirim ke lokasi customer', 'sewa kendaraan service', 'antar ke bengkel',
        // Product business shipping keywords
        'ongkir ke pembeli', 'bayar ekspedisi', 'kirim via JNE', 'ongkos J&T', 'bayar kurir', 'antar barang ke customer', 'kirim pesanan online', 'pengiriman ke konsumen', 'biaya logistik', 'jasa antar barang', 'kirim produk', 'paket dikirim', 'sewa kurir pribadi', 'bayar pengiriman', 'antar barang dropship', 'biaya antar ke ekspedisi', 'bayar logistik Shopee', 'ongkir pelanggan', 'jasa kirim produk', 'kirim ke alamat pembeli',
        // Personal - transportation keywords
        'naik gojek', 'grabcar', 'bayar bensin', 'ongkos kerja', 'ojek pangkalan', 'isi bensin', 'transport harian', 'bayar angkot', 'parkir motor', 'naik travel', 'biaya jalan', 'naik taksi', 'transport ke kampus', 'beli BBM', 'mobilan', 'tarif jalan', 'naik bus', 'perjalanan keluar', 'sewa motor', 'transport pribadi'
      ],
      subcategories: {
        'ongkir': ['ongkir', 'ongkos kirim', 'shipping', 'delivery fee', 'biaya pengiriman'],
        'bensin': ['bensin', 'bbm', 'solar', 'pertamax', 'pertalite', 'bahan bakar'],
        'kurir': ['kurir', 'expedisi', 'jne', 'j&t', 'sicepat', 'jnt', 'pos', 'tiki', 'anteraja', 'ninja'],
        'ekspedisi': ['ekspedisi', 'cargo', 'logistik', 'pengiriman massal', 'bulk shipping']
      }
    },
    'kemasan_packaging': {
      keywords: [
        // Food business packaging keywords
        'beli plastik wrap', 'beli sendok plastik', 'beli cup', 'beli tutup minuman', 'stok kemasan habis', 'beli packaging', 'kemasan kosong', 'bungkus habis', 'plastik gak cukup', 'beli box makanan', 'beli wadah', 'plastik makan abis', 'packaging stok habis', 'beli dus nasi', 'beli sedotan', 'beli tray', 'refill kemasan', 'belanja bungkus', 'beli tas kresek', 'cari plastik baru', 'beli kantong', 'label kemasan', 'stiker branding', 'bungkus delivery', 'plastik seal', 'alat wrapping', 'beli kotak minuman', 'beli mangkok sekali pakai', 'gelas brand', 'kemasan catering', 'beli food pail', 'kotak kue', 'tas delivery', 'kemasan takeaway', 'plastik bening', 'kemasan ramah lingkungan', 'beli kertas pembungkus', 'beli lap makan', 'kemasan premium', 'bungkus hadiah'
      ],
      subcategories: {
        'plastik': ['plastik', 'kresek', 'wrapping', 'seal', 'bungkus plastik', 'plastik wrap'],
        'container': ['box', 'kotak', 'wadah', 'container', 'mangkok', 'dus', 'pail'],
        'accessories': ['sendok', 'garpu', 'sedotan', 'tisu', 'sumpit', 'serbet'],
        'branding': ['stiker', 'label', 'cetakan logo', 'print kemasan', 'custom packaging']
      }
    },
    'peralatan_inventaris': {
      keywords: ['beli alat', 'beli mesin', 'beli etalase', 'beli meja', 'beli laptop', 'beli printer', 'peralatan', 'mesin', 'elektronik', 'komputer', 'hp', 'gadget', 'equipment', 'tools', 'device', 'inventaris', 'asset', 'aset', 'capex', 'modal',
        // Food business equipment keywords
        'kompor rusak beli baru', 'beli blender', 'beli rice cooker', 'alat masak rusak', 'beli panci', 'beli wajan', 'beli sutil', 'beli kompor gas', 'alat dapur kurang', 'beli alat dapur', 'peralatan baru', 'ganti mixer', 'beli oven kecil', 'beli pisau', 'beli spatula', 'beli dandang', 'beli alat kukus', 'beli peralatan warung', 'beli penggorengan', 'beli cetakan kue', 'beli serok', 'beli telenan', 'alat penggiling', 'beli timbangan dapur', 'beli microwave', 'beli food processor', 'beli kulkas', 'beli freezer', 'beli showcase', 'beli mesin kasir', 'ganti mesin kopi', 'beli alat ukur makanan', 'beli food container', 'beli display makanan', 'beli mesin minuman', 'beli alat bantu masak'
      ],
      subcategories: {
        'mesin': ['mesin', 'machine', 'equipment', 'alat berat', 'robot', 'automation'],
        'elektronik': ['elektronik', 'laptop', 'komputer', 'computer', 'pc', 'printer', 'monitor', 'tablet', 'hp', 'handphone', 'gadget'],
        'furniture': ['furniture', 'mebel', 'meja', 'kursi', 'lemari', 'etalase', 'rak', 'display', 'showcase'],
        'tools': ['tools', 'alat', 'perkakas', 'cutter', 'gunting', 'tang', 'obeng', 'kunci', 'penjepit']
      }
    },
    'iklan_promosi': {
      keywords: ['iklan', 'ads', 'promosi', 'boost', 'sponsor', 'promote', 'endorsement', 'marketing', 'promo', 'diskon', 'facebook ads', 'instagram ads', 'google ads', 'tiktok ads', 'shopee ads', 'iklan facebook', 'promotion', 'advertising', 'paid promote', 'banner', 'brosur', 'pamflet', 'flyer', 'katalog', 'influencer'],
      subcategories: {
        'online_ads': ['online ads', 'digital marketing', 'fb ads', 'facebook ads', 'instagram ads', 'google ads', 'tiktok ads', 'shopee ads', 'tokopedia ads'],
        'offline_ads': ['offline ads', 'banner', 'spanduk', 'brosur', 'flyer', 'pamflet', 'katalog', 'kartu nama', 'name card', 'print ad'],
        'endorsement': ['endorsement', 'influencer', 'buzzer', 'kol', 'key opinion leader', 'review', 'testimoni', 'paid review', 'paid promote'],
        'sponsor': ['sponsor', 'sponsorship', 'event', 'booth', 'pameran', 'exhibition', 'bazaar']
      }
    },
    'pembayaran_utang': {
      keywords: ['bayar utang', 'bayar pinjaman', 'bayar cicilan', 'angsuran', 'kredit', 'leasing', 'utang supplier', 'hutang distributor', 'tagihan tertunda', 'pembayaran tunda', 'invoice jatuh tempo', 'debt', 'loan payment'],
      subcategories: {
        'pinjaman': ['pinjaman', 'loan', 'kridit', 'credit', 'kta', 'kartu kredit', 'bank', 'koperasi', 'fintech', 'pinjol'],
        'supplier': ['supplier', 'vendor', 'distributor', 'pemasok', 'grosir', 'agen', 'hutang supplier', 'utang supplier'],
        'cicilan': ['cicilan', 'angsuran', 'installment', 'leasing', 'kredit', 'payment plan'],
        'leasing': ['leasing', 'sewa beli', 'sewa guna usaha', 'hire purchase']
      }
    },
    'biaya_platform': {
      keywords: ['potongan marketplace', 'fee shopee', 'fee tokopedia', 'biaya admin', 'biaya platform', 'komisi platform', 'marketplace fee', 'biaya layanan', 'service fee', 'admin fee', 'subscription', 'platform charges',
        // Product business platform fees
        'potongan Shopee', 'biaya admin Tokopedia', 'komisi marketplace', 'fee platform', 'fee Tokopedia', 'biaya transaksi Shopee', 'admin fee e-commerce', 'potongan hasil jual', 'fee dari order', 'biaya langganan seller', 'biaya promosi Shopee', 'iklan Tokopedia', 'biaya admin bulanan', 'potongan dari sistem', 'potongan dari platform', 'biaya ShopeePay', 'biaya admin Tokped', 'biaya checkout', 'potongan hasil penjualan', 'potongan otomatis', 'ongkos iklan shopee', 'promo fee', 'biaya layanan spesial', 'iklan khusus produk', 'biaya boost', 'ads fee', 'fee pengiklanan', 'biaya upgrade status seller', 'biaya pro seller', 'biaya merchant premium', 'biaya jual cepat', 'iklan prioritas', 'biaya langganan premium', 'biaya perlindungan produk', 'biaya bintang toko', 'biaya rekening escrow', 'biaya fitur premium'
      ],
      subcategories: {
        'komisi': ['komisi', 'fee', 'biaya transaksi', 'transaction fee', 'sales fee', 'fee penjualan'],
        'subscription': ['subscription', 'berlangganan', 'langganan', 'membership', 'premium', 'bulanan', 'tahunan'],
        'layanan_premium': ['premium', 'layanan tambahan', 'fitur berbayar', 'add-ons', 'additional service', 'power merchant']
      }
    },
    'pengeluaran_lain': {
      keywords: ['lain-lain', 'misc', 'pengeluaran lainnya', 'biaya lain', 'other expense', 'biaya tak terduga', 'pengeluaran mendadak', 'biaya diluar dugaan', 'biaya khusus', 'biaya keperluan lain', 'misc expense', 'biaya non-kategori', 'pengeluaran pribadi', 'keperluan tak terduga', 'biaya mendadak'],
      subcategories: {
        'emergency': ['darurat', 'mendadak', 'urgensi', 'tiba-tiba', 'tak terduga'],
        'donation': ['donasi', 'sumbangan', 'charity', 'bantuan', 'sedekah'],
        'tax': ['pajak', 'retribusi', 'iuran', 'pph', 'npwp'],
        'misc': ['lain-lain', 'misc', 'others', 'tidak terkategori', 'lainnya']
      }
    }
  };
  
  // Analisis teks untuk ciri-ciri transaksi
  const transactionAnalysis = analyzeTransactionText(lowerText);
  
  // Tentukan tipe transaksi (income/expense) dari hasil analisis
  type = transactionAnalysis.transactionType; // 'income' atau 'expense'
  
  // Berdasarkan tipe, pilih kategori yang sesuai
  if (type === 'income') {
    // Default income category
    category = 'pendapatan_lain';
    
    // Check income categories
    for (const [cat, data] of Object.entries(categoryKeywords)) {
      // Hanya periksa kategori income
      if (CATEGORIES.INCOME.includes(cat)) {
        // Cek keyword kategori dengan word boundary
        if (data.keywords.some(word => wordMatches(word, lowerText))) {
          category = cat;
          
          // Check for subcategories
          for (const [subCat, subKeywords] of Object.entries(data.subcategories)) {
            if (subKeywords.some(word => wordMatches(word, lowerText))) {
              subCategories.push(subCat);
            }
          }
          
          break;
        }
      }
    }
  } else { // type === 'expense'
    // Default expense category
    category = 'pengeluaran_lain';
    
    // Check expense categories - this allows for multiple category detection
    const matchedCategories = [];
    
    // Check personal account specific expense categories first
    // eslint-disable-next-line no-undef
    if (businessType === 'personal') {
      for (const [catKey, catData] of Object.entries(PERSONAL_EXPENSE_CATEGORIES)) {
        if (catData.keywords.some(word => wordMatches(word, lowerText))) {
          // Map personal expense category keys to their proper business category names
          switch (catKey) {
            case 'makan_minum':
              matchedCategories.push('Makan/Minum');
              break;
            case 'transportasi':
              matchedCategories.push('Transportasi');
              break;
            case 'belanja_harian':
              matchedCategories.push('Belanja Harian');
              break;
            case 'pulsa_internet':
              matchedCategories.push('Pulsa/Internet');
              break;
            case 'cicilan':
              matchedCategories.push('Cicilan');
              break;
            case 'tabungan':
              matchedCategories.push('Tabungan');
              break;
            case 'hiburan':
              matchedCategories.push('Hiburan');
              break;
            case 'kesehatan':
              matchedCategories.push('Kesehatan');
              break;
            case 'donasi':
              matchedCategories.push('Donasi');
              break;
            case 'sewa_kontrakan':
              matchedCategories.push('Sewa/Kontrakan');
              break;
            case 'listrik_air':
              matchedCategories.push('Listrik/Air');
              break;
          }
        }
      }
    }
    
    // Then check general expense categories
    for (const [cat, data] of Object.entries(categoryKeywords)) {
      // Only check expense categories
      if (CATEGORIES.EXPENSE.includes(cat)) {
        if (data.keywords.some(word => wordMatches(word, lowerText))) {
          matchedCategories.push(cat);
          
          // Check for subcategories
          for (const [subCat, subKeywords] of Object.entries(data.subcategories)) {
            if (subKeywords.some(word => wordMatches(word, lowerText))) {
              subCategories.push(subCat);
            }
          }
        }
      }
    }
    
    // If we found categories, use the first one as primary (most likely the main expense)
    if (matchedCategories.length > 0) {
      category = matchedCategories[0];
    }
  }
  
  return { type, category, subCategories };
}

/**
 * Fungsi helper untuk memeriksa apakah kata ditemukan dalam teks dengan batas kata
 * @param {string} word - Kata kunci untuk dicari
 * @param {string} text - Teks yang akan dicari
 * @returns {boolean} True jika kata ditemukan dengan batas kata
 */
function wordMatches(word, text) {
  // Jika kata mengandung spasi, buat regex biasa
  if (word.includes(' ')) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapedWord, 'i').test(text);
  }
  
  // Jika kata tunggal, gunakan word boundary
  const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(text);
}

/**
 * Analisis mendalam tentang teks transaksi untuk menentukan apakah income atau expense
 * @param {string} text - Teks transaksi yang akan dianalisis
 * @returns {Object} Hasil analisis teks transaksi
 */
function analyzeTransactionText(text) {
  // Indikator untuk pendapatan/pemasukan
  const incomeIndicators = [
    // Kata kerja pemasukan
    'terima', 'menerima', 'pemasukan', 'pendapatan', 'masuk', 'datang', 'dapat', 'mendapat',
    'dapet', 'income', 'terjual', 'dibayar', 'bayar ke saya', 'membayar saya', 'earn', 'earned',
    'terbayar', 'masukan', 'income', 'received', 'payment received', 'laku', 'laris', 'sold',
    'order', 'orderan', 'pesanan', 'closing', 'berhasil jual', 'deal', 'deals', 'hasil',
    // Kata kerja transaksi dengan aktor pembayaran
    'dari customer', 'dari pelanggan', 'dari klien', 'dari pembeli',  'dari konsumen', 'dari client',
    'dari marketplace', 'dari shopee', 'dari tokopedia', 'dari gojek', 'dari grab', 'dari bank',
    // Konteks objek penjualan
    'jual', 'menjual', 'jualan', 'sale', 'sold', 'penjualan',
    // Frasal penjualan
    'laku terjual', 'barang laku', 'berhasil jual', 'lakunya', 'orderan masuk',
    'closing penjualan', 'ada yang beli', 'ada pembeli', 'customer beli', 'konsumen beli'
  ];

  // Indikator untuk pengeluaran/expense
  const expenseIndicators = [
    // Kata kerja pengeluaran
    'beli', 'membeli', 'bayar', 'membayar', 'keluarkan', 'spent', 'spend', 'purchase',
    'pengeluaran', 'keluar', 'cost', 'biaya', 'payment', 'paid', 'belanja', 'bought',
    'expense', 'expenses', 'fee', 'charge', 'billed', 'tagihan', 'bill',
    // Kata kerja transaksi dengan aktor penerimaan
    'ke supplier', 'ke vendor', 'ke toko', 'ke penjual', 'ke kurir', 'ke ekspedisi',
    'untuk sewa', 'untuk listrik', 'untuk bahan', 'untuk stok', 'untuk marketing',
    // Konteks objek pembelian
    'stock', 'stok', 'inventory', 'supplies', 'material', 'bahan', 'gaji',
    'operasional', 'operational', 'belanja', 'shopping', 'bayar utang', 'bayar pinjaman'
  ];

  // Indikator kata kerja penjualan yang kuat: menjual, terjual, laku, ada pembeli, dll
  const strongSaleVerbs = [
    'jual', 'menjual', 'terjual', 'laku', 'laris', 'sold', 'sale',
    'closing', 'lakunya', 'berhasil jual', 'dagangan laku'
  ];
  
  // Kata kerja pembelian yang kuat: membeli, bayar, dll
  const strongPurchaseVerbs = [
    'beli', 'membeli', 'bayar', 'membayar', 'dibayar', 'belanja'
  ];

  // Mendeteksi arah transaksi (dari/ke) objek bisnis
  const fromPattern = /(?:dari|oleh|dibayar oleh|dari)\s+([a-z\s]+)/i;
  const toPattern = /(?:ke|kepada|untuk|bayar ke|kirim ke)\s+([a-z\s]+)/i;
  
  // Cek apakah teks memiliki pola "dari X" (indikasi pemasukan)
  const fromMatch = text.match(fromPattern);
  const hasFromPattern = fromMatch !== null;
  
  // Cek apakah teks memiliki pola "ke X" (indikasi pengeluaran)
  const toMatch = text.match(toPattern);
  const hasToPattern = toMatch !== null;
  
  // Hitung skor untuk income dan expense
  let incomeScore = 0;
  let expenseScore = 0;
  
  // Tambahkan skor berdasarkan indikator
  for (const indicator of incomeIndicators) {
    if (text.includes(indicator)) {
      incomeScore += 1;
      // Berikan bobot lebih untuk indikator penjualan yang kuat
      if (strongSaleVerbs.some(verb => indicator.includes(verb))) {
        incomeScore += 2;
      }
    }
  }
  
  for (const indicator of expenseIndicators) {
    if (text.includes(indicator)) {
      expenseScore += 1;
      // Berikan bobot lebih untuk indikator pembelian yang kuat
      if (strongPurchaseVerbs.some(verb => indicator.includes(verb))) {
        expenseScore += 2;
      }
    }
  }
  
  // Tambahkan skor dari pola arah transaksi
  if (hasFromPattern) {
    incomeScore += 2;
  }
  
  if (hasToPattern) {
    expenseScore += 2;
  }
  
  // Pengecekan khusus untuk kasus "jual" tapi mencari produk (bukan menjual)
  // Contoh: "beli untuk jualan", "belanja untuk dijual lagi"
  const resellPattern = /(?:beli|belanja|cari|restok)\s+(?:untuk|buat)\s+(?:jualan|dijual|jual)/i;
  if (resellPattern.test(text)) {
    // Ini pengeluaran untuk keperluan stok jualan
    expenseScore += 3;
    incomeScore -= 2; // Kurangi skor income karena "jual" di sini konteksnya bukan pemasukan
  }
  
  // Untuk refund/pengembalian, perlu deteksi khusus karena ambigu
  if (text.includes('refund') || text.includes('pengembalian') || text.includes('dibatalkan')) {
    // Jika ada indikasi refund ke customer, ini expense
    if (text.includes('ke customer') || text.includes('ke pelanggan') || text.includes('barang kembali')) {
      expenseScore += 3;
    } 
    // Jika ada indikasi refund dari supplier/vendor, ini income
    else if (text.includes('dari supplier') || text.includes('dari vendor') || text.includes('refund supplier')) {
      incomeScore += 3;
    }
    // Default: kebanyakan refund dalam konteks UMKM adalah income (dari supplier/platform)
    else {
      incomeScore += 1;
    }
  }
  
  // Deteksi kata "menjual sepeda" (case dari contoh user)
  if (text.includes('menjual') || text.includes('jual') || (text.includes('terjual') && !text.includes('dibeli'))) {
    incomeScore += 3; // Berikan bobot tinggi untuk kata "menjual" secara eksplisit
  }
  
  // Tentukan tipe transaksi berdasarkan skor
  let transactionType = incomeScore > expenseScore ? 'income' : 'expense';
  
  return {
    transactionType,
    incomeScore,
    expenseScore,
    hasFromPattern,
    hasToPattern
  };
}

/**
 * Ekstrak jumlah dari teks transaksi
 * @param {string} text - Teks deskripsi transaksi
 * @returns {number} Jumlah yang diekstrak atau 0 jika tidak ditemukan
 */
export function extractAmount(text) {
  const lowerText = text.toLowerCase();
  let isNegative = false;
  
  // Check for negative amount indicators
  if (
    lowerText.includes('kembali') || 
    lowerText.includes('mengembalikan') || 
    lowerText.includes('dikembalikan') || 
    lowerText.includes('refund') || 
    lowerText.includes('dibatalkan')
  ) {
    isNegative = true;
  }
  
  // Cari pola mata uang seperti Rp50.000, 50k, 50rb, 50 ribu
  // Patterns untuk angka dengan satuan
  const currencyPatterns = [
    // Format dengan Rp
    /\b[Rr][Pp]\s*\.?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d+)?)\b/i, // Rp50.000, Rp 50.000, Rp50,000
    /\b(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d+)?)\s*[Rr][Pp]\b/i, // 50.000Rp, 50.000 Rp
    
    // Satuan ribu/rb/k
    /\b(\d+)\s*(?:ribu|rb|k)\b/i, // 50 ribu, 50rb, 50k, 50 k
    
    // Satuan juta/m
    /\b(\d+)\s*(?:juta|jt|j|m)\b/i, // 2 juta, 2jt, 2j, 2m
    
    // Satuan miliar/milyar/b
    /\b(\d+)\s*(?:miliar|milyar|m|b)\b/i, // 1 miliar, 1milyar, 1b
  ];
  
  // Coba cocokkan dengan setiap pola
  for (const pattern of currencyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Bersihkan string jumlah (hapus pemisah ribuan)
      let amount = match[1].replace(/[.,\s]/g, '');
      
      // Konversi ke angka
      let numericAmount = parseInt(amount, 10);
      
      // Periksa satuan untuk pengganda
      const matchText = match[0].toLowerCase();
      
      // Ubah sesuai dengan satuan
      if (matchText.includes('miliar') || matchText.includes('milyar') || /\bb\b/.test(matchText)) {
        numericAmount *= 1000000000;
      } else if (matchText.includes('juta') || matchText.includes('jt') || /\bj\b/.test(matchText) || /\bm\b/.test(matchText) && numericAmount < 1000) {
        numericAmount *= 1000000;
      } else if (matchText.includes('ribu') || matchText.includes('rb') || /\bk\b/.test(matchText)) {
        numericAmount *= 1000;
      }
      
      return numericAmount;
    }
  }
  
  // Jika tidak ada pattern lengkap yang cocok, cari angka dengan konteks
  const priceContextPatterns = [
    // Konteks harga dengan nominal
    /(?:harga|nilai|sebesar|senilai|seharga|dijual|dibeli|laku)\s+(?:dengan\s+)?(?:harga\s+)?(?:[Rr][Pp]\s*)?([\d,.]+)\s*(?:ribu|rb|k|juta|jt)?/i,
    // Konteks pendapatan
    /(?:dapat|dapet|terima|masuk)\s+(?:uang|dana|pembayaran|gaji|penghasilan)?\s*(?:[Rr][Pp]\s*)?([\d,.]+)\s*(?:ribu|rb|k|juta|jt)?/i,
    // Konteks pengeluaran
    /(?:bayar|beli|keluar)\s+(?:uang|dana|pembayaran)?\s*(?:[Rr][Pp]\s*)?([\d,.]+)\s*(?:ribu|rb|k|juta|jt)?/i,
    // Konteks umum dengan nominal
    /(?:sebesar|senilai|berjumlah|sebanyak|total|sejumlah)\s+(?:[Rr][Pp]\s*)?([\d,.]+)\s*(?:ribu|rb|k|juta|jt)?/i
  ];
  
  for (const pattern of priceContextPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      // Bersihkan string jumlah
      let amount = match[1].replace(/[.,]/g, '');
      let numericAmount = parseInt(amount, 10);
      
      // Periksa apakah ada satuan
      const fullMatch = match[0].toLowerCase();
      if (fullMatch.includes('ribu') || fullMatch.includes('rb') || fullMatch.includes(' k')) {
        numericAmount *= 1000;
      } else if (fullMatch.includes('juta') || fullMatch.includes('jt')) {
        numericAmount *= 1000000;
      }
      
      return numericAmount;
    }
  }
  
  // Cari angka sederhana tetapi dengan lebih banyak konteks untuk akurasi
  // Ini adalah fallback terakhir dengan pemeriksaan konteks ketat
  const simpleNumberPattern = /\b(\d+)\b/;
  const numberMatches = lowerText.match(new RegExp(simpleNumberPattern, 'g')) || [];
  
  // Cek untuk angka di akhir kalimat (kasus seperti "penjualan waffleku - pada bazzar ubaya tanggal 10 mei 400000")
  const endingNumberPattern = /(\d{5,})$/;
  const endingNumberMatch = lowerText.match(endingNumberPattern);
  if (endingNumberMatch && endingNumberMatch[1]) {
    let numericAmount = parseInt(endingNumberMatch[1], 10);
    if (numericAmount > 0) {
      return numericAmount;
    }
  }
  
  // Jika ada angka dalam teks, dan ada kata kunci terkait transaksi,
  // kita bisa berasumsi angka tersebut adalah jumlah transaksi
  if (numberMatches.length >= 1) {
    const transactionKeywords = [
      'uang', 'bayar', 'harga', 'biaya', 'dibeli', 'dijual', 'transaksi',
      'pembayaran', 'pemasukan', 'pengeluaran', 'beli', 'jual', 'gaji',
      'penghasilan', 'ongkos', 'tarif', 'fee', 'komisi', 'order', 'bazzar',
      'bazaar', 'expo', 'pameran', 'penjualan', 'hasil', 'dapatan', 'terjual',
      'laku', 'pendapatan', 'income', 'expense'
    ];
    
    // Cek apakah ada kata kunci transaksi dalam teks
    const hasTransactionContext = transactionKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasTransactionContext) {
      // Cari angka terbesar pada teks yang kemungkinan nominal transaksi
      let largestNumber = 0;
      
      // Prioritaskan angka dengan 5+ digit (kemungkinan nominal langsung seperti 400000)
      for (const numStr of numberMatches) {
        const num = parseInt(numStr, 10);
        if (num >= 10000) {
          // Langsung gunakan angka besar yang kemungkinan adalah nominal uang
          return num;
        } else if (num > largestNumber) {
          largestNumber = num;
        }
      }
      
      if (largestNumber > 0) {
        // Cek apakah nilainya terlalu kecil untuk transaksi biasa (asumsi <1000 kemungkinan dalam ribuan)
        // Ini heuristic untuk kasus seperti "jual sepeda 150" (kemungkinan 150 ribu)
        if (largestNumber < 1000 && !lowerText.includes('rp')) {
          // Untuk nilai kecil tanpa konteks satuan, asumsikan dalam ribuan
          largestNumber *= 1000;
        }
        
        return largestNumber;
      }
    }
  }
  
  // Default jika tidak bisa mengekstrak jumlah
  return 0;
}

/**
 * Ekstrak tanggal dari teks transaksi atau gunakan tanggal saat ini
 * @param {string} text - Teks deskripsi transaksi
 * @returns {Date} Tanggal yang diekstrak atau tanggal saat ini
 */
export function extractDate(text) {
  const lowerText = text.toLowerCase();
  const today = new Date();
  
  // Check for "hari ini", "sekarang", etc.
  if (lowerText.includes('hari ini') || lowerText.includes('sekarang')) {
    return today;
  }
  
  // Check for "kemarin"
  if (lowerText.includes('kemarin')) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday;
  }
  
  // Check for "besok"
  if (lowerText.includes('besok')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  // Check for days of the week (in Indonesian)
  const daysIndo = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  for (let i = 0; i < daysIndo.length; i++) {
    if (lowerText.includes(daysIndo[i])) {
      const targetDay = i + 1; // 1 = Monday, 7 = Sunday
      const currentDay = today.getDay() || 7; // getDay: 0 = Sunday, 6 = Saturday; convert to 1-7
      const daysToAdd = (targetDay + 7 - currentDay) % 7;
      
      // If the mentioned day is today, don't change the date
      if (daysToAdd === 0) {
        return today;
      }
      
      const targetDate = new Date(today);
      // For past references (e.g., "last Monday"), go back a week plus the days difference
      if (lowerText.includes('kemarin') || lowerText.includes('lalu') || lowerText.includes('sebelumnya')) {
        targetDate.setDate(today.getDate() - (7 - daysToAdd));
      } else {
        // For future or unspecified references, add the days difference
        targetDate.setDate(today.getDate() + daysToAdd);
      }
      return targetDate;
    }
  }
  
  // Check for specific date patterns: dd/mm or dd/mm/yyyy or dd-mm or dd-mm-yyyy
  const datePatterns = [
    /\b(\d{1,2})\/(\d{1,2})(?:\/?(\d{2,4}))?\b/, // dd/mm/yyyy or dd/mm
    /\b(\d{1,2})-(\d{1,2})(?:-?(\d{2,4}))?\b/,    // dd-mm-yyyy or dd-mm
  ];
  
  for (const pattern of datePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-based
      
      // If year is not provided or is 2 digits
      let year = match[3] ? parseInt(match[3], 10) : today.getFullYear();
      if (year < 100) {
        year = 2000 + year; // Assume 21st century for 2-digit years
      }
      
      // Validate the date components
      if (month >= 0 && month < 12 && day > 0 && day <= 31) {
        const date = new Date(year, month, day);
        // Check if it's a valid date (handles cases like February 31)
        if (date.getDate() === day) {
          return date;
        }
      }
    }
  }
  
  // Check for month names in Indonesian
  const monthsIndo = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  
  // Cek pola "tanggal DD bulan" yang umum digunakan ("tanggal 10 mei")
  const tanggalPattern = /tanggal\s+(\d{1,2})\s+([a-zA-Z]+)/i;
  const tanggalMatch = lowerText.match(tanggalPattern);
  if (tanggalMatch) {
    const day = parseInt(tanggalMatch[1], 10);
    const monthText = tanggalMatch[2].toLowerCase();
    
    // Cari indeks bulan
    const monthIndex = monthsIndo.findIndex(month => monthText.includes(month) || month.includes(monthText));
    
    if (monthIndex !== -1 && day > 0 && day <= 31) {
      // Look for year pattern
      const yearPattern = /\b(20\d{2})\b/;
      const yearMatch = lowerText.match(yearPattern);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : today.getFullYear();
      
      const date = new Date(year, monthIndex, day);
      // Check if it's a valid date
      if (date.getDate() === day) {
        return date;
      }
    }
  }
  
  for (let i = 0; i < monthsIndo.length; i++) {
    const monthIndex = i;
    const monthName = monthsIndo[i];
    
    if (lowerText.includes(monthName)) {
      // Look for pattern: digits near month name for the day
      const dayPattern = new RegExp(`\\b(\\d{1,2})\\s+${monthName}|${monthName}\\s+(\\d{1,2})\\b`, 'i');
      const dayMatch = lowerText.match(dayPattern);
      
      if (dayMatch) {
        const day = parseInt(dayMatch[1] || dayMatch[2], 10);
        
        // Look for year pattern
        const yearPattern = /\b(20\d{2})\b/;
        const yearMatch = lowerText.match(yearPattern);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : today.getFullYear();
        
        // Validate the date components
        if (day > 0 && day <= 31) {
          const date = new Date(year, monthIndex, day);
          // Check if it's a valid date
          if (date.getDate() === day) {
            return date;
          }
        }
      }
    }
  }
  
  // Check for relative dates like 'minggu lalu' (last week), '2 hari yang lalu' (2 days ago)
  const relativeDayPattern = /(\d+)\s+hari\s+(yang\s+)?lalu/i;
  const relativeWeekPattern = /(\d+)\s+minggu\s+(yang\s+)?lalu/i;
  const relativeMonthPattern = /(\d+)\s+bulan\s+(yang\s+)?lalu/i;
  
  const dayMatch = lowerText.match(relativeDayPattern);
  if (dayMatch) {
    const daysAgo = parseInt(dayMatch[1], 10);
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    return date;
  }
  
  const weekMatch = lowerText.match(relativeWeekPattern);
  if (weekMatch) {
    const weeksAgo = parseInt(weekMatch[1], 10);
    const date = new Date(today);
    date.setDate(today.getDate() - (weeksAgo * 7));
    return date;
  }
  
  const monthMatch = lowerText.match(relativeMonthPattern);
  if (monthMatch) {
    const monthsAgo = parseInt(monthMatch[1], 10);
    const date = new Date(today);
    date.setMonth(today.getMonth() - monthsAgo);
    return date;
  }
  
  // Cek jika ada indikasi yang menunjukkan transaksi di masa lalu tanpa tanggal spesifik
  const pastIndicators = ['kemarin', 'sebelumnya', 'lalu', 'minggu lalu', 'bulan lalu', 'tempo hari'];
  if (pastIndicators.some(indicator => lowerText.includes(indicator))) {
    // Jika ada indikasi masa lalu tapi tanggal tidak spesifik, gunakan kemarin
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday;
  }
  
  // If no date reference is found, use current date
  return today;
}

/**
 * Proses teks transaksi untuk membuat objek transaksi
 * @param {string} messageText - Teks deskripsi transaksi
 * @returns {Object} Objek transaksi dengan metadata berbasis NLP
 */
export function processTransaction(messageText) {
  // First categorize using NLP
  const { type: detectedType, category, subCategories } = categorizeTransaction(messageText);
  const amount = extractAmount(messageText);
  const date = extractDate(messageText);
  const formattedDate = format(date, 'dd MMMM yyyy', { locale: id });
  
  // Get appropriate categories based on business type
  const businessType = getCurrentBusinessType();
  const businessCategories = getCategoriesByBusinessType(businessType);
  const currentCategories = getBusinessCategories();
  
  // Map the transaction to the appropriate business category
  let businessCategory;
  const type = detectedType; // keep the detected transaction type (income/expense)
  
  // First try to use the categories from the business info in localStorage
  const availableCategories = type === 'income' ? currentCategories.income : currentCategories.expense;
  
  if (availableCategories && availableCategories.length > 0) {
    // Default to first category
    businessCategory = availableCategories[0];
    
    // Try to find a relevant match based on the base category
    if (type === 'income') {
      if (category === 'penjualan_produk' || category === 'pendapatan_online') {
        // Look for categories with "Penjualan", "Jual", "Product" in them
        const saleCategory = availableCategories.find(cat => 
          cat.includes('Penjualan') || cat.includes('Jual') || cat.includes('Produk') || cat.includes('Online'));
        
        if (saleCategory) {
          businessCategory = saleCategory;
        }
      } else if (category === 'jasa_layanan') {
        // Look for service categories
        const serviceCategory = availableCategories.find(cat => 
          cat.includes('Jasa') || cat.includes('Layanan') || cat.includes('Service'));
        
        if (serviceCategory) {
          businessCategory = serviceCategory;
        }
      } else if (category === 'piutang_masuk' || category === 'pendanaan_investasi') {
        // Look for investment/loan related categories
        const financeCategory = availableCategories.find(cat => 
          cat.includes('Piutang') || cat.includes('Dana') || cat.includes('Modal') || 
          cat.includes('Investasi') || cat.includes('Transfer'));
        
        if (financeCategory) {
          businessCategory = financeCategory;
        }
      } else if (category === 'pendapatan_lain') {
        // Define lowerText from messageText if not already defined
        const messageLowerText = messageText ? messageText.toLowerCase() : '';
        
        // Special case for pendapatan_lain - handle product business reseller commissions
        if (businessType === 'product' && 
            (messageLowerText.includes('komisi') || messageLowerText.includes('reseller') || 
             messageLowerText.includes('dropship') || messageLowerText.includes('afiliasi'))) {
          const commissionCategory = availableCategories.find(cat => 
            cat.includes('Komisi') || cat.includes('Fee') || cat.includes('Reseller'));
          
          if (commissionCategory) {
            businessCategory = commissionCategory;
          }
        } 
        // Handle personal account specific categories
        else if (businessType === 'personal') {
          if ((messageLowerText.includes('gaji') || messageLowerText.includes('upah') || 
              messageLowerText.includes('kerjaan') || messageLowerText.includes('kantor'))) {
            const salaryCategory = availableCategories.find(cat => cat === 'Gaji');
            if (salaryCategory) businessCategory = salaryCategory;
          } 
          else if ((messageLowerText.includes('bonus') || messageLowerText.includes('thr') || 
                messageLowerText.includes('tambahan') || messageLowerText.includes('reward'))) {
            const bonusCategory = availableCategories.find(cat => cat === 'Bonus/THR');
            if (bonusCategory) businessCategory = bonusCategory;
          }
          else if ((messageLowerText.includes('uang saku') || messageLowerText.includes('jajan') || 
                messageLowerText.includes('mingguan') || messageLowerText.includes('allowance'))) {
            const allowanceCategory = availableCategories.find(cat => cat === 'Uang Saku');
            if (allowanceCategory) businessCategory = allowanceCategory;
          }
          else if ((messageLowerText.includes('jual') || messageLowerText.includes('barang') || 
                messageLowerText.includes('second') || messageLowerText.includes('bekas'))) {
            const sellItemCategory = availableCategories.find(cat => cat === 'Hasil Jual Barang');
            if (sellItemCategory) businessCategory = sellItemCategory;
          }
          else if ((messageLowerText.includes('transfer') || messageLowerText.includes('kiriman') || 
                messageLowerText.includes('kirim') || messageLowerText.includes('masuk'))) {
            const transferCategory = availableCategories.find(cat => cat === 'Transfer Masuk');
            if (transferCategory) businessCategory = transferCategory;
          }
          else if ((messageLowerText.includes('freelance') || messageLowerText.includes('proyek') || 
                messageLowerText.includes('job') || messageLowerText.includes('sampingan'))) {
            const sideIncomeCategory = availableCategories.find(cat => cat === 'Pendapatan Tambahan');
            if (sideIncomeCategory) businessCategory = sideIncomeCategory;
          }
        }
      }
    } else { // expense
      if (category === 'bahan_baku_stok') {
        // Look for supply/inventory categories
        const supplyCategory = availableCategories.find(cat => 
          cat.includes('Bahan') || cat.includes('Stok') || cat.includes('Barang'));
        
        if (supplyCategory) {
          businessCategory = supplyCategory;
        }
      } else if (category === 'gaji_upah') {
        // Look for salary categories
        const salaryCategory = availableCategories.find(cat => 
          cat.includes('Gaji') || cat.includes('Upah') || cat.includes('Karyawan'));
        
        if (salaryCategory) {
          businessCategory = salaryCategory;
        }
      } else if (category === 'sewa_operasional') {
        // Look for rent/operational categories
        const rentCategory = availableCategories.find(cat => 
          cat.includes('Sewa') || cat.includes('Tempat') || cat.includes('Operasional'));
        
        if (rentCategory) {
          businessCategory = rentCategory;
        }
      } else if (category === 'transportasi_pengiriman') {
        // Look for shipping/transportation categories
        const shippingCategory = availableCategories.find(cat => 
          cat.includes('Ongkir') || cat.includes('Pengiriman') || cat.includes('Transport'));
        
        if (shippingCategory) {
          businessCategory = shippingCategory;
        }
      } else if (category === 'biaya_platform') {
        // Look for platform fee categories for product business
        const platformCategory = availableCategories.find(cat => 
          cat.includes('Platform') || cat.includes('Biaya') || cat.includes('Fee'));
        
        if (platformCategory) {
          businessCategory = platformCategory;
        }
      } else if (category === 'peralatan_inventaris') {
        // Look for equipment categories
        const equipmentCategory = availableCategories.find(cat => 
          cat.includes('Alat') || cat.includes('Peralatan') || cat.includes('Equipment'));
        
        if (equipmentCategory) {
          businessCategory = equipmentCategory;
        }
      } else if (category === 'kemasan_packaging') {
        // Look for packaging categories for food business
        const packagingCategory = availableCategories.find(cat => 
          cat.includes('Kemasan') || cat.includes('Plastik') || cat.includes('Cup') || 
          cat.includes('Packaging') || cat.includes('Bungkus'));
        
        if (packagingCategory) {
          businessCategory = packagingCategory;
        }
      } 
      // Handle service business operational categories
      // eslint-disable-next-line no-dupe-else-if
      else if (businessType === 'service' && category === 'peralatan_inventaris') {
        const operationalCategory = availableCategories.find(cat => 
          cat.includes('Operasional') || cat.includes('Alat') || cat.includes('Bahan'));
          
        if (operationalCategory) {
          businessCategory = operationalCategory;
        }
      }
      // For personal account expenses
      else if (businessType === 'personal') {
        // Define lowerText from messageText if not already defined
        const messageLowerText = messageText ? messageText.toLowerCase() : '';
        
        // Check if the detected category is already one of our personal categories
        // String comparison since category could be a direct match (e.g., 'Makan/Minum')
        if (availableCategories.includes(category)) {
          businessCategory = category;
        }
        // Otherwise, check for common patterns
        else if ((messageLowerText.includes('makan') || messageLowerText.includes('jajan') || messageLowerText.includes('makanan'))) {
          const foodCategory = availableCategories.find(cat => cat === 'Makan/Minum');
          if (foodCategory) businessCategory = foodCategory;
        }
        else if ((messageLowerText.includes('transport') || messageLowerText.includes('bensin') || messageLowerText.includes('gojek'))) {
          const transportCategory = availableCategories.find(cat => cat === 'Transportasi');
          if (transportCategory) businessCategory = transportCategory;
        }
        else if ((messageLowerText.includes('belanja') || messageLowerText.includes('supermarket') || messageLowerText.includes('minimarket'))) {
          const shoppingCategory = availableCategories.find(cat => cat === 'Belanja Harian');
          if (shoppingCategory) businessCategory = shoppingCategory;
        }
        else if ((messageLowerText.includes('pulsa') || messageLowerText.includes('internet') || messageLowerText.includes('kuota'))) {
          const internetCategory = availableCategories.find(cat => cat === 'Pulsa/Internet');
          if (internetCategory) businessCategory = internetCategory;
        }
        else if ((messageLowerText.includes('cicilan') || messageLowerText.includes('kredit') || messageLowerText.includes('hutang'))) {
          const loanCategory = availableCategories.find(cat => cat === 'Cicilan');
          if (loanCategory) businessCategory = loanCategory;
        }
        else if ((messageLowerText.includes('tabung') || messageLowerText.includes('nabung') || messageLowerText.includes('saving'))) {
          const savingCategory = availableCategories.find(cat => cat === 'Tabungan');
          if (savingCategory) businessCategory = savingCategory;
        }
        else if ((messageLowerText.includes('hiburan') || messageLowerText.includes('nonton') || messageLowerText.includes('game'))) {
          const entertainmentCategory = availableCategories.find(cat => cat === 'Hiburan');
          if (entertainmentCategory) businessCategory = entertainmentCategory;
        }
        else if ((messageLowerText.includes('obat') || messageLowerText.includes('dokter') || messageLowerText.includes('sakit'))) {
          const healthCategory = availableCategories.find(cat => cat === 'Kesehatan');
          if (healthCategory) businessCategory = healthCategory;
        }
        else if ((messageLowerText.includes('donasi') || messageLowerText.includes('sumbang') || messageLowerText.includes('charity'))) {
          const donationCategory = availableCategories.find(cat => cat === 'Donasi');
          if (donationCategory) businessCategory = donationCategory;
        }
        else if ((messageLowerText.includes('sewa') || messageLowerText.includes('kontrakan') || messageLowerText.includes('kos'))) {
          const rentCategory = availableCategories.find(cat => cat === 'Sewa/Kontrakan');
          if (rentCategory) businessCategory = rentCategory;
        }
        else if ((messageLowerText.includes('listrik') || messageLowerText.includes('air') || messageLowerText.includes('pln'))) {
          const utilityCategory = availableCategories.find(cat => cat === 'Listrik/Air');
          if (utilityCategory) businessCategory = utilityCategory;
        }
      } else {
        // Define lowerText from messageText if not already defined
        const messageLowerText = messageText ? messageText.toLowerCase() : '';
        
        // Check for packaging keywords for food business
        if (businessType === 'food' && 
            (messageLowerText.includes('plastik') || 
             messageLowerText.includes('kemasan') || 
             messageLowerText.includes('packaging') ||
             messageLowerText.includes('cup') || 
             messageLowerText.includes('bungkus') || 
             messageLowerText.includes('wadah') ||
             messageLowerText.includes('tutup') || 
             messageLowerText.includes('box') || 
             messageLowerText.includes('dus') ||
             messageLowerText.includes('sedotan') || 
             messageLowerText.includes('kresek'))) {
          
          // Try to find "Kemasan" category in F&B business
          const packagingCategory = availableCategories.find(cat => 
            cat.includes('Kemasan') || cat.includes('Plastik') || cat.includes('Cup'));
          
          if (packagingCategory) {
            businessCategory = packagingCategory;
          }
        }
      }
    }
  } else {
    // Fallback to business type categories if no specific business categories are found
    if (type === 'income') {
      // Default to first income category if we can't map it
      businessCategory = businessCategories.income[0];
      
      // Try to map it to a more specific category if possible
      if (category === 'penjualan_produk' || category === 'pendapatan_online') {
        if (businessType === 'food' && businessCategories.income.includes('Penjualan Makanan/Minuman')) {
          businessCategory = 'Penjualan Makanan/Minuman';
        } else if (businessType === 'product' && businessCategories.income.includes('Penjualan Produk')) {
          businessCategory = 'Penjualan Produk';
        }
      } else if (category === 'jasa_layanan') {
        if (businessType === 'service' && businessCategories.income.includes('Pendapatan Layanan')) {
          businessCategory = 'Pendapatan Layanan';
        }
      } else if (category === 'pendapatan_lain') {
        // Define lowerText from messageText if not already defined
        const messageLowerText = messageText ? messageText.toLowerCase() : '';
        
        // Check for reseller commissions for product business
        if (businessType === 'product' && 
            (messageLowerText.includes('komisi') || messageLowerText.includes('reseller') || 
             messageLowerText.includes('dropship') || messageLowerText.includes('afiliasi')) && 
            businessCategories.income.includes('Komisi/Fee Reseller')) {
          businessCategory = 'Komisi/Fee Reseller';
        } 
        // Check for tips in service business
        else if (businessType === 'service' && 
                 (messageLowerText.includes('tip') || messageLowerText.includes('tambahan') || 
                  messageLowerText.includes('bonus') || messageLowerText.includes('extra')) &&
                 businessCategories.income.includes('Tip/Uang Tambahan')) {
          businessCategory = 'Tip/Uang Tambahan';
        }
        // Check for personal account income categories
        else if (businessType === 'personal') {
          if ((messageLowerText.includes('gaji') || messageLowerText.includes('upah') || 
               messageLowerText.includes('kerjaan') || messageLowerText.includes('kantor')) &&
              businessCategories.income.includes('Gaji')) {
            businessCategory = 'Gaji';
          } 
          else if ((messageLowerText.includes('bonus') || messageLowerText.includes('thr') || 
                    messageLowerText.includes('tambahan') || messageLowerText.includes('reward')) && 
                   businessCategories.income.includes('Bonus/THR')) {
            businessCategory = 'Bonus/THR';
          }
          else if ((messageLowerText.includes('jual') || messageLowerText.includes('barang') || 
                    messageLowerText.includes('second') || messageLowerText.includes('bekas')) && 
                   businessCategories.income.includes('Hasil Jual Barang')) {
            businessCategory = 'Hasil Jual Barang';
          }
          else if ((messageLowerText.includes('transfer') || messageLowerText.includes('kiriman') || 
                    messageLowerText.includes('dari teman') || messageLowerText.includes('masuk')) && 
                   businessCategories.income.includes('Transfer Masuk')) {
            businessCategory = 'Transfer Masuk';
          }
          else if ((messageLowerText.includes('freelance') || messageLowerText.includes('proyek') || 
                    messageLowerText.includes('job') || messageLowerText.includes('sampingan')) && 
                   businessCategories.income.includes('Pendapatan Tambahan')) {
            businessCategory = 'Pendapatan Tambahan';
          }
        }
      }
    } else { // expense
      // Default to first expense category
      businessCategory = businessCategories.expense[0];
      
      // Try to map it to a more specific category
      if (category === 'bahan_baku_stok') {
        if (businessType === 'food' && businessCategories.expense.includes('Bahan Baku')) {
          businessCategory = 'Bahan Baku';
        } else if (businessType === 'product' && businessCategories.expense.includes('Stok Barang')) {
          businessCategory = 'Stok Barang';
        } else if (businessType === 'service' && businessCategories.expense.includes('Alat & Bahan Operasional')) {
          businessCategory = 'Alat & Bahan Operasional';
        }
      } else if (category === 'gaji_upah' && businessCategories.expense.includes('Gaji')) {
        businessCategory = 'Gaji';
      } else if (category === 'sewa_operasional' && businessCategories.expense.includes('Biaya Tempat/Sewa')) {
        businessCategory = 'Biaya Tempat/Sewa';
      } else if (category === 'transportasi_pengiriman' && businessCategories.expense.includes('Ongkir')) {
        businessCategory = 'Ongkir';
      } else if (category === 'biaya_platform' && businessType === 'product' && businessCategories.expense.includes('Biaya Platform')) {
        businessCategory = 'Biaya Platform';
      } else if (category === 'peralatan_inventaris') {
        if (businessType === 'food' && businessCategories.expense.includes('Alat Masak/Peralatan Dapur')) {
          businessCategory = 'Alat Masak/Peralatan Dapur';
        } else if (businessType === 'service' && businessCategories.expense.includes('Alat & Bahan Operasional')) {
          businessCategory = 'Alat & Bahan Operasional';
        }
      } else if ((category === 'kemasan_packaging' || 
                (businessType === 'food' && messageText && (() => {
                  const messageLowerText = messageText.toLowerCase();
                  return (
                    messageLowerText.includes('plastik') || 
                    messageLowerText.includes('kemasan') || 
                    messageLowerText.includes('packaging') ||
                    messageLowerText.includes('cup') || 
                    messageLowerText.includes('bungkus') || 
                    messageLowerText.includes('wadah') ||
                    messageLowerText.includes('tutup') || 
                    messageLowerText.includes('box') || 
                    messageLowerText.includes('dus') ||
                    messageLowerText.includes('sedotan') || 
                    messageLowerText.includes('kresek')
                  );
                })())) && 
                businessCategories.expense.includes('Kemasan/Plastik/Cup')) {
        businessCategory = 'Kemasan/Plastik/Cup';
      }
      // Handle personal account expense categories
      else if (businessType === 'personal' && messageText) {
        const messageLowerText = messageText.toLowerCase();
        
        if (messageLowerText.includes('makan') || messageLowerText.includes('jajan') || messageLowerText.includes('makanan') || messageLowerText.includes('cafe')) {
          if (businessCategories.expense.includes('Makan/Minum')) {
            businessCategory = 'Makan/Minum';
          }
        } else if (messageLowerText.includes('transport') || messageLowerText.includes('bensin') || messageLowerText.includes('gojek') || messageLowerText.includes('grab')) {
          if (businessCategories.expense.includes('Transportasi')) {
            businessCategory = 'Transportasi';
          }
        } else if (messageLowerText.includes('belanja') || messageLowerText.includes('supermarket') || messageLowerText.includes('minimarket')) {
          if (businessCategories.expense.includes('Belanja Harian')) {
            businessCategory = 'Belanja Harian';
          }
        } else if (messageLowerText.includes('pulsa') || messageLowerText.includes('internet') || messageLowerText.includes('kuota') || messageLowerText.includes('wifi')) {
          if (businessCategories.expense.includes('Pulsa/Internet')) {
            businessCategory = 'Pulsa/Internet';
          }
        } else if (messageLowerText.includes('cicilan') || messageLowerText.includes('kredit') || messageLowerText.includes('hutang') || messageLowerText.includes('pinjaman')) {
          if (businessCategories.expense.includes('Cicilan')) {
            businessCategory = 'Cicilan';
          }
        } else if (messageLowerText.includes('tabung') || messageLowerText.includes('nabung') || messageLowerText.includes('saving')) {
          if (businessCategories.expense.includes('Tabungan')) {
            businessCategory = 'Tabungan';
          }
        } else if (messageLowerText.includes('hiburan') || messageLowerText.includes('nonton') || messageLowerText.includes('game') || messageLowerText.includes('liburan')) {
          if (businessCategories.expense.includes('Hiburan')) {
            businessCategory = 'Hiburan';
          }
        } else if (messageLowerText.includes('obat') || messageLowerText.includes('dokter') || messageLowerText.includes('sakit') || messageLowerText.includes('kesehatan')) {
          if (businessCategories.expense.includes('Kesehatan')) {
            businessCategory = 'Kesehatan';
          }
        } else if (messageLowerText.includes('donasi') || messageLowerText.includes('sumbang') || messageLowerText.includes('charity') || messageLowerText.includes('sedekah')) {
          if (businessCategories.expense.includes('Donasi')) {
            businessCategory = 'Donasi';
          }
        } else if (messageLowerText.includes('sewa') || messageLowerText.includes('kontrakan') || messageLowerText.includes('kos') || messageLowerText.includes('rumah')) {
          if (businessCategories.expense.includes('Sewa/Kontrakan')) {
            businessCategory = 'Sewa/Kontrakan';
          }
        } else if (messageLowerText.includes('listrik') || messageLowerText.includes('air') || messageLowerText.includes('pln') || messageLowerText.includes('pdam')) {
          if (businessCategories.expense.includes('Listrik/Air')) {
            businessCategory = 'Listrik/Air';
          }
        }
      }
    }
  }
  
  // Calculate confidence score based on evidence in the text
  let confidenceScore = 0.5; // Default medium confidence
  
  // Increase confidence if we have clear amount
  if (amount > 0) confidenceScore += 0.1;
  
  // Increase confidence if we have clear category keywords
  if (category !== 'pendapatan_lain' && category !== 'pengeluaran_lain') confidenceScore += 0.1;
  
  // Increase confidence if we have explicit type indicators
  if (messageText) {
    const lowerText = messageText.toLowerCase();
    if (
      (type === 'income' && (lowerText.includes('terima') || lowerText.includes('dapat') || lowerText.includes('masuk'))) ||
      (type === 'expense' && (lowerText.includes('bayar') || lowerText.includes('beli') || lowerText.includes('keluar')))
    ) {
      confidenceScore += 0.2;
    }
  }
  
  // Increase confidence if we found a specific date
  if (date.getTime() !== new Date().setHours(0, 0, 0, 0)) confidenceScore += 0.1;
  
  // Clamp confidence between 0 and 1
  confidenceScore = Math.min(Math.max(confidenceScore, 0), 1);
  
  return {
    id: Date.now(),
    text: messageText,
    amount,
    type,
    category: businessCategory, // Use the business-specific category
    originalCategory: category, // Keep the original NLP category for reference
    subCategories: subCategories || [],
    date,
    formatted_date: formattedDate,
    confidence: confidenceScore,
    needs_review: confidenceScore < 0.7 || amount === 0
  };
}
