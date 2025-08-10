const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const conversationSchema = new Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message_NewRUN', // Reference to the last message
  },
  lastUpdated: {
    type: Date,
    default: Date.now, // Timestamp of the latest message
  },
});

conversationSchema.index({ participants: 1 }); // Index for faster lookup by participants

const Conversation_NewRUN = mongoose.model('Conversation_NewRUN', conversationSchema);
module.exports = Conversation_NewRUN;