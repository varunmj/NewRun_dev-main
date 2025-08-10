import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar'
import TopicBar from '../components/Blogitems/TopicBar';
import BlogList from '../components/Blogitems/BlogList';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer/Footer';

const Blogs = () => {

  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-user');
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        console.error('Unexpected error:', error);
      }
    }};

    useEffect(() => {
      getUserInfo();
    }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userInfo={userInfo} />
      <TopicBar />
      <BlogList />
      <Footer />
    </div>
    
  )
}

export default Blogs