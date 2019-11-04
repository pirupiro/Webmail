const jwt = require('jsonwebtoken');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

class FolderController {
    async findAllConversations(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let convs = await convAccessor.findAllByFolderId(req.body.folderId);
            let lastMessages = [];

            for (let i = 0; i < convs.length; i++) {
                // Find all last messages stored in each conversation and visible by user
                lastMessages.push(messAccessor.findLast(convs[i]._id, user.email));
            }

            let messages = await Promise.all(lastMessages);
            let senderIds = messages.map(message => message[0].sender);
            let senders = await userAccessor.findAllByIds(senderIds);
            let data = [];

            for (let i = 0; i < lastMessages.length; i++) {
                data.push({
                    convId: convs[i]._id,
                    title: lastMessages[i].title,
                    content: lastMessages[i].content,
                    sender: senders[i].name,
                    sentAt: lastMessages[i].sentAt
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
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let convs = await convAccessor.findAllByFolderId(req.body.folderId);
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
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
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
            let convs = await convAccessor.findAllByFolderId(req.body.folderId);

            for (let i = 0; i < convs.length; i++) {
                if (convs[i].folders.length > 1) {
                    // Remove the reference between conversations and their folder
                    let index = convs[i].folders.indexOf(folderId);
                    convs[i].folders.splice(index, 1);
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
