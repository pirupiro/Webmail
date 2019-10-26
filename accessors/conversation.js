const convModel = require('../models/conversation');

class ConversationAccessor {
    insert(conversation) {
        return convModel.create(conversation);
    }

    find(folderId) {
        return convModel.findOne({
            folders: folderId
        });
    }

    findAll(folderId) {
        return convModel.find({
            folders: folderId
        });
    }
}

module.exports = new ConversationAccessor();
