// Service layer for Profiles
// Handles profile information and profile image uploads with localStorage persistence.
// Easy replacement for future REST API or Cloudinary / AWS S3 integration.

const PROFILE_KEY = 'rw_active_profile';

const defaultProfile = {
  display_name: 'Citizen User',
  level: 'Road Scout',
  points: 250,
  total_reports: 3,
  verified_reports: 2,
  forum_posts: 1,
  district: 'Mumbai',
  state: 'Maharashtra',
  profile_image_url: null, // Stores image path/url or local Base64 string for simulation
  role: 'citizen',
  phone: '',
  email: 'demo@roadwatch.in',
};

function initializeStorage() {
  if (!localStorage.getItem(PROFILE_KEY)) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
  }
}

initializeStorage();

export const profileService = {
  // Get active profile
  async getProfile() {
    await new Promise(r => setTimeout(r, 100)); // simulate latency
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || defaultProfile;
    return profile;
  },

  // Update profile textual info
  async updateProfile(updates) {
    await new Promise(r => setTimeout(r, 150));
    const current = JSON.parse(localStorage.getItem(PROFILE_KEY)) || defaultProfile;
    const updated = { ...current, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    
    // Dispatch storage event to keep views updated
    window.dispatchEvent(new Event('storage'));
    return updated;
  },

  // Simulates profile picture upload
  // In the future, this function will upload the image file to AWS S3/Cloudinary,
  // get a public URL back, and save that URL to the PostgreSQL database.
  async uploadProfilePicture(file) {
    await new Promise(r => setTimeout(r, 400)); // simulate upload network time
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result;
          
          // Store the Base64 data as the profile_image_url for simulation
          const updated = await this.updateProfile({ profile_image_url: base64Data });
          resolve(updated);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // Get citizen levels hierarchy info for display
  getLevelHierarchy() {
    return [
      { level: 'Road Scout', points: 0, badge: '🔍', description: 'Beginner rank. Can file basic road issues.' },
      { level: 'Road Reporter', points: 500, badge: '📋', description: 'Experienced reporter. Reports carry higher priority.' },
      { level: 'Road Guardian', points: 2000, badge: '🛡️', description: 'Community validator. Can verify and flag other reports.' },
      { level: 'Road Inspector', points: 5000, badge: '🔎', description: 'Trusted citizen. Direct line to regional road authorities.' },
      { level: 'Road Champion', points: 15000, badge: '🏆', description: 'Supreme citizen advocate. Direct collaboration with super admin.' }
    ];
  }
};
