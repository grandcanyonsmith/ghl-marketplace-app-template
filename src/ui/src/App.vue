<template>
  <div id="app">
    <div v-if="!onboardingComplete" class="onboarding-container">
      <OnboardingFlow @complete="handleOnboardingComplete" />
    </div>
    <div v-else class="dashboard-container">
      <DashboardMain :userProfile="userProfile" />
    </div>
  </div>
</template>

<script>
import OnboardingFlow from './components/OnboardingFlow.vue'
import DashboardMain from './components/Dashboard.vue'

export default {
  name: 'App',
  components: {
    OnboardingFlow,
    DashboardMain
  },
  data() {
    return {
      onboardingComplete: false,
      userProfile: null,
      ghlUserData: null
    }
  },
  async mounted() {
    try {
      // Get GHL user data
      this.ghlUserData = await window.ghl.getUserData();
      console.log("GHL user details:", this.ghlUserData);
      
      // Check if onboarding was previously completed
      const savedProfile = localStorage.getItem('courseCreator360Profile');
      if (savedProfile) {
        this.userProfile = JSON.parse(savedProfile);
        this.onboardingComplete = true;
      }
    } catch (error) {
      console.error("Error getting user data:", error);
    }
  },
  methods: {
    handleOnboardingComplete(profile) {
      this.userProfile = {
        ...profile,
        ghlData: this.ghlUserData
      };
      this.onboardingComplete = true;
      
      // Save to localStorage
      localStorage.setItem('courseCreator360Profile', JSON.stringify(this.userProfile));
      
      // Optional: Send to backend
      this.sendProfileToBackend(this.userProfile);
    },
    async sendProfileToBackend(profile) {
      try {
        // Send profile data to your backend endpoint
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profile)
        });
        
        if (response.ok) {
          console.log('Profile saved to backend successfully');
        }
      } catch (error) {
        console.error('Error saving profile to backend:', error);
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.onboarding-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dashboard-container {
  min-height: 100vh;
  background: #f8fafc;
}

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
</style>
