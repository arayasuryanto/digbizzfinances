<template>
  <div class="reports-container">
    <!-- Category Edit Dialog -->
    <div v-if="editingCategory.show" class="category-edit-overlay">
      <div class="category-edit-dialog">
        <div class="dialog-header">
          <h3>Ubah Kategori</h3>
          <button class="close-btn" @click="editingCategory.show = false">×</button>
        </div>
        <div class="dialog-content">
          <div class="category-options">
            <button 
              v-for="(category, index) in editingCategory.categories" 
              :key="index" 
              class="category-option" 
              :class="{selected: editingCategory.transaction && category === editingCategory.transaction.category}"
              @click="updateTransactionCategory(category)">
              {{ getCategoryTranslation(category) }}
            </button>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="editingCategory.show = false">Tutup</button>
        </div>
      </div>
    </div>
    <div class="reports-header">
      <h2>Laporan Transaksi</h2>
      <router-link to="/" class="back-button">Kembali ke Percakapan</router-link>
    </div>

    <!-- Tab Navigation for Mutasi/Analisis -->
    <div class="report-tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'mutasi' }]" 
        @click="switchTab('mutasi')"
      >
        Mutasi
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'analisis' }]" 
        @click="switchTab('analisis')"
      >
        Analisis
      </button>
    </div>

    <!-- Mutasi Tab Content -->
    <div v-if="activeTab === 'mutasi'" class="tab-content">
      <div class="filters">
        <div class="filter-group">
          <label for="typeFilter">Tipe:</label>
          <select id="typeFilter" v-model="filters.type">
            <option value="all">Semua</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="categoryFilter">Kategori:</label>
          <select id="categoryFilter" v-model="filters.category">
            <option value="all">Semua Kategori</option>
            <option v-for="category in uniqueCategories" :key="category" :value="category">
              {{ getCategoryTranslation(category) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Chart Controls with Month Selector -->
      <div class="chart-controls">
        <div class="chart-header">
          <div class="month-selector">
            <button class="month-nav" @click="previousMonth">&lt;</button>
            <div class="month-display" @click="showMonthPicker = !showMonthPicker">
              {{ formatMonth(selectedMonth) }}
              <span class="dropdown-icon">▾</span>
            </div>
            <button class="month-nav" @click="nextMonth">&gt;</button>
            
            <!-- Month picker dropdown -->
            <div class="month-picker" v-if="showMonthPicker">
              <div class="year-selector">
                <button @click="changeYear(-1)">&lt;</button>
                <span>{{ selectedYear }}</span>
                <button @click="changeYear(1)">&gt;</button>
              </div>
              <div class="months-grid">
                <button 
                  v-for="(month, index) in months" 
                  :key="index"
                  :class="['month-button', { active: index === selectedMonth && selectedYear === currentYear }]"
                  @click="selectMonth(index)"
                >
                  {{ month }}
                </button>
              </div>
            </div>
          </div>
          <div class="period-selector">
            <button 
              :class="['period-button', { active: selectedPeriod === 'weekly' }]" 
              @click="setPeriod('weekly')"
            >
              Mingguan
            </button>
            <button 
              :class="['period-button', { active: selectedPeriod === 'monthly' }]" 
              @click="setPeriod('monthly')"
            >
              Bulanan
            </button>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color income"></div>
            <span>Pemasukan</span>
          </div>
          <div class="legend-item">
            <div class="legend-color expense"></div>
            <span>Pengeluaran</span>
          </div>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="weekly-chart">
        <div class="chart-labels">
          <div class="y-axis-labels">
            <div v-for="(tick, index) in yAxisTicks" :key="index">
              {{ tick }}
            </div>
          </div>
          <div class="chart-area">
            <div class="chart-empty" v-if="noTransactionsInPeriod">
              Tidak ada transaksi dalam periode ini
            </div>
            <div class="chart-bar" v-for="(period, index) in periodData" :key="index" v-else>
              <div class="bar-tooltip">
                <div class="tooltip-content">
                  <strong>{{ period.name }}</strong><br>
                  Pemasukan: {{ formatRupiah(period.income) }}<br>
                  Pengeluaran: {{ formatRupiah(period.expense) }}<br>
                  Selisih: {{ formatRupiah(period.income - period.expense) }}
                </div>
              </div>
              <div class="period-total">{{ formatShortRupiah(period.income + period.expense) }}</div>
              <div class="bar-container">
                <div class="expense-bar" :style="{ height: calculateBarHeight(period.expense) + 'px' }"></div>
                <div class="income-bar" :style="{ height: calculateBarHeight(period.income) + 'px' }"></div>
              </div>
              <div class="x-label">{{ period.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card expense">
          <h3>Total Pengeluaran</h3>
          <p class="saldo-amount">{{ formatRupiah(totalExpense) }}</p>
        </div>
        <div class="summary-card income">
          <h3>Total Pemasukan</h3>
          <p class="saldo-amount">{{ formatRupiah(totalIncome) }}</p>
        </div>
      </div>

      <div class="data-section">
        <div class="transactions-list">
          <h3>Transaksi</h3>
          <div v-if="filteredTransactions.length === 0" class="empty-state">
            Tidak ada transaksi ditemukan untuk filter yang dipilih.
          </div>
          <table v-else>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Tipe</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in filteredTransactions" :key="transaction.id"
                  :class="transaction.type" ref="transactionRows">
                <td>{{ transaction.formatted_date }}</td>
                <td>{{ getCategoryTranslation(transaction.category) }}</td>
                <td>{{ truncateText(transaction.text, 50) }}</td>
                <td>{{ formatRupiah(transaction.amount) }}</td>
                <td>{{ transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran' }}</td>
                <td class="action-buttons">
                  <button class="edit-btn" @click="editTransaction(transaction)" title="Edit transaksi">
                    <span>✏️</span>
                  </button>
                  <button class="category-btn" @click="editCategory(transaction)" title="Ubah kategori">
                    <span>🏷️</span>
                  </button>
                  <button class="delete-btn" @click="confirmDeleteTransaction(transaction)" title="Hapus transaksi">
                    <span>🗑️</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Analisis Tab Content -->
    <div v-if="activeTab === 'analisis'" class="tab-content">
      <!-- Month Selector for Analysis Tab -->
      <div class="chart-controls">
        <div class="chart-header">
          <div class="month-selector">
            <button class="month-nav" @click="previousMonth">&lt;</button>
            <div class="month-display" @click="showMonthPicker = !showMonthPicker">
              {{ formatMonth(selectedMonth) }}
              <span class="dropdown-icon">▾</span>
            </div>
            <button class="month-nav" @click="nextMonth">&gt;</button>
            
            <!-- Month picker dropdown -->
            <div class="month-picker" v-if="showMonthPicker">
              <div class="year-selector">
                <button @click="changeYear(-1)">&lt;</button>
                <span>{{ selectedYear }}</span>
                <button @click="changeYear(1)">&gt;</button>
              </div>
              <div class="months-grid">
                <button 
                  v-for="(month, index) in months" 
                  :key="index"
                  :class="['month-button', { active: index === selectedMonth && selectedYear === currentYear }]"
                  @click="selectMonth(index)"
                >
                  {{ month }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Donut Chart Area -->
      <div class="donut-chart-container">
        <div class="donut-chart">
          <div class="donut-visual" ref="donutChart">
            <svg viewBox="0 0 100 100" class="chart-svg">
              <!-- Create a segment for each category -->
              <circle 
                v-for="(segment, index) in chartSegments" 
                :key="index"
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                :stroke="segment.color" 
                stroke-width="15"
                :stroke-dasharray="segment.dashArray"
                :stroke-dashoffset="segment.dashOffset"
                :transform="segment.transform || ''"
                ref="chartSegments"
              ></circle>
              <circle cx="50" cy="50" r="32" fill="white"></circle>
                
                <!-- Percentage labels -->
                <g v-for="(segment, index) in chartSegments" :key="'label-'+index">
                  <text 
                    :x="calculateLabelPosition(segment.percentage, index).x" 
                    :y="calculateLabelPosition(segment.percentage, index).y"
                    text-anchor="middle"
                    fill="#fff"
                    font-size="3"
                    font-weight="bold"
                    class="percentage-label"
                  >
                    {{ segment.percentage.toFixed(0) }}%
                  </text>
                </g>
            </svg>
            
            <!-- Indicators for categories -->
            <div v-for="(indicator, index) in categoryIndicators" 
                :key="index" 
                class="category-indicator"
                :style="{ 
                  top: indicator.top, 
                  left: indicator.left, 
                  backgroundColor: indicator.color 
                }"
                ref="categoryIndicators"
            >
              {{ indicator.icon }}
            </div>
            
            <!-- Center content -->
            <div class="donut-center" ref="donutCenter">
              <p class="center-label">{{ chartType === 'income' ? 'Total Pemasukan' : 'Total Pengeluaran' }}</p>
              <p class="center-amount">{{ formatRupiah(chartType === 'income' ? totalIncome : totalExpense) }}</p>
              <p class="center-categories">{{ displayedCategoryTotals ? Object.keys(displayedCategoryTotals).length : 0 }} kategori</p>
            </div>
          </div>
        </div>
        
        <!-- Type Selector -->
        <div class="category-type-selector">
          <button 
            :class="['type-button', { active: chartType === 'expense' }]" 
            @click="setChartType('expense')"
          >
            Pengeluaran
          </button>
          <button 
            :class="['type-button', { active: chartType === 'income' }]" 
            @click="setChartType('income')"
          >
            Pemasukan
          </button>
        </div>
      </div>
      
      <!-- Category Breakdown -->
      <div class="category-breakdown">
        <h3>{{ chartType === 'income' ? 'Kategori Pemasukan' : 'Kategori Pengeluaran' }}</h3>
        
        <div v-if="!displayedCategoryTotals || Object.keys(displayedCategoryTotals).length === 0" class="empty-state">
          Tidak ada data kategori untuk ditampilkan.
        </div>
        
        <div v-else class="category-list">
          <div v-for="(amount, category) in displayedCategoryTotals" 
               :key="category"
               class="category-item"
               ref="categoryItems">
            <div class="category-icon" :style="{ backgroundColor: getCategoryColor(category) }">
              {{ getCategoryIcon(category) }}
            </div>
            
            <div class="category-info">
              <div class="category-name">{{ getCategoryTranslation(category) }}</div>
              <div class="category-stats">
                {{ getCategoryCount(category) }} Transaksi ({{ getCategoryPercentage(category) }}%)
              </div>
            </div>
            
            <div class="category-amount">
              -{{ formatRupiah(amount) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CATEGORY_TRANSLATIONS, CATEGORIES } from '../utils/transactionParser';
import { getAvailableCategories } from '../utils/businessCategories';
import { formatRupiah } from '../utils/formatting';
import { gsap } from 'gsap';

export default {
  name: 'Reports',
  data() {
    return {
      activeTab: 'mutasi',
      chartType: 'expense',
      selectedPeriod: 'weekly',
      periodData: [],
      filters: {
        type: 'all',
        category: 'all'
      },
      editingCategory: {
        show: false,
        transaction: null,
        categories: []
      },
      weekData: [
        { name: 'Minggu 1', expense: 0, income: 0 },
        { name: 'Minggu 2', expense: 0, income: 0 },
        { name: 'Minggu 3', expense: 0, income: 0 },
        { name: 'Minggu 4', expense: 0, income: 0 },
        { name: 'Minggu 5', expense: 0, income: 0 }
      ],
      maxChartValue: 500000, // Default max value
      yAxisTicks: ['500rb', '400rb', '300rb', '200rb', '100rb', '0'], // Reversed order so 0 is at bottom
      showMonthPicker: false,
      selectedMonth: new Date().getMonth(),
      selectedYear: new Date().getFullYear(),
      currentYear: new Date().getFullYear(),
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
      categoryColors: {
        // Income categories
        'penjualan_produk': '#4CAF50',
        'jasa_layanan': '#8BC34A',
        'pendapatan_online': '#009688',
        'piutang_masuk': '#00BCD4',
        'pendanaan_investasi': '#03A9F4',
        'refund_pengembalian': '#3F51B5',
        'pendapatan_lain': '#673AB7',
        
        // Expense categories
        'bahan_baku_stok': '#F44336',
        'gaji_upah': '#E91E63',
        'sewa_operasional': '#9C27B0',
        'transportasi_pengiriman': '#4DABF7',
        'peralatan_inventaris': '#FF9800',
        'iklan_promosi': '#FF5722',
        'pembayaran_utang': '#795548',
        'biaya_platform': '#9E9E9E',
        'pengeluaran_lain': '#607D8B'
      },
      categoryIcons: {
        // Income icons
        'penjualan_produk': '🛒',
        'jasa_layanan': '🔧',
        'pendapatan_online': '🌐',
        'piutang_masuk': '💰',
        'pendanaan_investasi': '💼',
        'refund_pengembalian': '↩️',
        'pendapatan_lain': '💵',
        
        // Expense icons
        'bahan_baku_stok': '📦',
        'gaji_upah': '👨‍💼',
        'sewa_operasional': '🏪',
        'transportasi_pengiriman': '🚚',
        'peralatan_inventaris': '🔨',
        'iklan_promosi': '📣',
        'pembayaran_utang': '📝',
        'biaya_platform': '🖥️',
        'pengeluaran_lain': '📎'
      }
    }
  },
  computed: {
    noTransactionsInPeriod() {
      return this.periodData.length === 0 || 
             this.periodData.every(period => period.income === 0 && period.expense === 0);
    },
    filteredTransactions() {
      let transactions = this.$store.getters.sortedTransactions;
      
      // Filter by type
      if (this.filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === this.filters.type);
      }
      
      // Filter by category
      if (this.filters.category !== 'all') {
        transactions = transactions.filter(t => t.category === this.filters.category);
      }
      
      return transactions;
    },
    // Transactions filtered by selected month for both tabs
    monthFilteredTransactions() {
      return this.filteredTransactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getMonth() === this.selectedMonth && date.getFullYear() === this.selectedYear;
      });
    },
    uniqueCategories() {
      // Get all unique categories from transactions
      const categories = this.$store.state.transactions.map(t => t.category);
      return [...new Set(categories)].sort();
    },
    totalExpense() {
      if (this.filters.type === 'expense' || this.filters.type === 'all') {
        return this.monthFilteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      }
      return 0;
    },
    totalIncome() {
      if (this.filters.type === 'income' || this.filters.type === 'all') {
        return this.monthFilteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      }
      return 0;
    },
    categoryTotals() {
      const totals = {};
      
      this.monthFilteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
          if (!totals[transaction.category]) {
            totals[transaction.category] = 0;
          }
          totals[transaction.category] += transaction.amount;
        });
      
      // Sort by amount (descending)
      return Object.fromEntries(
        Object.entries(totals).sort((a, b) => b[1] - a[1])
      );
    },
    incomeCategoryTotals() {
      const totals = {};
      
      this.monthFilteredTransactions
        .filter(t => t.type === 'income')
        .forEach(transaction => {
          if (!totals[transaction.category]) {
            totals[transaction.category] = 0;
          }
          totals[transaction.category] += transaction.amount;
        });
      
      // Sort by amount (descending)
      return Object.fromEntries(
        Object.entries(totals).sort((a, b) => b[1] - a[1])
      );
    },
    displayedCategoryTotals() {
      // Get all possible categories based on business type
      const businessType = this.$store.state.business.type || 'personal';
      const allCategories = this.$store.state.business.transactionCategories || {
        income: [],
        expense: []
      };
      
      // Get current category totals
      const currentTotals = this.chartType === 'income' ? this.incomeCategoryTotals : this.categoryTotals;
      
      // Create a complete list including all possible categories with zero values
      const completeTotals = {};
      const categoryList = this.chartType === 'income' ? allCategories.income : allCategories.expense;
      
      if (categoryList.length === 0) {
        // Fallback to default categories if the business categories are not set
        if (businessType === 'food') {
          // Use food business categories
          const defaultCategories = this.chartType === 'income' ? 
            ['Penjualan Makanan/Minuman', 'Pesanan Online'] :
            ['Bahan Baku', 'Kemasan/Plastik/Cup', 'Alat Masak/Peralatan Dapur', 'Gaji', 'Ongkir', 'Biaya Tempat/Sewa'];
          
          // First add all default categories with zero values
          defaultCategories.forEach(category => {
            completeTotals[category] = 0;
          });
        } else if (businessType === 'service') {
          // Use service business categories
          const defaultCategories = this.chartType === 'income' ? 
            ['Pendapatan Layanan', 'Tip/Uang Tambahan'] :
            ['Alat & Bahan Operasional', 'Gaji', 'Ongkir', 'Biaya Tempat/Sewa'];
          
          // First add all default categories with zero values
          defaultCategories.forEach(category => {
            completeTotals[category] = 0;
          });
        } else if (businessType === 'product') {
          // Use product business categories
          const defaultCategories = this.chartType === 'income' ? 
            ['Penjualan Produk', 'Komisi/Fee Reseller'] :
            ['Stok Barang', 'Ongkir', 'Biaya Platform', 'Gaji', 'Biaya Tempat/Sewa'];
          
          // First add all default categories with zero values
          defaultCategories.forEach(category => {
            completeTotals[category] = 0;
          });
        } else {
          // Use personal categories
          const defaultCategories = this.chartType === 'income' ? 
            ['Gaji', 'Bonus/THR', 'Uang Saku', 'Hasil Jual Barang', 'Transfer Masuk', 'Pendapatan Tambahan'] :
            ['Makan/Minum', 'Transportasi', 'Belanja Harian', 'Pulsa/Internet', 'Cicilan', 'Tabungan', 
             'Hiburan', 'Kesehatan', 'Donasi', 'Sewa/Kontrakan', 'Listrik/Air'];
          
          // First add all default categories with zero values
          defaultCategories.forEach(category => {
            completeTotals[category] = 0;
          });
        }
      } else {
        // First add all categories with zero values
        categoryList.forEach(category => {
          completeTotals[category] = 0;
        });
      }
      
      // Then override with actual values
      Object.entries(currentTotals).forEach(([category, amount]) => {
        completeTotals[category] = amount;
      });
      
      return completeTotals;
    },
    displayedCategoryTotal() {
      return this.chartType === 'income' ? this.totalIncome : this.totalExpense;
    },
    totalCategoryAmount() {
      return Object.values(this.categoryTotals || {}).reduce((total, amount) => total + amount, 0);
    },
    // Calculate SVG segments for the donut chart
    chartSegments() {
      if (!this.displayedCategoryTotals || Object.keys(this.displayedCategoryTotals).length === 0) {
        return [];
      }
      
      const segments = [];
      const totalCircle = 251.2; // Circumference of circle with r=40
      let cumulativeOffset = 0;
      let totalAmount = this.displayedCategoryTotal;
      
      // Create an array of segments to sort by amount
      const categorySegments = Object.entries(this.displayedCategoryTotals).map(([category, amount]) => {
        return { category, amount };
      }).sort((a, b) => b.amount - a.amount);
      
      // Generate segments for each category
      categorySegments.forEach(({ category, amount }, index) => {
        const percentage = totalAmount > 0 ? amount / totalAmount : 0;
        const dashLength = totalCircle * percentage;
        const color = this.getCategoryColor(category);
        
        segments.push({
          category,
          amount,
          percentage: percentage * 100,
          color,
          dashArray: `${dashLength} ${totalCircle - dashLength}`,
          dashOffset: `${cumulativeOffset}`,
          transform: 'rotate(-90 50 50)'
        });
        
        cumulativeOffset += dashLength;
      });
      
      return segments;
    },
    // Create indicators for the donut chart
    categoryIndicators() {
      const indicators = [];
      const positions = [
        { top: '20%', left: '70%' },
        { top: '70%', left: '20%' },
        { top: '80%', left: '60%' },
        { top: '40%', left: '10%' }
      ];
      
      Object.entries(this.displayedCategoryTotals || {}).slice(0, 4).forEach(([category, amount], index) => {
        indicators.push({
          top: positions[index].top,
          left: positions[index].left,
          color: this.getCategoryColor(category),
          icon: this.getCategoryIcon(category)
        });
      });
      
      return indicators;
    }
  },
  mounted() {
    // Check if there's a tab parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    // Set active tab based on URL parameter
    if (tabParam === 'analisis') {
      this.activeTab = 'analisis';
    }
    
    // Initialize weekly data with selected month
    this.prepareWeeklyData();
    
    // Animate elements on mount
    this.animateElements();
    
    // Close month picker when clicking outside
    document.addEventListener('click', this.closeMonthPicker);
  },
  
  beforeUnmount() {
    // Remove event listener when component is destroyed
    document.removeEventListener('click', this.closeMonthPicker);
  },
  methods: {
    // Animations
    animateElements() {
      // Animate header
      gsap.from('.reports-header', {
        opacity: 0,
        y: -20,
        duration: 0.7,
        ease: 'power2.out'
      });
      
      // Stagger animations for tabs
      gsap.from('.tab-button', {
        opacity: 0,
        y: -10,
        stagger: 0.2,
        duration: 0.5,
        delay: 0.3,
        ease: 'back.out(1.7)'
      });
      
      // Animate based on current tab
      if (this.activeTab === 'mutasi') {
        this.animateMutasiElements();
      } else {
        this.animateAnalisisElements();
      }
    },
    
    animateMutasiElements() {
      // Animate chart area
      gsap.from('.weekly-chart', {
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        delay: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
      
      // Animate chart bars with staggering
      gsap.from('.chart-bar', {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.6,
        delay: 0.8,
        ease: 'power2.out'
      });
      
      // Animate expense and income bars
      gsap.from('.expense-bar, .income-bar', {
        scaleY: 0,
        transformOrigin: 'bottom',
        stagger: 0.05,
        duration: 1,
        delay: 1,
        ease: 'elastic.out(1, 0.3)'
      });
      
      // Animate summary cards
      gsap.from('.summary-card', {
        opacity: 0,
        y: 30,
        stagger: 0.2,
        duration: 0.7,
        delay: 1.2,
        ease: 'back.out(1.4)'
      });
      
      // Animate transaction rows
      if (this.$refs.transactionRows) {
        gsap.from(this.$refs.transactionRows, {
          opacity: 0,
          y: 10,
          stagger: 0.05,
          duration: 0.5,
          delay: 1.5,
          ease: 'power1.out'
        });
      }
    },
    
    animateAnalisisElements() {
      // Animate donut chart container
      gsap.from('.donut-chart-container', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.5,
        ease: 'power2.out'
      });
      
      // Animate donut chart
      gsap.from(this.$refs.donutChart, {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        delay: 0.8,
        ease: 'elastic.out(1, 0.5)'
      });
      
      // Animate chart segments with staggered rotation
      if (this.$refs.chartSegments) {
        gsap.from(this.$refs.chartSegments, {
          strokeDashoffset: 251.2, // Full circumference
          stagger: 0.2,
          duration: 1.5,
          delay: 1,
          ease: 'power2.inOut'
        });
      }
      
      // Animate category indicators
      if (this.$refs.categoryIndicators) {
        gsap.from(this.$refs.categoryIndicators, {
          opacity: 0,
          scale: 0,
          stagger: 0.1,
          duration: 0.5,
          delay: 1.5,
          ease: 'back.out(1.7)'
        });
      }
      
      // Animate center content
      if (this.$refs.donutCenter) {
        gsap.from(this.$refs.donutCenter, {
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          delay: 1.2,
          ease: 'power2.out'
        });
      }
      
      // Animate category items
      if (this.$refs.categoryItems) {
        gsap.from(this.$refs.categoryItems, {
          opacity: 0,
          x: 30,
          stagger: 0.1,
          duration: 0.6,
          delay: 1.8,
          ease: 'power2.out'
        });
      }
    },
    
    // Switch between tabs with animation
    switchTab(tabName) {
      // Only switch if it's a different tab
      if (this.activeTab === tabName) return;
      
      // Update URL with the new tab without page reload
      const url = new URL(window.location);
      url.searchParams.set('tab', tabName);
      window.history.pushState({}, '', url);
      
      // First, fade out current content
      gsap.to('.tab-content', {
        opacity: 0,
        x: this.activeTab === 'mutasi' ? -20 : 20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          // Change tab after fade out completes
          this.activeTab = tabName;
          
          // Wait for DOM update
          this.$nextTick(() => {
            // Fade in new content
            gsap.fromTo('.tab-content',
              { opacity: 0, x: tabName === 'mutasi' ? 20 : -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.5, 
                ease: 'power2.out',
                onComplete: () => {
                  // Animate elements in the new tab
                  if (tabName === 'mutasi') {
                    this.animateMutasiElements();
                  } else {
                    this.animateAnalisisElements();
                  }
                }
              }
            );
          });
        }
      });
    },
    
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    
    formatRupiah,
    
    getCategoryTranslation(category) {
      // First try to get from NLP category translations
      const nlpTranslation = CATEGORY_TRANSLATIONS[category];
      if (nlpTranslation) return nlpTranslation;
      
      // Otherwise, return the category as is - business-specific categories are already in human-readable format
      return category;
    },
    
    getCategoryColor(category) {
      // First check predefined category colors 
      if (this.categoryColors[category]) {
        return this.categoryColors[category];
      }
      
      // If not found, use a color based on the business type and category
      const businessType = this.$store.state.business.type || 'personal';
      
      // Generate a consistent color based on category name
      const hashCode = category.split('').reduce((hash, char) => {
        return char.charCodeAt(0) + ((hash << 5) - hash);
      }, 0);
      
      // Use different color palettes for different business types
      let colors;
      
      if (this.chartType === 'income') {
        // Income colors - varying shades of green/blue
        if (businessType === 'food') {
          colors = ['#4CAF50', '#8BC34A', '#009688', '#00BCD4', '#03A9F4', '#2196F3'];
        } else if (businessType === 'service') {
          colors = ['#03A9F4', '#2196F3', '#3F51B5', '#5C6BC0', '#7986CB', '#9FA8DA'];
        } else if (businessType === 'product') {
          colors = ['#009688', '#26A69A', '#4DB6AC', '#80CBC4', '#00ACC1', '#26C6DA'];
        } else { // personal
          colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#00897B', '#26A69A'];
        }
      } else {
        // Expense colors - varying shades of orange/red
        if (businessType === 'food') {
          colors = ['#FF5722', '#FF7043', '#FF8A65', '#FFAB91', '#E64A19', '#F4511E'];
        } else if (businessType === 'service') {
          colors = ['#F44336', '#EF5350', '#E57373', '#EF9A9A', '#D32F2F', '#E53935'];
        } else if (businessType === 'product') {
          colors = ['#FF9800', '#FFA726', '#FFB74D', '#FFCC80', '#FB8C00', '#FF9100'];
        } else { // personal
          colors = ['#F44336', '#FF5722', '#FF9800', '#FFC107', '#E91E63', '#9C27B0'];
        }
      }
      
      // Use hash to pick a color from the palette
      const index = Math.abs(hashCode) % colors.length;
      return colors[index];
    },
    
    getCategoryIcon(category) {
      // First check the predefined category icons
      if (this.categoryIcons[category]) {
        return this.categoryIcons[category];
      }
      
      // If not found, use a default icon based on the type of category
      const businessType = this.$store.state.business.type || 'personal';
      
      // Business type specific defaults
      if (businessType === 'food') {
        if (this.chartType === 'income') {
          if (category.includes('Makanan') || category.includes('Minuman')) return '🍔';
          if (category.includes('Online')) return '🌐';
          return '💰';
        } else {
          if (category.includes('Bahan')) return '🧀';
          if (category.includes('Kemasan') || category.includes('Cup')) return '📦';
          if (category.includes('Alat') || category.includes('Peralatan')) return '🍳';
          if (category.includes('Gaji')) return '👨‍🍳';
          if (category.includes('Ongkir')) return '🚚';
          if (category.includes('Sewa') || category.includes('Tempat')) return '🏪';
          return '💸';
        }
      } else if (businessType === 'service') {
        if (this.chartType === 'income') {
          if (category.includes('Layanan')) return '🔧';
          if (category.includes('Tip')) return '💸';
          return '💰';
        } else {
          if (category.includes('Alat') || category.includes('Bahan')) return '🛠️';
          if (category.includes('Gaji')) return '👨‍🔧';
          if (category.includes('Ongkir')) return '🚚';
          if (category.includes('Sewa') || category.includes('Tempat')) return '🏢';
          return '💸';
        }
      } else if (businessType === 'product') {
        if (this.chartType === 'income') {
          if (category.includes('Produk')) return '📦';
          if (category.includes('Komisi') || category.includes('Reseller')) return '👥';
          return '💰';
        } else {
          if (category.includes('Stok')) return '📦';
          if (category.includes('Ongkir')) return '🚚';
          if (category.includes('Platform')) return '🖥️';
          if (category.includes('Gaji')) return '👨‍💼';
          if (category.includes('Sewa') || category.includes('Tempat')) return '🏪';
          return '💸';
        }
      } else { // personal
        if (this.chartType === 'income') {
          if (category.includes('Gaji')) return '💼';
          if (category.includes('Bonus')) return '🎁';
          if (category.includes('Saku')) return '👛';
          if (category.includes('Jual')) return '🏷️';
          if (category.includes('Transfer')) return '🏦';
          return '💰';
        } else {
          if (category.includes('Makan')) return '🍔';
          if (category.includes('Transportasi')) return '🚗';
          if (category.includes('Belanja')) return '🛒';
          if (category.includes('Pulsa') || category.includes('Internet')) return '📱';
          if (category.includes('Cicilan')) return '📝';
          if (category.includes('Tabungan')) return '💹';
          if (category.includes('Hiburan')) return '🎭';
          if (category.includes('Kesehatan')) return '🏥';
          if (category.includes('Donasi')) return '🤲';
          if (category.includes('Sewa') || category.includes('Kontrakan')) return '🏠';
          if (category.includes('Listrik') || category.includes('Air')) return '💡';
          return '💸';
        }
      }
    },
    
    setChartType(type) {
      if (this.chartType !== type) {
        this.chartType = type;
        // Animate chart when switching between expense and income
        this.$nextTick(() => {
          this.animateAnalisisElements();
        });
      }
    },
    
    calculateBarWidth(amount) {
      // Find the maximum amount to scale the bars
      const maxAmount = Math.max(...Object.values(this.categoryTotals));
      return (amount / maxAmount) * 100;
    },
    
    getCategoryCount(category) {
      return this.monthFilteredTransactions.filter(t => t.category === category && t.type === this.chartType).length;
    },
    
    getCategoryPercentage(category) {
      const amount = this.displayedCategoryTotals[category];
      return this.displayedCategoryTotal > 0 
        ? ((amount / this.displayedCategoryTotal) * 100).toFixed(1) 
        : '0.0';
    },
    
    // Format amounts for y-axis
    formatSimpleAmount(amount) {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)} jt`;
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)} rb`;
      }
      return amount.toString();
    },
    
    // Format short rupiah for chart labels
    formatShortRupiah(amount) {
      // Format amount to shorter format (e.g., 1.5jt, 500rb)
      const absAmount = Math.abs(amount);
      if (absAmount >= 1000000) {
        return `Rp${(absAmount / 1000000).toFixed(1)}jt`;
      } else if (absAmount >= 1000) {
        return `Rp${(absAmount / 1000).toFixed(0)}rb`;
      }
      return `Rp${absAmount}`;
    },
    
    // Calculate label positions for donut chart percentages
    calculateLabelPosition(percentage, index) {
      // Calculate position for percentage labels in donut chart
      // Convert the chart's 0 position from bottom to right side (as SVG rotate is applied)
      const angleInDegrees = (index * 36) % 360;
      const angleInRadians = (angleInDegrees * Math.PI) / 180;
      
      // Calculate position on a radius slightly smaller than the chart's outer edge
      const radius = 42; // Slightly outside the main donut circle (r=40)
      const x = 50 + radius * Math.cos(angleInRadians);
      const y = 50 + radius * Math.sin(angleInRadians);
      
      return { x, y };
    },
    
    // Period switching functionality 
    setPeriod(period) {
      if (this.selectedPeriod !== period) {
        this.selectedPeriod = period;
        this.prepareWeeklyData();
        
        // Update chart Y-axis scale
        this.$nextTick(() => {
          this.updateMaxChartValue();
        });
      }
    },
    
    // Prepare period data based on selected period
    prepareWeeklyData() {
      // Reset the period data based on selected period
      if (this.selectedPeriod === 'weekly') {
        this.prepareWeeklyChartData();
      } else {
        this.prepareMonthlyChartData();
      }
    },
    
    // Prepare weekly chart data for selected month
    prepareWeeklyChartData() {
      // Initialize weekly bins with fixed ranges for any month
      const weeklyData = [
        { name: '1-7', expense: 0, income: 0, days: [] },
        { name: '8-14', expense: 0, income: 0, days: [] },
        { name: '15-21', expense: 0, income: 0, days: [] },
        { name: '22-28', expense: 0, income: 0, days: [] },
        { name: '29-31', expense: 0, income: 0, days: [] }
      ];

      // Filter transactions for selected month and year
      if (this.filteredTransactions.length > 0) {
        // Get transactions for the selected month
        const monthTransactions = this.filteredTransactions.filter(transaction => {
          const date = new Date(transaction.date);
          return date.getMonth() === this.selectedMonth && date.getFullYear() === this.selectedYear;
        });

        // Group transactions by week using day ranges
        monthTransactions.forEach(transaction => {
          const date = new Date(transaction.date);
          const day = date.getDate();
          let weekIndex = 0;
          
          // Determine week index by day range
          if (day <= 7) weekIndex = 0;
          else if (day <= 14) weekIndex = 1;
          else if (day <= 21) weekIndex = 2;
          else if (day <= 28) weekIndex = 3;
          else weekIndex = 4; // days 29-31
          
          // Add to appropriate week bin
          if (transaction.type === 'expense') {
            weeklyData[weekIndex].expense += transaction.amount;
          } else {
            weeklyData[weekIndex].income += transaction.amount;
          }
          
          // Track days with data
          if (!weeklyData[weekIndex].days.includes(day)) {
            weeklyData[weekIndex].days.push(day);
          }
        });
      }

      // Update period data - keep all weeks for consistent display
      this.periodData = weeklyData;
      
      // Update y-axis scale based on current data
      this.updateMaxChartValue();
    },

    // Format month for display
    formatMonth(monthIndex) {
      return `${this.months[monthIndex]} ${this.selectedYear}`;
    },
    
    // Transaction actions
    editTransaction(transaction) {
      // Untuk implementasi sederhana, gunakan prompt untuk mengedit jumlah
      const newAmount = prompt(`Edit jumlah untuk transaksi "${transaction.text}"`, transaction.amount);
      
      if (newAmount !== null) {
        // Parse amount dan update jika valid
        const parsedAmount = parseInt(newAmount.replace(/[^0-9]/g, ''));
        
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          // Buat salinan transaksi dengan jumlah yang diperbarui
          const updatedTransaction = {
            ...transaction,
            amount: parsedAmount
          };
          
          // Dispatch ke store
          this.$store.dispatch('updateTransaction', updatedTransaction);
          
          // Update tampilan
          this.$nextTick(() => {
            this.prepareWeeklyData();
          });
        } else {
          alert('Jumlah tidak valid. Mohon masukkan angka yang valid.');
        }
      }
    },
    
    editCategory(transaction) {
      // Get available categories based on transaction type and business type
      const businessInfo = this.$store.state.business;
      const businessType = businessInfo.type || 'personal';
      const availableCategories = getAvailableCategories(
        businessType,
        transaction.type,
        businessInfo.transactionCategories
      );
      
      if (!availableCategories || availableCategories.length === 0) {
        alert('Tidak ada kategori tersedia. Silakan atur kategori di pengaturan lebih dahulu.');
        return;
      }
      
      // Setup the category editing dialog
      this.editingCategory = {
        show: true,
        transaction: transaction,
        categories: availableCategories
      };
    },
    
    updateTransactionCategory(newCategory) {
      if (!this.editingCategory.transaction) return;
      
      if (newCategory !== this.editingCategory.transaction.category) {
        // Create updated transaction
        const updatedTransaction = {
          ...this.editingCategory.transaction,
          category: newCategory
        };
        
        // Dispatch to store
        this.$store.dispatch('updateTransaction', updatedTransaction);
        
        // Update display
        this.$nextTick(() => {
          this.prepareWeeklyData();
        });
      }
      
      // Close dialog
      this.editingCategory.show = false;
    },
    
    confirmDeleteTransaction(transaction) {
      if (confirm(`Apakah Anda yakin ingin menghapus transaksi "${transaction.text}"?`)) {
        this.deleteTransaction(transaction);
      }
    },
    
    deleteTransaction(transaction) {
      // Panggil action di store untuk menghapus transaksi
      this.$store.dispatch('deleteTransaction', transaction.id);
      
      // Update tampilan
      this.$nextTick(() => {
        this.prepareWeeklyData();
      });
    },
    
    // Month navigation methods
    previousMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11;
        this.selectedYear--;
      } else {
        this.selectedMonth--;
      }
      this.prepareWeeklyData();
    },
    
    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0;
        this.selectedYear++;
      } else {
        this.selectedMonth++;
      }
      this.prepareWeeklyData();
    },
    
    // Change year
    changeYear(delta) {
      this.selectedYear += delta;
      this.prepareWeeklyData();
    },
    
    // Select specific month
    selectMonth(monthIndex) {
      this.selectedMonth = monthIndex;
      this.showMonthPicker = false;
      this.prepareWeeklyData();
    },
    
    // Close month picker when clicking outside
    closeMonthPicker(event) {
      const picker = document.querySelector('.month-selector');
      if (picker && !picker.contains(event.target)) {
        this.showMonthPicker = false;
      }
    },
    
    calculateBarHeight(value) {
      // Create a more reasonable bar height that won't overflow
      // Max height is 180px (slightly less than chart-area height of 200px)
      const maxHeight = 180; 
      
      if (value <= 0) return 0;
      
      // Cap the height to prevent exceeding the chart area
      const calculatedHeight = (value / this.maxChartValue) * maxHeight;
      return Math.min(Math.max(5, calculatedHeight), maxHeight);
    },

    // Prepare monthly chart data - shows 6 months centered on the selected month
    prepareMonthlyChartData() {
      const monthlyData = [];
      const selectedDate = new Date(this.selectedYear, this.selectedMonth, 1);
      
      // Generate 3 months before and 2 months after selected month (total 6 months)
      for (let i = -2; i <= 3; i++) {
        const month = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + i, 1);
        monthlyData.push({
          name: month.toLocaleString('id-ID', { month: 'short' }),
          month: month.getMonth(),
          year: month.getFullYear(),
          expense: 0,
          income: 0,
          days: []
        });
      }

      // Group transactions by month
      this.filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const day = date.getDate();
        
        // Find matching month in our data
        const monthData = monthlyData.find(m => m.month === month && m.year === year);
        
        if (monthData) {
          if (transaction.type === 'expense') {
            monthData.expense += transaction.amount;
          } else {
            monthData.income += transaction.amount;
          }
          
          // Track days with data
          if (!monthData.days.includes(day)) {
            monthData.days.push(day);
          }
        }
      });

      // Always show all months regardless of data for consistency
      this.periodData = monthlyData;
      
      // Update y-axis scale
      this.updateMaxChartValue();
    },
    
    // Update max chart value for better visualization
    updateMaxChartValue() {
      // Find the largest value for better scaling
      const maxExpense = Math.max(...this.periodData.map(p => p.expense || 0));
      const maxIncome = Math.max(...this.periodData.map(p => p.income || 0));
      
      // Take the larger of max income or expense, but at least show both
      let maxValue = Math.max(maxExpense, maxIncome);
      
      // If both values should be shown together, find maximum sum in any period
      if (this.filters.type === 'all') {
        // Find max sum in any period
        const maxSum = Math.max(...this.periodData.map(p => (p.income || 0) + (p.expense || 0)));
        maxValue = Math.max(maxValue, maxSum);
      }
      
      // Set max value with some headroom (round to nearest 100k)
      this.maxChartValue = maxValue > 0 
        ? Math.ceil(maxValue / 100000) * 100000 
        : 500000;
        
      // Update y-axis ticks with better formatting
      const step = this.maxChartValue / 5;
      this.yAxisTicks = [
        this.formatSimpleAmount(this.maxChartValue),
        this.formatSimpleAmount(step * 4),
        this.formatSimpleAmount(step * 3),
        this.formatSimpleAmount(step * 2),
        this.formatSimpleAmount(step),
        '0'
      ];
      
      // Ensure the maxChartValue is at least 100,000 to prevent empty chart
      if (this.maxChartValue < 100000) {
        this.maxChartValue = 100000;
        this.yAxisTicks = ['100rb', '80rb', '60rb', '40rb', '20rb', '0'];
      }
    }
  },
  watch: {
    // Update period data when filters change
    filteredTransactions() {
      this.prepareWeeklyData();
      this.$nextTick(() => {
        this.updateMaxChartValue();
      });
    },
    
    // Update max chart value when type changes
    'filters.type'() {
      this.$nextTick(() => {
        this.updateMaxChartValue();
      });
    },
    
    // Update max chart value when period changes
    selectedPeriod() {
      this.$nextTick(() => {
        this.updateMaxChartValue();
      });
    }
  }
}
</script>

<style scoped>
.reports-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.reports-header h2 {
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

/* Tab Navigation */
.report-tabs {
  display: flex;
  border-bottom: 1px solid #e1e4e8;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  position: relative;
  transition: color 0.2s, transform 0.2s;
}

.tab-button:hover {
  color: #4361ee;
  transform: translateY(-2px);
}

.tab-button.active {
  color: #4361ee;
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #4361ee;
  animation: tabIndicator 0.3s ease-out forwards;
}

@keyframes tabIndicator {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
  will-change: transform, opacity;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #dce1e6;
  border-radius: 0.5rem;
  outline: none;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-group select:hover {
  border-color: #4361ee;
}

.filter-group select:focus {
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

/* Weekly Chart */
.weekly-chart {
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  height: 300px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.weekly-chart:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.chart-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Month selection */
.month-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.month-nav {
  width: 28px;
  height: 28px;
  border: 1px solid #dce1e6;
  border-radius: 50%;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-weight: bold;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
}

.month-nav:hover {
  background-color: #e9ecef;
  transform: scale(1.1);
}

.month-display {
  padding: 0.5rem 1rem;
  border: 1px solid #dce1e6;
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  min-width: 130px;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.month-display:hover {
  background-color: #e9ecef;
}

.dropdown-icon {
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.month-picker {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  z-index: 100;
  width: 280px;
  animation: fadeIn 0.2s ease-in-out;
}

.year-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.year-selector button {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #4361ee;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.year-selector button:hover {
  transform: scale(1.2);
}

.year-selector span {
  font-weight: 600;
  font-size: 1.1rem;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.month-button {
  padding: 0.5rem;
  border: 1px solid #dce1e6;
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.month-button:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.month-button.active {
  background-color: #4361ee;
  color: white;
  border-color: #4361ee;
  font-weight: 600;
}

/* Period selector buttons */
.period-selector {
  display: flex;
  gap: 0.5rem;
}

.period-button {
  padding: 0.5rem 1rem;
  border: 1px solid #dce1e6;
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.period-button.active {
  background-color: #4361ee;
  color: white;
  border-color: #4361ee;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.legend-color.income {
  background-color: #20c997;
}

.legend-color.expense {
  background-color: #ffc107;
}

.chart-labels {
  display: flex;
  height: 100%;
}

.y-axis-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 1rem;
  color: #6c757d;
  font-size: 0.8rem;
}

.chart-area {
  flex-grow: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  border-bottom: 1px solid #dce1e6;
  position: relative;
  padding-bottom: 0.5rem;
  overflow: hidden; /* Prevent bar overflow */
}

.chart-empty {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #6c757d;
  font-style: italic;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 15%;
}

.x-label {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
}

.bar-container {
  display: flex;
  gap: 4px;
  height: 190px; /* Slightly less than chart-area height */
  align-items: flex-end;
  overflow: hidden; /* Additional overflow prevention */
}

.expense-bar, .income-bar {
  width: 16px;
  border-radius: 3px 3px 0 0;
  transform-origin: bottom;
  transition: height 0.3s ease-out;
  max-height: 180px; /* Ensure bars don't get too tall */
}

.expense-bar {
  background-color: #ffc107;
}

.income-bar {
  background-color: #20c997;
}

.period-total {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.bar-tooltip {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  pointer-events: none;
  z-index: 999;
}

.tooltip-content {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.75rem;
  border-radius: 5px;
  font-size: 0.85rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

/* Add hover effect to bars */
.chart-bar:hover .expense-bar,
.chart-bar:hover .income-bar {
  filter: brightness(1.1);
}

.chart-bar:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}

.summary-cards {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  flex: 1;
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.summary-card.expense {
  background-color: rgba(255, 193, 7, 0.1);
}

.summary-card.income {
  background-color: rgba(32, 201, 151, 0.1);
}

.summary-card h3 {
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.summary-card p {
  font-size: 1.75rem;
  font-weight: 600;
  color: #212529;
}

.saldo-amount {
  font-size: calc(1.2rem + 0.5vw);
  font-weight: 700;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-card.expense p {
  color: #fd7e14;
}

.summary-card.income p {
  color: #20c997;
}

.data-section {
  margin-top: 1.5rem;
}

.transactions-list h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

tr {
  transition: background-color 0.2s;
}

tr:hover {
  background-color: #f8f9fa;
}

tr.income {
  background-color: rgba(32, 201, 151, 0.05);
}

tr.income td:nth-child(4) {
  color: #20c997;
  font-weight: 600;
}

tr.expense {
  background-color: rgba(253, 126, 20, 0.05);
}

tr.expense td:nth-child(4) {
  color: #fd7e14;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.edit-btn, .delete-btn, .category-btn {
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.edit-btn:hover, .delete-btn:hover, .category-btn:hover {
  opacity: 1;
  transform: scale(1.15);
}

.edit-btn {
  background-color: #e9f3ff;
}

.category-btn {
  background-color: #e8f5e9;
}

.delete-btn {
  background-color: #ffecec;
}

.edit-btn span, .delete-btn span {
  font-size: 16px;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  font-style: italic;
}

/* Donut Chart Styles */
.donut-chart-container {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.donut-chart-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.donut-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-visual {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 1rem 0;
}

.chart-svg {
  transform: rotate(-90deg);
  transition: transform 0.3s ease-out;
}

.donut-visual:hover .chart-svg {
  transform: rotate(-85deg) scale(1.05);
}

.category-indicator {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 10;
  transition: transform 0.3s;
  cursor: pointer;
}

.category-indicator:hover {
  transform: scale(1.2);
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 60%;
  transition: transform 0.3s;
}

.donut-visual:hover .donut-center {
  transform: translate(-50%, -50%) scale(1.05);
}

.center-label {
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
}

.center-amount {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  word-break: break-word;
}

.center-categories {
  color: #6c757d;
  font-size: 0.85rem;
}

.category-type-selector {
  display: flex;
  width: 100%;
  max-width: 320px;
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.type-button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background-color: #f1f3f5;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.type-button:hover {
  background-color: #e9ecef;
}

.type-button:first-child {
  border-radius: 6px 0 0 6px;
}

.type-button:last-child {
  border-radius: 0 6px 6px 0;
}

.type-button.active {
  background-color: #4361ee;
  color: white;
  font-weight: 600;
}

/* Category Breakdown */
.category-breakdown {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.category-breakdown h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.category-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 20px;
  transition: transform 0.3s;
}

.category-item:hover .category-icon {
  transform: scale(1.1);
}

.category-info {
  flex-grow: 1;
}

.category-name {
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.category-stats {
  font-size: 0.85rem;
  color: #6c757d;
}

.category-amount {
  font-weight: 700;
  color: #fd7e14;
}

/* Responsive styles */
@media (max-width: 768px) {
  .reports-container {
    padding: 1rem;
  }
  
  .reports-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .summary-cards {
    flex-direction: column;
  }
  
  .donut-visual {
    width: 200px;
    height: 200px;
  }
  
  .category-indicator {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }
  
  .data-section {
    overflow-x: auto;
  }
  
  table {
    min-width: 650px;
  }
  
  .saldo-amount {
    font-size: 1.2rem;
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
  position: relative;
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

/* Dialog is now inside the overlay */

.dialog-content {
  padding: 1rem;
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
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

/* We're now using dialog-content instead of dialog-body */

.dialog-body label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
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
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

.cancel-btn, .save-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background-color: #f8f9fa;
}

.save-btn {
  background-color: var(--primary-color);
}

/* For very small screens */
@media (max-width: 480px) {
  .reports-container {
    padding: 0.75rem;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .month-selector {
    width: 100%;
    justify-content: space-between;
  }
  
  .month-display {
    flex: 1;
  }
  
  .month-picker {
    width: 240px;
    left: 0;
    transform: none;
  }
  
  .period-selector {
    width: 100%;
    justify-content: space-between;
  }
  
  .period-button {
    flex: 1;
    text-align: center;
  }
  
  .chart-legend {
    justify-content: center;
  }
  
  .donut-visual {
    width: 180px;
    height: 180px;
  }
  
  .category-indicator {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }
  
  .center-amount {
    font-size: 1rem;
  }
  
  .category-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .category-name {
    font-size: 0.9rem;
  }
  
  .category-stats {
    font-size: 0.8rem;
  }
  
  .category-amount {
    font-size: 0.9rem;
  }
  
  .summary-card {
    padding: 1rem;
  }
  
  .saldo-amount {
    font-size: 1rem;
  }
  
  /* Ensure bars are smaller on small screens */
  .expense-bar, .income-bar {
    width: 12px;
    max-height: 150px;
  }
  
  .bar-container {
    height: 160px;
  }
}
</style>