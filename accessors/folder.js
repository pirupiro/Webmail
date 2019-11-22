const folderModel = require('../models/folder');

class FolderAccessor {
    insert(userId, name) {
        return folderModel.create({
            user: userId,
            name: name
        })
    }

    find(folderId) {
        return folderModel.findById(folderId);
    }

    findByName(userId, name) {
        return folderModel.findOne({
            user: userId,
            name: name
        });
    }
    
    findInbox(userId) {
        return this.findByName(userId, 'Inbox');
    }

    findSent(userId) {
        return this.findByName(userId, 'Sent');
    }

    findDrafts(userId) {
        return this.findByName(userId, 'Drafts');
    }

    findSpam(userId) {
        return this.findByName(userId, 'Spam');
    }

    findTrash(userId) {
        return this.findByName(userId, 'Trash');
    }

    findAllByName(userIds, name) {
        return folderModel.find({
            user: {
                $in: userIds
            },
            name: name
        });
    }

    findAllInbox(userIds) {
        return this.findAllByName(userIds, 'Inbox');
    }

    findAllSpam(userIds) {
        return this.findAllByName(userids, 'Spam');
    }

    delete(folderId) {
        return folderModel.findByIdAndDelete(folderId);
    }

    findAllByUserId(userId) {
        return folderModel.find({
            user: userId
        });
    }
}

module.exports = new FolderAccessor();
