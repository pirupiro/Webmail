const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const conversationSchema = new mongoose.Schema({
    folders: [ObjectId]
});

module.exports = mongoose.model('Conversation', conversationSchema);
