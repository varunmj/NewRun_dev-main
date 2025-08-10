import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar'
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer/Footer';
import QuestionCard from '../components/Cards/QuestionCard'
import avatar1 from '../assets/Images/avatars/avatar1.jpg'
import avatar2 from '../assets/Images/avatars/avatar2.jpg'
import avatar3 from '../assets/Images/avatars/avatar3.jpg'

const Community = () => {

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

    const questions = [
        { user: { username: "aryarox", avatar: avatar1, name: "Aryaveer Jain" }, question: "I just got accepted to my dream uni! How do I apply for an I-20?" },
        { user: { username: "hesen", avatar: avatar2, name: "Henrik Hansen" }, question: "How does my existing US tourist visa impact my F-1?" },
        { user: { username: "yuechen", avatar: avatar3, name: "Yue Chen" }, question: "Tips for finding affordable housing near campus?" },
        { user: { username: "hesen", avatar: avatar1, name: "Aryaveer Jain" }, question: "I just got accepted to my dream uni! How do I apply for an I-20?" },
        { user: { username: "hesen", avatar: avatar2, name: "Henrik Hansen" }, question: "How does my existing US tourist visa impact my F-1?" },
        { user: { username: "aryarox", avatar: avatar3, name: "Yue Chen" }, question: "Tips for finding affordable housing near campus?" },
        { user: { username: "aryarox", avatar: avatar1, name: "Aryaveer Jain" }, question: "I just got accepted to my dream uni! How do I apply for an I-20?" },
        { user: { username: "hesen", avatar: avatar2, name: "Henrik Hansen" }, question: "How does my existing US tourist visa impact my F-1?" },
        { user: { username: "yuechen", avatar: avatar3, name: "Yue Chen" }, question: "Tips for finding affordable housing near campus?" },
        // Add more questions here
      ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userInfo={userInfo} />
      <div className="bg-gray-100 min-h-screen p-5">
      
      <h1 className="text-2xl font-bold text-center mb-4">You got questions? We have answers 👋</h1>
      <div className="columns-1 md:columns-2 lg:columns-3 space-y-4">
        {questions.map(q => <QuestionCard key={q.user.username} user={q.user} question={q.question} />)}
      </div>
      <Footer />
    </div>
    </div>
   
    
  )
}

export default Community