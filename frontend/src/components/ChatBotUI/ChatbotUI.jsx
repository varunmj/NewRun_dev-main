import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, DateInput, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import axios from 'axios';
import openAIInstance from '../../utils/openAIInstance';
import { motion } from 'framer-motion';
import { CalendarDate } from "@internationalized/date";
import Navbar from '../Navbar/Navbar';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const ChatbotUI = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [messagesLog, setMessagesLog] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [universities, setUniversities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [graduationMonth, setGraduationMonth] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [majors, setMajors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const delayResponse = (response, clearMessages = false) => {
    setTimeout(() => {
      // Clear any existing messages if clearMessages is set to true
      if (clearMessages) {
        setMessages([{ role: 'bot', content: response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', content: response }]);
      }
      setLoading(false);
      setSuggestions([]);
    }, 1000);
  };

   // Fetch user data when the chatbot component loads
  //  useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await axiosInstance.get('/get-user');
  //       const user = response.data.user;
  //       console.log("Fetched user data:", user);
  //       setUserData(user);
  
  //       if (user?.firstName && user?.lastName) {
  //         // Set initial welcome message
  //         setMessages([{ role: 'bot', content: `Welcome back, ${user.firstName} ${user.lastName}! I’m Steve with NewRun to help you.` }]);
  
  //         // Schedule the next messages to appear in sequence with appropriate delays
  //         setTimeout(() => {
  //           setMessages((prev) => {
  //             // Add message only if it doesn't already exist in the list
  //             if (!prev.some(msg => msg.content === "To provide a tailored experience, I'll ask you a few questions.")) {
  //               return [...prev, { role: 'bot', content: "To provide a tailored experience, I'll ask you a few questions." }];
  //             }
  //             return prev;
  //           });
  //         }, 2000);
  
  //         setTimeout(() => {
  //           setMessages((prev) => {
  //             // Add location message only if it doesn't already exist
  //             if (!prev.some(msg => msg.content === "Where are you currently located? Could you share your city and country?")) {
  //               return [...prev, { role: 'bot', content: "Where are you currently located? Could you share your city and country?" }];
  //             }
  //             return prev;
  //           });
  //           setStage(1); // Set stage only once here
  //         }, 4000);
  //       } else {
  //         // Ask for the first and last name if they are missing
  //         setMessages([{ role: 'bot', content: 'Hello! I’m Steve with NewRun to help you. Could you share your first and last name?' }]);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching user data:', error);
  //       setMessages([{ role: 'bot', content: 'Hello! I’m Steve with NewRun to help you. Could you share your first and last name?' }]);
  //     }
  //   };
  
  //   fetchUserData();
  // }, []);

  useEffect(() => {
    let hasFetched = false; // Flag to prevent duplicate execution
  
    const fetchUserData = async () => {
      if (hasFetched) return; // Prevent re-fetching
      hasFetched = true;
  
      try {
        const response = await axiosInstance.get('/get-user');
        const user = response.data.user;
        console.log("Fetched user data:", user);
        setUserData(user);
  
        // Define required fields for onboarding
        const requiredFields = [
          'firstName',
          'lastName',
          'currentLocation',
          'hometown',
          'birthday',
          'university',
          'major',
          'graduationDate',
        ];
  
        // Check for missing or empty fields
        const missingFields = requiredFields.filter(
          (field) => !user[field] || user[field].trim() === ""
        );
  
        if (missingFields.length === 0) {
          // If no fields are missing, user has completed onboarding
          setMessages((prev) => {
            if (!prev.some((msg) => msg.content.includes("Welcome back"))) {
              return [
                ...prev,
                { role: 'bot', content: `Welcome back, ${user.firstName} ${user.lastName}!` },
                { role: 'bot', content: "How can I assist you today?" },
              ];
            }
            return prev;
          });
          setStage(-1); // Special stage for assistance
          console.log("moving to stage -1")
        } else {
          // If fields are missing, start onboarding flow with delays
          setMessages((prev) => {
            if (!prev.some((msg) => msg.content.includes("Welcome back"))) {
              return [
                ...prev,
                { role: 'bot', content: `Welcome back, ${user.firstName} ${user.lastName}!` },
              ];
            }
            return prev;
          });
  
          // Introduce conversational delay for onboarding questions
          setTimeout(() => {
            setMessages((prev) => {
              if (!prev.some((msg) => msg.content.includes("To provide a tailored experience"))) {
                return [
                  ...prev,
                  { role: 'bot', content: "To provide a tailored experience, I'll ask you a few questions." },
                ];
              }
              return prev;
            });
          }, 2000);
  
          setTimeout(() => {
            setMessages((prev) => {
              if (!prev.some((msg) => msg.content.includes("Where are you currently located"))) {
                return [
                  ...prev,
                  { role: 'bot', content: "Where are you currently located? Could you share your city and country?" },
                ];
              }
              return prev;
            });
            setStage(1); // Start onboarding process
          }, 4000);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessages((prev) => {
          if (!prev.some((msg) => msg.content.includes("Hello! I’m Steve"))) {
            return [
              ...prev,
              { role: 'bot', content: 'Hello! I’m Steve with NewRun to help you. Could you share your first and last name?' },
            ];
          }
          return prev;
        });
        setStage(0); // Default to first stage if fetch fails
      }
    };
  
    fetchUserData();
  }, []);
  
  
  
  
  
  

  useEffect(() => {
    if (stage === 4) {
        const fetchUniversities = async () => {
            try {
                const universityResponse = await axios.get('http://universities.hipolabs.com/search?country=United%20States');
                const uniNames = universityResponse.data.map((uni) => uni.name);
                setUniversities(uniNames); // Save to state
            } catch (error) {
                console.error('Error fetching university data:', error);
            }
        };
        fetchUniversities();
    }
}, [stage]);

const handleInputChange = (e) => {
  const value = e.target.value;
  setInput(value);

  if (stage === 4) {
      const filteredSuggestions = universities.filter((uni) =>
          uni.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5)); // Display top 5 suggestions
  }
};

  

  const handleSend = async () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      setInput(''); 
      handleChatbotResponse(input);
    }
  };

  const updateUserData = async (updates) => {
    try {
      const response = await axiosInstance.patch('/user/update', updates);
      if (response.data.success) {
        console.log('User data updated successfully:', response.data.user);
        return true;
      } else {
        console.error('Failed to update user data:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  };
  

  const handleChatbotResponse = async (userMessage) => {
    setLoading(true);
    let chatMessages = [
      { role: "system", content: "You are Steve, a helpful assistant for NewRun." }
    ];

    chatMessages = chatMessages.concat(
      { role: "user", content: `Current stage: ${stage}` },
      ...messagesLog.map(log => ({ role: log.role, content: log.content })),
      { role: "user", content: userMessage }
    );

    let response;
    try {
      if (stage === -1) {
        // Assistance logic for returning users
        chatMessages.push(
          { role: "system", content: "You are Steve, a helpful assistant for NewRun. Respond to the user's query based on their needs." },
          { role: "user", content: userMessage }
        );
      
        // Fetch the response from OpenAI
        response = await openAIInstance.post("/chat/completions", {
          model: "gpt-3.5-turbo",
          messages: chatMessages,
        });
      
        // Validate and handle the response
        if (response?.data?.choices?.[0]?.message?.content) {
          const botResponse = response.data.choices[0].message.content;
      
          setMessages((prev) => [
            ...prev,
            { role: 'bot', content: botResponse },
          ]);
        } else {
          console.error('Invalid response from OpenAI');
          setMessages((prev) => [
            ...prev,
            { role: 'bot', content: "Sorry, I didn't understand that. Can you try again?" },
          ]);
        }
      } else {
        switch (stage) {
          case 0:
            // Initial message to ask for user's first and last name
            chatMessages.push(
              { role: "system", content: "Greet the user warmly and ask for their first and last name." }
            );

        // Sending prompt to OpenAI to generate response
        response = await openAIInstance.post("/chat/completions", {
          model: "gpt-3.5-turbo",
          messages: chatMessages,
        });

        // Validate response structure
        if (response?.data?.choices?.[0]?.message?.content) {
          const botResponse = response.data.choices[0].message.content;

          // Capturing the user's response for their name
          const userName = userMessage.trim();
          const nameParts = userName.split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : '';

          // Storing the first and last names separately
          setUserFirstName(firstName);
          setUserLastName(lastName);

          // Persist the first and last name to the backend so subsequent stages see the data
          // If the call fails, we still continue the flow; updateUserData returns a boolean
          updateUserData({ firstName, lastName });

          // Personalized display for the user
          const userNameDisplay = lastName ? `${firstName} ${lastName}` : firstName;

          // Greeting the user and providing a brief introduction about the questions to follow
          delayResponse(`Nice to meet you, ${userNameDisplay}!`);

          // Adding a short disclaimer about the onboarding questions
          setTimeout(() => {
            delayResponse(
              "To provide a tailored experience, I'll ask you a few questions. This helps us recommend the best resources and support for you."
            );

            // Proceed to the next question about the user's location after the disclaimer
            setTimeout(() => {
              delayResponse("Where are you currently located? Could you share your city and country?");
              setStage(1); // Move to the location question in the next stage
            }, 1000);
          }, 500);
        } else {
          // Handling an invalid response from OpenAI API
          console.error("Invalid response from OpenAI API");
          delayResponse("I’m having trouble understanding your name. Could you please enter it again?");
        }
        break;

        case 1:
          // Refined system prompt for strict validation of city and country
          const locationPrompt = [
            {
              role: "system",
              content:
                "Validate if the provided location includes a valid city and country in the format 'City, Country'. Respond with 'Got it' or 'Okay' if the input is valid. If the input does not include a valid city and country, or if the format is incorrect, ask the user to re-enter the correct details in 'City, Country' format.",
            },
            { role: "user", content: userMessage },
          ];

          try {
            // Send the refined location prompt to OpenAI for validation
            response = await openAIInstance.post("/chat/completions", {
              model: "gpt-3.5-turbo",
              messages: locationPrompt,
            });

            // Ensure response format is as expected
            if (
              response &&
              response.data &&
              response.data.choices &&
              response.data.choices[0] &&
              response.data.choices[0].message
            ) {
              const botResponse = response.data.choices[0].message.content;

              // Check if ChatGPT acknowledged with "Got it" or "Okay"
              if (botResponse.toLowerCase().includes("got it") || botResponse.toLowerCase().includes("okay")) {
                const LocationName = userMessage.trim();
                const LocationParts = LocationName.split(",");
                const city = LocationParts[0]?.trim();
                const country = LocationParts[1]?.trim();

                // Proceed to update user data in the database
                const success = await updateUserData({ currentLocation: `${city}, ${country}` });
                if (success) {
                  setTimeout(() => {
                    delayResponse(`${botResponse}. So, ${city}, ${country} it is! Nice to know. Now, could you let me know where your hometown is?`);
                    setStage(2); // Move to the next question for hometown and home country
                  }, 1500);
                } else {
                  delayResponse("Failed to save your location. Let’s try again.");
                }
              } else {
                // If ChatGPT suggests a re-entry due to invalid format
                delayResponse("Please provide your current location in the format 'City, Country'.");
              }
            } else {
              console.error("Unexpected response format:", response);
              delayResponse("I'm having trouble understanding your location. Could you please enter it again in 'City, Country' format?");
            }
          } catch (error) {
            console.error("Error in chatbot response:", error);
            delayResponse("I’m experiencing a bit of an issue. Could you try again?");
          } finally {
            setLoading(false);
          }
          break;


          case 2:
            // Now we're asking for the user's hometown and home country
            const hometownPrompt = [
              {
                role: "system",
                content:
                  "Validate if the provided location includes a valid city and country in the format 'City, Country'. Respond with 'Great' or 'Nice' if the input is valid. If the input does not include a valid city and country, or if the format is incorrect, ask the user to re-enter the correct details in 'City, Country' format.",
              },
              { role: "user", content: userMessage },
            ];
          
            try {
              // Send the refined hometown prompt to OpenAI for validation
              response = await openAIInstance.post("/chat/completions", {
                model: "gpt-3.5-turbo",
                messages: hometownPrompt,
              });
          
              // Ensure response format is as expected
              if (
                response &&
                response.data &&
                response.data.choices &&
                response.data.choices[0] &&
                response.data.choices[0].message
              ) {
                const botResponse = response.data.choices[0].message.content;
          
                // Check if ChatGPT acknowledged with "Great" or "Nice"
                if (
                  botResponse.toLowerCase().includes("great") ||
                  botResponse.toLowerCase().includes("nice")
                ) {
                  const HomeLocationName = userMessage.trim();
                  const HomeLocationParts = HomeLocationName.split(",");
                  const Homecity = HomeLocationParts[0]?.trim();
                  const Homecountry = HomeLocationParts[1]?.trim();
          
                  // Update the user's hometown in the database
                  const success = await updateUserData({
                    hometown: `${Homecity}, ${Homecountry}`,
                  });
          
                  if (success) {
                    setTimeout(() => {
                      delayResponse(
                        `${botResponse}! Nice to know that you are from ${Homecity}, ${Homecountry}. Cool! Can you share your birthday? We love celebrating special occasions!`
                      );
                      setStage(3); // Move to the next question about the birthday
                    }, 1500);
                  } else {
                    delayResponse(
                      "Failed to save your hometown. Let’s try again. Could you provide your hometown in the format 'City, Country'?"
                    );
                  }
                } else {
                  // If ChatGPT suggests a re-entry due to invalid format
                  delayResponse(
                    "Please provide your hometown in the format 'City, Country'."
                  );
                }
              } else {
                console.error("Unexpected response format:", response);
                delayResponse(
                  "I'm having trouble understanding your hometown. Could you please enter it again in 'City, Country' format?"
                );
              }
            } catch (error) {
              console.error("Error in chatbot response:", error);
              delayResponse("I’m experiencing a bit of an issue. Could you try again?");
            } finally {
              setLoading(false);
            }
            break;
          

            case 3:
              const userBirthday = selectedDate
                ? selectedDate.toDate().toISOString().split("T")[0]
                : null;
            
              if (!userBirthday) {
                delayResponse("Please select a valid date.");
                setLoading(false);
                return;
              }
            
              const birthdayPrompt = [
                {
                  role: "system",
                  content:
                    "Check if the provided birthdate makes the user at least 17 years old. If they are 17 or older, respond with 'You're eligible!' If they are under 17, respond with 'You must be at least 17 years old to proceed. Please select a different date.'",
                },
                { role: "user", content: `The user's birthdate is ${userBirthday}.` },
              ];
            
              try {
                // Send the birthday validation prompt to OpenAI
                response = await openAIInstance.post("/chat/completions", {
                  model: "gpt-3.5-turbo",
                  messages: birthdayPrompt,
                });
            
                // Ensure response format is as expected
                if (
                  response &&
                  response.data &&
                  response.data.choices &&
                  response.data.choices[0] &&
                  response.data.choices[0].message
                ) {
                  const botResponse = response.data.choices[0].message.content;
            
                  // Check if the response indicates eligibility
                  if (botResponse.toLowerCase().includes("you're eligible")) {
                    // Update the user's birthday in the database
                    const success = await updateUserData({ birthday: userBirthday });
            
                    if (success) {
                      setTimeout(() => {
                        delayResponse(
                          "Great! Thank you for sharing your birthday. Tell us, which university are you attending?"
                        );
                        setStage(4); // Only setting stage here
                        console.log("Transitioning to stage 4..."); // Debugging log to track stage transition
                      }, 1000);
                    } else {
                      delayResponse(
                        "Failed to save your birthday. Let’s try again. Could you provide your birthday again?"
                      );
                    }
                  } else {
                    // If the user is under 17 or if ChatGPT suggests re-selection
                    delayResponse(
                      "You must be at least 17 years old to proceed. Please select a different date."
                    );
                  }
                } else {
                  console.error("Unexpected response format:", response);
                  delayResponse(
                    "I'm having trouble understanding the date. Could you please enter it again?"
                  );
                }
              } catch (error) {
                console.error("Error in chatbot response:", error);
                delayResponse("I’m experiencing a bit of an issue. Could you try again?");
              } finally {
                setLoading(false);
              }
              break;
            

              case 4:
                const universityPrompt = [
                  {
                    role: "system",
                    content:
                      "Validate if the provided university is a valid U.S. university. Respond with 'Got it' or 'Okay' if the input is valid. If not, ask the user to re-enter a correct U.S. university name.",
                  },
                  { role: "user", content: userMessage },
                ];
              
                try {
                  // Send the university validation prompt to OpenAI
                  response = await openAIInstance.post("/chat/completions", {
                    model: "gpt-3.5-turbo",
                    messages: universityPrompt,
                  });
              
                  // Ensure response format is as expected
                  if (
                    response &&
                    response.data &&
                    response.data.choices &&
                    response.data.choices[0] &&
                    response.data.choices[0].message
                  ) {
                    const botResponse = response.data.choices[0].message.content;
              
                    const UniversityName = userMessage.trim();
              
                    // Check if ChatGPT acknowledged with "Got it" or "Okay"
                    if (
                      botResponse.toLowerCase().includes("got it") ||
                      botResponse.toLowerCase().includes("okay")
                    ) {
                      // Update the user's university in the database
                      const success = await updateUserData({ university: UniversityName });
              
                      if (success) {
                        setTimeout(() => {
                          delayResponse(
                            `${botResponse}. So you’re attending ${UniversityName}! That's awesome! What’s your Major?`
                          );
                          setStage(5); // Move to the next question about the field of study
                        }, 1000);
                      } else {
                        delayResponse(
                          "Failed to save your university. Let’s try again. Could you please provide the name of your university?"
                        );
                      }
                    } else {
                      // If ChatGPT suggests a re-entry due to invalid university name
                      delayResponse(
                        `${UniversityName} doesn’t seem to be a valid U.S. university. Could you please provide the correct university name?`
                      );
                    }
                  } else {
                    console.error("Unexpected response format:", response);
                    delayResponse(
                      "I'm having trouble understanding your university. Could you please enter the correct name of your university?"
                    );
                  }
                } catch (error) {
                  console.error("Error in chatbot response:", error);
                  delayResponse("I’m experiencing a bit of an issue. Could you try again?");
                } finally {
                  setLoading(false);
                }
                break;
              

                case 5:
                  const majorPrompt = [
                    {
                      role: "system",
                      content:
                        "Validate if the provided major is a known or valid academic discipline. Respond with 'Got it' or 'Okay' if the input is valid. If not, ask the user to re-enter a correct major.",
                    },
                    { role: "user", content: userMessage },
                  ];
                
                  try {
                    // Send the major validation prompt to OpenAI
                    response = await openAIInstance.post("/chat/completions", {
                      model: "gpt-3.5-turbo",
                      messages: majorPrompt,
                    });
                
                    // Ensure response format is as expected
                    if (
                      response &&
                      response.data &&
                      response.data.choices &&
                      response.data.choices[0] &&
                      response.data.choices[0].message
                    ) {
                      const botResponse = response.data.choices[0].message.content;
                
                      const major = userMessage.trim();
                
                      // Check if ChatGPT acknowledged with "Got it" or "Okay"
                      if (
                        botResponse.toLowerCase().includes("got it") ||
                        botResponse.toLowerCase().includes("okay")
                      ) {
                        // Update the user's major in the database
                        const success = await updateUserData({ major });
                
                        if (success) {
                          setTimeout(() => {
                            delayResponse(
                              `${botResponse}. Awesome! So your major is ${major}. When do you expect to graduate? Please provide the month and year.`
                            );
                            setStage(6); // Transition to the next question about graduation
                          }, 1000);
                        } else {
                          delayResponse(
                            "Failed to save your major. Let’s try again. Could you please provide your major?"
                          );
                        }
                      } else {
                        // If ChatGPT suggests a re-entry due to invalid major
                        delayResponse(
                          `${major} doesn’t seem to be a valid academic discipline. Could you please provide the correct major?`
                        );
                      }
                    } else {
                      console.error("Unexpected response format:", response);
                      delayResponse(
                        "I'm having trouble understanding your major. Could you please enter it again?"
                      );
                    }
                  } catch (error) {
                    console.error("Error in chatbot response:", error);
                    delayResponse("I’m experiencing a bit of an issue. Could you try again?");
                  } finally {
                    setLoading(false);
                  }
                  break;
                

                  case 6:
                    console.log("Case 6 triggered"); // Debugging log
                  
                    if (!graduationMonth || !graduationYear) {
                      // Ensure that both month and year are provided
                      delayResponse("Please provide your expected graduation month and year.");
                      setLoading(false);
                      return;
                    }
                  
                    // Validate the month and year to ensure it's a valid future date
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth() + 1; // Month is 0-indexed
                    const isFutureDate =
                      parseInt(graduationYear) > currentYear ||
                      (parseInt(graduationYear) === currentYear &&
                        parseInt(graduationMonth) >= currentMonth);
                  
                    if (!isFutureDate) {
                      // If the date is not in the future, show an error message
                      delayResponse("Please enter a valid future graduation month and year.");
                      setLoading(false);
                      return;
                    }
                  
                    const graduationDate = `${graduationMonth}/${graduationYear}`;
                  
                    const graduationPrompt = [
                      {
                        role: "system",
                        content: `Validate if the provided ${graduationDate} is a future date. Respond with 'correct' or 'okay' if the input is valid. If not, ask the user to re-enter the correct expected graduation month and year.`,
                      },
                      {
                        role: "user",
                        content: `The user's expected graduation date is ${graduationDate}.`,
                      },
                    ];
                  
                    try {
                      // Send the graduation date validation prompt to OpenAI
                      response = await openAIInstance.post("/chat/completions", {
                        model: "gpt-3.5-turbo",
                        messages: graduationPrompt,
                      });
                  
                      if (
                        response &&
                        response.data &&
                        response.data.choices &&
                        response.data.choices[0] &&
                        response.data.choices[0].message
                      ) {
                        const botResponse = response.data.choices[0].message.content;
                  
                        // Check if ChatGPT acknowledged with "correct" or "okay"
                        if (
                          botResponse.toLowerCase().includes("correct") ||
                          botResponse.toLowerCase().includes("okay")
                        ) {
                          // Update the user's graduation date in the database
                          const success = await updateUserData({
                            graduationDate: graduationDate,
                          });
                  
                          if (success) {
                            setTimeout(() => {
                              delayResponse(
                                `${botResponse}. Great! Your expected graduation date is ${graduationDate}.`
                              );
                  
                              setTimeout(() => {
                                delayResponse(
                                  "Thank you for sharing your information! We will help you get the most optimized results with NewRun."
                                );
                                navigate("/dashboard"); // Redirect to the dashboard
                              }, 2000);
                            }, 1000);
                          } else {
                            delayResponse(
                              "Failed to save your graduation date. Let’s try again. Could you please provide it again?"
                            );
                          }
                        } else {
                          // If ChatGPT suggests a re-entry due to invalid date
                          delayResponse(
                            "Please provide a valid future graduation month and year."
                          );
                        }
                      } else {
                        console.error("Unexpected response format:", response);
                        delayResponse(
                          "I'm having trouble understanding your graduation date. Could you please enter it again?"
                        );
                      }
                    } catch (error) {
                      console.error("Error in chatbot response:", error);
                      delayResponse("I’m experiencing a bit of an issue. Could you try again?");
                    } finally {
                      setLoading(false);
                    }
                    break;
                  

            // case 7:
            //   // Asking the user for a brief introduction with an example of roles like "Engineer, Software Developer, Data Analyst"
            //   const introPrompt = [
            //       { role: "system", content: "Ask the user to describe the desired /expected job role that defines them best. Respond with a friendly tone." },
            //       { role: "user", content: userMessage }
            //   ];

            //   try {
            //       // Send the prompt to OpenAI for validation
            //       response = await openAIInstance.post("/chat/completions", {
            //           model: "gpt-3.5-turbo",
            //           messages: introPrompt
            //       });

            //       // Ensure response format is as expected
            //       if (response && response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            //           const botResponse = response.data.choices[0].message.content;

            //           const userIntroduction = userMessage.trim();

            //           // Validate and acknowledge the user introduction
            //           if (botResponse.toLowerCase().includes("great") || botResponse.toLowerCase().includes("awesome") || botResponse.toLowerCase().includes("thank you")) {
            //               setTimeout(() => {
            //                   delayResponse(`${botResponse}. Awesome! So, you are a ${userIntroduction}. It's always great to connect with professionals like you.`);
                              
            //                   // Move to the next stage after a short delay
            //                   setTimeout(() => {
            //                       console.log(botResponse)
            //                       delayResponse("Let's proceed to the final step.");
            //                       setStage(8); // Proceed to the next stage or finalize
            //                   }, 1500);
            //               }, 1000);
            //               console.log("Moving to stage 8");
            //           } else {
            //               // If the response doesn't match the expected, ask again
            //               delayResponse("I'm sorry, I couldn't understand your role. Could you please describe the job role that defines you the best? (e.g., Engineer, Software Developer, Data Analyst, etc.)");
            //           }
            //       } else {
            //           console.error("Unexpected response format:", response);
            //           delayResponse("I'm having trouble understanding your introduction. Could you try again?");
            //       }
            //   } catch (error) {
            //       console.error("Error in chatbot response:", error);
            //       delayResponse("I’m experiencing some issues. Could you please try again?");
            //   } finally {
            //       setLoading(false);
            //   }
            //   break;
          
  
      }}

      // Record the conversation only if we have a valid bot response
      if (response?.data?.choices?.[0]?.message?.content) {
        setMessagesLog(prevLog => [
          ...prevLog,
          { role: 'user', content: userMessage },
          { role: 'bot', content: response.data.choices[0].message.content }
        ]);
      }

    } catch (error) {
      console.error("Error in chatbot response:", error);
      setMessages((prev) => [
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
    onOpen();
  };

  const getChatGPTResponse = async (message) => {
    try {
      const response = await openAIInstance.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message },
        ],
      });
  
      // Ensure response has the expected structure
      if (response?.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      } else {
        console.error('Unexpected response structure:', response);
        return "Sorry, I couldn't process your request. Please try again.";
      }
    } catch (error) {
      console.error('Error fetching response from OpenAI:', error);
      return "Sorry, I'm having trouble reaching the assistant right now. Please try again later.";
    }
  };
  

  return (
    <div>
      <Navbar />
      <div className="chat-window flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#000000] to-[#2c2c2c]">
        <div className="chat-content bg-gradient-to-b from-[#000000] to-[#2c2c2c] bg-opacity-70 p-8 rounded-lg shadow-lg text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-2 ">Hi! I'm Steve from NewRun 😎</h2>
          <span className="text-lg text-blue-700 mb-6">I'm here to help you get set up!</span>
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

    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#000000] to-[#2c2c2c] text-white p-4">
      <Modal
        backdrop='blur'
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // closeButton
        size="4xl"
        placement="bottom-center"
        // preventClose
        className="bg-gray-900 text-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg w-full shadow-lg bg-black overflow-hidden"
      >
        <ModalContent>
          <ModalHeader className="justify-center">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r to-blue-600 from-teal-500 font-medium text-black py-2">
              Let's Make your life easy with NewRun...
            </h2>
          </ModalHeader>
          <ModalBody>
            <Card className="p-6 bg-opacity-10 backdrop-filter backdrop-blur-lg w-full rounded-lg shadow-lg">
              <div className="flex flex-col w-full space-y-4 relative">
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
              {stage === 3 ? (
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
                    onPress={() => {
                      if (selectedDate) {
                        // Convert the selected date to ISO string (YYYY-MM-DD) before sending
                        const isoDate = selectedDate.toDate().toISOString().split('T')[0];
                        handleChatbotResponse(isoDate);
                      }
                    }}
                    className="mt-2 bg-blue-500"
                    disabled={!selectedDate}
                  >
                    Add your birthday
                  </Button>
                </div>
              ) : stage === 6 ? (
                <div className="flex flex-col w-full">
                  <div className="flex space-x-4">
                    {/* Dropdown for Month */}
                    <select
                      className="bg-gray-700 text-white p-2 rounded-lg"
                      onChange={(e) => setGraduationMonth(e.target.value)}
                      value={graduationMonth}
                    >
                      <option value="" disabled>Select month</option>
                      {/* Use numeric values for months so that date validation works correctly */}
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>

                    {/* Input for Year */}
                      <input
                        type="number"
                        className="bg-gray-700 text-white p-2 rounded-lg"
                        placeholder="Enter year"
                        onChange={(e) => setGraduationYear(e.target.value)}
                        value={graduationYear}
                        min={new Date().getFullYear()}
                      />
                    </div>
                    {/* Validation message */}
                        {isInvalid && <span className="text-red-500 mt-1">Please enter a valid future month and year.</span>}
                    
                    <Button
                      onPress={() => {
                        if (graduationMonth && graduationYear) {
                          // Compose the date string in M/Y format and send to the chatbot handler
                          handleChatbotResponse(`${graduationMonth}/${graduationYear}`);
                        }
                      }}
                      className="mt-2 bg-blue-500"
                      disabled={!graduationMonth || !graduationYear}
                    >
                      Add Graduation Period
                    </Button>
                  </div>
              ) : stage === 4 ? (
                <div className="flex flex-col w-full">
                <Input
                  fullWidth
                  clearable
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your university name..."
                  className="bg-gray-200 text-black rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                  disabled={loading}
                  style={{ height: '50px', marginBottom: '10px' }}  // Adjust height and spacing
                />
                <Button 
                  onPress={handleSend} 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg text-lg w-full"
                  disabled={loading}>
                  Send
                </Button>
                
                {suggestions.length > 0 && (
                  <ul className="absolute z-50 bg-gray-700 text-white text-sm max-h-40 overflow-y-auto w-full mt-12 rounded-lg shadow-lg">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="p-2 cursor-pointer hover:bg-green-400 hover:text-black"
                        onClick={() => {
                          setInput(suggestion); // Set input to selected suggestion
                          setSuggestions([]);  // Hide suggestions after selection
                        }}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
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
