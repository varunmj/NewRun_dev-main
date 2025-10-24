import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const socketUrl = 
      import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ||
      import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
      import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
      (window.location.hostname.endsWith('newrun.club') ? 'https://api.newrun.club' : 'http://localhost:8000');

    console.log('🔌 Connecting to Socket.io:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Emit user registration
      this.emit('join_user', this.getCurrentUserId());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket.io connection error:', error);
      this.reconnectAttempts++;
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.io reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-register user
      this.emit('join_user', this.getCurrentUserId());
    });
  }

  getCurrentUserId() {
    // Return the stored user ID if available
    if (this.userId) {
      return this.userId;
    }
    
    // Get user ID from localStorage or context
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed._id || parsed.id;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Also try to get from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    return null;
  }

  // Event management
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    // Remove from listeners map
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, queuing event:', event);
      // Queue the event for when connection is restored
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          this.socket.emit(event, data);
        }
      }, 1000);
      return;
    }
    
    console.log('📤 Emitting event:', event, data);
    this.socket.emit(event, data);
  }

  // Messaging specific methods
  joinConversation(conversationId) {
    this.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId) {
    this.emit('leave_conversation', conversationId);
  }

  sendMessage(messageData) {
    this.emit('send_message', messageData);
  }

  markMessageRead(conversationId, messageId) {
    this.emit('mark_message_read', { conversationId, messageId });
  }

  // Set user ID and re-register
  setUserId(userId) {
    this.userId = userId;
    console.log('🔑 Socket.io - User ID set:', userId);
    
    if (this.socket && this.isConnected && userId) {
      console.log('🔄 Re-registering user with Socket.io:', userId);
      this.emit('join_user', userId);
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.io');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
