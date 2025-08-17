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


