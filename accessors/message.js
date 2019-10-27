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

    deleteAllByIds(ids) {
        return messageModel.deleteMany({
            _id: {
                $in: ids
            }
        });
    }

    findLast(convId, userId) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userId
        })
        .sort({
            sentAt: -1
        })
        .limit(1);
    }

    findAll(convId, userId) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userId,
        });
    }

    findAllNotDeleted(convId, userId) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userId,
            deletedBy: {
                $not: userId
            }
        });
    }
    
    findAllDeleted(convId, userId) {
        return messageModel.find({
            conversation: convId,
            visibleBy: userId,
            deletedBy: userId
        });
    }
}

module.exports = new MessageAccessor();
