<template>
  <div class="ghl-user-info">
    <div class="info-card">
      <div class="card-header">
        <h3>🏢 GHL Account Information</h3>
        <div class="header-indicators">
          <div class="status-indicator" :class="{ 'connected': userContext.hasValidToken, 'disconnected': !userContext.hasValidToken }">
            {{ userContext.hasValidToken ? 'OAuth Connected' : 'OAuth Pending' }}
          </div>
          <div class="data-indicator" :class="{ 'live': isDynamicData, 'static': !isDynamicData }">
            {{ isDynamicData ? '🔐 SECURE' : '📊 BASIC' }}
          </div>
        </div>
      </div>
      
      <div class="card-content">
        <div v-if="loading" class="loading">
          <p>Loading user information...</p>
        </div>
        
        <div v-else class="info-grid">
          <div class="info-item">
            <label>Company ID:</label>
            <span class="value">{{ userContext.identifiers?.companyId || 'Not Available' }}</span>
          </div>
          
          <div class="info-item">
            <label>Location ID:</label>
            <span class="value">{{ userContext.identifiers?.locationId || 'Not Available' }}</span>
          </div>
          
          <div class="info-item" v-if="userContext.identifiers?.userId">
            <label>User ID:</label>
            <span class="value success">{{ userContext.identifiers.userId }}</span>
          </div>
          
          <div class="info-item" v-if="userContext.identifiers?.userName">
            <label>User Name:</label>
            <span class="value success">{{ userContext.identifiers.userName }}</span>
          </div>
          
          <div class="info-item" v-if="userContext.identifiers?.userEmail">
            <label>User Email:</label>
            <span class="value success">{{ userContext.identifiers.userEmail }}</span>
          </div>
          
          <div class="info-item" v-if="userContext.userRole">
            <label>User Role:</label>
            <span class="value success">{{ userContext.userRole }}</span>
          </div>
          
          <div class="info-item" v-if="userContext.userType">
            <label>Context Type:</label>
            <span class="value" :class="{ 'success': userContext.userType === 'agency', 'warning': userContext.userType !== 'agency' }">
              {{ userContext.userType === 'agency' ? 'Agency User' : userContext.userType }}
            </span>
          </div>
          
          <div class="info-item">
            <label>Installation Status:</label>
            <span class="value" :class="{ 'success': userContext.installationExists, 'warning': !userContext.installationExists }">
              {{ userContext.installationExists ? 'Installed' : 'Not Installed' }}
            </span>
          </div>
          
          <div class="info-item">
            <label>Token Status:</label>
            <span class="value" :class="{ 'success': userContext.hasValidToken, 'error': !userContext.hasValidToken }">
              {{ userContext.hasValidToken ? 'Valid Token' : 'No Valid Token' }}
            </span>
          </div>
          
          <div class="info-item">
            <label>App Status:</label>
            <span class="value success">{{ userContext.appStatus || 'Active' }}</span>
          </div>
        </div>
        
        <div class="actions">
          <button @click="refreshUserContext" class="refresh-btn" :disabled="loading">
            {{ loading ? 'Refreshing...' : '🔄 Refresh Data' }}
          </button>
          
          <button v-if="!userContext.installationExists" @click="installApp" class="install-btn">
            📱 Install App
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <h4>⚠️ Error:</h4>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GHLUserInfo',
  data() {
    return {
      userContext: {
        identifiers: {
          companyId: null,
          locationId: null,
          userId: null,
          userName: null,
          userEmail: null
        },
        userRole: null,
        userType: null,
        installationExists: false,
        hasValidToken: false,
        appStatus: 'unknown'
      },
      loading: false,
      error: null,
      isDynamicData: false,
      refreshInterval: null
    }
  },
  
  mounted() {
    this.loadUserContext();
    
    // Set up periodic refresh (reduced frequency)
    this.refreshInterval = setInterval(() => {
      if (!this.isDynamicData || !this.hasValidUserData()) {
        this.loadUserContext();
      }
    }, 30000); // Check every 30 seconds
  },
  
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  
  methods: {
    async loadUserContext() {
      this.loading = true;
      this.error = null;
      
      try {
        // Try GHL Shared Secret authentication
        const sharedSecretData = await this.getGHLUserData();
        
        if (sharedSecretData) {
          this.userContext.identifiers = {
            companyId: sharedSecretData.companyId,
            locationId: sharedSecretData.activeLocation,
            userId: sharedSecretData.userId,
            userName: sharedSecretData.userName,
            userEmail: sharedSecretData.email
          };
          
          this.userContext.userRole = sharedSecretData.role;
          this.userContext.userType = sharedSecretData.type;
          this.isDynamicData = true;
          
          // Reduce polling frequency since we have official data
          if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(() => {
              if (!this.hasValidUserData()) {
                this.loadUserContext();
              }
            }, 60000); // Check every 60 seconds
          }
          
          await this.checkInstallationStatus();
          
        } else {
          // Fallback to basic context extraction
          this.extractBasicContext();
        }
        
      } catch (error) {
        this.error = `Authentication failed: ${error.message}`;
        this.extractBasicContext();
        
      } finally {
        this.loading = false;
      }
    },

    async getGHLUserData() {
      try {
        // Request encrypted user data from GHL parent window
        const encryptedUserData = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Authentication timeout')), 5000);

          window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');

          const messageHandler = ({ data }) => {
            if (data && data.message === 'REQUEST_USER_DATA_RESPONSE') {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              resolve(data.payload);
            }
          };

          window.addEventListener('message', messageHandler);
        });

        if (!encryptedUserData) {
          throw new Error('No user data received');
        }

        // Decrypt data using backend
        const response = await fetch('/decrypt-user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedData: encryptedUserData })
        });

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status}`);
        }

        const result = await response.json();
        return result.success ? result.userData : null;

      } catch (error) {
        return null;
      }
    },

    async checkInstallationStatus() {
      try {
        if (!this.userContext.identifiers.companyId && !this.userContext.identifiers.locationId) {
          return;
        }

        const params = new URLSearchParams();
        if (this.userContext.identifiers.companyId) {
          params.set('companyId', this.userContext.identifiers.companyId);
        }
        if (this.userContext.identifiers.locationId) {
          params.set('locationId', this.userContext.identifiers.locationId);
        }

        const response = await fetch(`/api/user-context?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          this.userContext.installationExists = data.userContext.installationExists;
          this.userContext.hasValidToken = data.userContext.hasValidToken;
          this.userContext.appStatus = data.userContext.appStatus;
        }

      } catch (error) {
        // Silently fail - not critical
      }
    },

    hasValidUserData() {
      const hasUserId = !!this.userContext.identifiers?.userId;
      const hasUserName = !!this.userContext.identifiers?.userName;
      const hasEmail = !!this.userContext.identifiers?.userEmail;
      const hasCompanyId = !!this.userContext.identifiers?.companyId;
      
      return hasUserId && hasUserName && hasEmail && hasCompanyId;
    },
    
    extractBasicContext() {
      // Only run fallback extraction if we don't already have good official data
      if (this.isDynamicData && this.hasValidUserData()) {
        return;
      }
      
      try {
        // Extract from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        
        const companyId = urlParams.get('companyId') || hashParams.get('companyId');
        const locationId = urlParams.get('locationId') || hashParams.get('locationId');
        const userId = urlParams.get('userId') || hashParams.get('userId');

        // Extract from URL path
        const pathMatches = window.location.pathname.match(/\/location\/([^/]+)|\/company\/([^/]+)/);
        const pathLocationId = pathMatches && pathMatches[1];
        const pathCompanyId = pathMatches && pathMatches[2];

        // Update user context with any found data
        this.userContext.identifiers = {
          companyId: companyId || pathCompanyId,
          locationId: locationId || pathLocationId,
          userId: userId,
          userName: null,
          userEmail: null
        };

        this.userContext.appStatus = 'active';
        this.isDynamicData = false;
        
      } catch (error) {
        // Set minimal fallback data
        this.userContext.identifiers = {
          companyId: null,
          locationId: null,
          userId: null,
          userName: null,
          userEmail: null
        };
        this.userContext.appStatus = 'active';
        this.isDynamicData = false;
      }
    },

    refreshUserContext() {
      this.loadUserContext();
    },

    installApp() {
      // Redirect to installation flow
      window.open('https://marketplace.gohighlevel.com/install', '_blank');
    }
  }
}
</script>

<style scoped>
.ghl-user-info {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-indicators {
  display: flex;
  gap: 12px;
}

.status-indicator, .data-indicator {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-indicator.connected {
  background: rgba(34, 197, 94, 0.2);
  color: #059669;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-indicator.disconnected {
  background: rgba(239, 68, 68, 0.2);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.data-indicator.live {
  background: rgba(34, 197, 94, 0.2);
  color: #059669;
  border: 1px solid rgba(34, 197, 94, 0.3);
  animation: pulse 2s infinite;
}

.data-indicator.static {
  background: rgba(156, 163, 175, 0.2);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.card-content {
  padding: 30px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #e2e8f0;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  margin-right: 15px;
}

.info-item .value {
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background: #e5e7eb;
  color: #1f2937;
}

.info-item .value.success {
  background: #d1fae5;
  color: #065f46;
}

.info-item .value.warning {
  background: #fef3c7;
  color: #92400e;
}

.info-item .value.error {
  background: #fee2e2;
  color: #991b1b;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.refresh-btn, .install-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.install-btn {
  background: #10b981;
  color: white;
}

.install-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

.error-message {
  margin-top: 20px;
  padding: 20px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}

.error-message h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.error-message p {
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .ghl-user-info {
    padding: 15px;
  }
  
  .card-header {
    padding: 15px;
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>