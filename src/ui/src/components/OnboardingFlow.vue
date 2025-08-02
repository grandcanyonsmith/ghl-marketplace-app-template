<template>
  <div class="onboarding-flow">
    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>
      <div class="step-counter">
        Step {{ currentStep }} of {{ totalSteps }}
      </div>
    </div>

    <!-- Onboarding Card -->
    <div class="onboarding-card">
      <!-- Welcome Step -->
      <div v-if="currentStep === 1" class="step welcome-step">
        <div class="step-icon">🎓</div>
        <h1>Welcome to Course Creator 360!</h1>
        <p>Transform your knowledge into profitable online courses with our comprehensive platform. Let's get you set up for success!</p>
        <div class="features-list">
          <div class="feature">
            <span class="feature-icon">✨</span>
            <span>AI-powered course creation</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📊</span>
            <span>Advanced analytics & insights</span>
          </div>
          <div class="feature">
            <span class="feature-icon">💰</span>
            <span>Multiple monetization options</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🚀</span>
            <span>Automated marketing tools</span>
          </div>
        </div>
      </div>

      <!-- Profile Setup Step -->
      <div v-if="currentStep === 2" class="step profile-step">
        <div class="step-icon">👤</div>
        <h2>Tell us about yourself</h2>
        <p>Help us personalize your experience</p>
        
        <form class="profile-form">
          <div class="form-group">
            <label>What's your name?</label>
            <input 
              type="text" 
              v-model="profile.fullName" 
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div class="form-group">
            <label>What's your expertise area?</label>
            <select v-model="profile.expertise" required>
              <option value="">Select your primary expertise</option>
              <option value="business">Business & Entrepreneurship</option>
              <option value="technology">Technology & Programming</option>
              <option value="marketing">Marketing & Sales</option>
              <option value="design">Design & Creativity</option>
              <option value="health">Health & Fitness</option>
              <option value="education">Education & Teaching</option>
              <option value="finance">Finance & Investing</option>
              <option value="lifestyle">Lifestyle & Personal Development</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>How would you describe your experience level?</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="profile.experience" value="beginner" />
                <span class="radio-custom"></span>
                Beginner - New to online courses
              </label>
              <label class="radio-label">
                <input type="radio" v-model="profile.experience" value="intermediate" />
                <span class="radio-custom"></span>
                Intermediate - Some experience teaching online
              </label>
              <label class="radio-label">
                <input type="radio" v-model="profile.experience" value="advanced" />
                <span class="radio-custom"></span>
                Advanced - Experienced course creator
              </label>
            </div>
          </div>
        </form>
      </div>

      <!-- Goals Step -->
      <div v-if="currentStep === 3" class="step goals-step">
        <div class="step-icon">🎯</div>
        <h2>What are your goals?</h2>
        <p>Select all that apply to help us customize your experience</p>
        
        <div class="goals-grid">
          <div 
            v-for="goal in availableGoals" 
            :key="goal.id"
            class="goal-card"
            :class="{ active: profile.goals.includes(goal.id) }"
            @click="toggleGoal(goal.id)"
          >
            <div class="goal-icon">{{ goal.icon }}</div>
            <h3>{{ goal.title }}</h3>
            <p>{{ goal.description }}</p>
          </div>
        </div>
      </div>

      <!-- Course Topics Step -->
      <div v-if="currentStep === 4" class="step topics-step">
        <div class="step-icon">📚</div>
        <h2>What topics will you teach?</h2>
        <p>Add the subjects you want to create courses about</p>
        
        <div class="topics-input">
          <div class="input-group">
            <input 
              type="text" 
              v-model="newTopic" 
              @keyup.enter="addTopic"
              placeholder="e.g., Digital Marketing, Python Programming, Photography..."
            />
            <button type="button" @click="addTopic" class="add-btn">Add</button>
          </div>
          
          <div class="topics-list">
            <div 
              v-for="(topic, index) in profile.topics" 
              :key="index"
              class="topic-tag"
            >
              {{ topic }}
              <button @click="removeTopic(index)" class="remove-btn">×</button>
            </div>
          </div>
          
          <div class="suggested-topics">
            <h4>Popular topics in {{ profile.expertise }}:</h4>
            <div class="suggested-list">
              <button 
                v-for="suggestion in getSuggestedTopics()" 
                :key="suggestion"
                @click="addSuggestedTopic(suggestion)"
                class="suggestion-btn"
                :disabled="profile.topics.includes(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Platform Tour Step -->
      <div v-if="currentStep === 5" class="step tour-step">
        <div class="step-icon">🗺️</div>
        <h2>Quick Platform Tour</h2>
        <p>Let's explore the key features you'll be using</p>
        
        <div class="tour-features">
          <div class="tour-feature">
            <div class="tour-icon">🎬</div>
            <h3>Course Builder</h3>
            <p>Create engaging courses with our drag-and-drop builder, video hosting, and interactive elements.</p>
          </div>
          <div class="tour-feature">
            <div class="tour-icon">👥</div>
            <h3>Student Management</h3>
            <p>Track student progress, send communications, and manage enrollments all in one place.</p>
          </div>
          <div class="tour-feature">
            <div class="tour-icon">💳</div>
            <h3>Sales & Marketing</h3>
            <p>Set up pricing, create sales funnels, and automate your marketing campaigns.</p>
          </div>
          <div class="tour-feature">
            <div class="tour-icon">📈</div>
            <h3>Analytics Dashboard</h3>
            <p>Monitor your performance with detailed insights on sales, engagement, and student success.</p>
          </div>
        </div>
      </div>

      <!-- Completion Step -->
      <div v-if="currentStep === 6" class="step completion-step">
        <div class="step-icon">🎉</div>
        <h2>You're all set!</h2>
        <p>Welcome to Course Creator 360, {{ profile.fullName }}! Your personalized dashboard is ready.</p>
        
        <div class="completion-summary">
          <h3>Your Profile Summary:</h3>
          <div class="summary-item">
            <strong>Expertise:</strong> {{ formatExpertise(profile.expertise) }}
          </div>
          <div class="summary-item">
            <strong>Experience:</strong> {{ formatExperience(profile.experience) }}
          </div>
          <div class="summary-item">
            <strong>Goals:</strong> {{ formatGoals(profile.goals) }}
          </div>
          <div class="summary-item">
            <strong>Topics:</strong> {{ profile.topics.join(', ') }}
          </div>
        </div>
        
        <div class="next-steps">
          <h3>Recommended Next Steps:</h3>
          <ul>
            <li>Create your first course outline</li>
            <li>Set up your instructor profile</li>
            <li>Explore our course templates</li>
            <li>Connect your payment processor</li>
          </ul>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-buttons">
        <button 
          v-if="currentStep > 1" 
          @click="previousStep" 
          class="btn btn-secondary"
        >
          Previous
        </button>
        
        <button 
          v-if="currentStep < totalSteps" 
          @click="nextStep" 
          class="btn btn-primary"
          :disabled="!isCurrentStepValid"
        >
          Next
        </button>
        
        <button 
          v-if="currentStep === totalSteps" 
          @click="completeOnboarding" 
          class="btn btn-success"
        >
          Complete Setup
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OnboardingFlow',
  data() {
    return {
      currentStep: 1,
      totalSteps: 6,
      newTopic: '',
      profile: {
        fullName: '',
        expertise: '',
        experience: '',
        goals: [],
        topics: []
      },
      availableGoals: [
        {
          id: 'passive_income',
          icon: '💰',
          title: 'Generate Passive Income',
          description: 'Create courses that sell while you sleep'
        },
        {
          id: 'build_authority',
          icon: '👑',
          title: 'Build Authority',
          description: 'Establish yourself as an expert in your field'
        },
        {
          id: 'help_others',
          icon: '🤝',
          title: 'Help Others Learn',
          description: 'Share your knowledge to make an impact'
        },
        {
          id: 'scale_business',
          icon: '📈',
          title: 'Scale Your Business',
          description: 'Leverage courses to grow your business'
        },
        {
          id: 'career_change',
          icon: '🔄',
          title: 'Career Transition',
          description: 'Move into online education full-time'
        },
        {
          id: 'supplement_income',
          icon: '💡',
          title: 'Supplement Income',
          description: 'Add an additional revenue stream'
        }
      ]
    }
  },
  computed: {
    isCurrentStepValid() {
      switch (this.currentStep) {
        case 1:
          return true;
        case 2:
          return this.profile.fullName && this.profile.expertise && this.profile.experience;
        case 3:
          return this.profile.goals.length > 0;
        case 4:
          return this.profile.topics.length > 0;
        case 5:
          return true;
        case 6:
          return true;
        default:
          return false;
      }
    }
  },
  methods: {
    nextStep() {
      if (this.currentStep < this.totalSteps && this.isCurrentStepValid) {
        this.currentStep++;
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    toggleGoal(goalId) {
      const index = this.profile.goals.indexOf(goalId);
      if (index > -1) {
        this.profile.goals.splice(index, 1);
      } else {
        this.profile.goals.push(goalId);
      }
    },
    addTopic() {
      if (this.newTopic.trim() && !this.profile.topics.includes(this.newTopic.trim())) {
        this.profile.topics.push(this.newTopic.trim());
        this.newTopic = '';
      }
    },
    addSuggestedTopic(topic) {
      if (!this.profile.topics.includes(topic)) {
        this.profile.topics.push(topic);
      }
    },
    removeTopic(index) {
      this.profile.topics.splice(index, 1);
    },
    getSuggestedTopics() {
      const suggestions = {
        business: ['Leadership', 'Entrepreneurship', 'Project Management', 'Business Strategy', 'Team Building'],
        technology: ['Web Development', 'Data Science', 'AI/Machine Learning', 'Cybersecurity', 'Cloud Computing'],
        marketing: ['Social Media Marketing', 'Email Marketing', 'SEO', 'Content Marketing', 'PPC Advertising'],
        design: ['UI/UX Design', 'Graphic Design', 'Web Design', 'Brand Design', 'Animation'],
        health: ['Nutrition', 'Fitness Training', 'Mental Health', 'Yoga', 'Wellness Coaching'],
        education: ['Online Teaching', 'Curriculum Design', 'Educational Technology', 'Learning Psychology', 'Assessment'],
        finance: ['Personal Finance', 'Investment Strategies', 'Cryptocurrency', 'Real Estate', 'Financial Planning'],
        lifestyle: ['Productivity', 'Mindfulness', 'Personal Development', 'Time Management', 'Life Coaching']
      };
      return suggestions[this.profile.expertise] || [];
    },
    formatExpertise(expertise) {
      const expertiseMap = {
        business: 'Business & Entrepreneurship',
        technology: 'Technology & Programming',
        marketing: 'Marketing & Sales',
        design: 'Design & Creativity',
        health: 'Health & Fitness',
        education: 'Education & Teaching',
        finance: 'Finance & Investing',
        lifestyle: 'Lifestyle & Personal Development'
      };
      return expertiseMap[expertise] || expertise;
    },
    formatExperience(experience) {
      const experienceMap = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced'
      };
      return experienceMap[experience] || experience;
    },
    formatGoals(goals) {
      return goals.map(goalId => {
        const goal = this.availableGoals.find(g => g.id === goalId);
        return goal ? goal.title : goalId;
      }).join(', ');
    },
    completeOnboarding() {
      this.$emit('complete', {
        ...this.profile,
        completedAt: new Date().toISOString()
      });
    }
  }
}
</script>

<style scoped>
.onboarding-flow {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.progress-container {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.step-counter {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
}

.onboarding-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.step-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  display: block;
}

.step h1, .step h2 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-weight: 700;
}

.step h1 {
  font-size: 2.5rem;
}

.step h2 {
  font-size: 2rem;
}

.step p {
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.features-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
  width: 100%;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  text-align: left;
}

.feature-icon {
  font-size: 1.5rem;
}

.profile-form {
  width: 100%;
  max-width: 500px;
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.radio-label:hover {
  background: #f9fafb;
}

.radio-label input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: border-color 0.2s;
}

.radio-label input[type="radio"]:checked + .radio-custom {
  border-color: #667eea;
}

.radio-label input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  width: 100%;
}

.goal-card {
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.goal-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.goal-card.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.goal-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.goal-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.goal-card p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.topics-input {
  width: 100%;
  max-width: 600px;
}

.input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.input-group input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #5a67d8;
}

.topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.topic-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.remove-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.suggested-topics {
  text-align: left;
}

.suggested-topics h4 {
  margin-bottom: 1rem;
  color: #374151;
  font-weight: 600;
}

.suggested-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.suggestion-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.suggestion-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tour-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  width: 100%;
  text-align: left;
}

.tour-feature {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 16px;
}

.tour-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.tour-feature h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.tour-feature p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.completion-summary,
.next-steps {
  text-align: left;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 16px;
}

.completion-summary h3,
.next-steps h3 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-weight: 600;
}

.summary-item {
  margin-bottom: 0.5rem;
  color: #374151;
}

.next-steps ul {
  margin: 0;
  padding-left: 1.5rem;
}

.next-steps li {
  margin-bottom: 0.5rem;
  color: #374151;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
  padding-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

@media (max-width: 768px) {
  .onboarding-card {
    padding: 2rem;
    margin: 1rem;
  }
  
  .features-list {
    grid-template-columns: 1fr;
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
  }
  
  .tour-features {
    grid-template-columns: 1fr;
  }
  
  .navigation-buttons {
    flex-direction: column;
  }
}
</style>