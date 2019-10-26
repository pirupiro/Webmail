const folderModel = require('../models/folder');

class FolderAccessor {
    insert(userId, name) {
        return folderModel.create({
            user: userId,
            name: name
        })
    }

    find(userId, name) {
        return folderModel.findOne({
            user: userId,
            name: name
        });
    }
    
    findInbox(userId) {
        return this.find(userId, 'Inbox');
    }

    findSent(userId) {
        return this.find(userId, 'Sent');
    }

    findDrafts(userId) {
        return this.find(userId, 'Drafts');
    }

    findSpam(userId) {
        return this.find(userId, 'Spam');
    }

    findTrash(userId) {
        return this.find(userId, 'Trash');
    }

    findAll(userIds, name) {
        return folderModel.find({
            user: {
                $in: userIds
            },
            name: name
        });
    }

    findAllInbox(userIds) {
        return this.findAll(userIds, 'Inbox');
    }

    delete(folderId) {
        return folderModel.findByIdAndDelete(folderId);
    }
}

module.exports = new FolderAccessor();
