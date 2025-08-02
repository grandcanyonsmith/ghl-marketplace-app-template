<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="logo">Course Creator 360</h1>
          <span class="tagline">Transform Knowledge into Profit</span>
        </div>
        <div class="user-section">
          <div class="user-info">
            <span class="welcome-text">Welcome back, {{ userProfile.fullName }}!</span>
            <button @click="showProfileModal = true" class="profile-btn">
              <span class="avatar">{{ getInitials(userProfile.fullName) }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-container">
        <!-- Welcome Section -->
        <section class="welcome-section">
          <div class="welcome-card">
            <div class="welcome-content">
              <h2>🚀 Ready to create amazing courses?</h2>
              <p>Based on your profile, we've personalized your experience for {{ formatExpertise(userProfile.expertise) }}.</p>
              <div class="quick-stats">
                <div class="stat">
                  <span class="stat-number">{{ userProfile.goals.length }}</span>
                  <span class="stat-label">Goals Set</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ userProfile.topics.length }}</span>
                  <span class="stat-label">Topics Ready</span>
                </div>
                <div class="stat">
                  <span class="stat-number">0</span>
                  <span class="stat-label">Courses Created</span>
                </div>
              </div>
            </div>
            <div class="welcome-illustration">
              <div class="illustration-icon">🎓</div>
            </div>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="actions-grid">
            <div class="action-card primary" @click="startCourseCreation">
              <div class="action-icon">🎬</div>
              <h4>Create Your First Course</h4>
              <p>Start with our guided course builder</p>
              <span class="action-badge">Recommended</span>
            </div>
            <div class="action-card" @click="setupProfile">
              <div class="action-icon">👤</div>
              <h4>Complete Your Profile</h4>
              <p>Add your bio, photo, and credentials</p>
            </div>
            <div class="action-card" @click="connectPayments">
              <div class="action-icon">💳</div>
              <h4>Connect Payments</h4>
              <p>Set up your payment processing</p>
            </div>
            <div class="action-card" @click="browseTutorials">
              <div class="action-icon">📚</div>
              <h4>Watch Tutorials</h4>
              <p>Learn best practices for course creation</p>
            </div>
          </div>
        </section>

        <!-- Personalized Recommendations -->
        <section class="recommendations">
          <h3>Recommended for {{ formatExpertise(userProfile.expertise) }} Experts</h3>
          <div class="recommendations-grid">
            <div v-for="template in getRecommendedTemplates()" :key="template.id" class="template-card">
              <div class="template-header">
                <div class="template-icon">{{ template.icon }}</div>
                <span class="template-category">{{ template.category }}</span>
              </div>
              <h4>{{ template.title }}</h4>
              <p>{{ template.description }}</p>
              <div class="template-features">
                <span v-for="feature in template.features" :key="feature" class="feature-tag">
                  {{ feature }}
                </span>
              </div>
              <button class="template-btn">Use This Template</button>
            </div>
          </div>
        </section>

        <!-- Goals Progress -->
        <section class="goals-progress">
          <h3>Your Goals Progress</h3>
          <div class="goals-list">
            <div v-for="goalId in userProfile.goals" :key="goalId" class="goal-item">
              <div class="goal-info">
                <div class="goal-icon">{{ getGoalIcon(goalId) }}</div>
                <div class="goal-content">
                  <h4>{{ getGoalTitle(goalId) }}</h4>
                  <p>{{ getGoalDescription(goalId) }}</p>
                </div>
              </div>
              <div class="goal-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: '15%' }"></div>
                </div>
                <span class="progress-text">Getting Started</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="recent-activity">
          <h3>Getting Started Checklist</h3>
          <div class="checklist">
            <div class="checklist-item completed">
              <div class="checkbox checked">✓</div>
              <span>Complete onboarding</span>
            </div>
            <div class="checklist-item" @click="setupProfile">
              <div class="checkbox"></div>
              <span>Set up your instructor profile</span>
            </div>
            <div class="checklist-item" @click="startCourseCreation">
              <div class="checkbox"></div>
              <span>Create your first course outline</span>
            </div>
            <div class="checklist-item" @click="connectPayments">
              <div class="checkbox"></div>
              <span>Connect payment processing</span>
            </div>
            <div class="checklist-item">
              <div class="checkbox"></div>
              <span>Publish your first course</span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Profile Modal -->
    <div v-if="showProfileModal" class="modal-overlay" @click="showProfileModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Your Profile</h3>
          <button @click="showProfileModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="profile-summary">
            <div class="profile-avatar">{{ getInitials(userProfile.fullName) }}</div>
            <h4>{{ userProfile.fullName }}</h4>
            <p class="profile-expertise">{{ formatExpertise(userProfile.expertise) }} Expert</p>
            <p class="profile-experience">{{ formatExperience(userProfile.experience) }} Level</p>
          </div>
          <div class="profile-details">
            <div class="detail-section">
              <h5>Your Goals</h5>
              <div class="goals-tags">
                <span v-for="goalId in userProfile.goals" :key="goalId" class="goal-tag">
                  {{ getGoalTitle(goalId) }}
                </span>
              </div>
            </div>
            <div class="detail-section">
              <h5>Your Topics</h5>
              <div class="topics-tags">
                <span v-for="topic in userProfile.topics" :key="topic" class="topic-tag">
                  {{ topic }}
                </span>
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <button @click="editProfile" class="btn btn-primary">Edit Profile</button>
            <button @click="resetOnboarding" class="btn btn-secondary">Reset Onboarding</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardMain',
  props: {
    userProfile: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showProfileModal: false,
      courseTemplates: {
        business: [
          {
            id: 'leadership-fundamentals',
            icon: '👔',
            category: 'Leadership',
            title: 'Leadership Fundamentals',
            description: 'Comprehensive course on essential leadership skills and team management.',
            features: ['10 Modules', 'Case Studies', 'Templates', 'Certification']
          },
          {
            id: 'startup-playbook',
            icon: '🚀',
            category: 'Entrepreneurship',
            title: 'Startup Playbook',
            description: 'Step-by-step guide to launching and scaling a successful startup.',
            features: ['12 Modules', 'Business Plan Template', 'Pitch Deck', 'Worksheets']
          }
        ],
        technology: [
          {
            id: 'web-dev-bootcamp',
            icon: '💻',
            category: 'Programming',
            title: 'Web Development Bootcamp',
            description: 'Complete course covering HTML, CSS, JavaScript, and modern frameworks.',
            features: ['20 Modules', 'Projects', 'Code Reviews', 'Portfolio']
          },
          {
            id: 'data-science-intro',
            icon: '📊',
            category: 'Data Science',
            title: 'Data Science Introduction',
            description: 'Learn Python, statistics, and machine learning for data analysis.',
            features: ['15 Modules', 'Datasets', 'Jupyter Notebooks', 'Certificate']
          }
        ],
        marketing: [
          {
            id: 'digital-marketing-mastery',
            icon: '📱',
            category: 'Digital Marketing',
            title: 'Digital Marketing Mastery',
            description: 'Complete guide to SEO, social media, email, and paid advertising.',
            features: ['14 Modules', 'Campaign Templates', 'Analytics', 'Tools List']
          },
          {
            id: 'content-strategy',
            icon: '✍️',
            category: 'Content',
            title: 'Content Strategy Blueprint',
            description: 'Create compelling content that converts and builds your brand.',
            features: ['8 Modules', 'Content Calendar', 'Templates', 'Examples']
          }
        ],
        design: [
          {
            id: 'ui-ux-design',
            icon: '🎨',
            category: 'UI/UX',
            title: 'UI/UX Design Masterclass',
            description: 'Learn user interface and experience design from concept to prototype.',
            features: ['16 Modules', 'Design Files', 'Prototypes', 'Portfolio']
          }
        ],
        health: [
          {
            id: 'fitness-coaching',
            icon: '💪',
            category: 'Fitness',
            title: 'Personal Fitness Coaching',
            description: 'Complete guide to fitness training, nutrition, and client management.',
            features: ['12 Modules', 'Workout Plans', 'Meal Plans', 'Client Tools']
          }
        ],
        education: [
          {
            id: 'online-teaching',
            icon: '🎓',
            category: 'Teaching',
            title: 'Online Teaching Excellence',
            description: 'Master the art of engaging online education and course delivery.',
            features: ['10 Modules', 'Teaching Tools', 'Assessment', 'Engagement']
          }
        ],
        finance: [
          {
            id: 'personal-finance',
            icon: '💰',
            category: 'Personal Finance',
            title: 'Personal Finance Mastery',
            description: 'Comprehensive guide to budgeting, investing, and wealth building.',
            features: ['11 Modules', 'Calculators', 'Templates', 'Strategies']
          }
        ],
        lifestyle: [
          {
            id: 'productivity-system',
            icon: '⚡',
            category: 'Productivity',
            title: 'Ultimate Productivity System',
            description: 'Time management, goal setting, and productivity optimization.',
            features: ['9 Modules', 'Templates', 'Tools', 'Habits Tracker']
          }
        ]
      },
      availableGoals: [
        { id: 'passive_income', icon: '💰', title: 'Generate Passive Income', description: 'Create courses that sell while you sleep' },
        { id: 'build_authority', icon: '👑', title: 'Build Authority', description: 'Establish yourself as an expert in your field' },
        { id: 'help_others', icon: '🤝', title: 'Help Others Learn', description: 'Share your knowledge to make an impact' },
        { id: 'scale_business', icon: '📈', title: 'Scale Your Business', description: 'Leverage courses to grow your business' },
        { id: 'career_change', icon: '🔄', title: 'Career Transition', description: 'Move into online education full-time' },
        { id: 'supplement_income', icon: '💡', title: 'Supplement Income', description: 'Add an additional revenue stream' }
      ]
    }
  },
  methods: {
    getInitials(name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
    getRecommendedTemplates() {
      return this.courseTemplates[this.userProfile.expertise] || [];
    },
    getGoalIcon(goalId) {
      const goal = this.availableGoals.find(g => g.id === goalId);
      return goal ? goal.icon : '🎯';
    },
    getGoalTitle(goalId) {
      const goal = this.availableGoals.find(g => g.id === goalId);
      return goal ? goal.title : goalId;
    },
    getGoalDescription(goalId) {
      const goal = this.availableGoals.find(g => g.id === goalId);
      return goal ? goal.description : '';
    },
    startCourseCreation() {
      alert('Course creation feature coming soon! This would open the course builder.');
    },
    setupProfile() {
      alert('Profile setup feature coming soon! This would open the profile editor.');
    },
    connectPayments() {
      alert('Payment setup feature coming soon! This would open payment configuration.');
    },
    browseTutorials() {
      alert('Tutorials feature coming soon! This would open the learning center.');
    },
    editProfile() {
      this.showProfileModal = false;
      alert('Profile editing feature coming soon!');
    },
    resetOnboarding() {
      if (confirm('Are you sure you want to reset your onboarding? This will clear all your current settings.')) {
        localStorage.removeItem('courseCreator360Profile');
        location.reload();
      }
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.tagline {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-top: 2px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text {
  color: #374151;
  font-weight: 500;
}

.profile-btn {
  background: none;
  border: none;
  cursor: pointer;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome-section {
  margin-bottom: 1rem;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-content p {
  font-size: 1.125rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.quick-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.welcome-illustration {
  flex-shrink: 0;
}

.illustration-icon {
  font-size: 4rem;
  opacity: 0.8;
}

.quick-actions h3,
.recommendations h3,
.goals-progress h3,
.recent-activity h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.action-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.action-card.primary {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f4ff, #e0e7ff);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.action-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.action-card p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.action-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.template-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.template-icon {
  font-size: 2rem;
}

.template-category {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.template-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.template-card p {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.template-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.feature-tag {
  background: #f0f4ff;
  color: #667eea;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.template-btn {
  width: 100%;
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.template-btn:hover {
  background: #5a67d8;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.goal-icon {
  font-size: 2rem;
}

.goal-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.goal-content p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.goal-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 150px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.checklist {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.checklist-item:not(.completed):hover {
  opacity: 0.7;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.checklist-item.completed {
  opacity: 0.6;
}

.checklist-item.completed span {
  text-decoration: line-through;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 2rem;
}

.profile-summary {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

.profile-summary h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.profile-expertise {
  color: #667eea;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.profile-experience {
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.goals-tags,
.topics-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.goal-tag,
.topic-tag {
  background: #f0f4ff;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .dashboard-main {
    padding: 1rem;
  }
  
  .header-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .welcome-card {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
  
  .quick-stats {
    justify-content: center;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
  
  .goal-item {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .goal-progress {
    align-items: center;
    min-width: auto;
    width: 100%;
  }
  
  .profile-actions {
    flex-direction: column;
  }
}
</style>