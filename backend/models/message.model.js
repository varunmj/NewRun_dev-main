const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation_NewRUN',
    required: true,
  },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    type: String,
    default: '', // Regular text content
  },
  attachments: {
    images: [{ type: String }], // Array of image URLs
    documents: [{ type: String }], // Array of document URLs
  },
  gif: { type: String, default: '' }, // GIF URL if applicable
  emoji: { type: String, default: '' }, // Emoji if applicable
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  // Read receipt status: 'sent', 'delivered', 'read'
  readStatus: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  },
  // Timestamps for each status
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date, default: null },
  readAt: { type: Date, default: null }
});

messageSchema.index({ conversationId: 1, timestamp: 1 }); // Index for faster sorting by timestamp

const Message_NewRUN = mongoose.model('Message_NewRUN', messageSchema);
module.exports = Message_NewRUN;