// ================================
// OFFLINE DETECTION
// ================================
function updateOnlineStatus() {
  const indicator = document.getElementById('offlineIndicator');
  if (!indicator) return;
  
  if (!navigator.onLine) {
    indicator.classList.add('show');
    indicator.classList.remove('online');
    indicator.innerHTML = '<i data-lucide="wifi-off"></i><span>You\'re offline</span>';
  } else {
    // Show briefly that we're back online
    indicator.classList.add('show', 'online');
    indicator.innerHTML = '<i data-lucide="wifi"></i><span>Back online</span>';
    
    // Hide after 2 seconds
    setTimeout(() => {
      indicator.classList.remove('show', 'online');
    }, 2000);
  }
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Check initial status
window.addEventListener('load', () => {
  if (!navigator.onLine) {
    updateOnlineStatus();
  }
});

// ================================
// HAPTIC FEEDBACK
// ================================
function haptic(type = 'light') {
  if (!('vibrate' in navigator)) return;
  
  switch(type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(20);
      break;
    case 'heavy':
      navigator.vibrate([30, 10, 30]);
      break;
    case 'success':
      navigator.vibrate([10, 50, 10]);
      break;
    case 'error':
      navigator.vibrate([50, 30, 50]);
      break;
  }
}

// Add haptic feedback to interactive elements
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, .haptic, .btn-haptic');
  if (target) {
    haptic('light');
  }
});

// ================================
// SERVICE WORKER REGISTRATION (PWA)
// ================================
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('🔄 New version available! Refresh to update.');
          }
        });
      });
    } catch (error) {
      console.log('❌ Service Worker registration failed:', error);
    }
  });
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67+ from showing the mini-infobar
  e.preventDefault();
  // Save the event for later
  deferredPrompt = e;
  // Show install button
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.classList.remove('hidden');
  }
  console.log('📲 App can be installed');
});

// Handle install button click
document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`📲 Install prompt outcome: ${outcome}`);
  
  // Clear the deferred prompt
  deferredPrompt = null;
  
  // Hide the install button
  document.getElementById('installBtn').classList.add('hidden');
});

// Handle successful install
window.addEventListener('appinstalled', () => {
  console.log('🎉 App installed successfully!');
  deferredPrompt = null;
  document.getElementById('installBtn')?.classList.add('hidden');
});

// ================================
// FIREBASE CONFIG
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyAe__tXXGPkmTu9FRvIu3t3R7G50qf5JQ0",
  authDomain: "fitnessapp-1ddbb.firebaseapp.com",
  projectId: "fitnessapp-1ddbb",
  storageBucket: "fitnessapp-1ddbb.appspot.com",
  messagingSenderId: "94655961050",
  appId: "1:94655961050:web:4a3fc4469256404708d2e3",
  measurementId: "G-LRWQKFJ083"
};

// Initialize Firebase (Compat SDK - loaded from HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Current user state
let currentUser = null;

// Get current user ID (replaces hardcoded getUserId())
function getUserId() {
  return currentUser ? currentUser.uid : null;
}

// ==================== AUTHENTICATION ====================

// Show/hide auth modal
function showAuthModal() {
  document.getElementById('authModal').classList.add('show');
  document.querySelector('.container').classList.add('hidden');
  lucide.createIcons();
}

function hideAuthModal() {
  document.getElementById('authModal').classList.remove('show');
  document.querySelector('.container').classList.remove('hidden');
}

// Update user UI
function updateUserUI(user) {
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const verificationBanner = document.getElementById('verificationBanner');
  
  if (user) {
    const displayName = user.displayName || user.email.split('@')[0];
    userName.textContent = displayName;
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
    dropdownEmail.textContent = user.email;
    
    // Check email verification status
    // Google users are automatically verified
    const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
    
    if (!user.emailVerified && !isGoogleUser) {
      verificationBanner.classList.remove('hidden');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
      verificationBanner.classList.add('hidden');
    }
  }
}

// Resend verification email
document.getElementById('resendVerificationBtn')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  const originalContent = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2"></i> Sending...';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    await currentUser.sendEmailVerification();
    
    btn.innerHTML = '<i data-lucide="check"></i> Sent!';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    showToast('Verification email sent! Check your inbox.', 'success');
    
    // Reset button after 3 seconds
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalContent;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 3000);
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    btn.disabled = false;
    btn.innerHTML = originalContent;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    if (error.code === 'auth/too-many-requests') {
      showToast('Too many requests. Please wait a moment.', 'error');
    } else {
      showToast('Failed to send email. Try again later.', 'error');
    }
  }
});

// Toggle user dropdown
function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  if (userMenu && !userMenu.contains(e.target)) {
    dropdown?.classList.add('hidden');
  }
});

// Auth tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const tabName = tab.dataset.tab;
    document.getElementById('loginForm').classList.toggle('hidden', tabName !== 'login');
    document.getElementById('signupForm').classList.toggle('hidden', tabName !== 'signup');
    // Hide forgot password form when switching tabs
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    document.querySelector('.auth-tabs').classList.remove('hidden');
  });
});

// Login form submit
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  
  try {
    errorEl.classList.add('hidden');
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
    errorEl.classList.remove('hidden');
  }
});

// Forgot password link click
document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  // Hide login form and tabs, show forgot password form
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('forgotPasswordForm').classList.remove('hidden');
  document.querySelector('.auth-tabs').classList.add('hidden');
  // Pre-fill email if already entered
  const loginEmail = document.getElementById('loginEmail').value;
  if (loginEmail) {
    document.getElementById('resetEmail').value = loginEmail;
  }
  // Refresh icons
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// Back to login link
document.getElementById('backToLogin')?.addEventListener('click', (e) => {
  e.preventDefault();
  // Show login form and tabs, hide forgot password form
  document.getElementById('forgotPasswordForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.querySelector('.auth-tabs').classList.remove('hidden');
  // Reset messages
  document.getElementById('resetError').classList.add('hidden');
  document.getElementById('resetSuccess').classList.add('hidden');
  // Reset the active tab
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === 'login');
  });
});

// Forgot password form submit
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value;
  const errorEl = document.getElementById('resetError');
  const successEl = document.getElementById('resetSuccess');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Sending...';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    await auth.sendPasswordResetEmail(email);
    
    successEl.innerHTML = '<i data-lucide="check-circle"></i> Password reset email sent! Check your inbox.';
    successEl.classList.remove('hidden');
    submitBtn.innerHTML = '<i data-lucide="check"></i> Email Sent';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Auto return to login after 3 seconds
    setTimeout(() => {
      document.getElementById('backToLogin').click();
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send"></i> Send Reset Link';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 3000);
    
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
    errorEl.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="send"></i> Send Reset Link';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
});

// Signup form submit
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  const errorEl = document.getElementById('signupError');
  
  if (!agreeTerms) {
    errorEl.textContent = 'Please agree to the Terms of Service and Privacy Policy';
    errorEl.classList.remove('hidden');
    
    // Show toast notification
    showToast('<i data-lucide="alert-circle"></i> Please agree to the Terms of Service', 'warning');
    
    // Highlight the checkbox
    const termsCheckbox = document.getElementById('termsCheckboxWrapper');
    if (termsCheckbox) {
      termsCheckbox.classList.add('shake');
      setTimeout(() => termsCheckbox.classList.remove('shake'), 600);
    }
    
    return;
  }
  
  if (password !== confirm) {
    errorEl.textContent = 'Passwords do not match';
    errorEl.classList.remove('hidden');
    return;
  }
  
  try {
    errorEl.classList.add('hidden');
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    // Update display name
    await userCredential.user.updateProfile({ displayName: name });
    // Send email verification
    await userCredential.user.sendEmailVerification();
    console.log('📧 Verification email sent to:', email);
    // Reload to get updated profile
    await userCredential.user.reload();
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
    errorEl.classList.remove('hidden');
  }
});

// Google Sign In
document.getElementById('googleSignIn')?.addEventListener('click', async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error('Google sign in error:', error);
    showToast('Failed to sign in with Google');
  }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    await auth.signOut();
    showToast('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Delete Account
document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
  // First confirmation
  const confirm1 = confirm('Are you sure you want to delete your account?\n\nThis will permanently delete:\n• All your food logs\n• Weight history\n• Progress photos\n• Achievements\n• All personal data\n\nThis action cannot be undone!');
  
  if (!confirm1) return;
  
  // Second confirmation with typing
  const confirmText = prompt('To confirm deletion, type "DELETE" (all caps):');
  
  if (confirmText !== 'DELETE') {
    showToast('Account deletion cancelled', 'default');
    return;
  }
  
  try {
    const userId = getUserId();
    
    // Delete all user subcollections
    showToast('<i data-lucide="loader-2"></i> Deleting account...', 'default');
    
    // Delete food logs
    const foodLogsRef = db.collection('users').doc(userId).collection('foodLogs');
    const foodLogsSnap = await foodLogsRef.get();
    for (const doc of foodLogsSnap.docs) {
      await doc.ref.delete();
    }
    
    // Delete daily status
    const statusRef = db.collection('users').doc(userId).collection('dailyStatus');
    const statusSnap = await statusRef.get();
    for (const doc of statusSnap.docs) {
      await doc.ref.delete();
    }
    
    // Delete progress photos
    const photosRef = db.collection('users').doc(userId).collection('progressPhotos');
    const photosSnap = await photosRef.get();
    for (const doc of photosSnap.docs) {
      await doc.ref.delete();
    }
    
    // Delete user document
    await db.collection('users').doc(userId).delete();
    
    // Delete Firebase Auth account
    await currentUser.delete();
    
    showToast('<i data-lucide="check"></i> Account deleted successfully', 'success');
    
    // Redirect to login
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Error deleting account:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      showToast('Please log out and log back in, then try again', 'error');
    } else {
      showToast('Failed to delete account. Please try again.', 'error');
    }
  }
});

// User dropdown toggle
document.getElementById('userBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleUserDropdown();
});

// Edit profile button
document.getElementById('editProfileBtn')?.addEventListener('click', () => {
  toggleUserDropdown();
  showOnboarding();
});

// Helper function for auth error messages
function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later'
  };
  return messages[code] || 'An error occurred. Please try again.';
}

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  
  if (user) {
    console.log('✅ User logged in:', user.email);
    hideAuthModal();
    updateUserUI(user);
    // Initialize app after authentication
    await initApp();
  } else {
    console.log('❌ User not logged in');
    showAuthModal();
  }
});

// Refresh verification status when user returns to page
window.addEventListener('focus', async () => {
  if (currentUser && !currentUser.emailVerified) {
    try {
      await currentUser.reload();
      currentUser = auth.currentUser;
      if (currentUser.emailVerified) {
        const banner = document.getElementById('verificationBanner');
        banner.classList.add('hidden');
        showToast('<i data-lucide="check-circle"></i> Email verified!', 'success');
      }
    } catch (error) {
      console.log('Error refreshing user:', error);
    }
  }
});

// Helper functions to match modular SDK syntax with compat SDK
function doc(db, ...pathSegments) {
  // users, {userId} -> db.collection('users').doc(userId)
  // users, {userId}, dailyStatus, date -> db.collection('users').doc(userId).collection('dailyStatus').doc(date)
  if (pathSegments.length === 2) {
    return db.collection(pathSegments[0]).doc(pathSegments[1]);
  } else if (pathSegments.length === 4) {
    return db.collection(pathSegments[0]).doc(pathSegments[1]).collection(pathSegments[2]).doc(pathSegments[3]);
  }
  // Fallback: join path
  return db.doc(pathSegments.join('/'));
}

function collection(db, ...pathSegments) {
  // users, {userId}, dailyStatus -> db.collection('users').doc(userId).collection('dailyStatus')
  if (pathSegments.length === 3) {
    return db.collection(pathSegments[0]).doc(pathSegments[1]).collection(pathSegments[2]);
  }
  return db.collection(pathSegments[0]);
}

async function getDoc(docRef) {
  const snap = await docRef.get();
  return {
    exists: () => snap.exists,
    data: () => snap.data(),
    id: snap.id
  };
}

async function getDocs(collectionRef) {
  const snap = await collectionRef.get();
  const docs = [];
  snap.forEach(d => {
    docs.push({
      id: d.id,
      data: () => d.data()
    });
  });
  return { forEach: (fn) => docs.forEach(fn) };
}

function setDoc(docRef, data) {
  return docRef.set(data);
}

function updateDoc(docRef, data) {
  return docRef.update(data);
}

function deleteDoc(docRef) {
  return docRef.delete();
}

// Helper function to format date as MM-DD-YYYY (matches your Firestore doc IDs)
function getFormattedDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

// Default targets (will be overwritten by Firebase)
let targets = {
  calories: 2100,
  protein: 150,
  carbs: 240,
  fat: 60
};

const today = getFormattedDate(); // Uses MM-DD-YYYY format to match Firestore

// Load all history
let allFoods = JSON.parse(localStorage.getItem('allFoods')) || {};
let foods = allFoods[today] || [];

// Confetti celebration tracking
let confettiTriggeredToday = localStorage.getItem(`confetti_${today}`) === 'true';

// ================================
// CONFETTI CELEBRATION
// ================================
function triggerGoalConfetti() {
  if (confettiTriggeredToday) return;
  if (typeof confetti !== 'function') return;
  
  confettiTriggeredToday = true;
  localStorage.setItem(`confetti_${today}`, 'true');
  
  // Haptic feedback for the celebration
  haptic('success');
  
  // First burst - center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  });
  
  // Second burst - left side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b']
    });
  }, 200);
  
  // Third burst - right side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b']
    });
  }, 400);
  
  // Show celebratory toast
  showToast('<i data-lucide="party-popper"></i> You hit your calorie goal! 🎉', 'success');
}

// DOM Elements
const foodTable = document.getElementById('foodTable');
const sumCalories = document.getElementById('sumCalories');
const sumProtein = document.getElementById('sumProtein');
const sumCarbs = document.getElementById('sumCarbs');
const sumFat = document.getElementById('sumFat');
const calProgress = document.getElementById('calProgress');
const remainingCalories = document.getElementById('remainingCalories');

const addFoodBtn = document.getElementById('addFoodBtn');
const saveStatusBtn = document.getElementById('saveStatusBtn');
const historyDate = document.getElementById('historyDate');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const resetStreakBtn = document.getElementById('resetStreakBtn');

addFoodBtn.addEventListener('click', addFood);
saveStatusBtn.addEventListener('click', saveStatus);
viewHistoryBtn.addEventListener('click', viewHistory);
resetStreakBtn.addEventListener('click', resetStreak);

// Targets edit elements
const editTargetsBtn = document.getElementById('editTargetsBtn');
const saveTargetsBtn = document.getElementById('saveTargetsBtn');
const cancelTargetsBtn = document.getElementById('cancelTargetsBtn');
const targetsDisplay = document.getElementById('targetsDisplay');
const targetsEdit = document.getElementById('targetsEdit');

editTargetsBtn.addEventListener('click', toggleEditTargets);
saveTargetsBtn.addEventListener('click', saveTargets);
cancelTargetsBtn.addEventListener('click', toggleEditTargets);

// Goal weight elements
const editGoalWeightBtn = document.getElementById('editGoalWeightBtn');
const saveGoalWeightBtn = document.getElementById('saveGoalWeightBtn');
const cancelGoalWeightBtn = document.getElementById('cancelGoalWeightBtn');
const goalWeightSection = document.getElementById('goalWeightSection');
const goalWeightEdit = document.getElementById('goalWeightEdit');

editGoalWeightBtn.addEventListener('click', toggleGoalWeightEdit);
saveGoalWeightBtn.addEventListener('click', saveGoalWeight);
cancelGoalWeightBtn.addEventListener('click', toggleGoalWeightEdit);

// Goal weight state
let goalWeight = null;
let currentWeight = null;
let startingWeight = null; // Weight when goal was set

// ================================
// FOOD INPUT TABS
// ================================
function initFoodInputTabs() {
  const tabs = document.querySelectorAll('.food-input-tab');
  const panels = {
    search: document.getElementById('searchPanel'),
    manual: document.getElementById('manualPanel')
  };
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show/hide panels
      Object.entries(panels).forEach(([key, panel]) => {
        if (panel) {
          panel.classList.toggle('hidden', key !== targetTab);
        }
      });
      
      haptic('light');
    });
  });
}

// ================================
// USDA FOOD SEARCH
// ================================
const USDA_API_KEY = 'DEMO_KEY'; // Replace with your key for higher limits
let searchTimeout = null;

function initUSDASearch() {
  const searchInput = document.getElementById('usdaSearch');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // Hide results if query is too short
    if (query.length < 2) {
      document.getElementById('usdaResults').classList.add('hidden');
      return;
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => searchUSDA(query), 400);
  });
}

async function searchUSDA(query) {
  const resultsDiv = document.getElementById('usdaResults');
  const loadingDiv = document.getElementById('searchLoading');
  
  // Show loading
  loadingDiv.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=8&dataType=Foundation,SR%20Legacy`
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        resultsDiv.innerHTML = '<div class="search-error">Rate limit reached. Try again later or add an API key.</div>';
        resultsDiv.classList.remove('hidden');
        return;
      }
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    displayUSDAResults(data.foods || []);
    
  } catch (err) {
    console.error('USDA search error:', err);
    resultsDiv.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
    resultsDiv.classList.remove('hidden');
  } finally {
    loadingDiv.classList.add('hidden');
  }
}

function displayUSDAResults(foods) {
  const resultsDiv = document.getElementById('usdaResults');
  
  if (!foods || foods.length === 0) {
    resultsDiv.innerHTML = '<div class="search-no-results">No foods found. Try different keywords.</div>';
    resultsDiv.classList.remove('hidden');
    return;
  }
  
  resultsDiv.innerHTML = foods.map(food => {
    // Extract nutrients (USDA returns per 100g)
    const nutrients = food.foodNutrients || [];
    const calories = Math.round(nutrients.find(n => n.nutrientId === 1008)?.value || 0);
    const protein = Math.round(nutrients.find(n => n.nutrientId === 1003)?.value || 0);
    const carbs = Math.round(nutrients.find(n => n.nutrientId === 1005)?.value || 0);
    const fat = Math.round(nutrients.find(n => n.nutrientId === 1004)?.value || 0);
    
    const foodName = food.description || 'Unknown';
    const category = food.foodCategory || '';
    
    return `
      <div class="search-result-item" onclick="selectUSDAFood('${foodName.replace(/'/g, "\\'")}', ${calories}, ${protein}, ${carbs}, ${fat})">
        <div class="food-name-row">
          <span class="food-name">${foodName}</span>
          <span class="food-source usda">USDA</span>
        </div>
        ${category ? `<div class="food-brand">${category}</div>` : ''}
        <div class="food-macros">
          <span class="macro"><span>${calories}</span> cal</span>
          <span class="macro"><span>${protein}g</span> protein</span>
          <span class="macro"><span>${carbs}g</span> carbs</span>
          <span class="macro"><span>${fat}g</span> fat</span>
        </div>
        <div class="food-per100g">per 100g serving</div>
      </div>
    `;
  }).join('');
  
  resultsDiv.classList.remove('hidden');
}

function selectUSDAFood(name, calories, protein, carbs, fat) {
  // Fill in the form
  document.getElementById('foodName').value = name;
  document.getElementById('foodCalories').value = calories;
  document.getElementById('foodProtein').value = protein;
  document.getElementById('foodCarbs').value = carbs;
  document.getElementById('foodFat').value = fat;
  
  // Hide results
  document.getElementById('usdaResults').classList.add('hidden');
  document.getElementById('usdaSearch').value = '';
  
  // Scroll to form
  document.querySelector('.manual-entry-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  showToast(`<i data-lucide="check"></i> ${name} selected (adjust serving size if needed)`, 'success');
  haptic('success');
}

window.selectUSDAFood = selectUSDAFood;


// ================================
// MY FOODS - Save favorites for quick add
// ================================
let myFoods = [];


// Save manually entered food to My Foods
async function saveManualToMyFoods() {
  const name = document.getElementById('foodName').value.trim();
  const calories = parseFloat(document.getElementById('foodCalories').value) || 0;
  const protein = parseFloat(document.getElementById('foodProtein').value) || 0;
  const carbs = parseFloat(document.getElementById('foodCarbs').value) || 0;
  const fat = parseFloat(document.getElementById('foodFat').value) || 0;
  
  if (!name) {
    alert('Please enter a food name');
    return;
  }
  
  if (calories <= 0) {
    alert('Please enter calories');
    return;
  }
  
  const myFood = {
    id: Date.now().toString(),
    name: name,
    // Store the exact values user entered (this is the serving they care about)
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10
  };
  
  // Save to Firebase
  const myFoodsRef = doc(db, "users", getUserId());
  
  try {
    myFoods.push(myFood);
    await updateDoc(myFoodsRef, { myFoods: myFoods });
    renderMyFoods();
    
    // Clear form
    document.getElementById('foodName').value = '';
    document.getElementById('foodCalories').value = '';
    document.getElementById('foodProtein').value = '';
    document.getElementById('foodCarbs').value = '';
    document.getElementById('foodFat').value = '';
    
    showToast(`<i data-lucide="bookmark"></i> "${myFood.name}" saved to My Foods!`, 'success');
    
    // Check achievements
    checkAchievements();
  } catch (err) {
    console.error("Error saving to My Foods:", err);
    showToast('Failed to save. Please try again.', 'error');
  }
}

// Load My Foods from Firebase
async function loadMyFoods() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data().myFoods) {
      myFoods = userSnap.data().myFoods;
      renderMyFoods();
    }
  } catch (err) {
    console.error("Error loading My Foods:", err);
  }
}

// Render My Foods list
function renderMyFoods() {
  const list = document.getElementById('myFoodsList');
  
  if (myFoods.length === 0) {
    list.innerHTML = '<div class="my-foods-empty">No saved foods yet. Add a food and click "Save to My Foods"!</div>';
    return;
  }
  
  list.innerHTML = myFoods.map(food => `
    <div class="my-food-item" onclick="quickAddMyFood('${food.id}')">
      <div class="my-food-info">
        <div class="my-food-name">${food.name}</div>
        <div class="my-food-details">${food.calories} cal · ${food.protein}g P · ${food.carbs}g C · ${food.fat}g F</div>
      </div>
      <button class="my-food-delete" onclick="event.stopPropagation(); deleteMyFood('${food.id}')"><i data-lucide="trash-2"></i></button>
    </div>
  `).join('');
  
  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Toast notification
function showToast(message, type = 'default') {
  const toast = document.getElementById('toast');
  toast.innerHTML = message;
  toast.className = 'toast show ' + type;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  // Haptic feedback based on toast type
  if (type === 'success') haptic('success');
  else if (type === 'error') haptic('error');
  else if (type === 'warning') haptic('medium');
  else haptic('light');
  
  setTimeout(() => {
    toast.classList.remove('show');
    toast.className = 'toast';
  }, 2500);
}

// Quick add from My Foods
function quickAddMyFood(foodId) {
  const myFood = myFoods.find(f => f.id === foodId);
  if (!myFood) return;
  
  // Use exact saved values (user knows their serving)
  const food = {
    name: myFood.name,
    calories: myFood.calories,
    protein: myFood.protein,
    carbs: myFood.carbs,
    fat: myFood.fat,
    meal: selectedMealTag
  };
  
  foods.push(food);
  saveFoodsToFirestore();
  render();
  
  // Show toast notification
  showToast(`✓ ${myFood.name} added (${myFood.calories} cal)`);
  
  // Visual feedback on item
  const item = event.target.closest('.my-food-item');
  if (item) {
    item.style.background = 'rgba(34, 197, 94, 0.3)';
    setTimeout(() => { item.style.background = ''; }, 300);
  }
}

// Delete from My Foods
async function deleteMyFood(foodId) {
  if (!confirm('Remove this food from your favorites?')) return;
  
  myFoods = myFoods.filter(f => f.id !== foodId);
  
  const myFoodsRef = doc(db, "users", getUserId());
  try {
    await updateDoc(myFoodsRef, { myFoods: myFoods });
    renderMyFoods();
  } catch (err) {
    console.error("Error deleting from My Foods:", err);
  }
}

// Toggle My Foods visibility
function toggleMyFoods() {
  const list = document.getElementById('myFoodsList');
  const btn = document.getElementById('toggleMyFoodsBtn');
  list.classList.toggle('hidden');
  btn.innerHTML = list.classList.contains('hidden') 
    ? '<i data-lucide="chevron-down"></i>' 
    : '<i data-lucide="chevron-up"></i>';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================================
// FILIPINO FOODS DATABASE
// ================================
const FILIPINO_FOODS = {
  breakfast: [
    { name: 'Tapsilog', serving: '1 plate (tapa, egg, 1 cup rice)', calories: 550, protein: 28, carbs: 65, fat: 18 },
    { name: 'Longsilog', serving: '1 plate (2 pcs longganisa, egg, 1 cup rice)', calories: 620, protein: 22, carbs: 68, fat: 28 },
    { name: 'Tostilog', serving: '1 plate (tocino, egg, 1 cup rice)', calories: 580, protein: 20, carbs: 70, fat: 24 },
    { name: 'Bangsilog', serving: '1 plate (bangus, egg, 1 cup rice)', calories: 520, protein: 32, carbs: 62, fat: 16 },
    { name: 'Champorado', serving: '1 bowl (250g)', calories: 320, protein: 6, carbs: 58, fat: 8 },
    { name: 'Pandesal', serving: '2 pieces', calories: 180, protein: 6, carbs: 34, fat: 2 },
    { name: 'Arroz Caldo', serving: '1 bowl (300g)', calories: 280, protein: 18, carbs: 35, fat: 8 },
    { name: 'Tortang Talong', serving: '1 piece with egg', calories: 220, protein: 12, carbs: 15, fat: 14 },
  ],
  lunch: [
    { name: 'Sinigang na Baboy', serving: '1 bowl ulam + 1 cup rice', calories: 480, protein: 25, carbs: 55, fat: 18 },
    { name: 'Chicken Adobo', serving: '2 pcs chicken + 1 cup rice', calories: 520, protein: 32, carbs: 52, fat: 20 },
    { name: 'Pork Adobo', serving: '100g pork + 1 cup rice', calories: 580, protein: 28, carbs: 54, fat: 26 },
    { name: 'Kare-Kare', serving: '1 bowl + 1 cup rice', calories: 620, protein: 30, carbs: 58, fat: 28 },
    { name: 'Pinakbet', serving: '1 cup vegetables + 1 cup rice', calories: 380, protein: 15, carbs: 55, fat: 12 },
    { name: 'Tinolang Manok', serving: '1 bowl + 1 cup rice', calories: 420, protein: 28, carbs: 48, fat: 14 },
    { name: 'Bicol Express', serving: '1 cup + 1 cup rice', calories: 550, protein: 22, carbs: 52, fat: 28 },
    { name: 'Ginisang Monggo', serving: '1 bowl + 1 cup rice', calories: 420, protein: 20, carbs: 62, fat: 10 },
  ],
  dinner: [
    { name: 'Grilled Bangus', serving: '1 medium fish + 1 cup rice', calories: 450, protein: 35, carbs: 48, fat: 14 },
    { name: 'Lechon Kawali', serving: '100g + 1 cup rice', calories: 650, protein: 28, carbs: 52, fat: 38 },
    { name: 'Bistek Tagalog', serving: '150g beef + 1 cup rice', calories: 520, protein: 32, carbs: 50, fat: 20 },
    { name: 'Paksiw na Isda', serving: '1 serving fish + 1 cup rice', calories: 380, protein: 28, carbs: 45, fat: 10 },
    { name: 'Crispy Pata', serving: '1/4 pata (shared)', calories: 480, protein: 32, carbs: 20, fat: 32 },
    { name: 'Laing', serving: '1 cup + 1 cup rice', calories: 420, protein: 12, carbs: 55, fat: 18 },
    { name: 'Inihaw na Liempo', serving: '150g + 1 cup rice', calories: 580, protein: 26, carbs: 50, fat: 30 },
    { name: 'Nilaga', serving: '1 bowl + 1 cup rice', calories: 450, protein: 28, carbs: 52, fat: 16 },
  ],
  snack: [
    { name: 'Banana Cue', serving: '2 pieces', calories: 280, protein: 2, carbs: 52, fat: 8 },
    { name: 'Turon', serving: '2 pieces', calories: 320, protein: 3, carbs: 48, fat: 14 },
    { name: 'Halo-Halo', serving: '1 regular cup', calories: 350, protein: 6, carbs: 65, fat: 8 },
    { name: 'Puto', serving: '3 small pieces', calories: 180, protein: 4, carbs: 36, fat: 2 },
    { name: 'Bibingka', serving: '1 piece (medium)', calories: 280, protein: 5, carbs: 45, fat: 10 },
    { name: 'Saging na Saba', serving: '2 pieces (boiled)', calories: 180, protein: 2, carbs: 46, fat: 0 },
    { name: 'Leche Flan', serving: '1 slice (80g)', calories: 250, protein: 6, carbs: 35, fat: 10 },
    { name: 'Taho', serving: '1 small cup (200ml)', calories: 150, protein: 8, carbs: 22, fat: 4 },
  ]
};

// Current meal plan
let currentMealPlan = null;

// Generate random meal plan
function generateMealPlan() {
  const plan = {
    breakfast: FILIPINO_FOODS.breakfast[Math.floor(Math.random() * FILIPINO_FOODS.breakfast.length)],
    lunch: FILIPINO_FOODS.lunch[Math.floor(Math.random() * FILIPINO_FOODS.lunch.length)],
    dinner: FILIPINO_FOODS.dinner[Math.floor(Math.random() * FILIPINO_FOODS.dinner.length)],
    snack: FILIPINO_FOODS.snack[Math.floor(Math.random() * FILIPINO_FOODS.snack.length)]
  };
  
  currentMealPlan = plan;
  return plan;
}

// Render meal suggestions
function renderMealSuggestions() {
  const listEl = document.getElementById('mealSuggestionsList');
  const totalEl = document.getElementById('mealPlanTotal');
  if (!listEl) return;
  
  const plan = currentMealPlan || generateMealPlan();
  
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪'
  };
  
  let totalCals = 0;
  
  listEl.innerHTML = Object.entries(plan).map(([mealType, food]) => {
    totalCals += food.calories;
    return `
      <div class="meal-suggestion-item" onclick="addMealSuggestion('${mealType}')">
        <div class="meal-suggestion-info">
          <div class="meal-type-icon ${mealType}">${mealIcons[mealType]}</div>
          <div class="meal-suggestion-details">
            <div class="meal-suggestion-name">${food.name}</div>
            <div class="meal-suggestion-serving">${food.serving}</div>
            <div class="meal-suggestion-macros">P: ${food.protein}g • C: ${food.carbs}g • F: ${food.fat}g</div>
          </div>
        </div>
        <span class="meal-suggestion-cals">${food.calories} cal</span>
        <button class="meal-suggestion-add" onclick="event.stopPropagation(); addMealSuggestion('${mealType}')">
          <i data-lucide="plus"></i>
        </button>
      </div>
    `;
  }).join('');
  
  totalEl.textContent = `Total: ${totalCals} cal`;
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Add single meal suggestion to log
function addMealSuggestion(mealType) {
  if (!currentMealPlan || !currentMealPlan[mealType]) return;
  
  const food = currentMealPlan[mealType];
  
  foods.push({
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    meal: mealType
  });
  
  saveFoodsToFirestore();
  render();
  
  showToast(`<i data-lucide="check"></i> ${food.name} added!`, 'success');
  haptic('success');
}

// Add all meals to log
function addAllMealSuggestions() {
  if (!currentMealPlan) return;
  
  Object.entries(currentMealPlan).forEach(([mealType, food]) => {
    foods.push({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      meal: mealType
    });
  });
  
  saveFoodsToFirestore();
  render();
  
  const totalCals = Object.values(currentMealPlan).reduce((sum, f) => sum + f.calories, 0);
  showToast(`<i data-lucide="check"></i> All meals added (${totalCals} cal)`, 'success');
  haptic('success');
}

// Refresh meal plan
function refreshMealPlan() {
  generateMealPlan();
  renderMealSuggestions();
  showToast('<i data-lucide="refresh-cw"></i> New meal plan generated!', 'success');
  haptic('light');
}

// Render Filipino foods list
function renderFilipinoFoods() {
  const listEl = document.getElementById('filipinoFoodsList');
  if (!listEl) return;
  
  // Flatten all foods into one list with categories
  const allFoods = [];
  Object.entries(FILIPINO_FOODS).forEach(([category, foods]) => {
    foods.forEach(food => {
      allFoods.push({ ...food, category });
    });
  });
  
  // Show first 12 items initially
  const displayFoods = allFoods.slice(0, 12);
  
  listEl.innerHTML = displayFoods.map((food, index) => `
    <div class="my-food-item" onclick="addFilipinoFood(${index})">
      <div class="my-food-info">
        <span class="my-food-name">${food.name}</span>
        <span class="my-food-serving">${food.serving}</span>
        <span class="my-food-macros">${food.calories} cal • P: ${food.protein}g C: ${food.carbs}g F: ${food.fat}g</span>
      </div>
      <button class="my-food-add" onclick="event.stopPropagation(); addFilipinoFood(${index})">
        <i data-lucide="plus"></i>
      </button>
    </div>
  `).join('');
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Add Filipino food to log
function addFilipinoFood(index) {
  const allFoods = [];
  Object.entries(FILIPINO_FOODS).forEach(([category, foods]) => {
    foods.forEach(food => {
      allFoods.push({ ...food, category });
    });
  });
  
  const food = allFoods[index];
  if (!food) return;
  
  foods.push({
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    meal: food.category
  });
  
  saveFoodsToFirestore();
  render();
  
  showToast(`<i data-lucide="check"></i> ${food.name} added!`, 'success');
  haptic('success');
}

// Toggle Filipino Foods visibility
function toggleFilipinoFoods() {
  const list = document.getElementById('filipinoFoodsList');
  const btn = document.getElementById('toggleFilipinoFoodsBtn');
  list.classList.toggle('hidden');
  btn.innerHTML = list.classList.contains('hidden') 
    ? '<i data-lucide="chevron-down"></i>' 
    : '<i data-lucide="chevron-up"></i>';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Initialize meal plan events
function initMealPlan() {
  document.getElementById('refreshMealPlanBtn')?.addEventListener('click', refreshMealPlan);
  document.getElementById('addAllMealsBtn')?.addEventListener('click', addAllMealSuggestions);
  
  // Generate initial meal plan
  generateMealPlan();
  renderMealSuggestions();
  renderFilipinoFoods();
}

// Make functions globally available
window.addMealSuggestion = addMealSuggestion;
window.addAllMealSuggestions = addAllMealSuggestions;
window.addFilipinoFood = addFilipinoFood;
window.toggleFilipinoFoods = toggleFilipinoFoods;

// Make functions globally available
window.saveManualToMyFoods = saveManualToMyFoods;
window.quickAddMyFood = quickAddMyFood;
window.deleteMyFood = deleteMyFood;
window.toggleMyFoods = toggleMyFoods;

// ================================
// EDIT FOOD ENTRY
// ================================
let editingFoodIndex = null;

function editFood(index) {
  const food = foods[index];
  if (!food) return;
  
  editingFoodIndex = index;
  
  // Populate the form with food data
  foodName.value = food.name;
  foodCalories.value = food.calories;
  foodProtein.value = food.protein || 0;
  foodCarbs.value = food.carbs || 0;
  foodFat.value = food.fat || 0;
  
  // Set the meal tag
  if (food.meal) {
    selectedMealTag = food.meal;
    document.querySelectorAll('.meal-tag').forEach(tag => {
      tag.classList.toggle('active', tag.dataset.meal === food.meal);
    });
  }
  
  // Update UI to show edit mode
  const addBtn = document.getElementById('addFoodBtn');
  addBtn.innerHTML = '<i data-lucide="save"></i> Update Food';
  addBtn.classList.add('editing');
  
  // Show cancel button
  let cancelBtn = document.getElementById('cancelEditBtn');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancelEditBtn';
    cancelBtn.className = 'secondary';
    cancelBtn.innerHTML = '<i data-lucide="x"></i> Cancel';
    cancelBtn.onclick = cancelEdit;
    addBtn.parentNode.insertBefore(cancelBtn, addBtn.nextSibling);
  }
  cancelBtn.style.display = 'flex';
  
  // Scroll to form
  document.querySelector('.manual-entry-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  foodName.focus();
  
  // Haptic feedback
  haptic('medium');
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  showToast('<i data-lucide="pencil"></i> Editing: ' + food.name, 'warning');
}

function cancelEdit() {
  editingFoodIndex = null;
  clearFoodInputs();
  
  // Reset button
  const addBtn = document.getElementById('addFoodBtn');
  addBtn.innerHTML = '<i data-lucide="plus"></i> Add to Log';
  addBtn.classList.remove('editing');
  
  // Hide cancel button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.editFood = editFood;
window.cancelEdit = cancelEdit;

// ================================
// RECENT FOODS
// ================================
let recentFoods = [];
const MAX_RECENT_FOODS = 10;

// Load recent foods from Firebase
async function loadRecentFoods() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data().recentFoods) {
      recentFoods = userSnap.data().recentFoods;
    } else {
      recentFoods = [];
    }
    renderRecentFoods();
  } catch (err) {
    console.error("Error loading recent foods:", err);
  }
}

// Save recent foods to Firebase
async function saveRecentFoods() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    await updateDoc(userDocRef, { recentFoods: recentFoods });
  } catch (err) {
    console.error("Error saving recent foods:", err);
  }
}

// Add food to recent list
function addToRecentFoods(food) {
  // Remove if already exists (to move it to top)
  recentFoods = recentFoods.filter(f => 
    !(f.name === food.name && f.calories === food.calories)
  );
  
  // Add to beginning
  recentFoods.unshift({
    name: food.name,
    calories: food.calories,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0
  });
  
  // Keep only last MAX_RECENT_FOODS
  if (recentFoods.length > MAX_RECENT_FOODS) {
    recentFoods = recentFoods.slice(0, MAX_RECENT_FOODS);
  }
  
  saveRecentFoods();
  renderRecentFoods();
}

// Render recent foods list
function renderRecentFoods() {
  const container = document.getElementById('recentFoodsList');
  const section = document.getElementById('recentFoodsSection');
  
  if (!container) return;
  
  if (recentFoods.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  
  container.innerHTML = recentFoods.map((food, index) => `
    <div class="my-food-item">
      <div class="my-food-info">
        <span class="my-food-name">${food.name}</span>
        <span class="my-food-macros">${food.calories} cal | P:${food.protein}g C:${food.carbs}g F:${food.fat}g</span>
      </div>
      <button class="my-food-add" onclick="quickAddRecentFood(${index})">
        <i data-lucide="plus"></i>
      </button>
    </div>
  `).join('');
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Quick add from recent foods
function quickAddRecentFood(index) {
  const food = recentFoods[index];
  if (!food) return;
  
  const newFood = {
    ...food,
    meal: selectedMealTag
  };
  
  foods.push(newFood);
  saveFoodsToFirestore();
  render();
  
  showToast(`<i data-lucide="plus"></i> ${food.name} added`, 'success');
  haptic('success');
}

// Toggle Recent Foods visibility
function toggleRecentFoods() {
  const list = document.getElementById('recentFoodsList');
  const btn = document.getElementById('toggleRecentFoodsBtn');
  list.classList.toggle('hidden');
  btn.innerHTML = list.classList.contains('hidden') 
    ? '<i data-lucide="chevron-down"></i>' 
    : '<i data-lucide="chevron-up"></i>';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.quickAddRecentFood = quickAddRecentFood;
window.toggleRecentFoods = toggleRecentFoods;

// ================================
// MEAL TAGS
// ================================
let selectedMealTag = 'breakfast';

function initMealTags() {
  const tags = document.querySelectorAll('.meal-tag');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      selectedMealTag = tag.dataset.meal;
    });
  });
}

// Auto-select meal based on time of day
function autoSelectMeal() {
  const hour = new Date().getHours();
  let meal = 'snack';
  
  if (hour >= 5 && hour < 11) meal = 'breakfast';
  else if (hour >= 11 && hour < 15) meal = 'lunch';
  else if (hour >= 17 && hour < 21) meal = 'dinner';
  
  selectedMealTag = meal;
  
  const tags = document.querySelectorAll('.meal-tag');
  tags.forEach(tag => {
    tag.classList.toggle('active', tag.dataset.meal === meal);
  });
}

// ================================
// DAILY AFFIRMATIONS
// ================================
const affirmations = [
  "Your only limit is you.",
  "Progress, not perfection.",
  "Every rep counts. Every step matters.",
  "You're stronger than you think.",
  "Discipline beats motivation.",
  "Small steps lead to big changes.",
  "Your future self will thank you.",
  "Embrace the grind.",
  "Consistency is the key to success.",
  "You didn't come this far to only come this far.",
  "Be patient with yourself.",
  "Results take time. Keep going.",
  "Your body can do it. Convince your mind.",
  "Today's effort is tomorrow's result.",
  "Champions train, losers complain.",
  "Make yourself proud.",
  "The pain you feel today is the strength you feel tomorrow.",
  "Don't wish for it. Work for it.",
  "Success starts with self-discipline.",
  "Push yourself because no one else will."
];

function showDailyAffirmation() {
  const today = new Date().toDateString();
  const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const index = seed % affirmations.length;
  
  const el = document.querySelector('.affirmation-text');
  if (el) {
    el.textContent = `"${affirmations[index]}"`;
  }
}

// ================================
// WEIGHT PREDICTION
// ================================
async function calculateWeightPrediction() {
  const predictionEl = document.getElementById('predictionText');
  if (!predictionEl || !goalWeight) return;
  
  try {
    // Get last 14 days of weight data
    const weights = [];
    const now = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = getFormattedDate(date);
      
      const docRef = doc(db, "users", getUserId(), "dailyStatus", dateStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().weight) {
        weights.push({
          date: date,
          weight: docSnap.data().weight
        });
      }
    }
    
    if (weights.length < 3) {
      predictionEl.textContent = "Log at least 3 days to see prediction";
      return;
    }
    
    // Calculate average weekly change
    weights.sort((a, b) => a.date - b.date);
    const firstWeight = weights[0].weight;
    const lastWeight = weights[weights.length - 1].weight;
    const daysDiff = (weights[weights.length - 1].date - weights[0].date) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) {
      predictionEl.textContent = "Need more data for prediction";
      return;
    }
    
    const dailyChange = (lastWeight - firstWeight) / daysDiff;
    const weeklyChange = dailyChange * 7;
    
    // Calculate days to goal
    const weightToGo = lastWeight - goalWeight;
    
    if (Math.abs(weightToGo) < 0.5) {
      predictionEl.innerHTML = "<strong>You've reached your goal!</strong> Congratulations!";
      return;
    }
    
    // Check if moving in right direction
    const movingRight = (weightToGo > 0 && dailyChange < 0) || (weightToGo < 0 && dailyChange > 0);
    
    if (!movingRight || Math.abs(dailyChange) < 0.01) {
      const direction = weightToGo > 0 ? "lose" : "gain";
      predictionEl.innerHTML = `At current pace, you need to ${direction} more consistently`;
      return;
    }
    
    const daysToGoal = Math.abs(weightToGo / dailyChange);
    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + Math.round(daysToGoal));
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = goalDate.toLocaleDateString('en-US', options);
    
    const weeksToGo = Math.round(daysToGoal / 7);
    const changePerWeek = Math.abs(weeklyChange).toFixed(1);
    
    // Reality check
    let warning = '';
    if (Math.abs(weeklyChange) > 1.0) {
      warning = ' ⚠️ (faster than recommended)';
    } else if (Math.abs(weeklyChange) < 0.2) {
      warning = ' 💡 (slow but steady)';
    }
    
    // Don't show unrealistic predictions (> 2 years)
    if (weeksToGo > 104) {
      predictionEl.innerHTML = `At current pace (<strong>${changePerWeek} kg/week</strong>), goal is far away. Try increasing activity or adjusting diet.`;
      return;
    }
    
    predictionEl.innerHTML = `At <strong>${changePerWeek} kg/week</strong>, goal by <strong>${dateStr}</strong> (~${weeksToGo} weeks)${warning}`;
    
  } catch (err) {
    console.error("Error calculating prediction:", err);
    predictionEl.textContent = "Unable to calculate prediction";
  }
}

// ================================
// THEME TOGGLE
// ================================
let isDarkTheme = localStorage.getItem('theme') !== 'light';

function initTheme() {
  const btn = document.getElementById('themeToggleBtn');
  if (!isDarkTheme) {
    document.body.classList.add('light-theme');
    btn.innerHTML = '<i data-lucide="sun"></i>';
  } else {
    btn.innerHTML = '<i data-lucide="moon"></i>';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  const btn = document.getElementById('themeToggleBtn');
  
  if (isDarkTheme) {
    document.body.classList.remove('light-theme');
    btn.innerHTML = '<i data-lucide="moon"></i>';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.add('light-theme');
    btn.innerHTML = '<i data-lucide="sun"></i>';
    localStorage.setItem('theme', 'light');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

// ================================
// MACRO PIE CHART
// ================================
let macroChart = null;

function renderMacroChart() {
  const ctx = document.getElementById('macroChart');
  if (!ctx) return;
  
  // Calculate totals
  const totalProtein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalCarbs = foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalFat = foods.reduce((sum, f) => sum + (f.fat || 0), 0);
  
  // Calculate calories from each macro
  const proteinCals = totalProtein * 4;
  const carbsCals = totalCarbs * 4;
  const fatCals = totalFat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;
  
  // If no data, show empty state
  const data = totalMacroCals > 0 
    ? [proteinCals, carbsCals, fatCals]
    : [1, 1, 1]; // Equal segments when empty
  
  const colors = totalMacroCals > 0
    ? ['#ef4444', '#3b82f6', '#eab308']
    : ['#374151', '#374151', '#374151'];
  
  if (macroChart) {
    macroChart.data.datasets[0].data = data;
    macroChart.data.datasets[0].backgroundColor = colors;
    macroChart.update();
  } else {
    macroChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Protein', 'Carbs', 'Fat'],
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (totalMacroCals === 0) return 'No data';
                const value = context.raw;
                const percent = Math.round((value / totalMacroCals) * 100);
                return `${context.label}: ${percent}%`;
              }
            }
          }
        }
      }
    });
  }
  
  // Update legend with percentages
  updateMacroLegend(proteinCals, carbsCals, fatCals, totalMacroCals);
}

function updateMacroLegend(proteinCals, carbsCals, fatCals, total) {
  const legend = document.querySelector('.macro-legend');
  if (!legend || total === 0) return;
  
  const proteinPct = Math.round((proteinCals / total) * 100) || 0;
  const carbsPct = Math.round((carbsCals / total) * 100) || 0;
  const fatPct = Math.round((fatCals / total) * 100) || 0;
  
  legend.innerHTML = `
    <div class="legend-item"><span class="legend-dot protein"></span> Protein ${proteinPct}%</div>
    <div class="legend-item"><span class="legend-dot carbs"></span> Carbs ${carbsPct}%</div>
    <div class="legend-item"><span class="legend-dot fat"></span> Fat ${fatPct}%</div>
  `;
}

// ================================
// UNDO DELETE
// ================================
let deletedFood = null;
let deleteTimeout = null;

function showUndoToast(foodName) {
  const toast = document.getElementById('toast');
  toast.innerHTML = `"${foodName}" removed <button class="undo-btn" onclick="undoDelete()">Undo</button>`;
  toast.classList.add('show', 'undo-toast');
  
  // Auto-hide after 5 seconds
  if (deleteTimeout) clearTimeout(deleteTimeout);
  deleteTimeout = setTimeout(() => {
    toast.classList.remove('show', 'undo-toast');
    deletedFood = null;
  }, 5000);
}

async function undoDelete() {
  if (!deletedFood) return;
  
  // Restore the food
  foods.splice(deletedFood.index, 0, deletedFood.food);
  await saveFoodsToFirestore();
  render();
  
  // Hide toast
  const toast = document.getElementById('toast');
  toast.classList.remove('show', 'undo-toast');
  clearTimeout(deleteTimeout);
  
  showToast(`✓ "${deletedFood.food.name}" restored`);
  deletedFood = null;
}

window.undoDelete = undoDelete;

// ================================
// DAILY REMINDER NOTIFICATIONS
// ================================
let reminderTimeout = null;

function initReminder() {
  const toggle = document.getElementById('reminderToggle');
  const timeSection = document.getElementById('reminderTimeSection');
  const timeInput = document.getElementById('reminderTime');
  const saveBtn = document.getElementById('saveReminderBtn');
  
  // Load saved settings
  const savedReminder = localStorage.getItem('reminderEnabled') === 'true';
  const savedTime = localStorage.getItem('reminderTime') || '09:00';
  
  toggle.checked = savedReminder;
  timeInput.value = savedTime;
  
  if (savedReminder) {
    timeSection.classList.remove('hidden');
    scheduleReminder(savedTime);
  }
  
  // Toggle event
  toggle.addEventListener('change', async () => {
    if (toggle.checked) {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toggle.checked = false;
          showToast('Please allow notifications in browser settings');
          return;
        }
      }
      timeSection.classList.remove('hidden');
      localStorage.setItem('reminderEnabled', 'true');
      scheduleReminder(timeInput.value);
      showToast('✓ Reminder enabled!');
    } else {
      timeSection.classList.add('hidden');
      localStorage.setItem('reminderEnabled', 'false');
      if (reminderTimeout) clearTimeout(reminderTimeout);
      showToast('Reminder disabled');
    }
  });
  
  // Save time
  saveBtn.addEventListener('click', () => {
    localStorage.setItem('reminderTime', timeInput.value);
    scheduleReminder(timeInput.value);
    showToast(`✓ Reminder set for ${formatTime(timeInput.value)}`);
  });
}

function scheduleReminder(timeStr) {
  if (reminderTimeout) clearTimeout(reminderTimeout);
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);
  
  // If time already passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const delay = reminderTime - now;
  
  reminderTimeout = setTimeout(() => {
    sendReminderNotification();
    // Reschedule for next day
    scheduleReminder(timeStr);
  }, delay);
  
  console.log(`Reminder scheduled for ${reminderTime.toLocaleString()}`);
}

function sendReminderNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Fitness Tracker Reminder', {
      body: "Time for your daily check-in! Log your weight and track your progress.",
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💪</text></svg>',
      tag: 'daily-checkin'
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// ================================
// ONBOARDING - New User Setup
// ================================
let currentStep = 1;
const totalSteps = 4;
let userProfile = {};

async function checkIfNewUser() {
  const userDocRef = doc(db, "users", getUserId());
  const userSnap = await getDoc(userDocRef);
  
  if (!userSnap.exists() || !userSnap.data().profile) {
    showOnboarding();
    return true;
  }
  return false;
}

function showOnboarding() {
  document.getElementById('onboardingModal').classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initOnboardingEvents();
}

function hideOnboarding() {
  document.getElementById('onboardingModal').classList.add('hidden');
}

function initOnboardingEvents() {
  const nextBtn = document.getElementById('onboardNext');
  const backBtn = document.getElementById('onboardBack');
  
  nextBtn.addEventListener('click', () => {
    if (currentStep < totalSteps) {
      if (validateCurrentStep()) {
        if (currentStep === 3) {
          calculateResults();
        }
        goToStep(currentStep + 1);
      }
    } else {
      saveProfileAndTargets();
    }
  });
  
  backBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });
}

function validateCurrentStep() {
  if (currentStep === 1) {
    const age = document.getElementById('onboardAge').value;
    const height = document.getElementById('onboardHeight').value;
    const weight = document.getElementById('onboardWeight').value;
    
    if (!age || !height || !weight) {
      showToast('Please fill in all fields');
      return false;
    }
    
    userProfile.age = parseInt(age);
    userProfile.gender = document.getElementById('onboardGender').value;
    userProfile.height = parseFloat(height);
    userProfile.weight = parseFloat(weight);
  }
  
  if (currentStep === 2) {
    const activity = document.querySelector('input[name="activity"]:checked');
    userProfile.activityLevel = parseFloat(activity.value);
  }
  
  if (currentStep === 3) {
    const goal = document.querySelector('input[name="goal"]:checked');
    userProfile.goal = goal.value;
  }
  
  return true;
}

function goToStep(step) {
  currentStep = step;
  
  // Update step visibility
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
  
  // Update dots
  document.querySelectorAll('.step-dots .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === step - 1);
  });
  
  // Update buttons
  const backBtn = document.getElementById('onboardBack');
  const nextBtn = document.getElementById('onboardNext');
  
  backBtn.disabled = step === 1;
  
  if (step === totalSteps) {
    nextBtn.innerHTML = '<i data-lucide="check"></i> Get Started';
  } else {
    nextBtn.innerHTML = 'Next <i data-lucide="arrow-right"></i>';
  }
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function calculateResults() {
  const { age, gender, height, weight, activityLevel, goal } = userProfile;
  
  // Calculate BMI
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  userProfile.bmi = Math.round(bmi * 10) / 10;
  
  // BMI Category
  let bmiCategory = '';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi < 25) bmiCategory = 'Normal';
  else if (bmi < 30) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese';
  
  // Calculate BMR (Mifflin-St Jeor)
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  
  // Calculate TDEE
  let tdee = bmr * activityLevel;
  
  // Adjust for goal
  let targetCalories = tdee;
  if (goal === 'lose') {
    targetCalories = tdee - 500; // 0.5 kg/week loss
  } else if (goal === 'gain') {
    targetCalories = tdee + 300; // Lean bulk
  }
  
  targetCalories = Math.round(targetCalories);
  
  // Calculate macros
  // Protein: 2g per kg bodyweight for active people
  // Fat: 25% of calories
  // Carbs: remainder
  const proteinG = Math.round(weight * 2);
  const fatG = Math.round((targetCalories * 0.25) / 9);
  const carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4);
  
  userProfile.targetCalories = targetCalories;
  userProfile.targetProtein = proteinG;
  userProfile.targetCarbs = carbsG;
  userProfile.targetFat = fatG;
  
  // Update UI
  document.getElementById('resultBMI').textContent = userProfile.bmi;
  document.getElementById('resultBMICategory').textContent = bmiCategory;
  document.getElementById('resultCalories').textContent = targetCalories + ' kcal';
  document.getElementById('resultProtein').textContent = proteinG + 'g';
  document.getElementById('resultCarbs').textContent = carbsG + 'g';
  document.getElementById('resultFat').textContent = fatG + 'g';
}

async function saveProfileAndTargets() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    await setDoc(userDocRef, {
      profile: {
        age: userProfile.age,
        gender: userProfile.gender,
        height: userProfile.height,
        weight: userProfile.weight,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        bmi: userProfile.bmi,
        createdAt: new Date().toISOString()
      },
      targets: {
        calories: userProfile.targetCalories,
        protein: userProfile.targetProtein,
        carbs: userProfile.targetCarbs,
        fat: userProfile.targetFat
      },
      goalWeight: userProfile.goal === 'lose' ? userProfile.weight - 5 : 
                  userProfile.goal === 'gain' ? userProfile.weight + 5 : 
                  userProfile.weight
    }, { merge: true });
    
    // Update local targets
    targets = {
      calories: userProfile.targetCalories,
      protein: userProfile.targetProtein,
      carbs: userProfile.targetCarbs,
      fat: userProfile.targetFat
    };
    
    // Update current weight
    goalWeight = userProfile.goal === 'lose' ? userProfile.weight - 5 : 
                 userProfile.goal === 'gain' ? userProfile.weight + 5 : 
                 userProfile.weight;
    
    updateTargetsDisplay();
    hideOnboarding();
    showToast('✓ Profile saved! Your targets are set.');
    
    // Refresh displays
    render();
    await renderWeightChart();
    
  } catch (err) {
    console.error("Error saving profile:", err);
    showToast('Error saving profile. Try again.');
  }
}

// ------------------------------
// Targets Functions
// ------------------------------
function toggleEditTargets() {
  targetsDisplay.classList.toggle('hidden');
  targetsEdit.classList.toggle('hidden');
  
  // If entering edit mode, populate inputs with current values
  if (!targetsEdit.classList.contains('hidden')) {
    document.getElementById('inputCalTarget').value = targets.calories;
    document.getElementById('inputProteinTarget').value = targets.protein;
    document.getElementById('inputCarbsTarget').value = targets.carbs;
    document.getElementById('inputFatTarget').value = targets.fat;
  }
}

async function saveTargets() {
  const newTargets = {
    calories: Number(document.getElementById('inputCalTarget').value) || 2100,
    protein: Number(document.getElementById('inputProteinTarget').value) || 150,
    carbs: Number(document.getElementById('inputCarbsTarget').value) || 240,
    fat: Number(document.getElementById('inputFatTarget').value) || 60
  };
  
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    await updateDoc(userDocRef, { targets: newTargets });
    targets = newTargets;
    updateTargetsDisplay();
    toggleEditTargets();
    render(); // Re-render to update remaining calories
    alert('Targets saved!');
  } catch (err) {
    console.error("Error saving targets:", err);
    alert('Failed to save targets. Check console.');
  }
}

async function loadTargetsFromFirestore() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data().targets) {
      targets = userSnap.data().targets;
      updateTargetsDisplay();
    }
  } catch (err) {
    console.error("Error loading targets:", err);
  }
}

function updateTargetsDisplay() {
  document.getElementById('displayCalTarget').textContent = targets.calories;
  document.getElementById('displayProteinTarget').textContent = targets.protein;
  document.getElementById('displayCarbsTarget').textContent = targets.carbs;
  document.getElementById('displayFatTarget').textContent = targets.fat;
  
  // Also update the remaining calories display
  document.getElementById('remainingCalories').textContent = targets.calories;
}

// ------------------------------
// Goal Weight Functions
// ------------------------------
function toggleGoalWeightEdit() {
  goalWeightSection.classList.toggle('hidden');
  goalWeightEdit.classList.toggle('hidden');
  
  if (!goalWeightEdit.classList.contains('hidden') && goalWeight) {
    document.getElementById('inputGoalWeight').value = goalWeight;
  }
}

async function saveGoalWeight() {
  const newGoalWeight = Number(document.getElementById('inputGoalWeight').value);
  
  if (!newGoalWeight || newGoalWeight <= 0) {
    alert('Please enter a valid goal weight');
    return;
  }
  
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    // Save goal weight and starting weight (current weight when goal is set)
    const updateData = { goalWeight: newGoalWeight };
    
    // Only set starting weight if it's a new goal or goal changed significantly
    if (!startingWeight || Math.abs(goalWeight - newGoalWeight) > 1) {
      updateData.startingWeight = currentWeight || newGoalWeight;
      startingWeight = currentWeight || newGoalWeight;
    }
    
    await updateDoc(userDocRef, updateData);
    goalWeight = newGoalWeight;
    updateGoalWeightDisplay();
    toggleGoalWeightEdit();
    await renderWeightChart(); // Re-render chart with goal line
    showToast('<i data-lucide="check"></i> Goal weight saved!', 'success');
  } catch (err) {
    console.error("Error saving goal weight:", err);
    showToast('Failed to save. Please try again.', 'error');
  }
}

async function loadGoalWeight() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.goalWeight) {
        goalWeight = data.goalWeight;
      }
      if (data.startingWeight) {
        startingWeight = data.startingWeight;
      }
    }
  } catch (err) {
    console.error("Error loading goal weight:", err);
  }
}

function updateGoalWeightDisplay() {
  const goalValueEl = document.getElementById('goalWeightValue');
  const currentValueEl = document.getElementById('currentWeightDisplay');
  const toGoEl = document.getElementById('weightToGoDisplay');
  const progressEl = document.getElementById('goalWeightProgress');
  
  // Update current weight
  currentValueEl.textContent = currentWeight ? `${currentWeight} kg` : '-- kg';
  
  // Update goal weight
  goalValueEl.textContent = goalWeight ? `${goalWeight} kg` : '-- kg';
  
  // Calculate progress
  if (goalWeight && currentWeight && startingWeight) {
    const diff = currentWeight - goalWeight;
    const absDiff = Math.abs(diff).toFixed(1);
    
    if (diff > 0.1) {
      // Need to lose weight
      toGoEl.textContent = `-${absDiff} kg`;
      toGoEl.style.color = '#ef4444'; // Red - need to lose
    } else if (diff < -0.1) {
      // Need to gain weight
      toGoEl.textContent = `+${absDiff} kg`;
      toGoEl.style.color = '#3b82f6'; // Blue - need to gain
    } else {
      toGoEl.textContent = '<i data-lucide="check"></i> Goal!';
      toGoEl.style.color = '#22c55e';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    // Calculate actual progress based on starting weight
    // Progress = how much you've moved from start toward goal
    const totalToLose = startingWeight - goalWeight;
    const actualLost = startingWeight - currentWeight;
    
    let progress = 0;
    if (Math.abs(totalToLose) > 0.1) {
      // Calculate percentage (works for both weight loss and gain)
      progress = (actualLost / totalToLose) * 100;
      // Clamp between 0 and 100
      progress = Math.max(0, Math.min(100, progress));
    }
    
    progressEl.style.width = progress + '%';
  } else if (goalWeight && currentWeight) {
    // No starting weight yet - show 0% progress
    const diff = currentWeight - goalWeight;
    const absDiff = Math.abs(diff).toFixed(1);
    
    if (diff > 0) {
      toGoEl.textContent = `-${absDiff} kg`;
      toGoEl.style.color = '#ef4444';
    } else if (diff < 0) {
      toGoEl.textContent = `+${absDiff} kg`;
      toGoEl.style.color = '#3b82f6';
    } else {
      toGoEl.textContent = '<i data-lucide="check"></i> Goal!';
      toGoEl.style.color = '#22c55e';
    }
    
    progressEl.style.width = '0%';
  } else {
    toGoEl.textContent = '-- kg';
    toGoEl.style.color = '#3b82f6';
    progressEl.style.width = '0%';
  }
}

// ------------------------------
// Food Log Functions (Firebase)
// ------------------------------
async function saveFoodsToFirestore(dateStr = today) {
  const docRef = doc(db, "users", getUserId(), "foodLog", dateStr);
  
  try {
    await setDoc(docRef, {
      date: dateStr,
      foods: foods,
      updatedAt: new Date()
    });
    console.log("Foods saved to Firestore");
  } catch (err) {
    console.error("Error saving foods to Firestore:", err);
    // Fallback to localStorage
    allFoods[dateStr] = foods;
    localStorage.setItem('allFoods', JSON.stringify(allFoods));
  }
}

async function loadFoodsFromFirestore(dateStr = today) {
  const docRef = doc(db, "users", getUserId(), "foodLog", dateStr);
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      foods = docSnap.data().foods || [];
    } else {
      foods = [];
    }
  } catch (err) {
    console.error("Error loading foods from Firestore:", err);
    // Fallback to localStorage
    foods = allFoods[dateStr] || [];
  }
  
  return foods;
}

async function addFood() {
  const food = {
    name: foodName.value.trim(),
    calories: +foodCalories.value,
    protein: +foodProtein.value || 0,
    carbs: +foodCarbs.value || 0,
    fat: +foodFat.value || 0,
    meal: selectedMealTag
  };

  if (!food.name || !food.calories) {
    alert('Please enter food name and calories');
    return;
  }

  // Check if we're editing an existing food
  if (editingFoodIndex !== null) {
    // Update existing food
    foods[editingFoodIndex] = food;
    await saveFoodsToFirestore();
    
    showToast(`<i data-lucide="check"></i> ${food.name} updated!`, 'success');
    haptic('success');
    
    // Reset edit mode
    editingFoodIndex = null;
    const addBtn = document.getElementById('addFoodBtn');
    addBtn.innerHTML = '<i data-lucide="plus"></i> Add to Log';
    addBtn.classList.remove('editing');
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
  } else {
    // Add new food
    foods.push(food);
    await saveFoodsToFirestore();
    
    // Add to recent foods
    addToRecentFoods(food);
    
    // Show toast notification
    showToast(`<i data-lucide="check"></i> ${food.name} added (${food.calories} cal)`);
  }
  
  clearFoodInputs();
  render();
  
  // Check achievements
  checkAchievements();
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function removeFood(index) {
  // Store for undo
  deletedFood = {
    food: foods[index],
    index: index
  };
  
  foods.splice(index, 1);
  await saveFoodsToFirestore();
  render();
  
  // Show undo toast
  showUndoToast(deletedFood.food.name);
}

// Make removeFood available globally for onclick
window.removeFood = removeFood;

function render() {
  let cal = 0, p = 0, c = 0, f = 0;
  foodTable.innerHTML = '';

  const mealLabels = {
    breakfast: '<i data-lucide="sunrise" class="meal-icon"></i>',
    lunch: '<i data-lucide="sun" class="meal-icon"></i>',
    dinner: '<i data-lucide="moon" class="meal-icon"></i>',
    snack: '<i data-lucide="cookie" class="meal-icon"></i>'
  };

  // Show empty state if no foods
  if (foods.length === 0) {
    foodTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i data-lucide="utensils" class="empty-state-icon"></i>
          <div class="empty-state-title">No foods logged yet</div>
          <div class="empty-state-desc">Start tracking by adding your first meal above</div>
        </td>
      </tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  foods.forEach((food, i) => {
    cal += food.calories;
    p += food.protein;
    c += food.carbs;
    f += food.fat;

    const mealBadge = food.meal 
      ? `<span class="meal-badge ${food.meal}">${mealLabels[food.meal]}</span>` 
      : '';

    foodTable.innerHTML += `
      <tr>
        <td>${food.name}${mealBadge}</td>
        <td>${food.calories}</td>
        <td>${food.protein}</td>
        <td>${food.carbs}</td>
        <td>${food.fat}</td>
        <td class="food-actions">
          <span class="edit-food" onclick="editFood(${i})" title="Edit"><i data-lucide="pencil"></i></span>
          <span class="delete-food" onclick="removeFood(${i})" title="Delete"><i data-lucide="x"></i></span>
        </td>
      </tr>`;
  });

  sumCalories.textContent = cal;
  sumProtein.textContent = p;
  sumCarbs.textContent = c;
  sumFat.textContent = f;

  // Use dynamic targets
  const remaining = Math.max(targets.calories - cal, 0);
  remainingCalories.textContent = remaining;

  const caloriePercent = (cal / targets.calories) * 100;
  calProgress.style.width = Math.min(caloriePercent, 100) + '%';
  
  // Trigger confetti when hitting calorie goal (90-105% range)
  if (caloriePercent >= 90 && caloriePercent <= 105) {
    triggerGoalConfetti();
  }

  // Color coding using dynamic targets
  sumCalories.style.color = cal <= targets.calories ? 'lightgreen' : 'red';
  sumProtein.style.color = p <= targets.protein ? 'lightgreen' : 'red';
  sumCarbs.style.color = c <= targets.carbs ? 'lightgreen' : 'red';
  sumFat.style.color = f <= targets.fat ? 'lightgreen' : 'red';
  remainingCalories.style.color = remaining > 0 ? 'lightgreen' : 'red';
  
  // Calculate calories by meal
  const mealCalories = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  foods.forEach(food => {
    if (food.meal && mealCalories.hasOwnProperty(food.meal)) {
      mealCalories[food.meal] += food.calories;
    }
  });
  
  // Update calories by meal display
  document.getElementById('calBreakfast').textContent = mealCalories.breakfast;
  document.getElementById('calLunch').textContent = mealCalories.lunch;
  document.getElementById('calDinner').textContent = mealCalories.dinner;
  document.getElementById('calSnack').textContent = mealCalories.snack;
  
  // Update macro pie chart
  renderMacroChart();
  
  // Re-initialize Lucide icons for dynamic content
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function clearFoodInputs() {
  foodName.value = '';
  foodCalories.value = '';
  foodProtein.value = '';
  foodCarbs.value = '';
  foodFat.value = '';
}

// ------------------------------
// Daily Check-in & Streak
// ------------------------------
async function saveStatus() {
  const todayStr = getFormattedDate(); // MM-DD-YYYY format

  // Firestore path: users > defaultUser > dailyStatus > [date]
  const docRef = doc(db, "users", getUserId(), "dailyStatus", todayStr);
  
  try {
    // Prevent multiple check-ins
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      alert("You have already checked in today!");
      return;
    }

    // Encode workout as boolean
    const workoutBool = workout.value.toLowerCase() === "yes";

    const status = {
      date: new Date(), // Firestore Timestamp
      weight: Number(weight.value),
      workout: workoutBool,
      notes: notes.value || ""
    };

    await setDoc(docRef, status);
    showToast('<i data-lucide="check"></i> Daily check-in saved!', 'success');

    // Update streak in Firestore
    await updateStreakInFirestore();

    // Disable button
    saveStatusBtn.disabled = true;
    saveStatusBtn.textContent = "Checked In";
    
    // Update weight chart and check achievements
    await renderWeightChart();
    await checkAchievements();

  } catch (err) {
    console.error("Error saving daily status:", err);
    showToast('Failed to save. Please try again.', 'error');
  }
}


// Update streak count in Firestore (users/defaultUser)
async function updateStreakInFirestore() {
  const userDocRef = doc(db, "users", getUserId());
  const todayDate = new Date();
  const todayStr = getFormattedDate(todayDate);
  const dayIndex = todayDate.getDay();
  
  try {
    const userSnap = await getDoc(userDocRef);
    let currentStreak = 0;
    let lastDate = null;
    let weekData = {};
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      currentStreak = data.streakCount || 0;
      lastDate = data.lastCheckIn || null;
      weekData = data.weekVisual || {};
    }
    
    // Calculate streak
    if (lastDate) {
      const last = new Date(lastDate);
      const diffDays = Math.round((todayDate - last) / (1000*60*60*24));
      if (diffDays === 1) currentStreak += 1;
      else if (diffDays > 1) currentStreak = 1;
    } else {
      currentStreak = 1;
    }
    
    // Update week visual (mark today as checked)
    weekData[dayIndex] = true;
    
    // Save to Firestore
    await updateDoc(userDocRef, {
      streakCount: currentStreak,
      lastCheckIn: todayStr,
      weekVisual: weekData
    });
    
    // Update UI
    await loadStreakFromFirestore();
    
  } catch (err) {
    console.error("Error updating streak in Firestore:", err);
  }
}

function renderStreakVisual(streakData) {
  const visual = document.getElementById('streakVisual');
  visual.innerHTML = '';
  const days = ['S','M','T','W','T','F','S'];
  const weekData = streakData.weekVisual || {};
  
  days.forEach((d, i) => {
    const dot = document.createElement('div');
    dot.className = 'day';
    if (weekData[i]) dot.classList.add('active');
    dot.textContent = d;
    visual.appendChild(dot);
  });

  // Milestone badges
  const milestones = [3,7,14,30];
  const milestoneContainer = document.getElementById('streakMilestones');
  milestoneContainer.innerHTML = '';
  const count = streakData.streakCount || 0;
  
  milestones.forEach(m => {
    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = m;
    if (count >= m) {
      badge.classList.add('active');
    }
    milestoneContainer.appendChild(badge);
  });
  
  // Trigger fireworks if milestone reached
  if ([3,7,14,30].includes(count)) {
    triggerFireworks();
  }
}

// Legacy function for fallback
function loadStreak() {
  const streakData = JSON.parse(localStorage.getItem('streakData')) || { lastDate: null, count: 0, week: {} };
  document.getElementById('streakCount').textContent = streakData.count;
  renderStreakVisual({ streakCount: streakData.count, weekVisual: streakData.week });
}

function triggerFireworks() {
  const canvas = document.getElementById('fireworksCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles = [];
  for(let i=0;i<30;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height/2,
      vx: (Math.random()-0.5)*6,
      vy: (Math.random()-0.5)*6,
      radius: Math.random()*3+2,
      alpha:1
    });
  }

  const interval = setInterval(() => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x+=p.vx;
      p.y+=p.vy;
      p.alpha-=0.02;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,215,0,${p.alpha})`;
      ctx.fill();
    });
    if(particles.every(p=>p.alpha<=0)) clearInterval(interval);
  },30);
}

// ------------------------------
// History Navigation
// ------------------------------
let startX = 0;
historyDate.addEventListener('touchstart', e => startX = e.touches[0].clientX);
historyDate.addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  if(endX-startX>50) changeHistoryDate(-1);
  else if(startX-endX>50) changeHistoryDate(1);
});

function changeHistoryDate(offset){
  const current = new Date(historyDate.value);
  current.setDate(current.getDate()+offset);
  historyDate.value = current.toISOString().split('T')[0];
  viewHistory();
}

async function viewHistory() {
  const selectedDateObj = new Date(historyDate.value);
  const selectedDate = getFormattedDate(selectedDateObj);
  
  // Load foods from Firestore
  await loadFoodsFromFirestore(selectedDate);
  render();

  // Fetch daily status from Firestore
  const docRef = doc(db, "users", getUserId(), "dailyStatus", selectedDate);
  
  try {
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const status = docSnap.data();
      weight.value = status.weight || '';
      workout.value = status.workout ? 'Yes' : 'No';
      notes.value = status.notes || '';
    } else {
      weight.value = '';
      workout.value = 'Yes';
      notes.value = '';
    }

    const todayStr = getFormattedDate();
    if (selectedDate === todayStr && docSnap.exists()) {
      saveStatusBtn.disabled = true;
      saveStatusBtn.textContent = 'Checked In';
    } else {
      saveStatusBtn.disabled = false;
      saveStatusBtn.textContent = 'Save Check-In';
    }
  } catch (err) {
    console.error("Error fetching history:", err);
  }

  renderWeightChart();
}

// ------------------------------
// Reset Streak (Firebase + localStorage)
// ------------------------------
async function resetStreak() {
  if (confirm('Are you sure you want to reset your streak?')) {
    const userDocRef = doc(db, "users", getUserId());
    
    try {
      // Reset in Firestore
      await updateDoc(userDocRef, {
        streakCount: 0,
        lastCheckIn: null,
        weekVisual: {}
      });
      
      // Also clear localStorage
      localStorage.removeItem('streakData');
      
      // Reload UI
      await loadStreakFromFirestore();
      alert('Streak has been reset.');
      
    } catch (err) {
      console.error("Error resetting streak:", err);
      alert('Failed to reset streak. Check console.');
    }
  }
}

// ------------------------------
// Delete Today's Check-In (for testing)
// ------------------------------
async function deleteTodayCheckIn() {
  const todayStr = getFormattedDate();
  const docRef = doc(db, "users", getUserId(), "dailyStatus", todayStr);
  
  try {
    await docRef.delete();
    alert("Today's check-in deleted! You can now check in again.");
    saveStatusBtn.disabled = false;
    saveStatusBtn.textContent = 'Save Check-In';
  } catch (err) {
    console.error("Error deleting check-in:", err);
    alert("Failed to delete. Check console.");
  }
}

// Make it available in console for testing
window.deleteTodayCheckIn = deleteTodayCheckIn;

// ------------------------------
// Auto-reset at midnight
// ------------------------------
function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()-now.getTime();

  setTimeout(async () => {
    // Reset for new day
    foods = [];
    render();
    saveStatusBtn.disabled = false;
    saveStatusBtn.textContent = 'Save Check-In';
    
    // Reset week visual on Sunday (start of new week)
    if (new Date().getDay() === 0) {
      const userDocRef = doc(db, "users", getUserId());
      try {
        await updateDoc(userDocRef, { weekVisual: {} });
      } catch (err) {
        console.error("Error resetting week visual:", err);
      }
    }
    
    scheduleMidnightReset();
  }, msUntilMidnight);
}

// ------------------------------
// Weight Progress Chart
// ------------------------------
async function renderWeightChart() {
  const weights = [];
  const dates = [];

  // Fetch all daily status documents from Firestore
  const dailyStatusRef = collection(db, "users", getUserId(), "dailyStatus");
  
  try {
    const querySnapshot = await getDocs(dailyStatusRef);
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.weight) {
        dates.push(docSnap.id); // Document ID is the date (MM-DD-YYYY)
        weights.push(+data.weight);
      }
    });
    
    // Sort by date
    const combined = dates.map((date, i) => ({ date, weight: weights[i] }));
    combined.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const sortedDates = combined.map(item => item.date);
    const sortedWeights = combined.map(item => item.weight);
    
    // Set current weight (most recent)
    if (sortedWeights.length > 0) {
      currentWeight = sortedWeights[sortedWeights.length - 1];
      updateGoalWeightDisplay();
    }

    const ctx = document.getElementById('weightChart').getContext('2d');

    // Destroy previous chart only if it's a Chart instance
    if (window.weightChart instanceof Chart) {
      window.weightChart.destroy();
    }
    
    // Prepare datasets
    const datasets = [{
      label: 'Weight (kg)',
      data: sortedWeights,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.2)',
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }];
    
    // Add goal line if goal weight is set
    if (goalWeight && sortedDates.length > 0) {
      datasets.push({
        label: 'Goal Weight',
        data: sortedDates.map(() => goalWeight),
        borderColor: '#3b82f6',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false
      });
    }

    window.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: { 
            display: goalWeight ? true : false,
            labels: {
              color: '#9ca3af'
            }
          }
        },
        scales: {
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
    
  } catch (err) {
    console.error("Error fetching weight history:", err);
  }
}

// ------------------------------
// Weekly Stats
// ------------------------------
async function loadWeeklyStats() {
  const dailyStatusRef = collection(db, "users", getUserId(), "dailyStatus");
  const foodLogRef = collection(db, "users", getUserId(), "foodLog");
  
  // Get dates for the last 7 days
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(getFormattedDate(date));
  }
  
  let checkIns = 0;
  let workouts = 0;
  let totalWeight = 0;
  let weightCount = 0;
  let totalCalories = 0;
  let caloriesCount = 0;
  
  try {
    // Fetch daily status for weekly stats
    const statusSnapshot = await getDocs(dailyStatusRef);
    statusSnapshot.forEach((docSnap) => {
      if (last7Days.includes(docSnap.id)) {
        const data = docSnap.data();
        checkIns++;
        if (data.workout) workouts++;
        if (data.weight) {
          totalWeight += data.weight;
          weightCount++;
        }
      }
    });
    
    // Fetch food logs for calorie averages
    const foodSnapshot = await getDocs(foodLogRef);
    foodSnapshot.forEach((docSnap) => {
      if (last7Days.includes(docSnap.id)) {
        const data = docSnap.data();
        if (data.foods && data.foods.length > 0) {
          const dayCalories = data.foods.reduce((sum, food) => sum + (food.calories || 0), 0);
          totalCalories += dayCalories;
          caloriesCount++;
        }
      }
    });
    
    // Update UI
    document.getElementById('weeklyCheckIns').textContent = checkIns;
    document.getElementById('weeklyWorkouts').textContent = workouts;
    document.getElementById('weeklyAvgCalories').textContent = caloriesCount > 0 
      ? Math.round(totalCalories / caloriesCount) 
      : 0;
    document.getElementById('weeklyAvgWeight').textContent = weightCount > 0 
      ? (totalWeight / weightCount).toFixed(1) + ' kg'
      : '--';
    
    // Weekly goal progress (7 check-ins = 100%)
    const goalPercent = Math.round((checkIns / 7) * 100);
    document.getElementById('weeklyGoalProgress').style.width = goalPercent + '%';
    document.getElementById('weeklyGoalPercent').textContent = goalPercent + '%';
    
  } catch (err) {
    console.error("Error loading weekly stats:", err);
  }
}

// ------------------------------
// Load streak from Firestore
// ------------------------------
async function loadStreakFromFirestore() {
  const userDocRef = doc(db, "users", getUserId());
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById('streakCount').textContent = data.streakCount || 0;
      renderStreakVisual(data);
    } else {
      // Initialize user document if it doesn't exist
      document.getElementById('streakCount').textContent = 0;
      renderStreakVisual({ streakCount: 0, weekVisual: {} });
    }
  } catch (err) {
    console.error("Error loading streak from Firestore:", err);
    // Fallback to localStorage
    loadStreak();
  }
}

// Check if user already checked in today (from Firestore)
async function checkTodayStatus() {
  const todayStr = getFormattedDate();
  const docRef = doc(db, "users", getUserId(), "dailyStatus", todayStr);
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      saveStatusBtn.disabled = true;
      saveStatusBtn.textContent = 'Checked In';
    }
  } catch (err) {
    console.error("Error checking today's status:", err);
  }
}

// ------------------------------
// Export Data
// ------------------------------

// Export food logs as CSV
document.getElementById('exportFoodLogsBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('exportFoodLogsBtn');
  try {
    btn.disabled = true;
    
    const foodLogsRef = db.collection('users').doc(getUserId()).collection('foodLogs');
    const snapshot = await foodLogsRef.orderBy('__name__').get();
    
    if (snapshot.empty) {
      showToast('No food logs to export', 'warning');
      return;
    }
    
    // Build CSV
    let csv = 'Date,Food Name,Calories,Protein (g),Carbs (g),Fat (g),Meal\n';
    
    snapshot.forEach(doc => {
      const date = doc.id;
      const data = doc.data();
      if (data.foods && Array.isArray(data.foods)) {
        data.foods.forEach(food => {
          csv += `"${date}","${food.name}",${food.calories},${food.protein || 0},${food.carbs || 0},${food.fat || 0},"${food.meal || ''}"\n`;
        });
      }
    });
    
    downloadCSV(csv, `fitflow-food-logs-${getFormattedDate()}.csv`);
    showToast('<i data-lucide="download"></i> Food logs exported!', 'success');
    
  } catch (error) {
    console.error('Error exporting food logs:', error);
    showToast('Failed to export data', 'error');
  } finally {
    btn.disabled = false;
  }
});

// Export weight history as CSV
document.getElementById('exportWeightBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('exportWeightBtn');
  try {
    btn.disabled = true;
    
    const statusRef = db.collection('users').doc(getUserId()).collection('dailyStatus');
    const snapshot = await statusRef.orderBy('date').get();
    
    if (snapshot.empty) {
      showToast('No weight history to export', 'warning');
      return;
    }
    
    // Build CSV
    let csv = 'Date,Weight (kg),Workout,Notes\n';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const dateStr = data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : doc.id;
      csv += `"${dateStr}",${data.weight || ''},"${data.workout ? 'Yes' : 'No'}","${(data.notes || '').replace(/"/g, '""')}"\n`;
    });
    
    downloadCSV(csv, `fitflow-weight-history-${getFormattedDate()}.csv`);
    showToast('<i data-lucide="download"></i> Weight history exported!', 'success');
    
  } catch (error) {
    console.error('Error exporting weight history:', error);
    showToast('Failed to export data', 'error');
  } finally {
    btn.disabled = false;
  }
});

// Export all data as single CSV
document.getElementById('exportAllBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('exportAllBtn');
  try {
    btn.disabled = true;
    
    // Get all data
    const [foodLogsSnap, statusSnap, userSnap] = await Promise.all([
      db.collection('users').doc(getUserId()).collection('foodLogs').get(),
      db.collection('users').doc(getUserId()).collection('dailyStatus').orderBy('date').get(),
      getDoc(doc(db, "users", getUserId()))
    ]);
    
    // Create summary CSV
    let csv = '=== FITFLOW DATA EXPORT ===\n';
    csv += `Export Date: ${new Date().toISOString()}\n\n`;
    
    // Profile
    if (userSnap.exists()) {
      const userData = userSnap.data();
      csv += '=== PROFILE ===\n';
      csv += `Calorie Target,${userData.calorieTarget || ''}\n`;
      csv += `Protein Target,${userData.proteinTarget || ''}\n`;
      csv += `Carb Target,${userData.carbTarget || ''}\n`;
      csv += `Fat Target,${userData.fatTarget || ''}\n`;
      csv += `Goal Weight,${userData.goalWeight || ''}\n`;
      csv += `Streak,${userData.streak || 0}\n\n`;
    }
    
    // Weight History
    csv += '=== WEIGHT HISTORY ===\n';
    csv += 'Date,Weight (kg),Workout,Notes\n';
    statusSnap.forEach(doc => {
      const data = doc.data();
      const dateStr = data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : doc.id;
      csv += `"${dateStr}",${data.weight || ''},"${data.workout ? 'Yes' : 'No'}","${(data.notes || '').replace(/"/g, '""')}"\n`;
    });
    csv += '\n';
    
    // Food Logs
    csv += '=== FOOD LOGS ===\n';
    csv += 'Date,Food Name,Calories,Protein,Carbs,Fat,Meal\n';
    foodLogsSnap.forEach(doc => {
      const date = doc.id;
      const data = doc.data();
      if (data.foods && Array.isArray(data.foods)) {
        data.foods.forEach(food => {
          csv += `"${date}","${food.name}",${food.calories},${food.protein || 0},${food.carbs || 0},${food.fat || 0},"${food.meal || ''}"\n`;
        });
      }
    });
    
    downloadCSV(csv, `fitflow-complete-export-${getFormattedDate()}.csv`);
    showToast('<i data-lucide="download"></i> All data exported!', 'success');
    
  } catch (error) {
    console.error('Error exporting all data:', error);
    showToast('Failed to export data', 'error');
  } finally {
    btn.disabled = false;
  }
});

// Download CSV helper
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ------------------------------
// Achievements
// ------------------------------
const ACHIEVEMENTS = [
  // Streak achievements
  { id: 'streak_3', name: 'Getting Started', desc: '3 day streak', icon: 'flame', tier: 'bronze', type: 'streak', target: 3 },
  { id: 'streak_7', name: 'One Week Strong', desc: '7 day streak', icon: 'flame', tier: 'silver', type: 'streak', target: 7 },
  { id: 'streak_14', name: 'Committed', desc: '14 day streak', icon: 'flame', tier: 'gold', type: 'streak', target: 14 },
  { id: 'streak_30', name: 'Unstoppable', desc: '30 day streak', icon: 'flame', tier: 'platinum', type: 'streak', target: 30 },
  { id: 'streak_100', name: 'Legend', desc: '100 day streak', icon: 'flame', tier: 'diamond', type: 'streak', target: 100 },
  
  // Check-in achievements
  { id: 'checkins_10', name: 'Consistency', desc: '10 total check-ins', icon: 'clipboard-check', tier: 'bronze', type: 'checkins', target: 10 },
  { id: 'checkins_50', name: 'Dedicated', desc: '50 total check-ins', icon: 'clipboard-check', tier: 'silver', type: 'checkins', target: 50 },
  { id: 'checkins_100', name: 'Centurion', desc: '100 total check-ins', icon: 'clipboard-check', tier: 'gold', type: 'checkins', target: 100 },
  
  // Food logging achievements
  { id: 'foods_50', name: 'Tracker', desc: 'Log 50 foods', icon: 'utensils', tier: 'bronze', type: 'foods', target: 50 },
  { id: 'foods_200', name: 'Nutrition Nerd', desc: 'Log 200 foods', icon: 'utensils', tier: 'silver', type: 'foods', target: 200 },
  { id: 'foods_500', name: 'Macro Master', desc: 'Log 500 foods', icon: 'utensils', tier: 'gold', type: 'foods', target: 500 },
  
  // Weight progress achievements
  { id: 'weight_5', name: 'First Steps', desc: '5 weight entries', icon: 'scale', tier: 'bronze', type: 'weight', target: 5 },
  { id: 'weight_20', name: 'Tracking Pro', desc: '20 weight entries', icon: 'scale', tier: 'silver', type: 'weight', target: 20 },
  
  // Photo achievements
  { id: 'photos_1', name: 'Snapshot', desc: 'First progress photo', icon: 'camera', tier: 'bronze', type: 'photos', target: 1 },
  { id: 'photos_5', name: 'Transformation', desc: '5 progress photos', icon: 'camera', tier: 'silver', type: 'photos', target: 5 },
  
  // Special achievements
  { id: 'goal_reached', name: 'Goal Crusher', desc: 'Reach goal weight', icon: 'trophy', tier: 'diamond', type: 'goal', target: 1 },
  { id: 'my_foods_10', name: 'Meal Prepper', desc: 'Save 10 foods', icon: 'bookmark', tier: 'bronze', type: 'myfoods', target: 10 }
];

let userAchievements = {};

// Load achievements from Firestore
async function loadAchievements() {
  try {
    const docRef = doc(db, "users", getUserId());
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().achievements) {
      userAchievements = docSnap.data().achievements;
    } else {
      userAchievements = {};
    }
    
    renderAchievements();
  } catch (error) {
    console.error('Error loading achievements:', error);
  }
}

// Get achievement progress data
async function getAchievementProgress() {
  const progress = {
    streak: 0,
    checkins: 0,
    foods: 0,
    weight: 0,
    photos: 0,
    goal: 0,
    myfoods: 0
  };
  
  try {
    // Get streak
    const streakEl = document.getElementById('streakCount');
    if (streakEl) {
      progress.streak = parseInt(streakEl.textContent) || 0;
    }
    
    // Get total check-ins
    const checkinsRef = db.collection('users').doc(getUserId()).collection('dailyStatus');
    const checkinsSnap = await checkinsRef.get();
    progress.checkins = checkinsSnap.size;
    
    // Get total foods logged (approximate from all daily logs)
    const foodsRef = db.collection('users').doc(getUserId()).collection('foodLogs');
    const foodsSnap = await foodsRef.get();
    let totalFoods = 0;
    foodsSnap.forEach(doc => {
      const data = doc.data();
      if (data.foods && Array.isArray(data.foods)) {
        totalFoods += data.foods.length;
      }
    });
    progress.foods = totalFoods;
    
    // Get weight entries count
    let weightCount = 0;
    checkinsSnap.forEach(doc => {
      const data = doc.data();
      if (data.weight) weightCount++;
    });
    progress.weight = weightCount;
    
    // Get photos count
    progress.photos = progressPhotos.length;
    
    // Check if goal reached
    const goalEl = document.getElementById('goalWeightValue');
    const currentEl = document.getElementById('currentWeight');
    if (goalEl && currentEl) {
      const goal = parseFloat(goalEl.textContent) || 0;
      const current = parseFloat(currentEl.textContent) || 0;
      if (goal > 0 && current > 0 && Math.abs(current - goal) < 0.5) {
        progress.goal = 1;
      }
    }
    
    // Get my foods count
    progress.myfoods = myFoods.length;
    
  } catch (error) {
    console.error('Error getting achievement progress:', error);
  }
  
  return progress;
}

// Render achievements grid
async function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  const countEl = document.getElementById('achievementsCount');
  if (!grid) return;
  
  const progress = await getAchievementProgress();
  let unlockedCount = 0;
  
  grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const currentProgress = progress[ach.type] || 0;
    const isUnlocked = currentProgress >= ach.target;
    const wasJustUnlocked = isUnlocked && !userAchievements[ach.id];
    const progressPercent = Math.min((currentProgress / ach.target) * 100, 100);
    
    if (isUnlocked) {
      unlockedCount++;
      // Save if newly unlocked
      if (!userAchievements[ach.id]) {
        userAchievements[ach.id] = { unlockedAt: new Date().toISOString() };
        saveAchievements();
      }
    }
    
    return `
      <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'} ${wasJustUnlocked ? 'achievement-new' : ''}">
        ${isUnlocked ? '<div class="achievement-unlocked-badge"><i data-lucide="check"></i></div>' : ''}
        <div class="achievement-icon ${ach.tier}">
          <i data-lucide="${ach.icon}"></i>
        </div>
        <span class="achievement-name">${ach.name}</span>
        <span class="achievement-desc">${ach.desc}</span>
        ${!isUnlocked ? `
          <div class="achievement-progress">
            <div class="achievement-progress-bar">
              <div style="width: ${progressPercent}%"></div>
            </div>
            <span class="achievement-progress-text">${currentProgress}/${ach.target}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  countEl.textContent = `${unlockedCount}/${ACHIEVEMENTS.length}`;
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Save achievements to Firestore
async function saveAchievements() {
  try {
    const docRef = doc(db, "users", getUserId());
    await updateDoc(docRef, { achievements: userAchievements });
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
}

// Check for new achievements (call after actions)
async function checkAchievements() {
  const previousUnlocked = Object.keys(userAchievements).length;
  await renderAchievements();
  const currentUnlocked = Object.keys(userAchievements).length;
  
  // Show toast for new achievements
  if (currentUnlocked > previousUnlocked) {
    const newCount = currentUnlocked - previousUnlocked;
    showToast(`<i data-lucide="trophy"></i> ${newCount} new achievement${newCount > 1 ? 's' : ''} unlocked!`, 'success');
  }
}

// Share achievements
document.getElementById('shareAchievementsBtn')?.addEventListener('click', async () => {
  const unlockedAchievements = ACHIEVEMENTS.filter(ach => userAchievements[ach.id]);
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  
  if (unlockedCount === 0) {
    showToast('<i data-lucide="trophy"></i> Unlock some achievements first!', 'warning');
    return;
  }
  
  showToast('<i data-lucide="loader-2"></i> Creating image...', 'default');
  
  // Generate achievement card image
  const imageBlob = await generateAchievementImage(unlockedAchievements, unlockedCount, totalAchievements);
  
  // Try to share with image
  if (navigator.share && navigator.canShare) {
    const file = new File([imageBlob], 'fitflow-achievements.png', { type: 'image/png' });
    const shareData = {
      title: 'My FitFlow Achievements',
      text: '💪 Check out my fitness achievements!',
      files: [file]
    };
    
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('<i data-lucide="check"></i> Shared!', 'success');
        haptic('success');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
  }
  
  // Fallback: Download the image
  const url = URL.createObjectURL(imageBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fitflow-achievements.png';
  a.click();
  URL.revokeObjectURL(url);
  showToast('<i data-lucide="download"></i> Image downloaded!', 'success');
  haptic('success');
});

// Generate achievement card as image
async function generateAchievementImage(achievements, unlockedCount, totalCount) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Card dimensions
  const width = 600;
  const padding = 40;
  const headerHeight = 120;
  const achievementHeight = 50;
  const footerHeight = 80;
  const height = headerHeight + (achievements.length * achievementHeight) + footerHeight + padding * 2;
  
  canvas.width = width;
  canvas.height = height;
  
  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#1e293b');
  bgGradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle pattern
  ctx.fillStyle = 'rgba(139, 92, 246, 0.03)';
  for (let i = 0; i < width; i += 30) {
    for (let j = 0; j < height; j += 30) {
      ctx.beginPath();
      ctx.arc(i, j, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Header background
  const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
  headerGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
  headerGradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, width, headerHeight);
  
  // Header text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏋️ FitFlow Achievements', width / 2, 50);
  
  // Progress
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${unlockedCount} of ${totalCount} unlocked (${progressPercent}%)`, width / 2, 85);
  
  // Progress bar
  const barWidth = 300;
  const barHeight = 12;
  const barX = (width - barWidth) / 2;
  const barY = 95;
  
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 6);
  ctx.fill();
  
  const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  progressGradient.addColorStop(0, '#22c55e');
  progressGradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = progressGradient;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth * (progressPercent / 100), barHeight, 6);
  ctx.fill();
  
  // Tier colors
  const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    diamond: '#00bfff'
  };
  
  // Achievements list
  let y = headerHeight + padding;
  
  for (const ach of achievements) {
    // Achievement background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(padding, y, width - padding * 2, 40, 10);
    ctx.fill();
    
    // Tier badge
    ctx.fillStyle = tierColors[ach.tier] || '#8b5cf6';
    ctx.beginPath();
    ctx.arc(padding + 25, y + 20, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Trophy icon
    ctx.fillStyle = '#fff';
    ctx.font = '12px -apple-system';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', padding + 25, y + 24);
    
    // Achievement name
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ach.name, padding + 50, y + 18);
    
    // Achievement description
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(ach.desc, padding + 50, y + 34);
    
    y += achievementHeight;
  }
  
  // Footer
  const footerY = height - footerHeight;
  ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
  ctx.fillRect(0, footerY, width, footerHeight);
  
  ctx.fillStyle = '#8b5cf6';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('💪 Track your fitness journey', width / 2, footerY + 30);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('FitFlow - Your Personal Fitness Tracker', width / 2, footerY + 55);
  
  // Convert to blob
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
}

// ------------------------------
// Progress Photos
// ------------------------------
let progressPhotos = [];
let selectedPhotoData = null;

// Open photo modal
document.getElementById('addPhotoBtn')?.addEventListener('click', () => {
  document.getElementById('photoModal').classList.remove('hidden');
  document.getElementById('photoDate').value = getFormattedDate();
  document.getElementById('photoLabel').value = '';
  document.getElementById('photoPreview').innerHTML = '<i data-lucide="image-plus"></i><span>Click or drag to add photo</span>';
  document.getElementById('photoPreview').classList.remove('has-image');
  document.getElementById('savePhotoBtn').disabled = true;
  selectedPhotoData = null;
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// Close photo modal
document.getElementById('cancelPhotoBtn')?.addEventListener('click', () => {
  document.getElementById('photoModal').classList.add('hidden');
});

// Click on preview to select photo
document.getElementById('photoPreview')?.addEventListener('click', () => {
  document.getElementById('photoInput').click();
});

// Handle file selection
document.getElementById('photoInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    // Compress and convert to base64
    selectedPhotoData = await compressImage(file, 800, 0.7);
    
    // Show preview
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `<img src="${selectedPhotoData}" alt="Preview">`;
    preview.classList.add('has-image');
    
    // Enable save button
    document.getElementById('savePhotoBtn').disabled = false;
  } catch (error) {
    console.error('Error processing image:', error);
    showToast('Failed to process image', 'error');
  }
});

// Compress image to reduce storage size
function compressImage(file, maxSize = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Resize to max dimension while keeping aspect ratio
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Save photo to Firestore
document.getElementById('savePhotoBtn')?.addEventListener('click', async () => {
  if (!selectedPhotoData) return;
  
  const btn = document.getElementById('savePhotoBtn');
  const date = document.getElementById('photoDate').value;
  const label = document.getElementById('photoLabel').value.trim();
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2"></i> Saving...';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    const photoId = Date.now().toString();
    const photoData = {
      id: photoId,
      date: date,
      label: label,
      image: selectedPhotoData,
      createdAt: new Date().toISOString()
    };
    
    // Save to Firestore
    const docRef = doc(db, "users", getUserId(), "progressPhotos", photoId);
    await setDoc(docRef, photoData);
    
    // Close modal and refresh
    document.getElementById('photoModal').classList.add('hidden');
    showToast('<i data-lucide="check"></i> Photo saved!', 'success');
    
    // Reload photos and check achievements
    await loadProgressPhotos();
    await checkAchievements();
    
  } catch (error) {
    console.error('Error saving photo:', error);
    showToast('Failed to save photo', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="save"></i> Save Photo';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
});

// Load progress photos from Firestore
async function loadProgressPhotos() {
  try {
    const photosRef = db.collection('users').doc(getUserId()).collection('progressPhotos');
    const snapshot = await photosRef.orderBy('date', 'desc').get();
    
    progressPhotos = [];
    snapshot.forEach(doc => {
      progressPhotos.push(doc.data());
    });
    
    renderProgressPhotos();
  } catch (error) {
    console.error('Error loading photos:', error);
  }
}

// Render progress photos gallery
function renderProgressPhotos() {
  const gallery = document.getElementById('photosGallery');
  const empty = document.getElementById('photosEmpty');
  const actions = document.getElementById('photosActions');
  
  if (progressPhotos.length === 0) {
    empty.classList.remove('hidden');
    gallery.classList.add('hidden');
    actions.classList.add('hidden');
    return;
  }
  
  empty.classList.add('hidden');
  gallery.classList.remove('hidden');
  actions.classList.remove('hidden');
  
  gallery.innerHTML = progressPhotos.map(photo => `
    <div class="photo-item" data-id="${photo.id}">
      <img src="${photo.image}" alt="Progress photo">
      ${photo.label ? `<span class="photo-label">${photo.label}</span>` : ''}
      <span class="photo-date">${formatPhotoDate(photo.date)}</span>
      <button class="photo-delete" onclick="deletePhoto('${photo.id}')">
        <i data-lucide="x"></i>
      </button>
    </div>
  `).join('');
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  // Update compare dropdowns
  updateCompareDropdowns();
}

// Format date for display
function formatPhotoDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// Delete photo
async function deletePhoto(photoId) {
  if (!confirm('Delete this photo?')) return;
  
  try {
    const docRef = doc(db, "users", getUserId(), "progressPhotos", photoId);
    await deleteDoc(docRef);
    
    showToast('<i data-lucide="trash-2"></i> Photo deleted', 'default');
    await loadProgressPhotos();
  } catch (error) {
    console.error('Error deleting photo:', error);
    showToast('Failed to delete photo', 'error');
  }
}

// Make deletePhoto available globally
window.deletePhoto = deletePhoto;

// Compare photos functionality
document.getElementById('comparePhotosBtn')?.addEventListener('click', () => {
  if (progressPhotos.length < 2) {
    showToast('Need at least 2 photos to compare', 'warning');
    return;
  }
  
  document.getElementById('photosCompare').classList.remove('hidden');
  updateCompareDropdowns();
  
  // Auto-select first and last photos
  const leftSelect = document.getElementById('compareLeft');
  const rightSelect = document.getElementById('compareRight');
  
  if (leftSelect.options.length >= 2) {
    leftSelect.selectedIndex = leftSelect.options.length - 1; // Oldest
    rightSelect.selectedIndex = 0; // Newest
    updateComparePhotos();
  }
});

document.getElementById('closeCompareBtn')?.addEventListener('click', () => {
  document.getElementById('photosCompare').classList.add('hidden');
});

// Update compare dropdowns with photo options
function updateCompareDropdowns() {
  const leftSelect = document.getElementById('compareLeft');
  const rightSelect = document.getElementById('compareRight');
  
  if (!leftSelect || !rightSelect) return;
  
  const options = progressPhotos.map(photo => 
    `<option value="${photo.id}">${formatPhotoDate(photo.date)}${photo.label ? ` (${photo.label})` : ''}</option>`
  ).join('');
  
  leftSelect.innerHTML = options;
  rightSelect.innerHTML = options;
  
  // Add change listeners
  leftSelect.onchange = updateComparePhotos;
  rightSelect.onchange = updateComparePhotos;
}

// Update compare view with selected photos
function updateComparePhotos() {
  const leftId = document.getElementById('compareLeft').value;
  const rightId = document.getElementById('compareRight').value;
  
  const leftPhoto = progressPhotos.find(p => p.id === leftId);
  const rightPhoto = progressPhotos.find(p => p.id === rightId);
  
  const leftContainer = document.getElementById('compareLeftPhoto');
  const rightContainer = document.getElementById('compareRightPhoto');
  
  leftContainer.innerHTML = leftPhoto 
    ? `<img src="${leftPhoto.image}" alt="Before">`
    : '<span class="placeholder">Select photo</span>';
    
  rightContainer.innerHTML = rightPhoto 
    ? `<img src="${rightPhoto.image}" alt="After">`
    : '<span class="placeholder">Select photo</span>';
}

// ------------------------------
// Initialize
// ------------------------------
async function initApp() {
  // Initialize theme
  initTheme();
  
  // Check if new user - show onboarding
  const isNewUser = await checkIfNewUser();
  
  // Initialize food input tabs and USDA search
  initFoodInputTabs();
  initUSDASearch();
  
  // Initialize meal tags and auto-select based on time
  initMealTags();
  autoSelectMeal();
  
  // Show daily affirmation
  showDailyAffirmation();
  
  // Initialize reminder notifications
  initReminder();
  
  // Load targets and goal weight from Firestore first
  await loadTargetsFromFirestore();
  await loadGoalWeight();
  
  // Load today's foods from Firestore
  await loadFoodsFromFirestore(today);
  render();
  
  // Load My Foods
  await loadMyFoods();
  await loadRecentFoods(); // Recent foods quick list
  
  loadStreak(); // Local streak visual (week dots)
  await loadStreakFromFirestore(); // Firestore streak count
  await renderWeightChart(); // This also updates goal weight display
  await loadWeeklyStats(); // Weekly stats summary
  await loadProgressPhotos(); // Progress photos gallery
  await loadAchievements(); // Achievements system
  await checkTodayStatus();
  scheduleMidnightReset();
  
  // Calculate weight prediction
  await calculateWeightPrediction();
  
  console.log("✅ App initialized and connected to Firebase!");
}

// Note: initApp() is called by auth.onAuthStateChanged after user logs in
