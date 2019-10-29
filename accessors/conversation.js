const convModel = require('../models/conversation');

class ConversationAccessor {
    insert(conversation) {
        return convModel.create(conversation);
    }

    delete(convId) {
        return convModel.findByIdAndDelete(convId);
    }

    find(convId) {
        return convModel.findById(convId);
    }

    findByFolderId(folderId) {
        return convModel.findOne({
            folders: folderId
        });
    }

    findAllByFolderId(folderId) {
        return convModel.find({
            folders: folderId
        });
    }

    findAllByIds(convIds) {
        return convModel.find({
            _id: {
                $in: convIds
            }
        })
    }
}

module.exports = new ConversationAccessor();
