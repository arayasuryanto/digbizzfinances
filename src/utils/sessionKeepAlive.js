/**
 * Session Keep-Alive Utility
 * 
 * This utility prevents session timeouts by:
 * 1. Periodically checking if the user is logged in
 * 2. Refreshing the token if needed
 * 3. Making sure localStorage data isn't accidentally cleared
 */

// Check if user is active every 20 seconds
const HEARTBEAT_INTERVAL = 20 * 1000;

class SessionKeepAlive {
  constructor() {
    this.interval = null;
    this.tokenBackup = null;
    this.userBackup = null;
  }

  start() {
    // Backup authentication data
    this.backupAuthData();
    
    // Start heartbeat
    this.interval = setInterval(() => {
      this.heartbeat();
    }, HEARTBEAT_INTERVAL);
    
    // Log start
    console.log('Session keep-alive started');
    
    // Run immediately
    this.heartbeat();
    
    // Add event listeners for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
  
  // Backup important authentication data
  backupAuthData() {
    this.tokenBackup = localStorage.getItem('token');
    this.userBackup = localStorage.getItem('user');
    
    // Also save backups in sessionStorage as an extra precaution
    if (this.tokenBackup) {
      sessionStorage.setItem('tokenBackup', this.tokenBackup);
    }
    
    if (this.userBackup) {
      sessionStorage.setItem('userBackup', this.userBackup);
    }
  }
  
  // Handle page visibility changes
  handleVisibilityChange() {
    if (!document.hidden) {
      // Page is visible again, check auth immediately
      console.log('Page visible, checking auth state');
      this.heartbeat();
    }
  }

  // The heartbeat function
  heartbeat() {
    // Check if user is still logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Simple backup and restore logic - less aggressive to fix login issues
    
    // Save backups if we have valid data
    if (token) {
      this.tokenBackup = token;
      sessionStorage.setItem('tokenBackup', token);
    }
    
    if (user) {
      this.userBackup = user;
      sessionStorage.setItem('userBackup', user);
    }
    
    // Only restore from backup if completely missing
    if (!token && this.tokenBackup) {
      console.log('Token missing, restoring from backup');
      localStorage.setItem('token', this.tokenBackup);
    }
    
    if (!user && this.userBackup) {
      console.log('User data missing, restoring from backup');
      localStorage.setItem('user', this.userBackup);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    console.log('Session keep-alive stopped');
  }
}

// Create and export an instance
export const sessionKeepAlive = new SessionKeepAlive();
export default sessionKeepAlive;