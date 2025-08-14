# Sentinel OS Frontend

A modern, cyber-themed threat monitoring interface built with React, TailwindCSS, and Framer Motion.

## 🎨 Design Features

### Modern Cyber Theme
- **Dark theme** with subtle gradients and glass morphism effects
- **Cyber color palette**: Blues, purples, and threat-specific colors
- **Custom typography**: Poppins for headings, Inter for body text
- **Smooth animations** powered by Framer Motion

### Layout & Structure
- **Split-pane design**: Globe/map on the left, collapsible panel on the right
- **Sticky header** with app logo, search, and quick filters
- **Responsive design** that works on all screen sizes
- **Collapsible side panel** for better map visibility

### Interactive Elements
- **Animated markers** with hover effects and glow
- **Smooth transitions** between globe and map views
- **Real-time updates** with socket connections
- **Audio/visual alerts** for high-priority threats

### Threat Visualization
- **Color-coded threat levels**:
  - High: #FF4C4C (Red)
  - Medium: #FFB74D (Orange)
  - Low: #FFD700 (Yellow)
  - None: #4CAF50 (Green)
- **Pulsing markers** for high-threat alerts
- **Interactive popups** with detailed threat information
- **Automatic clustering** for nearby threats

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Map GL** - Map visualization
- **Socket.io** - Real-time updates
- **Axios** - API communication

## 📱 Components

### Header
- App logo with animated shield icon
- Search functionality
- Quick filters for threat types and levels
- Global notification banner
- Dark mode toggle

### Dashboard
- Split-pane layout with map and side panel
- Collapsible side panel with tabs
- Live feed and analytics views
- Mini stats overlay when panel is collapsed

### ThreatMap
- Interactive 3D globe and 2D map views
- Animated threat markers with glow effects
- Collapsible legend
- Enhanced popups with threat details

### LiveFeed
- Modern card layout for threat items
- Real-time updates with animations
- Advanced filtering and sorting
- Admin controls for threat management

### StatsPanel
- Threat analytics and trends
- Regional distribution charts
- System status monitoring
- Quick action buttons

## 🎯 Key Features

- **Real-time monitoring** of global threats
- **Interactive 3D globe** with satellite imagery
- **Advanced filtering** by threat type, level, and region
- **Responsive design** for desktop and mobile
- **Modern animations** and micro-interactions
- **Accessibility** with proper contrast and keyboard navigation

## 🎨 Design System

### Colors
- Primary: Cyber blue (#0ea5e9)
- Background: Dark slate (#0f172a)
- Threat levels: Custom red, orange, yellow, green
- Accents: Purple, cyan, and gray variations

### Typography
- Headings: Poppins (Bold, Semi-bold)
- Body: Inter (Regular, Medium)
- Monospace: JetBrains Mono (for data)

### Animations
- Spring-based transitions
- Staggered card animations
- Hover effects and micro-interactions
- Loading states and skeleton screens

## 🔧 Configuration

The app uses environment variables for configuration:
- `VITE_API_URL` - Backend API endpoint
- `VITE_SOCKET_URL` - WebSocket server URL
- `VITE_MAPBOX_TOKEN` - Mapbox access token

## 📄 License

This project is part of the Sentinel OS threat monitoring system.
