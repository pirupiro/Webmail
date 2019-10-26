const messageModel = require('../models/message');

class MessageAccessor {
    insert(message) {
        return messageModel.create(message);
    }

    findLast(convId, userId) {
        return messageModel.find({
            conversation: convId,
            $or: [
                { sender: userId },
                { receivers: userId },
                { ccReceivers: userId },
                { bccReceivers: userId }
            ]
        })
        .sort({
            sentAt: -1
        })
        .limit(1);
    }

    findAll(convId) {
        return messageModel.find({
            conversation: convId
        });
    }
}

module.exports = new MessageAccessor();
