import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import SplineGlobe from '../components/Globe/SplineGlobe';
import axiosInstance from '../utils/axiosInstance';
import { Link } from 'react-router-dom';
import { FaPlaneArrival, FaHome, FaPhoneAlt, FaBriefcase, FaHandsHelping } from 'react-icons/fa';  // Importing icons from FontAwesome
import Footer from '../components/Footer/Footer';


const ChatbotPage = () => {
    return (
      <div className="chatbot-background">
        <Navbar />
        <div className="chat-window">
          <div className="chat-content">
            <h1>Hi! I'm NewRun :)</h1>
            <p>I'm here to help you get set up!</p>
          </div>
          <div className="input-area">
            <button className="begin-button">Let's begin →</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  };
  
  export default ChatbotPage;
