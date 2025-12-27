# 🏋️ FitFlow

A modern, mobile-first fitness tracking Progressive Web App (PWA) built with vanilla JavaScript and Firebase.

![FitFlow](https://img.shields.io/badge/FitFlow-Fitness%20Tracker-22c55e?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Powered-FFCA28?style=for-the-badge)

## 🌐 Live Demo

**[fitnessapp-1ddbb.web.app](https://fitnessapp-1ddbb.web.app)**

## ✨ Features

### 📊 Food Tracking
- Manual food entry with full macro support
- USDA food database search
- "My Foods" for saving frequently eaten items
- Recent foods quick-add
- Meal tagging (Breakfast, Lunch, Dinner, Snack)
- Macro pie chart visualization
- Calories by meal breakdown

### ⚖️ Weight Progress
- Daily weight logging
- Interactive weight chart with Chart.js
- Goal weight tracking with progress bar
- Weight prediction based on trends
- Weekly stats summary

### 🔥 Streaks & Check-ins
- Daily check-in system
- Streak tracking with milestones
- Workout logging
- Daily affirmations
- Customizable daily reminders

### 🏆 Gamification
- Achievement badges system
- Progress photos with comparison view
- Confetti celebration on hitting goals
- Shareable achievement cards

### 📱 PWA Features
- Installable on mobile/desktop
- Offline support with service worker
- Native-like experience
- Push notification reminders

### 🔐 User Management
- Firebase Authentication (Email/Password + Google)
- Email verification
- Password reset
- User profile with BMI/BMR calculations
- Data export (CSV/JSON)
- Account deletion

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Auth, Storage, Hosting)
- **Charts**: Chart.js
- **Icons**: Lucide Icons
- **Animations**: CSS Animations, Canvas Confetti
- **PWA**: Service Worker, Web App Manifest

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/fitflow.git
cd fitflow
```

2. Install dependencies:
```bash
npm install
```

3. Update Firebase config in `script.js` with your own credentials

4. Run locally:
```bash
npm start
```

### Build for Production

```bash
npm run build
```

This creates minified files in the `dist/` folder.

### Deploy to Firebase

```bash
firebase deploy --only hosting
```

## 📁 Project Structure

```
fitflow/
├── index.html          # Main app page
├── style.css           # All styles
├── script.js           # Main application logic
├── sw.js               # Service worker for offline support
├── manifest.json       # PWA manifest
├── about.html          # About page
├── privacy.html        # Privacy policy
├── terms.html          # Terms of service
├── icons/              # PWA icons
├── build.js            # Build script for minification
├── firebase.json       # Firebase hosting config
└── package.json        # Node.js dependencies
```

## 📱 Screenshots

*Coming soon*

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Ranier**

---

Made with ❤️ and lots of ☕

