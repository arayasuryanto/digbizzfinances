/**
 * Business categories and transaction types for each business type
 */

// Food & Beverage business transaction categories
export const FOOD_BUSINESS_CATEGORIES = {
  income: [
    'Penjualan Makanan/Minuman',
    'Pesanan Online'
  ],
  expense: [
    'Bahan Baku',
    'Kemasan/Plastik/Cup',
    'Alat Masak/Peralatan Dapur',
    'Gaji',
    'Ongkir',
    'Biaya Tempat/Sewa'
  ]
};

// Service business transaction categories
export const SERVICE_BUSINESS_CATEGORIES = {
  income: [
    'Pendapatan Layanan',
    'Tip/Uang Tambahan'
  ],
  expense: [
    'Alat & Bahan Operasional',
    'Gaji',
    'Ongkir',
    'Biaya Tempat/Sewa'
  ]
};

// Product business transaction categories
export const PRODUCT_BUSINESS_CATEGORIES = {
  income: [
    'Penjualan Produk',
    'Komisi/Fee Reseller'
  ],
  expense: [
    'Stok Barang',
    'Ongkir',
    'Biaya Platform',
    'Gaji',
    'Biaya Tempat/Sewa'
  ]
};

// Personal account transaction categories
export const PERSONAL_CATEGORIES = {
  income: [
    'Gaji',
    'Bonus/THR',
    'Uang Saku',
    'Hasil Jual Barang',
    'Transfer Masuk',
    'Pendapatan Tambahan'
  ],
  expense: [
    'Makan/Minum',
    'Transportasi',
    'Belanja Harian',
    'Pulsa/Internet',
    'Cicilan',
    'Tabungan',
    'Hiburan',
    'Kesehatan',
    'Donasi',
    'Sewa/Kontrakan',
    'Listrik/Air'
  ]
};

// Get categories based on business type
export function getCategoriesByBusinessType(type) {
  switch(type) {
    case 'food':
      return FOOD_BUSINESS_CATEGORIES;
    case 'service':
      return SERVICE_BUSINESS_CATEGORIES;
    case 'product':
      return PRODUCT_BUSINESS_CATEGORIES;
    case 'personal':
      return PERSONAL_CATEGORIES;
    default:
      // Default to personal categories
      return PERSONAL_CATEGORIES;
  }
}

/**
 * Helper function to get available categories based on business type and transaction type
 * @param {string} businessType - Type of business ('personal', 'food', 'service', 'product')
 * @param {string} transactionType - Type of transaction ('income' or 'expense')
 * @param {Object} customCategories - Optional custom categories provided by the user
 * @returns {string[]} Array of available categories
 */
export function getAvailableCategories(businessType, transactionType, customCategories = null) {
  // First check if custom categories are provided
  if (customCategories && 
      customCategories[transactionType] && 
      customCategories[transactionType].length > 0) {
    return customCategories[transactionType];
  }
  
  // Otherwise, get default categories based on business type
  const businessCategories = getCategoriesByBusinessType(businessType);
  return transactionType === 'income' ? businessCategories.income : businessCategories.expense;
}