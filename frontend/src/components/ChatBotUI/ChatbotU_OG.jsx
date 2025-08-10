// src/components/Chatbot/ChatbotUI.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, DateInput, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,useDisclosure } from '@heroui/react';
import axios from 'axios';
import openAIInstance from '../../utils/openAIInstance';
import { motion } from 'framer-motion';
import { CalendarDate } from "@internationalized/date";
import Navbar from '../Navbar/Navbar';

const ChatbotUI = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I’m Steve with NewRun to help you. What’s your name?' },
  ]);
  const [messagesLog, setMessagesLog] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [universities, setUniversities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [graduationDate, setGraduationDate] = useState(null);
  const [majors, setMajors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(true); // Modal control

  const {isOpen, onOpen, onClose} = useDisclosure();
  const [backdrop, setBackdrop] = React.useState('blur')
  const [modalPlacement, setModalPlacement] = React.useState("bottom-center");
  const [size, setSize] = React.useState('lg')



  const handleModalPlacement = (modalPlacement) =>{
    setModalPlacement(modalPlacement)
    // isOpen={isOpen}
  }

  const handleOpen = (size) => {
    setSize(size)
    onOpen();
  }


  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    const fetchUniversitiesAndMajors = async () => {
      try {
        const universityResponse = await axios.get('http://universities.hipolabs.com/search?country=United%20States');
        const uniNames = universityResponse.data.map((uni) => uni.name);
        setUniversities(uniNames);

        //we need to find the API for mapping Majors and add it in this function:
        const majorResponse = await axios.get('/path/to/majors_api');
        setMajors(majorResponse.data.majors);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchUniversitiesAndMajors();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (stage === 4) {
      const filteredSuggestions = universities.filter((uni) =>
        uni.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5));
    } else if (stage === 5) {
      const majorSuggestions = majors.filter((major) =>
        major.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(majorSuggestions.slice(0, 5));
    }
  };

  const delayResponse = (response) => {
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', content: response }]);
      setLoading(false);
      setSuggestions([]);
    }, 1000);
  };

  const handleSend = async () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      setInput('');  // clear input after sending
  
      // Call ChatGPT API for response
      const response = await getChatGPTResponse(input);
      setMessages((prev) => [...prev, { role: 'bot', content: response }]);
    }
  };
  

  // const handleChatbotResponse = async (userMessage) => {
  //   setLoading(true);
  //   try {
  //     switch (stage) {
  //       case 0:
  //         delayResponse(`Nice to meet you, ${userMessage}! Where are you currently located?`);
  //         setStage(1);
  //         break;
  //       case 1:
  //         const locationValidationPrompt = `Is "${userMessage}" a valid location in the United States?`;
  //         const locationValidationResponse = await openAIInstance.post("/chat/completions", {
  //           model: "gpt-3.5-turbo",
  //           messages: [{ role: "system", content: locationValidationPrompt }],
  //         });
  //         const isLocationValid = locationValidationResponse.data.choices[0].message.content.includes("Yes");
  //         if (isLocationValid) {
  //           delayResponse("We love celebrating special occasions! Can you share your birthday?");
  //           setStage(2);
  //         } else {
  //           delayResponse("I couldn't verify that location. Could you please enter a valid location?");
  //         }
  //         break;
  //       case 2:
  //         if (selectedDate && selectedDate.toDate().getFullYear() <= new Date().getFullYear() - 17) {
  //           setMessages((prev) => [
  //             ...prev,
  //             { role: 'user', content: `Birthday: ${selectedDate.toString()}` }
  //           ]);
  //           delayResponse("Are you an incoming student or already studying at your university?");
  //           setStage(3);
  //         } else {
  //           delayResponse("Please enter a valid birthday (17 years or older).");
  //         }
  //         break;
  //       case 3:
  //         delayResponse("Which university are you attending?");
  //         setStage(4);
  //         break;
  //       case 4:
  //         const universityValidationPrompt = `Is "${userMessage}" a recognized university in the United States?`;
  //         const universityValidationResponse = await openAIInstance.post("/chat/completions", {
  //           model: "gpt-3.5-turbo",
  //           messages: [{ role: "system", content: universityValidationPrompt }],
  //         });
  //         const isUniversityValid = universityValidationResponse.data.choices[0].message.content.includes("Yes");
  //         if (isUniversityValid) {
  //           delayResponse("Thank you! What’s your field of study?");
  //           setStage(5);
  //         } else {
  //           delayResponse("I couldn't verify that university. Could you please provide the correct name?");
  //         }
  //         break;
  //       case 5:
  //         delayResponse("When do you expect to graduate? Please provide the month and year.");
  //         setStage(6);
  //         break;
  //       case 6:
  //         if (graduationDate && graduationDate.toDate() > new Date()) {
  //           setMessages((prev) => [
  //             ...prev,
  //             { role: 'user', content: `Expected Graduation: ${graduationDate.toString()}` }
  //           ]);
  //           delayResponse("Tell me a bit about yourself. What are your interests and passions?");
  //           setStage(7);
  //         } else {
  //           delayResponse("Please enter a valid future graduation month and year.");
  //         }
  //         break;
  //       case 7:
  //         delayResponse("Thanks! We’ll use this information to make your experience smooth and personalized.");
  //         setStage(8);
  //         break;
  //       default:
  //         break;
  //     }
  //   } catch (error) {
  //     setMessages((prev) => [
  //       ...prev,
  //       { role: 'bot', content: 'Sorry, I am having trouble right now. Please try again later.' },
  //     ]);
  //     setLoading(false);
  //   }
  // };

  const handleChatbotResponse = async (userMessage) => {
    setLoading(true);
    
    try {
        // Initialize the message array with context and instructions for ChatGPT
        let messages = [
            { role: "system", content: "You are Steve, a helpful assistant for NewRun, guiding users through a profile setup with personalized questions." }
        ];

        // Add conversation history to maintain context
        messages = messages.concat(
            { role: "user", content: `Current stage: ${stage}` },
            ...messagesLog.map(log => ({ role: log.role, content: log.content })),
            { role: "user", content: userMessage }
        );

        let response;
        switch (stage) {
            case 0:
                // Stage 0: Greet the user and ask for their name
                messages.push(
                    { role: "system", content: "Greet the user warmly and ask for their name." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });
                
                const userName = response.data.choices[0].message.content;
                delayResponse(`Nice to meet you, ${userName}! Where are you currently located?`);
                setStage(1);
                break;

            case 1:
                // Stage 1: Confirm location validity
                messages.push(
                    { role: "system", content: "Ask for the user's location, ensuring it's a valid U.S. location." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });
                
                const locationValid = response.data.choices[0].message.content.toLowerCase().includes("valid");
                if (locationValid) {
                    delayResponse("Great! Can you share your birthday? We love celebrating special occasions!");
                    setStage(2);
                } else {
                    delayResponse("Please enter a valid U.S. location.");
                }
                break;

            case 2:
                // Stage 2: Check if user is at least 17 years old
                messages.push(
                    { role: "system", content: "Ensure the user is at least 17 years old based on their birthdate." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });

                const isAgeValid = response.data.choices[0].message.content.toLowerCase().includes("valid");
                if (isAgeValid) {
                    delayResponse("Are you an incoming student or already studying at your university?");
                    setStage(3);
                } else {
                    delayResponse("Please enter a birthdate that indicates you're 17 or older.");
                }
                break;

            case 3:
                // Stage 3: Ask for the university
                messages.push(
                    { role: "system", content: "Ask the user for their university name." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });

                delayResponse("Which university are you attending?");
                setStage(4);
                break;

            case 4:
                // Stage 4: Validate the university name
                messages.push(
                    { role: "system", content: "Check if the provided university is recognized in the U.S." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });

                const isUniversityValid = response.data.choices[0].message.content.toLowerCase().includes("yes");
                if (isUniversityValid) {
                    delayResponse("Thank you! What’s your field of study?");
                    setStage(5);
                } else {
                    delayResponse("I couldn't verify that university. Could you please provide the correct name?");
                }
                break;

            case 5:
                // Stage 5: Ask for graduation date
                messages.push(
                    { role: "system", content: "Ask the user for their expected graduation date (month and year)." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });

                delayResponse("When do you expect to graduate? Please provide the month and year.");
                setStage(6);
                break;

            case 6:
                // Stage 6: Check if the graduation date is valid
                messages.push(
                    { role: "system", content: "Ensure the graduation date is in the future." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });

                const isGraduationDateValid = response.data.choices[0].message.content.toLowerCase().includes("valid");
                if (isGraduationDateValid) {
                    delayResponse("Tell me a bit about yourself. What are your interests and passions?");
                    setStage(7);
                } else {
                    delayResponse("Please enter a valid future graduation date.");
                }
                break;

            case 7:
                // Stage 7: Ask about interests and passions
                messages.push(
                    { role: "system", content: "Collect the user's interests and passions for a personalized experience." }
                );
                response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages
                });

                delayResponse("Thank you! This will help us personalize your experience on NewRun.");
                setStage(8);
                break;

            default:
                delayResponse("I’m here to help you set up your profile and preferences. Just let me know if you need assistance!");
                break;
        }

        // Update message log after each stage
        setMessagesLog(prevLog => [...prevLog, { role: 'user', content: userMessage }, { role: 'bot', content: response.data.choices[0].message.content }]);

    } catch (error) {
        console.error("Error in chatbot response:", error);
        setMessages(prev => [
            ...prev,
            { role: 'bot', content: 'I’m experiencing a bit of an issue. Could you try again?' }
        ]);
    } finally {
        setLoading(false);
    }
};





  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setBackdrop(backdrop)
    onOpen();
  };

  const getChatGPTResponse = async (message) => {
    try {
      const response = await openAIInstance.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },  // initial system message
          { role: 'user', content: message },  // user message
        ],
      });
  
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error fetching response from OpenAI:', error);
      return "Sorry, I'm having trouble reaching the assistant right now. Please try again later.";
    }
  };

  return (
    <div>
      <Navbar />
      <div className="chat-window flex flex-col items-center justify-center h-screen ">
        {/* bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 */}
        <div className="chat-content bg-white bg-opacity-70 p-8 rounded-lg shadow-lg text-center max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 ">Hi! I'm Steve from NewRun 😎</h2>
          <span className="text-lg text-gray-700 mb-6">I'm here to help you get set up!</span>
        </div>
        
        <div className="input-area mt-8">
          <button 
            className="begin-button bg-blue-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-700 transition duration-200" 
            onClick={handleOpenModal}
          >
            Let’s Begin 🚀
          </button>
        </div>
      </div>


      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <Modal
          backdrop='blur'
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          closeButton
          size={size} 
          width="100%"
          placement={handleModalPlacement}
          className="bg-gray-900 text-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg  w-full shadow-lg overflow-hidden"
        >
          <ModalContent>
            <ModalHeader className="justify-center">
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r to-blue-600 from-teal-500 font-medium text-black py-2">Let's Make your life easy with NewRun...</h2>
            </ModalHeader>
            <ModalBody>
              <Card className="p-6 bg-opacity-10 backdrop-filter backdrop-blur-lg w-full rounded-lg shadow-lg">
                <div className="flex flex-col w-full space-y-5 relative">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                        msg.role === 'bot' ? 'bg-gradient-to-r to-blue-600 from-teal-500 text-black self-start' : 'bg-black text-white self-end'
                      }`}
                    >
                      {msg.content}
                    </motion.div>
                  ))}
                  {loading && <div className="text-left text-gray-400">Steve is typing...</div>}
                </div>
                <div className="flex mt-4 space-x-2 relative w-full">
                  {stage === 2 ? (
                    <div className="flex flex-col w-full">
                      <DateInput
                        label="Select your birthday"
                        placeholderValue={new CalendarDate(2000, 1, 1)}
                        onChange={(value) => setSelectedDate(value)}
                        isInvalid={!selectedDate || selectedDate.toDate().getFullYear() > new Date().getFullYear() - 17}
                        errorMessage="You must be 17 years or older."
                        className="max-w-xs"
                      />
                      <Button
                        onPress={() => handleChatbotResponse(selectedDate.toString())}
                        className="mt-2 bg-blue-500"
                        disabled={!selectedDate}
                      >
                        Submit
                      </Button>
                    </div>
                  ) : stage === 6 ? (
                    <div className="flex flex-col w-full">
                      <DateInput
                        label="Expected Graduation Month and Year"
                        placeholderValue={new CalendarDate(new Date().getFullYear() + 1, 5, 1)}
                        onChange={(value) => setGraduationDate(value)}
                        isInvalid={!graduationDate || graduationDate.toDate() < new Date()}
                        errorMessage="Please enter a valid future date."
                        className="max-w-xs"
                      />
                      <Button
                        onPress={() => handleChatbotResponse(graduationDate.toString())}
                        className="mt-2 bg-blue-500"
                        disabled={!graduationDate}
                      >
                        Submit
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        fullWidth
                        clearable
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        className="bg-gray-700 text-white focus:ring focus:outline-none"
                        autoFocus
                        disabled={loading}
                      />
                      <Button onPress={handleSend} className="ml-2 bg-blue-500" disabled={loading}>
                        Send
                      </Button>
                    </>
                  )}
                  {suggestions.length > 0 && (
                    <ul className="absolute z-50 bg-gray-700 text-white max-h-40 overflow-y-auto w-full mt-2 rounded-lg shadow-lg">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="p-2 cursor-pointer hover:bg-gray-600"
                          onClick={() => {
                            setInput(suggestion);
                            setSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ChatbotUI;
