<template>
  <div class="ghl-user-info">
    <div class="info-card">
      <div class="card-header">
        <h3>🚀 GHL CustomJS Utilities</h3>
        <div class="header-indicators">
          <div class="status-indicator" :class="{ 'connected': userContext.hasValidToken, 'disconnected': !userContext.hasValidToken }">
            {{ userContext.hasValidToken ? 'OAuth Connected' : 'OAuth Pending' }}
          </div>
          <div class="data-indicator" :class="{ 'live': isDynamicData, 'static': !isDynamicData }">
            {{ isDynamicData ? '🚀 LIVE API' : '📊 FALLBACK' }}
          </div>
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
        
        <!-- Company Information Section -->
        <div v-if="userContext.companyData" class="plan-section">
          <h4>🏢 Company Information</h4>
          <div class="plan-grid">
            <div class="plan-item" v-if="userContext.companyData?.name">
              <label>Company Name:</label>
              <span class="value success">{{ userContext.companyData.name }}</span>
            </div>
            <div class="plan-item" v-if="userContext.companyData?.id">
              <label>Company ID:</label>
              <span class="value">{{ userContext.companyData.id }}</span>
            </div>
          </div>
        </div>

        <!-- Location Information Section -->
        <div v-if="userContext.locationData" class="plan-section">
          <h4>📍 Location Information</h4>
          <div class="plan-grid">
            <div class="plan-item" v-if="userContext.locationData?.name">
              <label>Location Name:</label>
              <span class="value success">{{ userContext.locationData.name }}</span>
            </div>
            <div class="plan-item" v-if="userContext.locationData?.id">
              <label>Location ID:</label>
              <span class="value">{{ userContext.locationData.id }}</span>
            </div>
            <div class="plan-item" v-if="userContext.locationData?.address?.city">
              <label>City:</label>
              <span class="value">{{ userContext.locationData.address.city }}</span>
            </div>
            <div class="plan-item" v-if="userContext.locationData?.address?.country">
              <label>Country:</label>
              <span class="value">{{ userContext.locationData.address.country }}</span>
            </div>
            <div class="plan-item" v-if="userContext.locationData?.address?.address">
              <label>Address:</label>
              <span class="value">{{ userContext.locationData.address.address }}</span>
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
        identifiers: {
          companyId: null,
          locationId: null,
          userId: null,
          userName: null,
          userEmail: null
        },
        userRole: null,
        userType: null,
        locationData: null,
        companyData: null,
        installationExists: false,
        hasValidToken: false,
        appStatus: 'unknown',
        ssoData: null,
        planInfo: null,
        subscriptionInfo: null
      },
      loading: false,
      error: null,
      isDynamicData: false,
      refreshInterval: null
    }
  },
  
  mounted() {
    this.loadUserContext();
    
    // Set up periodic refresh to keep data dynamic
    this.refreshInterval = setInterval(() => {
      this.extractFromGlobalContext();
    }, 5000); // Refresh every 5 seconds
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
        console.log('🚀 Using Official GHL CustomJS Utilities...');
        
        // Method 1: Try Official GHL CustomJS utility methods (most reliable)
        const customJSData = await this.getOfficialCustomJSData();
        
        if (customJSData) {
          console.log('✅ Official GHL CustomJS data received:', customJSData);
          
          this.userContext.identifiers = {
            companyId: customJSData.companyId,
            locationId: customJSData.locationId,
            userId: customJSData.userId,
            userName: customJSData.userName,
            userEmail: customJSData.userEmail
          };
          
          this.userContext.userRole = customJSData.userRole;
          this.userContext.userType = customJSData.userType;
          this.userContext.locationData = customJSData.locationData;
          this.userContext.companyData = customJSData.companyData;
          this.isDynamicData = true;
          
          // Check OAuth installation status
          await this.checkInstallationStatus();
          
        } else {
          console.warn('🔄 CustomJS method failed, trying Shared Secret method...');
          
          // Method 2: Try postMessage with Shared Secret decryption
          const sharedSecretData = await this.getOfficialGHLUserData();
          
          if (sharedSecretData) {
            console.log('✅ Shared Secret user data received:', sharedSecretData);
            
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
            
            await this.checkInstallationStatus();
            
          } else {
            console.warn('🔄 All official methods failed, trying fallback extraction...');
            // Fallback to manual extraction methods
            this.extractFromGlobalContext();
          }
        }
        
      } catch (error) {
        console.error('❌ Error loading user context:', error);
        this.error = `Failed to load user data: ${error.message}`;
        
        // Try fallback method
        this.extractFromGlobalContext();
        
      } finally {
        this.loading = false;
      }
    },

    async getOfficialCustomJSData() {
      try {
        console.log('📡 Attempting to use GHL CustomJS Utilities...');
        
        // Check if AppUtils is available (official GHL CustomJS environment)
        if (typeof window.AppUtils === 'undefined') {
          console.warn('⚠️ AppUtils not available - not in GHL CustomJS environment');
          return null;
        }

        // Use official GHL utility methods
        const [userInfo, locationInfo, companyInfo] = await Promise.all([
          window.AppUtils.Utilities.getCurrentUser().catch(e => {
            console.warn('getCurrentUser failed:', e);
            return null;
          }),
          window.AppUtils.Utilities.getCurrentLocation().catch(e => {
            console.warn('getCurrentLocation failed:', e);
            return null;
          }),
          window.AppUtils.Utilities.getCompany().catch(e => {
            console.warn('getCompany failed:', e);
            return null;
          })
        ]);

        console.log('📊 CustomJS API Results:', {
          userInfo,
          locationInfo,
          companyInfo
        });

        if (!userInfo && !locationInfo && !companyInfo) {
          console.warn('⚠️ No data received from CustomJS utilities');
          return null;
        }

        // Transform the data to our expected format
        const customJSData = {
          // User data from getCurrentUser()
          userId: userInfo?.id,
          userName: userInfo?.name || `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim(),
          userEmail: userInfo?.email,
          userRole: userInfo?.role,
          userType: userInfo?.type,
          
          // Location data from getCurrentLocation()
          locationId: locationInfo?.id,
          locationName: locationInfo?.name,
          locationAddress: locationInfo?.address,
          
          // Company data from getCompany()
          companyId: companyInfo?.id,
          companyName: companyInfo?.name,

          // Store raw data for debugging
          locationData: locationInfo,
          companyData: companyInfo
        };

        console.log('✅ Transformed CustomJS data:', customJSData);
        return customJSData;

      } catch (error) {
        console.warn('⚠️ CustomJS utilities failed:', error.message);
        return null;
      }
    },

    async getOfficialGHLUserData() {
      try {
        // Official GHL postMessage method for custom pages
        const encryptedUserData = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for user data'));
          }, 5000);

          // Request user data from parent window
          console.log('📨 Requesting user data from GHL parent window...');
          window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');

          // Listen for the response
          const messageHandler = ({ data }) => {
            if (data && data.message === 'REQUEST_USER_DATA_RESPONSE') {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              console.log('📨 Received encrypted user data from GHL');
              resolve(data.payload);
            }
          };

          window.addEventListener('message', messageHandler);
        });

        if (!encryptedUserData) {
          throw new Error('No encrypted user data received');
        }

        // Send encrypted data to backend for decryption
        console.log('🔓 Decrypting user data using Shared Secret...');
        const response = await fetch('/decrypt-user-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ encryptedData: encryptedUserData })
        });

        if (!response.ok) {
          throw new Error(`Decryption failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          return result.userData;
        } else {
          throw new Error(result.message || 'Decryption failed');
        }

      } catch (error) {
        console.warn('⚠️ Official GHL method failed:', error.message);
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
        console.warn('⚠️ Failed to check installation status:', error);
      }
    },
    
    extractFromGlobalContext() {
      // Dynamically extract real GHL user data from live context
      try {
        console.log('🔍 Extracting LIVE GHL data from context...');
        
        let extractedData = {
          companyId: null,
          locationId: null,
          userId: null,
          userName: null,
          userEmail: null,
          planInfo: null,
          subscriptionInfo: null
        };

        // Method 1: Extract from GHL Vue.js applications (main method)
        this.extractFromVueContext(extractedData);
        
        // Method 2: Extract from global window variables that GHL sets
        this.extractFromWindowGlobals(extractedData);
        
        // Method 3: Extract from DOM data attributes
        this.extractFromDOMData(extractedData);
        
        // Method 4: Extract from URL only as absolute fallback
        this.extractFromURL(extractedData);
        
        // Method 5: Try to get data from iframe parent context safely
        this.extractFromParentContext(extractedData);

        // Update user context with extracted data
        this.userContext.identifiers = {
          companyId: extractedData.companyId,
          locationId: extractedData.locationId,
          userId: extractedData.userId,
          userName: extractedData.userName,
          userEmail: extractedData.userEmail
        };

        if (extractedData.planInfo) {
          this.userContext.planInfo = extractedData.planInfo;
        }

        if (extractedData.subscriptionInfo) {
          this.userContext.subscriptionInfo = extractedData.subscriptionInfo;
        }

        this.userContext.appStatus = 'active';
        
        // Check if we have dynamic data (not from URL fallback)
        const hasRealData = extractedData.companyId && extractedData.locationId && 
                           (extractedData.userName || extractedData.userId || extractedData.planInfo);
        this.isDynamicData = hasRealData;
        
        console.log('✅ Dynamically extracted GHL data:', this.userContext);
        console.log(`📊 Data source: ${this.isDynamicData ? 'LIVE GHL Context' : 'Static/URL Fallback'}`);
        
      } catch (extractError) {
        console.error('❌ Error extracting dynamic GHL data:', extractError);
        // Only set fallback if no data was extracted at all
        if (!this.userContext.identifiers.companyId && !this.userContext.identifiers.locationId) {
          this.setFallbackData();
        }
      }
    },

    extractFromVueContext(data) {
      try {
        // Look for GHL's Vue application instances
        const vueSelectors = [
          '[data-v-app]', '#app', '.app', '[id*="app"]', 
          '[class*="vue"]', '[data-vue]', 'main', 'body'
        ];
        
        for (const selector of vueSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            // Check for Vue 2 instances
            if (el.__vue__) {
              const vue = el.__vue__;
              console.log('📱 Found Vue 2 instance:', vue);
              
              // Extract from Vue store
              if (vue.$store?.state) {
                const state = vue.$store.state;
                console.log('🏪 Vue store state:', state);
                
                data.companyId = state.companyId || state.company?.id || state.currentCompany?.id;
                data.locationId = state.locationId || state.location?.id || state.currentLocation?.id;
                data.userId = state.userId || state.user?.id || state.currentUser?.id;
                data.userName = state.user?.name || state.currentUser?.name;
                data.userEmail = state.user?.email || state.currentUser?.email;
                
                // Extract plan information
                if (state.plan || state.subscription || state.subscriptionDetails) {
                  data.planInfo = {
                    type: state.plan?.type || state.subscription?.type || 'USAGE',
                    currency: state.plan?.currency || 'usd',
                    isAgencyUser: state.isAgencyUser,
                    isAccountUser: state.isAccountUser
                  };
                }
              }
              
              // Extract from Vue data
              if (vue.$data) {
                const vueData = vue.$data;
                data.companyId = data.companyId || vueData.companyId;
                data.locationId = data.locationId || vueData.locationId;
                data.userId = data.userId || vueData.userId;
              }
            }
            
            // Check for Vue 3 instances
            if (el._vnode?.ctx) {
              const ctx = el._vnode.ctx;
              console.log('📱 Found Vue 3 context:', ctx);
              
              if (ctx.app?.config?.globalProperties) {
                const globals = ctx.app.config.globalProperties;
                data.companyId = data.companyId || globals.companyId;
                data.locationId = data.locationId || globals.locationId;
                data.userId = data.userId || globals.userId;
              }
            }
          }
        }
      } catch (vueError) {
        console.warn('⚠️ Vue context extraction failed:', vueError.message);
      }
    },

    extractFromWindowGlobals(data) {
      try {
        // Common GHL global variables
        const globalSources = [
          'ghlConfig', 'ghlContext', 'appConfig', 'userConfig',
          'currentUser', 'currentCompany', 'currentLocation',
          '__GHL_APP_DATA__', '__APP_CONFIG__', 'APP_DATA'
        ];
        
        globalSources.forEach(source => {
          if (window[source]) {
            const globalData = window[source];
            console.log(`🌐 Found global ${source}:`, globalData);
            
            data.companyId = data.companyId || globalData.companyId || globalData.company?.id;
            data.locationId = data.locationId || globalData.locationId || globalData.location?.id;
            data.userId = data.userId || globalData.userId || globalData.user?.id;
            data.userName = data.userName || globalData.user?.name;
            data.userEmail = data.userEmail || globalData.user?.email;
            
            if (globalData.plan || globalData.subscription) {
              data.planInfo = {
                type: globalData.plan?.type || 'USAGE',
                currency: globalData.plan?.currency || 'usd',
                isAgencyUser: globalData.isAgencyUser,
                isAccountUser: globalData.isAccountUser
              };
            }
          }
        });

        // Check for embedded JSON in script tags
        const scriptTags = document.querySelectorAll('script[type="application/json"]');
        scriptTags.forEach(script => {
          try {
            const jsonData = JSON.parse(script.textContent);
            console.log('📄 Found JSON script data:', jsonData);
            
            data.companyId = data.companyId || jsonData.companyId;
            data.locationId = data.locationId || jsonData.locationId;
            data.userId = data.userId || jsonData.userId;
          } catch (jsonError) {
            // Ignore invalid JSON
          }
        });
        
      } catch (globalsError) {
        console.warn('⚠️ Global variables extraction failed:', globalsError.message);
      }
    },

    extractFromDOMData(data) {
      try {
        // Look for data attributes on DOM elements
        const dataSelectors = [
          '[data-company-id]', '[data-location-id]', '[data-user-id]',
          '[data-ghl-company]', '[data-ghl-location]', '[data-ghl-user]'
        ];
        
        dataSelectors.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) {
            console.log(`🏷️ Found element with data attributes:`, el);
            
            data.companyId = data.companyId || el.dataset.companyId || el.dataset.ghlCompany;
            data.locationId = data.locationId || el.dataset.locationId || el.dataset.ghlLocation;
            data.userId = data.userId || el.dataset.userId || el.dataset.ghlUser;
          }
        });
        
      } catch (domError) {
        console.warn('⚠️ DOM data extraction failed:', domError.message);
      }
    },

    extractFromURL(data) {
      try {
        // Extract from URL path patterns
        const urlPath = window.location.pathname;
        const locationMatch = urlPath.match(/\/location\/([^/]+)/);
        const companyMatch = urlPath.match(/\/company\/([^/]+)/);
        
        data.locationId = data.locationId || locationMatch?.[1];
        data.companyId = data.companyId || companyMatch?.[1];
        
        // Extract from URL parameters as last resort
        const urlParams = new URLSearchParams(window.location.search);
        data.companyId = data.companyId || urlParams.get('companyId');
        data.locationId = data.locationId || urlParams.get('locationId');
        data.userId = data.userId || urlParams.get('userId');
        
      } catch (urlError) {
        console.warn('⚠️ URL extraction failed:', urlError.message);
      }
    },

    extractFromParentContext(data) {
      // Try to get context from parent window (if in iframe) without triggering CORS
      try {
        if (window.parent && window.parent !== window) {
          // Send a message to parent requesting context data
          window.parent.postMessage({ 
            type: 'GHL_REQUEST_CONTEXT',
            origin: window.location.origin 
          }, '*');
          
          // Listen for response (this won't block the extraction)
          const messageHandler = (event) => {
            if (event.data?.type === 'GHL_CONTEXT_RESPONSE') {
              console.log('📨 Received context from parent:', event.data);
              
              if (event.data.companyId) data.companyId = event.data.companyId;
              if (event.data.locationId) data.locationId = event.data.locationId;
              if (event.data.userId) data.userId = event.data.userId;
              
              // Update the UI with the new data
              this.userContext.identifiers = {
                ...this.userContext.identifiers,
                companyId: data.companyId,
                locationId: data.locationId,
                userId: data.userId
              };
              
              window.removeEventListener('message', messageHandler);
            }
          };
          
          window.addEventListener('message', messageHandler);
          
          // Remove listener after timeout to prevent memory leaks
          setTimeout(() => {
            window.removeEventListener('message', messageHandler);
          }, 2000);
        }
      } catch (parentError) {
        console.warn('⚠️ Parent context extraction failed:', parentError.message);
      }
    },

    setFallbackData() {
      console.log('🔄 Setting fallback data...');
      this.userContext.identifiers = {
        companyId: null,
        locationId: null,
        userId: null,
        userName: 'Unknown User',
        userEmail: null
      };
      this.userContext.appStatus = 'active';
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

.header-indicators {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.data-indicator {
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.data-indicator.live {
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
  animation: pulse 2s infinite;
}

.data-indicator.static {
  background: rgba(255, 255, 255, 0.2);
  color: #ccc;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
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