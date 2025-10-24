import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { Input, Button, Avatar, Card } from '@heroui/react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar/Navbar';
import { format } from 'date-fns';
import './messaging.css';

const socket = io(
  import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000')
);

const MessagingPage = () => {
    const [searchParams] = useSearchParams();
    const [userId, setUserId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const messagesEndRef = useRef(null);
    
    // Get URL parameters
    const targetUserId = searchParams.get('to');
    const context = searchParams.get('ctx');
    const preFilledMessage = searchParams.get('message');

    // Helper function to safely decode messages with emojis
    const safeDecodeMessage = (message) => {
        if (!message) return '';
        
        try {
            // First try standard decoding
            return decodeURIComponent(message);
        } catch (error) {
            try {
                // Try with manual apostrophe replacement
                const fixedMessage = message.replace(/%27/g, "'");
                return decodeURIComponent(fixedMessage);
            } catch (secondError) {
                try {
                    // Try with manual space replacement for common issues
                    const spaceFixed = message.replace(/%20/g, ' ').replace(/%0A/g, '\n');
                    return decodeURIComponent(spaceFixed);
                } catch (thirdError) {
                    console.warn('All decoding methods failed, returning original message');
                    return message;
                }
            }
        }
    };

    // Fetch user info and connect to Socket.io on mount
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axiosInstance.get('/get-user');
                if (response.data && response.data.user) {
                    setUserId(response.data.userId);
                    fetchConversations();
                    socket.emit('join_user', response.data.userId); // Connect user to their own socket room
                }
            } catch (error) {
                console.error('Unexpected error fetching user info:', error);
            }
        };
        fetchUserInfo();
    }, []);

    // Handle pre-filled message and auto-start conversation
    useEffect(() => {
        if (preFilledMessage) {
            const decodedMessage = safeDecodeMessage(preFilledMessage);
            setNewMessage(decodedMessage);
        }
    }, [preFilledMessage]);

    // Auto-start conversation with target user if specified
    useEffect(() => {
        const autoStartConversation = async () => {
            if (targetUserId && userId) {
                console.log('Auto-starting conversation with:', targetUserId);
                
                // Find existing conversation with target user
                const existingConversation = conversations.find(conv => 
                    conv.participants.some(p => p._id === targetUserId)
                );
                
                if (existingConversation) {
                    console.log('Found existing conversation:', existingConversation._id);
                    fetchMessages(existingConversation._id);
                } else {
                    console.log('Creating new conversation with:', targetUserId);
                    // Create new conversation
                    try {
                        const response = await axiosInstance.post('/conversations/initiate', {
                            receiverId: targetUserId
                        });
                        if (response.data.success) {
                            console.log('Conversation created successfully');
                            // Refresh conversations and then select the new one
                            const updatedConversations = await fetchConversations();
                            const newConversation = updatedConversations.find(conv => 
                                conv.participants.some(p => p._id === targetUserId)
                            );
                            if (newConversation) {
                                console.log('Selecting new conversation:', newConversation._id);
                                fetchMessages(newConversation._id);
                            }
                        }
                    } catch (error) {
                        console.error('Error creating conversation:', error);
                    }
                }
            }
        };

        if (targetUserId && userId) {
            // Trigger immediately, don't wait for conversations to load
            autoStartConversation();
        }
    }, [targetUserId, userId]);

    // Handle case where conversations are loaded after auto-start logic
    useEffect(() => {
        if (targetUserId && userId && conversations.length > 0) {
            const existingConversation = conversations.find(conv => 
                conv.participants.some(p => p._id === targetUserId)
            );
            
            if (existingConversation && !selectedConversation) {
                console.log('Found conversation after loading:', existingConversation._id);
                fetchMessages(existingConversation._id);
            }
        }
    }, [conversations, targetUserId, userId, selectedConversation]);

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            console.log('Fetching conversations...');
            const response = await axiosInstance.get('/conversations');
            if (response.data.success) {
                console.log('Conversations fetched:', response.data.data);
                setConversations(response.data.data);
                return response.data.data;
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
        return [];
    };

    // Fetch messages for the selected conversation and join its socket room
    const fetchMessages = async (conversationId) => {
        try {
            setSelectedConversation(conversationId);
            const response = await axiosInstance.get(`/conversations/${conversationId}/messages`);
            if (response.data.success) {
                setMessages(response.data.data);

                // Fetch participant details
                const conversation = conversations.find(c => c._id === conversationId);
                const otherParticipant = conversation.participants.find(p => p._id !== userId);
                setSelectedUser(otherParticipant);

                // Join the conversation room for real-time updates
                socket.emit('join_conversation', conversationId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Listen for incoming messages using Socket.io
    useEffect(() => {
        socket.on('receive_message', (messageData) => {
            if (messageData.conversationId === selectedConversation) {
                setMessages(prevMessages => [...prevMessages, messageData]);
                fetchConversations();
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, [selectedConversation]);

    // Scroll to the bottom whenever new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const messageData = {
            conversationId: selectedConversation,
            content: newMessage,
            senderId: userId,
        };

        try {
            const response = await axiosInstance.post(`/messages/send`, messageData);
            if (response.data.success) {
                socket.emit('send_message', messageData); // Emit message to server
                setNewMessage('');
                setMessages([...messages, response.data.data]);
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderMessagesWithDate = () => {
        let lastDate = null;
    
        return messages.map((message, index) => {
            const messageDate = new Date(message.timestamp); 
            const formattedDate = format(messageDate, 'MMM dd, yyyy');
            console.log('Message senderId:', message.senderId, 'Current userId:', userId);
            const isCurrentUser = message.senderId === userId || (message.senderId && message.senderId._id === userId);
            console.log('Is current user:', isCurrentUser);
            const senderName = isCurrentUser ? 'You' : `${message.senderId?.firstName || ''} ${message.senderId?.lastName || ''}`;
            const avatarText = isCurrentUser ? "You" : `${senderName.split(' ').map(name => name[0]).join('')}`;
    
            let dateSeparator = null;
            if (!lastDate || formattedDate !== format(lastDate, 'MMM dd, yyyy')) {
                dateSeparator = (
                    <div className="flex items-center justify-center my-6" key={`date-${formattedDate}`}>
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-white/20 flex-1"></div>
                            <span className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                                {formattedDate}
                            </span>
                            <div className="h-px bg-white/20 flex-1"></div>
                        </div>
                    </div>
                );
                lastDate = messageDate;
            }
    
            return (
                <React.Fragment key={index}>
                    {dateSeparator}
                    <div className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {!isCurrentUser && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                {avatarText.slice(0, 2)}
                            </div>
                        )}
                        <div className={`max-w-md ${isCurrentUser ? 'order-first' : ''}`}>
                            <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                                isCurrentUser 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/30' 
                                    : 'bg-white/10 text-white border border-white/20 backdrop-blur-sm'
                            }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className={`text-xs text-white/40 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                                {format(new Date(message.timestamp), 'h:mm a')}
                            </p>
                        </div>
                        {isCurrentUser && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                You
                            </div>
                        )}
                    </div>
                </React.Fragment>
            );
        });
    };
    

    return (
        <div className="min-h-screen bg-[#0b0c0f] relative">
            {/* NewRun Background Pattern */}
            <div className="absolute inset-0 bg-[#0b0c0f]"></div>
            <div className="absolute inset-0 opacity-100" style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='1' cy='1' r='1.2' fill='%23ffffff' opacity='0.06'/></svg>")`
            }}></div>
            
            {/* NewRun Hero Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b0c0f] via-[#0f1115] to-[#0b0c0f]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-teal-600/5"></div>
            
            {/* Subtle animated orbs */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>

            <Navbar />
            
            <div className="relative z-10 flex h-[calc(100vh-80px)] backdrop-blur-sm">
                {/* Conversations Sidebar */}
                <div className="w-80 bg-[#0f1115]/80 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Messages
                        </h2>
                        <p className="text-white/60 text-sm">{conversations.length} conversations</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {conversations.map((conversation) => {
                            console.log('Conversation participants:', conversation.participants);
                            console.log('Current userId:', userId);
                            
                            const otherParticipants = conversation.participants.filter(p => {
                                const isOther = p._id !== userId;
                                console.log(`Participant ${p._id} vs userId ${userId}: ${isOther}`);
                                return isOther;
                            });
                            
                            console.log('Other participants:', otherParticipants);
                            
                            const participantNames = otherParticipants.length > 0
                                ? otherParticipants.map(p => `${p.firstName} ${p.lastName}`).join(', ')
                                : 'Unknown User';

                            return (
                                <div
                                    key={conversation._id}
                                    onClick={() => fetchMessages(conversation._id)}
                                    className={`p-4 cursor-pointer transition-all duration-200 rounded-xl border-l-4 ${
                                        selectedConversation === conversation._id 
                                            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500 shadow-lg shadow-blue-500/20' 
                                            : 'hover:bg-white/5 border-transparent hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                                                {participantNames.split(' ').map(name => name[0]).join('').slice(0, 2)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#0f1115] animate-pulse"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white truncate">
                                                {participantNames}
                                            </h3>
                                            <p className="text-sm text-white/60 truncate">
                                                {conversation.lastMessage?.content || 'No messages yet'}
                                            </p>
                                        </div>
                                        <div className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                                            {conversation.lastMessage?.timestamp ? 
                                                format(new Date(conversation.lastMessage.timestamp), 'MMM dd') : 
                                                ''
                                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0b0c0f]/80 backdrop-blur-xl">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/10 bg-[#0f1115]/80 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-lg">
                                            {selectedUser.firstName[0] + selectedUser.lastName[0]}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#0b0c0f] animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            {`${selectedUser.firstName} ${selectedUser.lastName}`}
                                        </h2>
                                        <p className="text-sm text-green-400 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            Online
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {renderMessagesWithDate()}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-6 border-t border-white/10 bg-[#0f1115]/80 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type your message..."
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm shadow-lg"
                                        />
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!selectedConversation || !newMessage.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                                <p className="text-white/60">Choose a conversation from the sidebar to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagingPage;
