import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { MdHome, MdArrowBack, MdSearch } from 'react-icons/md';

const NotFound = () => {
  const navigate = useNavigate();

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.65, 
        ease: "easeOut", 
        delay: i * 0.08 
      } 
    }),
  };

  return (
    <div className="body-obsidian min-h-screen">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Animation */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-8"
          >
            <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 mb-4">
              404
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-cyan-400 mx-auto rounded-full"></div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-xl text-white/70 mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-white/50">
              Don't worry, let's get you back on track!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/')}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <MdHome className="text-lg" />
              Go Home
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <MdArrowBack className="text-lg" />
              Go Back
            </button>
            
            <button
              onClick={() => navigate('/marketplace')}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <MdSearch className="text-lg" />
              Browse Marketplace
            </button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={3}
            className="mt-12"
          >
            <p className="text-white/50 text-sm mb-4">Popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { path: '/marketplace', label: 'Marketplace' },
                { path: '/all-properties', label: 'Properties' },
                { path: '/Synapsematches', label: 'Roommate Matches' },
                { path: '/community', label: 'Community' },
                { path: '/blogs', label: 'Blogs' },
              ].map((link, index) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="text-orange-400 hover:text-orange-300 text-sm transition-colors duration-200"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
