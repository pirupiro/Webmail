const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const messageSchema = new mongoose.Schema({
    title: String,
    content: String,
    sender: String,
    receivers: [String],
    ccReceivers: [String],
    bccReceivers: [String],
    visibleBy: [String],
    readBy: [String],
    deletedBy: [String],
    conversation: ObjectId,
    replyTo: ObjectId,
    files: [String],
    sentAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
