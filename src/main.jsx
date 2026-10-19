// React entry point: mounts the app into <div id="root"> in index.html
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Shared Cozy Desk design system (variables, tag styles, reusable classes)
import './index.css'

import App from './App.jsx'
// React Router: client-side navigation without reloading the page
import { BrowserRouter, Routes, Route } from "react-router-dom"

// Pages
import SignUp from './Auth/SignUp.jsx'
import LogIn from './Auth/LogIn.jsx'
import CreateAd from './Company/CreateAd.jsx'
import AdminPage from './Admin/AdminPage.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import Profile from './Auth/Profile.jsx'
import MyAds from './Company/MyAds.jsx'
import About from './About.jsx'

createRoot(document.getElementById('root')).render(
  // StrictMode: development-only checks (runs some effects twice to catch bugs)
  <StrictMode>
    {/* Enables routing for everything inside */}
    <BrowserRouter>
      {/* Header outside <Routes>: shown on every page */}
      <Header />

      {/* Only the route matching the current URL is displayed */}
      <Routes>
        {/* Home: job ads list */}
        <Route path="/" element={<App />} />
        {/* Account creation (user or employer) */}
        <Route path="/signup" element={<SignUp />} />
        {/* Logged-in user's profile (GET / PUT /me) */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<LogIn />} />
        {/* Ad creation, for employers */}
        <Route path="/createad" element={<CreateAd />} />
        {/* Ad editing, for employers */}
        <Route path="/myads" element={<MyAds />} />
        <Route path="/about" element={<About />} />
        {/* Admin dashboard: manages every table */}
        <Route path="/adminpage" element={<AdminPage />} />
      </Routes>

      {/* Footer outside <Routes>: shown on every page */}
      <Footer />
    </BrowserRouter>
  </StrictMode>,
)