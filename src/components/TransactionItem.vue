<template>
  <div class="transaction-item" :class="[transaction.type, {'needs-review': transaction.needs_review}]" @click="showCategoryEditOptions">
    <div class="transaction-details">
      <span class="transaction-category">{{ getCategoryTranslation(transaction.category) }}
        <span class="edit-icon" title="Ubah kategori">✏️</span>
      </span>
      <span class="transaction-subcategories" v-if="transaction.subCategories && transaction.subCategories.length > 0">
        {{ getSubcategoryLabels(transaction.subCategories) }}
      </span>
      <span class="transaction-date">{{ transaction.formatted_date }}</span>
      <p class="transaction-text">{{ truncatedText }}</p>
    </div>
    <div class="transaction-amount">
      <span>{{ transaction.type === 'income' ? '+' : '-' }}{{ formatRupiah(transaction.amount) }}</span>
      <div class="confidence-indicator" v-if="showConfidence" :style="{width: (transaction.confidence * 100) + '%'}"></div>
    </div>
    
    <!-- Category Edit Dialog -->
    <div v-if="showCategoryDialog" class="category-edit-dialog">
      <div class="dialog-header">
        <h3>Ubah Kategori</h3>
        <button class="close-btn" @click.stop="showCategoryDialog = false">×</button>
      </div>
      <div class="dialog-content">
        <div class="category-options">
          <span v-for="(category, index) in availableCategories" 
                :key="index" 
                class="category-option" 
                :class="{selected: category === transaction.category}"
                @click.stop="updateCategory(category)">
            {{ getCategoryTranslation(category) }}
          </span>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="save-btn" @click.stop="showCategoryDialog = false">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script>
import { CATEGORY_TRANSLATIONS, SUBCATEGORIES } from '../utils/transactionParser';
import { getAvailableCategories } from '../utils/businessCategories';
import { formatRupiah } from '../utils/formatting';

export default {
  name: 'TransactionItem',
  props: {
    transaction: {
      type: Object,
      required: true
    },
    maxLength: {
      type: Number,
      default: 80
    },
    showConfidence: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showCategoryDialog: false
    };
  },
  computed: {
    truncatedText() {
      if (this.transaction.text.length <= this.maxLength) {
        return this.transaction.text;
      }
      return this.transaction.text.substring(0, this.maxLength) + '...';
    },
    availableCategories() {
      // Get available categories based on transaction type and business type
      const businessInfo = this.$store.state.business;
      const businessType = businessInfo.type || 'personal';
      
      return getAvailableCategories(
        businessType, 
        this.transaction.type, 
        businessInfo.transactionCategories
      );
    }
  },
  methods: {
    getCategoryTranslation(category) {
      return CATEGORY_TRANSLATIONS[category] || category;
    },
    getSubcategoryLabels(subCategories) {
      if (!subCategories || subCategories.length === 0) return '';
      
      // Create a readable list of subcategories
      return subCategories.map(sub => {
        // Display subcategory in a more readable format
        return sub.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }).join(', ');
    },
    showCategoryEditOptions() {
      this.showCategoryDialog = true;
    },
    updateCategory(newCategory) {
      if (newCategory === this.transaction.category) return;
      
      // Create an updated transaction object
      const updatedTransaction = {
        ...this.transaction,
        category: newCategory
      };
      
      // Dispatch to store to update the transaction
      this.$store.dispatch('updateTransaction', updatedTransaction);
      
      // Close the dialog
      this.showCategoryDialog = false;
    },
    formatRupiah
  }
}
</script>

<style scoped>
.transaction-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
  position: relative;
  overflow: hidden;
}

.transaction-item.income {
  border-left: 4px solid #28a745;
}

.transaction-item.expense {
  border-left: 4px solid #dc3545;
}

.transaction-item.needs-review {
  border-left: 4px solid #ffc107;
  background-color: #fffbf0;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 70%;
}

.transaction-category {
  font-weight: 600;
  font-size: 1rem;
  color: #212529;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.edit-icon {
  font-size: 0.75rem;
  margin-left: 0.5rem;
  opacity: 0.5;
  visibility: hidden;
}

.transaction-item:hover .edit-icon {
  visibility: visible;
}

.transaction-subcategories {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
  word-break: break-word;
}

.transaction-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.transaction-text {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #495057;
  word-break: break-word;
}

.transaction-amount {
  font-weight: 700;
  font-size: 1.1rem;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 30%;
}

.income .transaction-amount {
  color: #28a745;
}

.expense .transaction-amount {
  color: #dc3545;
}

.needs-review .transaction-amount {
  color: #ffc107;
}

.confidence-indicator {
  height: 3px;
  background-color: currentColor;
  margin-top: 5px;
  transition: width 0.3s ease;
  max-width: 100%;
  opacity: 0.6;
}

/* Category Edit Dialog Styles */
.category-edit-dialog {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
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
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
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
  padding: 0.75rem 1rem;
  border-top: 1px solid #e9ecef;
}

.save-btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.save-btn:hover {
  background-color: var(--primary-dark);
}

@media (max-width: 768px) {
  .transaction-item {
    flex-direction: column;
  }
  
  .transaction-details,
  .transaction-amount {
    width: 100%;
  }
  
  .transaction-amount {
    margin-top: 0.5rem;
    align-items: flex-start;
  }
  
  /* Make edit icon visible on mobile */
  .edit-icon {
    visibility: visible;
    opacity: 0.7;
    font-size: 0.85rem;
    margin-left: 0.3rem;
  }
  
  /* Improve touch target size */
  .transaction-category {
    padding: 5px 0;
  }
  
  /* Optimize category dialog for mobile */
  .category-edit-dialog {
    position: fixed;
    width: 95%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 400px;
    max-height: 85vh;
    overflow-y: auto;
    z-index: 1000;
  }
  
  .category-options {
    gap: 0.4rem;
  }
  
  .category-option {
    padding: 0.7rem 0.8rem;
    flex: 1 0 45%;
    text-align: center;
    white-space: normal;
  }
  
  .dialog-footer {
    justify-content: center;
  }
  
  .close-btn {
    padding: 0.5rem;
  }
  
  .save-btn {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
  }
}
@media (max-width: 480px) {
  .transaction-category {
    font-size: 0.95rem;
  }
  
  .transaction-subcategories,
  .transaction-date {
    font-size: 0.75rem;
  }
  
  .transaction-text {
    font-size: 0.85rem;
  }
  
  .transaction-amount {
    font-size: 1rem;
  }
  
  .category-option {
    font-size: 0.9rem;
    padding: 0.6rem 0.7rem;
    flex: 1 0 40%;
  }
  
  .dialog-header h3 {
    font-size: 1rem;
  }
}

@media (max-width: 360px) {
  .transaction-item {
    padding: 0.8rem;
  }
  
  .transaction-category {
    font-size: 0.9rem;
  }
  
  .category-option {
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
  }
}
</style>