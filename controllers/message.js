const jwt = require('jsonwebtoken');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

class MessageController {
    async send(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let sentFolder = await folderAccessor.findSent(decoded._id);
            let receivers = req.body.receivers.concat(req.body.ccReceivers).concat(req.body.bccReceivers);
            let inboxFolders = await folderAccessor.findAllInbox(receivers);
            let folders = inboxFolders.concat(sentFolder);
            let folderIds = folders.map(folder => folder._id);
            const convData = {
                folders: folderIds
            };
            let conversation = await convAccessor.insert(convData);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: decoded._id,
                receivers: req.body.receivers,
                ccReceivers: req.body.ccReceivers,
                bccReceivers: req.body.bccReceivers,
                conversation: conversation._id,
                visibleBy: receivers.concat(decoded._id),
                readBy: [decoded._id],
                files: req.body.files
            };

            let message = await messAccessor.insert(messageData);
            return res.status(200).json({
                error: false,
                message: 'Send message successfully',
                data: message
            });
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async reply(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let receivers = req.body.receivers.concat(req.body.ccReceivers).concat(req.body.bccReceivers);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: decoded._id,
                receivers: req.body.receivers,
                ccReceivers: req.body.ccReceivers,
                bccReceivers: req.body.bccReceivers,
                conversation: req.body.conversation,  // Conversation id of the replied message
                visibleBy: receivers.concat(decoded._id),
                replyTo: req.body.id,  // Id of the replied message
                files: req.body.files
            };

            messAccessor.insert(messageData);
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

    async saveToDrafts(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let drafts = await folderAccessor.findDrafts(decoded._id);
            let conversation = await convAccessor.findByFolderId(drafts._id);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: decoded._id,
                receivers: req.body.receivers,
                ccReceivers: req.body.ccReceivers,
                bccReceivers: req.body.bccReceivers,
                conversation: conversation._id,
                visibleBy: [decoded._id],
                files: req.body.files,
                sentAt: null
            };

            messAccessor.create(messageData);
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

    async delete(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(req.params.msgId);
            let conversation = await convAccessor.find(message.conversation);
            let messages = await messAccessor.findAllNotDeleted(conversation._id, decoded._id);
            let trashFolder = await folderAccessor.findTrash(decoded._id);

            if (!conversation.folderds.includes(trashFolder._id)) {
                conversation.folders.push(trashFolder._id);
            }

            if (messages.length == 1) {
                let folder = await folderAccessor.find(req.params.folderId);

                if (folder.name != 'Drafts' && folder.name != 'Spam') {
                    let index = conversation.folders.indexOf(req.params.folderId);
                    conversation.folders.splice(index, 1);
                    conversation.save();
                } 
            }

            message.deletedBy.push(decoded._id);
            message.save();

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

    async deletePermanently(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(req.params.msgId);
            let conversation = await convAccessor.find(message.conversation);
            let messages = await messAccessor.findAllDeleted(conversation._id, decoded._id);

            if (messages.length == 1) {
                if (conversation.folders.length > 1) {
                    let index = conversation.folders.indexOf(req.params.folderId);
                    conversation.splice(index, 1);
                    conversation.save();
                } else {
                    convAccessor.delete(conversation._id);
                }
            }

            let index = message.visibleBy.indexOf(decoded._id);
            message.visibleBy.splice(index, 1);
            
            if (message.visibleBy.length == 0) {
                messAccessor.delete(message._id);
            }
            
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

    async markRead(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = messAccessor.find(req.params.id);
            message.readBy.push(decoded._id);
            message.save();
            
            return res.status(200).json({
                error: false,
                message: null,
                data: null
            }) ;
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async markUnread(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = messAccessor.find(req.params.id);
            let index = message.readBy.indexOf(decoded._id);
            message.readBy.splice(index, 1);
            message.save();
            
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

module.exports = new MessageController();
