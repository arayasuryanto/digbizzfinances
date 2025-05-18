<template>
  <div class="network-status-container" v-if="!isNetworkAvailable">
    <div class="network-status-indicator" :class="statusClass">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-message">{{ statusMessage }}</span>
      <button v-if="showRetryButton" @click="retry" class="retry-button">
        Retry
      </button>
      <span v-if="isRetrying" class="retry-spinner"></span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import networkMonitor from '../utils/networkMonitor';

export default {
  name: 'NetworkStatus',
  data() {
    return {
      isRetrying: false
    };
  },
  computed: {
    ...mapGetters(['isOnline', 'isApiConnected', 'networkError']),
    
    isNetworkAvailable() {
      return this.isOnline && this.isApiConnected && !this.networkError;
    },
    
    statusClass() {
      if (!this.isOnline) return 'offline';
      if (!this.isApiConnected) return 'api-error';
      if (this.networkError) return 'error';
      return '';
    },
    
    statusIcon() {
      if (!this.isOnline) return '📡';
      if (!this.isApiConnected) return '🔌';
      if (this.networkError) return '⚠️';
      return '✓';
    },
    
    statusMessage() {
      if (!this.isOnline) return 'You are offline. Please check your internet connection.';
      if (!this.isApiConnected) return 'Cannot connect to server. Please try again later.';
      if (this.networkError) return `Error: ${this.networkError}`;
      return '';
    },
    
    showRetryButton() {
      return !this.isOnline || !this.isApiConnected || this.networkError;
    }
  },
  
  methods: {
    retry() {
      this.isRetrying = true;
      
      // Try to reconnect or clear error
      networkMonitor.checkApiConnection()
        .then(connected => {
          if (connected) {
            this.$store.dispatch('clearNetworkError');
          }
        })
        .finally(() => {
          this.isRetrying = false;
        });
    }
  },
  
  mounted() {
    // Start network monitoring when component is mounted
    networkMonitor.startMonitoring();
  },
  
  beforeUnmount() {
    // Stop monitoring when component is destroyed
    networkMonitor.stopMonitoring();
  }
};
</script>

<style scoped>
.network-status-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  padding: 8px;
  pointer-events: none;
}

.network-status-indicator {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  max-width: 90%;
  pointer-events: auto;
}

.network-status-indicator.offline {
  border-left: 4px solid #f44336;
}

.network-status-indicator.api-error {
  border-left: 4px solid #ff9800;
}

.network-status-indicator.error {
  border-left: 4px solid #e91e63;
}

.status-icon {
  margin-right: 8px;
  font-size: 1.1rem;
}

.status-message {
  font-size: 0.9rem;
  color: #333;
}

.retry-button {
  margin-left: 12px;
  padding: 4px 8px;
  border: none;
  background-color: var(--primary-color);
  color: var(--text-dark);
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: var(--primary-dark);
}

.retry-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  margin-left: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .network-status-indicator {
    padding: 8px 12px;
    max-width: 95%;
  }
  
  .status-message {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .network-status-container {
    padding: 6px;
  }
  
  .network-status-indicator {
    padding: 8px 10px;
    max-width: 98%;
    flex-wrap: wrap;
  }
  
  .status-icon {
    margin-right: 6px;
    font-size: 1rem;
  }
  
  .status-message {
    font-size: 0.75rem;
    flex: 1 0 100%;
    margin-bottom: 6px;
  }
  
  .retry-button {
    margin-left: auto;
    margin-right: auto;
    margin-top: 5px;
    padding: 5px 10px;
  }
}
</style>