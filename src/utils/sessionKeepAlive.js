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
    
    // If token or user data is missing but we have backups, restore them
    if (!token && this.tokenBackup) {
      console.log('Token missing, restoring from backup');
      localStorage.setItem('token', this.tokenBackup);
    } else if (token) {
      // If we have a token, update our backup only if different
      if (this.tokenBackup !== token) {
        this.tokenBackup = token;
        sessionStorage.setItem('tokenBackup', token);
      }
    }
    
    if (!user && this.userBackup) {
      console.log('User data missing, restoring from backup');
      localStorage.setItem('user', this.userBackup);
    } else if (user) {
      // If we have user data, update our backup only if different
      if (this.userBackup !== user) {
        this.userBackup = user;
        sessionStorage.setItem('userBackup', user);
      }
    }
    
    // Validate the current or restored token
    if (token) {
      try {
        // Simple check: Does it have 3 parts separated by dots?
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.warn('Invalid token format detected, clearing it');
          localStorage.removeItem('token');
          
          // If we have a backup with the correct format, restore it
          if (this.tokenBackup && this.tokenBackup.split('.').length === 3) {
            localStorage.setItem('token', this.tokenBackup);
          }
        }
      } catch (e) {
        console.error('Error validating token:', e);
      }
    }
    
    // If we have a valid user object, ensure it's consistent
    if (user) {
      try {
        // Try to parse the user
        const userObj = JSON.parse(user);
        if (!userObj || !userObj.id) {
          console.warn('Invalid user data detected');
          
          // If we have valid backup user data, restore it
          if (this.userBackup) {
            try {
              const backupUser = JSON.parse(this.userBackup);
              if (backupUser && backupUser.id) {
                localStorage.setItem('user', this.userBackup);
                console.log('Restored valid user data from backup');
              }
            } catch (e) {
              console.error('Error parsing backup user data:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Check for last-resort backups in sessionStorage
    if (!localStorage.getItem('token') && sessionStorage.getItem('tokenBackup')) {
      console.log('Token missing, restoring from session storage');
      localStorage.setItem('token', sessionStorage.getItem('tokenBackup'));
      this.tokenBackup = sessionStorage.getItem('tokenBackup');
    }
    
    if (!localStorage.getItem('user') && sessionStorage.getItem('userBackup')) {
      console.log('User data missing, restoring from session storage');
      localStorage.setItem('user', sessionStorage.getItem('userBackup'));
      this.userBackup = sessionStorage.getItem('userBackup');
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