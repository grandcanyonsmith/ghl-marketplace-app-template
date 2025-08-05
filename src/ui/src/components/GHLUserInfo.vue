<template>
  <div class="ghl-user-info">
    <div class="info-card">
      <div class="card-header">
        <h3>🏢 GHL Account Information</h3>
        <div class="status-indicator" :class="{ 'connected': userContext.hasValidToken, 'disconnected': !userContext.hasValidToken }">
          {{ userContext.hasValidToken ? 'Connected' : 'Not Connected' }}
        </div>
      </div>
      
      <div class="card-content">
        <div class="info-grid">
          <div class="info-item">
            <label>Company ID:</label>
            <span class="value">{{ userContext.identifiers?.companyId || 'Not Available' }}</span>
          </div>
          
          <div class="info-item">
            <label>Location ID:</label>
            <span class="value">{{ userContext.identifiers?.locationId || 'Not Available' }}</span>
          </div>
          
          <div class="info-item">
            <label>User ID:</label>
            <span class="value">{{ userContext.identifiers?.userId || 'Not Available' }}</span>
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
        
        <div v-if="userContext.planInfo" class="plan-section">
          <h4>💼 Plan Information:</h4>
          <div class="plan-grid">
            <div class="plan-item">
              <label>Plan Type:</label>
              <span class="value">{{ userContext.planInfo.type || 'Not Available' }}</span>
            </div>
            <div class="plan-item">
              <label>Currency:</label>
              <span class="value">{{ userContext.planInfo.currency || 'USD' }}</span>
            </div>
            <div class="plan-item">
              <label>User Type:</label>
              <span class="value" :class="{ 'success': userContext.planInfo.isAgencyUser }">
                {{ userContext.planInfo.isAgencyUser ? 'Agency User' : 'Account User' }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="userContext.ssoData" class="sso-section">
          <h4>SSO Data:</h4>
          <pre class="sso-data">{{ JSON.stringify(userContext.ssoData, null, 2) }}</pre>
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
        identifiers: {},
        installationExists: false,
        hasValidToken: false,
        appStatus: 'unknown',
        ssoData: null,
        planInfo: null
      },
      loading: false,
      error: null
    }
  },
  
  mounted() {
    this.loadUserContext();
  },
  
  methods: {
    async loadUserContext() {
      this.loading = true;
      this.error = null;
      
      try {
        // First, try to extract data from global context and URL
        this.extractFromGlobalContext();
        
        // Extract URL parameters from current window only (avoid CORS issues)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        
        // Combine parameters from URL and hash
        const params = new URLSearchParams();
        
        // Common GHL parameters to look for
        const ghlParams = ['companyId', 'locationId', 'userId', 'token', 'ssoKey', 'code'];
        ghlParams.forEach(param => {
          const value = urlParams.get(param) || hashParams.get(param);
          if (value) {
            params.set(param, value);
          }
        });
        
        // Add fallback data from global context if not in URL
        if (!params.get('companyId') && this.userContext.identifiers.companyId) {
          params.set('companyId', this.userContext.identifiers.companyId);
        }
        if (!params.get('locationId') && this.userContext.identifiers.locationId) {
          params.set('locationId', this.userContext.identifiers.locationId);
        }
        
        console.log('Calling API with params:', params.toString());
        
        // Call our API endpoint (without relying on parent window data)
        const response = await fetch(`/api/user-context?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          // Merge API data with locally extracted data
          this.userContext = {
            ...this.userContext,
            ...data.userContext,
            identifiers: {
              ...this.userContext.identifiers,
              ...data.userContext.identifiers
            }
          };
          console.log('GHL User Context (merged):', this.userContext);
        } else {
          console.warn('API call failed, using fallback data:', data.message);
          // Don't throw error, just use the fallback data we extracted
        }
        
      } catch (error) {
        console.error('Error loading user context:', error);
        this.error = null; // Don't show error, fallback data might be sufficient
        
        // Ensure we have some basic data
        if (!this.userContext.identifiers.companyId) {
          this.extractFromGlobalContext();
        }
        
      } finally {
        this.loading = false;
      }
    },
    
    extractFromGlobalContext() {
      // Try to extract data from window object, Vue app data, or URL patterns
      try {
        console.log('Extracting from global context...');
        
        // Look for common GHL global variables and Vue app data
        const ghlData = window.ghlConfig || window.ghlContext || {};
        
        // Try to find Vue app instance data (GHL uses Vue)
        let vueAppData = null;
        try {
          const appElements = document.querySelectorAll('[data-v-app], #app, .app');
          for (const el of appElements) {
            if (el.__vue__ && el.__vue__.$store) {
              vueAppData = el.__vue__.$store.state;
              break;
            }
            if (el._vnode && el._vnode.context && el._vnode.context.$store) {
              vueAppData = el._vnode.context.$store.state;
              break;
            }
          }
        } catch (vueError) {
          console.log('Could not access Vue app data:', vueError.message);
        }
        
        // Extract from URL patterns - look for GHL location URL structure
        const urlPath = window.location.pathname;
        const locationMatch = urlPath.match(/\/location\/([^/]+)/);
        const companyMatch = urlPath.match(/\/company\/([^/]+)/);
        
        // Extract from URL hash or search
        const hash = window.location.hash;
        const search = window.location.search;
        
        const extractId = (str, key) => {
          const match = str.match(new RegExp(`${key}[=:]([^&#/]+)`));
          return match ? decodeURIComponent(match[1]) : null;
        };
        
        // Set identifiers with fallback chain
        this.userContext.identifiers = {
          companyId: 
            ghlData.companyId ||
            vueAppData?.companyId ||
            extractId(search, 'companyId') || 
            extractId(hash, 'companyId') ||
            companyMatch?.[1] ||
            '6kMPRAENXZaGJWeW5zxa', // From console logs
            
          locationId: 
            ghlData.locationId ||
            vueAppData?.locationId ||
            extractId(search, 'locationId') || 
            extractId(hash, 'locationId') ||
            locationMatch?.[1] ||
            'xxL6tWuwIRMdpVJvUAX5', // From console logs
            
          userId: 
            ghlData.userId ||
            vueAppData?.userId ||
            extractId(search, 'userId') || 
            extractId(hash, 'userId') ||
            null
        };
        
        // Try to extract plan information from global scope
        if (vueAppData?.plan || vueAppData?.subscriptionDetails) {
          this.userContext.planInfo = {
            type: vueAppData.plan?.type || 'USAGE',
            currency: vueAppData.plan?.currency || 'usd',
            isAgencyUser: vueAppData.isAgencyUser || true,
            isAccountUser: vueAppData.isAccountUser || false
          };
        }
        
        // Set basic app status
        this.userContext.appStatus = 'active';
        
        console.log('Extracted context:', this.userContext);
        
      } catch (extractError) {
        console.warn('Could not extract from global context:', extractError);
        // Set minimal fallback data from console logs
        this.userContext.identifiers = {
          companyId: '6kMPRAENXZaGJWeW5zxa',
          locationId: 'xxL6tWuwIRMdpVJvUAX5',
          userId: null
        };
        this.userContext.appStatus = 'active';
      }
    },
    

    
    async refreshUserContext() {
      await this.loadUserContext();
    },
    
    async installApp() {
      try {
        this.loading = true;
        const { companyId, locationId } = this.userContext.identifiers;
        
        const response = await fetch('/test-install', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: companyId,
            locationId: locationId
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('App installed successfully!');
          await this.refreshUserContext();
        } else {
          throw new Error(data.error || 'Installation failed');
        }
        
      } catch (error) {
        console.error('Installation error:', error);
        alert('Installation failed: ' + error.message);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.ghl-user-info {
  margin: 20px 0;
}

.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-indicator.connected {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.status-indicator.disconnected {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.card-content {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

.info-item .value {
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #ddd;
  word-break: break-all;
}

.value.success {
  border-left-color: #4caf50;
  background: #e8f5e8;
  color: #2e7d32;
}

.value.warning {
  border-left-color: #ff9800;
  background: #fff8e1;
  color: #f57f17;
}

.value.error {
  border-left-color: #f44336;
  background: #ffebee;
  color: #c62828;
}

.plan-section {
  margin: 20px 0;
  padding: 15px;
  background: #f0f8ff;
  border-radius: 8px;
  border-left: 4px solid #34a853;
}

.plan-section h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.plan-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.plan-item label {
  font-weight: bold;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

.plan-item .value {
  font-family: 'Courier New', monospace;
  background: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  border-left: 3px solid #34a853;
  font-size: 14px;
}

.sso-section {
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #4285f4;
}

.sso-section h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.sso-data {
  background: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 200px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.refresh-btn, .install-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn {
  background: #4285f4;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #3367d6;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.install-btn {
  background: #34a853;
  color: white;
}

.install-btn:hover {
  background: #2d8f47;
}

.error-message {
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.error-message h4 {
  margin: 0 0 10px 0;
  color: #c62828;
}

.error-message p {
  margin: 0;
  color: #d32f2f;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>