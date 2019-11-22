const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');
const ObjectId = require('mongoose').Types.ObjectId;

class FolderController {
    async findAllConversations(req, res, next) {
        try {
            let user = req.body.user;
            let convs = await convAccessor.findAllByFolderId(ObjectId(req.body.folderId));
            let lastMessages = [];
            let numUnread = [];
            let senders = [];
            
            for (let conv of convs) {
                lastMessages.push(messAccessor.findLast(conv._id, user.email));
                numUnread.push(messAccessor.countUnread(conv._id, user.email));
            }

            lastMessages = await Promise.all(lastMessages);
            numUnread = await Promise.all(numUnread);

            for (let message of lastMessages) {
                senders.push(userAccessor.findByEmail(message[0].sender));
            }

            senders = await Promise.all(senders);
            let data = [];

            for (let i = 0; i < convs.length; i++) {
                data.push({
                    convId: convs[i]._id,
                    title: lastMessages[i][0].title,
                    content: lastMessages[i][0].content,
                    sender: senders[i].name,
                    sentAt: lastMessages[i][0].sentAt,
                    numUnread: numUnread[i]
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
            let user = req.body.user;
            let conversation = await convAccessor.findByFolderId(ObjectId(req.body.folderId));
            let messages = await messAccessor.findAllNotDeleted(conversation._id, user.email);  // Drafts folder has only 1 conversation
            
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
            let user = req.body.user;
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
