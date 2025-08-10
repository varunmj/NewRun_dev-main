import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { Input, Button, Avatar, Card } from '@heroui/react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar/Navbar';
import { format } from 'date-fns';

const socket = io('http://localhost:8000'); // Update with your backend URL if needed

const MessagingPage = () => {
    const [userId, setUserId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch user info and connect to Socket.io on mount
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axiosInstance.get('/get-user');
                if (response.data && response.data.user) {
                    setUserId(response.data.user._id);
                    fetchConversations();
                    socket.emit('join_user', response.data.user._id); // Connect user to their own socket room
                }
            } catch (error) {
                console.error('Unexpected error fetching user info:', error);
            }
        };
        fetchUserInfo();
    }, []);

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            const response = await axiosInstance.get('/conversations');
            if (response.data.success) {
                setConversations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
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
            const isCurrentUser = message.senderId === userId || (message.senderId && message.senderId._id === userId);
            const senderName = isCurrentUser ? 'You' : `${message.senderId?.firstName || ''} ${message.senderId?.lastName || ''}`;
            const avatarText = isCurrentUser ? "You" : `${senderName.split(' ').map(name => name[0]).join('')}`;
    
            let dateSeparator = null;
            if (!lastDate || formattedDate !== format(lastDate, 'MMM dd, yyyy')) {
                dateSeparator = (
                    <div className="text-center text-gray-500 text-sm my-2" key={`date-${formattedDate}`}>
                        <span className="border-t border-gray-300 w-1/4 inline-block"></span>
                        <span className="mx-2">{formattedDate}</span>
                        <span className="border-t border-gray-300 w-1/4 inline-block"></span>
                    </div>
                );
                lastDate = messageDate;
            }
    
            return (
                <React.Fragment key={index}>
                    {dateSeparator}
                    <div className={`flex mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {!isCurrentUser && (
                            <Avatar 
                                text={avatarText || 'NN'}
                                size="sm"
                                className="mr-2"
                            />
                        )}
                        <div
                            className={`p-3 rounded-lg shadow-sm max-w-xs ${
                                isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                            }`}
                        >
                            <p className="text-xs font-semibold">{senderName}</p>
                            <p className="text-sm">{message.content}</p>
                        </div>
                        {isCurrentUser && (
                            <Avatar 
                                text="You"
                                size="sm"
                                className="ml-2"
                            />
                        )}
                    </div>
                </React.Fragment>
            );
        });
    };
    

    return (
        <div>
            <Navbar />
            <div className="flex h-screen bg-gray-50">
                <div className="w-1/4 bg-white p-4 shadow-lg overflow-y-auto">
                    <h3 className="text-2xl font-semibold mb-4 text-center text-gray-700 border-b pb-2">
                        Conversations
                    </h3>
                    {conversations.map((conversation) => {
                        const otherParticipants = conversation.participants.filter(p => p._id !== userId);
                        const participantNames = otherParticipants.length > 0
                            ? otherParticipants.map(p => `${p.firstName} ${p.lastName}`).join(', ')
                            : 'Unknown User';

                        return (
                            <motion.div
                                key={conversation._id}
                                onClick={() => fetchMessages(conversation._id)}
                                whileHover={{ scale: 1.02 }}
                                className={`p-3 mb-3 rounded-lg cursor-pointer shadow-md ${
                                    selectedConversation === conversation._id ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Avatar 
                                        text={participantNames.split(' ').map(name => name[0]).join('')}
                                        size="md"
                                        color="primary"
                                    />
                                    <div className="ml-3">
                                        <p className="font-semibold text-gray-800">
                                            {participantNames}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conversation.lastMessage?.content || 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="w-3/4 flex flex-col p-6 bg-gray-100">
                    {selectedUser && (
                        <div className="flex items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
                            <Avatar 
                                text={selectedUser.firstName[0] + selectedUser.lastName[0]} 
                                size="lg" 
                                className="mr-3" 
                            />
                            <div>
                                <h2 className="text-xl font-semibold">{`${selectedUser.firstName} ${selectedUser.lastName}`}</h2>
                                <p className="text-sm text-gray-600">User's intro or role</p>
                            </div>
                        </div>
                    )}

                    <Card className="flex-grow rounded-lg shadow-md overflow-hidden flex flex-col">
                        <div className="p-4 overflow-y-auto flex-grow">
                            {renderMessagesWithDate()}
                            <div ref={messagesEndRef} />
                        </div>
                    </Card>

                    <div className="mt-4 flex items-center bg-white p-3 border-t border-gray-300">
                        <Input
                            id="messageInput"
                            name="messageContent"
                            clearable
                            underlined
                            placeholder="Type a message..."
                            fullWidth
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="mr-2"
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button
                            auto
                            color="primary"
                            onClick={sendMessage}
                            disabled={!selectedConversation}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagingPage;
