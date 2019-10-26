const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema({
    title: String,
    content: String,
    sender: ObjectId,
    receivers: [ObjectId],
    ccReceivers: [ObjectId],
    bccReceivers: [ObjectId],
    conversation: ObjectId,
    readBy: [ObjectId],
    deletedBy: [ObjectId],
    replyTo: ObjectId,
    files: [String],
    sentAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
