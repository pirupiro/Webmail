const jwt = require('jsonwebtoken');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');
const ObjectId = require('mongoose').Types.ObjectId;

class FolderController {
    async findAllConversations(req, res, next) {
        try {
            let user = req.body.user
            let convs = await convAccessor.findAllByFolderId(ObjectId(req.body.folderId));
            let lastMessages = [];

            for (let i = 0; i < convs.length; i++) {
                // Find all last messages stored in each conversation and visible by user
                lastMessages.push(messAccessor.findLast(convs[i]._id, user.email));
            }

            let messages = await Promise.all(lastMessages);
            let data = [];

            for (let i = 0; i < convs.length; i++) {
                data.push({
                    convId: convs[i]._id,
                    title: messages[i][0].title,
                    content: messages[i][0].content,
                    sender: messages[i][0].sender,
                    sentAt: messages[i][0].sentAt
                });
            }

            return res.status(200).json({
                error: false,
                message: null,
                data: data
            });
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async findAllMessages(req, res, next) {
        try {
            let user = req.body.user
            let convs = await convAccessor.findAllByFolderId(ObjectId(req.body.folderId));
            let messages = await messAccessor.findAllNotDeleted(convs[0]._id, user.email);  // Drafts and Spam folder have only 1 conversation
            
            return res.status(200).json({
                error: false,
                message: null,
                data: messages
            });
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async createFolder(req, res, next) {
        try {
            let user = req.body.user
            let folders = await folderAccessor.findAllByUserId(user._id);
            let folderNames = folders.map(folder => folder.name.toLowerCase());

            if (folderNames.includes(req.body.folderName.toLowerCase())) {
                return res.status(400).json({
                    error: true,
                    message: 'Your folder name is dulicated with other folder name',
                    data: null
                });
            }

            await folderAccessor.insert(user._id, req.body.folderName);
            
            return res.status(200).json({
                error: false,
                message: null,
                data: null
            });
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async deleteFolder(req, res, next) {
        try {
            let folderId = ObjectId(req.body.folderId);
            let convs = await convAccessor.findAllByFolderId(folderId);

            for (let i = 0; i < convs.length; i++) {
                if (convs[i].folders.length > 1) {
                    // Remove the reference between conversations and their folder
                    for (let j = 0; j < convs[i].folders.length; j++) {
                        if (convs[i].folders[j].equals(folderId)) {
                            convs[i].folders[j].splice(j, 1);
                            break;
                        }
                    }

                    await convs[i].save();
                } else {
                    // Permanently deletes conversations
                    // This also deletes all messages stored in each conversation
                    let messages = await messAccessor.findAll(convs[i]._id);
                    let messageIds = messages.map(message => message._id);
                    await messAccessor.deleteAllByIds(messageIds);
                    await convAccessor.delete(convs[i]._id);
                }
            }

            await folderAccessor.delete(folderId);

            return res.status(200).json({
                error: false,
                message: null,
                data: null
            });
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }
}

module.exports = new FolderController();
