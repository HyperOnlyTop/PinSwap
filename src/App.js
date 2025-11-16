import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PinProvider } from './contexts/PinContext';
import { VoucherProvider } from './contexts/VoucherContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import PinCollection from './pages/PinCollection';
import VoucherExchange from './pages/VoucherExchange';
import Map from './pages/Map';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import './App.css';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <AuthProvider>
      <PinProvider>
        <VoucherProvider>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pin-collection" element={<PinCollection />} />
                <Route path="/voucher-exchange" element={<VoucherExchange />} />
                <Route path="/map" element={<Map />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </VoucherProvider>
      </PinProvider>
    </AuthProvider>
  );
}

export default App;
