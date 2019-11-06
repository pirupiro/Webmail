const messageModel = require('../models/message');

class MessageAccessor {
    insert(message) {
        return messageModel.create(message);
    }

    find(msgId) {
        return messageModel.findById(msgId);
    }

    delete(msgId) {
        return messageModel.findByIdAndDelete(msgId);
    }

    deleteAllByIds(msgIds) {
        return messageModel.deleteMany({
            _id: {
                $in: msgIds
            }
        });
    }

    findLast(convId, userEmail) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userEmail
        })
        .sort({
            sentAt: -1
        })
        .limit(1);
    }

    findAll(convId, userEmail) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userEmail,
        });
    }

    findAllNotDeleted(convId, userEmail) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userEmail,
            deletedBy: {
                $ne: userEmail
            }
        });
    }
    
    findAllDeleted(convId, userEmail) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userEmail,
            deletedBy: userEmail
        });
    }
}

module.exports = new MessageAccessor();
