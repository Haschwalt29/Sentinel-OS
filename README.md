# 🛰️ Sentinel OS  
**AI-Powered Global Threat Monitoring System**

---

## 🌍 Overview  
**Sentinel OS** is a **real-time intelligence platform** that monitors global instability by analyzing live news feeds, detecting threats using AI, and projecting them onto a **3D interactive globe**.  
It provides situational awareness through data-driven insights, making it useful for researchers, analysts, and developers working on crisis monitoring and security visualization.

---

## ✨ Features  
- 🌐 **3D Globe Visualization** – Interactive threat mapping with Mapbox GL JS.  
- 🤖 **AI Threat Detection** – NLP models classify incidents as potential threats.  
- 📍 **Geolocation Mapping** – Converts extracted entities into coordinates (OpenCage API).  
- 📊 **Live Feed Panel** – Real-time list of threats with categories and timestamps.  
- 🔍 **Filtering & Sorting** *(coming soon)* – Refine by region, type, and severity.  
- 🛠 **Admin Dashboard** *(coming soon)* – Verify, update, or dismiss detected threats.  
- 🔔 **Critical Alerts** *(coming soon)* – Audio notifications for high-priority events.  

---

## 🏗️ System Architecture  
```mermaid
flowchart LR
    A[News Sources] -->|Fetch| B[Backend AI - NLP Classifier]
    B -->|Entities| C[Geocoder - OpenCage API]
    C -->|Coordinates| D[MongoDB Atlas]
    D -->|API| E[Frontend - React + Mapbox]
    E -->|Live Updates| F[User Dashboard]
```
---
## 🛠️ Tech Stack

### **Frontend**
- ⚛️ React.js  
- 🎨 TailwindCSS  
- 🎥 Framer Motion  
- 🌍 Mapbox GL  

### **Backend**
- 🟢 Node.js  
- 🚂 Express.js  
- 🍃 MongoDB Atlas  
- 🤖 OpenAI API  
- 📍 OpenCage API  

---

## 🚀 Getting Started

### 1. Clone the repository
```
git clone https://github.com/Haschwalt29/Sentinel-OS.git
cd Sentinel-OS
```

## 🛠️ Backend Setup

```
cd backend
npm install
```
Create a .env file inside /backend with the following:
```
MONGODB_URI=your_mongo_uri
OPENCAGE_API_KEY=your_opencage_api_key
OPENAI_API_KEY=your_openai_api_key
```
Start the backend:
```
npm run start
```
---
## 🎨 Frontend Setup
```
cd ../frontend
npm install
npm start
```
## 🌐 Deployment

Frontend → Vercel / Netlify

Backend → Render / Railway

(See DEPLOYMENT.md for detailed deployment steps.)

## 📸 Demo (Preview)

<img width="1919" height="922" alt="Screenshot 2025-08-17 202553" src="https://github.com/user-attachments/assets/873342b2-8a99-4e6f-89e8-5f78b5963f6c" />
<img width="1919" height="922" alt="Screenshot 2025-08-17 202622" src="https://github.com/user-attachments/assets/1d2414fa-915a-4a05-bed0-184349e24549" />
<img width="1919" height="1073" alt="Screenshot 2025-08-17 202643" src="https://github.com/user-attachments/assets/f0917c95-b9fe-474f-8769-e7c544924a29" />
<img width="1918" height="918" alt="Screenshot 2025-08-17 202719" src="https://github.com/user-attachments/assets/c846ca94-5cc3-4f61-a967-05091ffa24c3" />
<img width="481" height="639" alt="Screenshot 2025-08-17 202744" src="https://github.com/user-attachments/assets/bcf6b4dc-59df-4d20-b5cd-b71f37b0517e" />
<img width="485" height="729" alt="Screenshot 2025-08-17 202753" src="https://github.com/user-attachments/assets/786ff8c9-af1a-4e5d-ba9e-467652a64b2f" />

## 🤝 Contributing

Pull requests are welcome!
If you’d like to collaborate, check the Issues tab or start a Discussion.

## 📩 Contact

Author: Aditya Rane
🔗 LinkedIn: https://www.linkedin.com/in/aditya-rane-9b82822aa/




