import api from '../services/api';
import store from '../store'; // Assuming you have a Vuex store

/**
 * Utility to check API connection and monitor network status
 */
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.apiConnected = false;
    this.checkInterval = null;
    
    // Listen for browser online/offline events
    window.addEventListener('online', this.handleConnectionChange.bind(this));
    window.addEventListener('offline', this.handleConnectionChange.bind(this));
  }
  
  /**
   * Handle online/offline status changes
   */
  handleConnectionChange() {
    this.isOnline = navigator.onLine;
    if (this.isOnline) {
      // We're back online, check API connection
      this.checkApiConnection();
    } else {
      this.apiConnected = false;
      // Dispatch an action to show offline status
      if (store && store.dispatch) {
        store.dispatch('setNetworkStatus', { 
          online: false, 
          apiConnected: false 
        });
      }
    }
  }
  
  /**
   * Check if the API server is available
   */
  async checkApiConnection() {
    try {
      const response = await api.axios.get('/', { timeout: 5000 });
      this.apiConnected = response.status === 200;
    } catch (error) {
      this.apiConnected = false;
      console.warn('API connection check failed:', error.message);
    }
    
    // Dispatch an action to update network status
    if (store && store.dispatch) {
      store.dispatch('setNetworkStatus', { 
        online: this.isOnline, 
        apiConnected: this.apiConnected 
      });
    }
    
    return this.apiConnected;
  }
  
  /**
   * Start periodic connection monitoring
   */
  startMonitoring(intervalMs = 30000) {
    // Clear any existing interval
    this.stopMonitoring();
    
    // Do an initial check
    this.checkApiConnection();
    
    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      if (this.isOnline) {
        this.checkApiConnection();
      }
    }, intervalMs);
    
    return this;
  }
  
  /**
   * Stop connection monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    return this;
  }
  
  /**
   * Get current network status
   */
  getStatus() {
    return {
      online: this.isOnline,
      apiConnected: this.apiConnected
    };
  }
}

// Export a singleton instance
export default new NetworkMonitor();