import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';

const UniversityPage = () => {
    // Scroll to the top when the component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

  return (
    <div className="university-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="university-hero">
        <div className="content">
          <h1>Transform University Outcomes with NewRun</h1>
          <p>Enhance student retention, engagement, and success through tailored experiences from day one.</p>
          <Link to="/contact" className="btn">Schedule a Demo</Link>
        </div>
      </section>

      {/* Features Section */}
      <div className="features-container">
        {/* Onboarding Experience */}
        <div className="feature">
          <h2>Welcoming Experience</h2>
          <p>Begin every student's journey with a personalized welcoming process that sets the tone for success and integration into the university community.</p>
        </div>
        
        {/* Community Integration */}
        <div className="feature">
          <h2>Community Integration</h2>
          <p>Facilitate rich networking opportunities for students to forge valuable connections within the campus community, boosting their engagement and sense of belonging.</p>
        </div>

        {/* Accommodation Matching */}
        <div className="feature">
          <h2>Accommodation and Roommate Matching</h2>
          <p>Empower students to find ideal living situations and compatible roommates with our advanced housing tools, creating a stable foundation for academic success.</p>
        </div>

        {/* Career Preparation */}
        <div className="feature" >
        <div className="bg-black p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
          <h2>Career Preparation and Job Placement</h2>
          <p>Support students from education to employment with comprehensive career services that align with market needs and personal aspirations.</p>
        </div>
        </div>
      </div>

      {/* Call to Action */}
      <section className="call-to-action">
        <h2>Ready to Enhance Your University's Success?</h2>
        <p>Join the myriad of institutions already benefiting from NewRun’s innovative solutions.</p>
        <Link to="/contact" className="btn">Learn More</Link>
      </section>
    </div>
  );
};

export default UniversityPage;
