# 🎬 Moviemind — AI Movie Recommendation Platform

Moviemind is a full-stack web application that delivers intelligent movie recommendations using a hybrid approach combining user preferences, OMDb API data, and AI-powered insights.

🔗 **Live Demo:** https://moviemind-mu.vercel.app

---

## 🚀 Features

* 🔍 **Movie Search** — Search any movie using OMDb API
* 🎬 **Smart Recommendations** — Hybrid recommendation system
* 🤖 **AI Suggestions** — Gemini AI fallback for advanced recommendations
* ❤️ **Favorites & Watchlist** — Save movies for later
* 🌍 **Region Filtering** — Bollywood / Hollywood filtering
* 📊 **Dynamic UI** — Clean and responsive interface

---

## 🧠 Recommendation System Logic

Moviemind uses a **hybrid recommendation model**:

1. User history & favorites (if available)
2. Multi-query OMDb search (genres, keywords)
3. AI fallback using Gemini (only when needed)

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### APIs

* OMDb API
* Gemini AI API

### Deployment

* Frontend: Vercel
* Backend: Render

---

## ⚙️ Environment Variables

### Backend (.env)

MONGO_URI=your_mongodb_connection
OMDB_API_KEY=your_omdb_key
GEMINI_API_KEY=your_gemini_key

### Frontend (.env)

VITE_API_URL=https://your-backend-url

---

## 📂 Project Structure

frontend/ → React app
backend/ → Express API
config/ → Database config
controllers/ → Business logic
routes/ → API routes

---

## 🚀 Getting Started (Local Setup)

### 1. Clone the repository

git clone https://github.com/your-username/moviemind.git

### 2. Install dependencies

cd backend
npm install

cd ../frontend
npm install

### 3. Run backend

cd backend
npm start

### 4. Run frontend

cd frontend
npm run dev

---

## 📌 Future Improvements

* 🤖 Chatbot-based recommendations
* 🎬 Netflix-style UI redesign
* ⭐ Personalized ML recommendations
* 📊 User analytics dashboard

---

## 👨‍💻 Author

**Iswar Behera**

Full Stack Developer

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
