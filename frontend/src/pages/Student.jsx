import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { FaPlaneArrival, FaHome, FaPhoneAlt, FaBriefcase, FaHandsHelping } from 'react-icons/fa';  // Importing icons from FontAwesome
import Footer from '../components/Footer/Footer';


const StudentPage = () => {
  return (
    <div className="student-page">
        <Navbar />
        {/* RoadMap Section : Varun */}
      <section className="roadmap-section py-20 relative bg-cover bg-center text-white flex items-center justify-between" style={{ height: '100vh', backgroundColor: '#000' }}>
        <div className="container mx-auto text-center">
          <h2 className="text-5xl mb-4 font-extrabold text-transparent bg-clip-text bg-gradient-to-r to-blue-600 from-teal-500 font-medium text-black py-2">Your Journey with NewRun</h2>
          
          <p className="text-xl mb-12 max-w-4xl mx-auto">
            Follow our step-by-step roadmap to get settled in a new country. We are here to help you every step of the way.
          </p>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            
            {/* Step 1: Airport Pickup */}
            <Link to="/airport-pickup" className="roadmap-step group">
              <div className="icon-wrapper bg-yellow-100 group-hover:bg-yellow-500 p-6 rounded-2xl mb-4 transition duration-300 flex justify-center items-center">
                <FaPlaneArrival className="text-yellow-500 group-hover:text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-yellow-500 transition duration-300">Airport Pickup</h3>
              <p className="text-yellow-600">Arrive stress-free with our student airport pickup service.</p>
            </Link>

            {/* Step 2: Housing Assistance */}
            <Link to="/all-properties" className="roadmap-step group">
              <div className="icon-wrapper bg-blue-100 group-hover:bg-blue-500 p-6 rounded-2xl mb-4 transition duration-300 flex justify-center items-center">
                <FaHome className="text-blue-500 group-hover:text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-500 transition duration-300">Housing Assistance</h3>
              <p className="text-blue-600">Find housing and roommates.</p>
            </Link>

            {/* Step 3: Settling In */}
            <Link to="/settling-in" className="roadmap-step group">
              <div className="icon-wrapper bg-green-100 group-hover:bg-green-500 p-6 rounded-2xl mb-4 transition duration-300 flex justify-center items-center">
                <FaPhoneAlt className="text-green-500 group-hover:text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-green-500 transition duration-300">Settling In</h3>
              <p className="text-green-500">SIM card, bank account, and essentials.</p>
            </Link>

            {/* Step 4: Career Support */}
            <Link to="/career-support" className="roadmap-step group">
              <div className="icon-wrapper bg-purple-100 group-hover:bg-purple-500 p-6 rounded-2xl mb-4 transition duration-300 flex justify-center items-center">
                <FaBriefcase className="text-purple-500 group-hover:text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-500 transition duration-300">Career Support</h3>
              <p className="text-purple-600">Job search and networking.</p>
            </Link>

            {/* Step 5: Community Building */}
            <Link to="/community" className="roadmap-step group">
              <div className="icon-wrapper bg-red-100 group-hover:bg-red-500 p-6 rounded-2xl mb-4 transition duration-300 flex justify-center items-center">
                <FaHandsHelping className="text-red-500 group-hover:text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-red-500 transition duration-300">Community</h3>
              <p className="text-red-600">Join events and build your community.</p>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
        
  )
}

export default StudentPage