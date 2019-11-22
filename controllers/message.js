const jwt = require('jsonwebtoken');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

// Array.prototype.diff = function(list) {
//     return this.filter(function(item) {
//         return !list.includes(item) < 0;
//     });
// };

class MessageController {
    async send(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let allReceiverEmails = req.body.receiverEmails
                                    .concat(req.body.ccReceiverEmails)
                                    .concat(req.body.bccReceiverEmails);
            let allReceivers = await userAccessor.findAllByEmails(allReceiverEmails);
            let allReceiverIds = allReceivers.map(receiver => receiver._id);
            let inboxFolders = await folderAccessor.findAllInbox(allReceiverIds);
            let folders = inboxFolders.concat(req.body.sentFolderId);
            let folderIds = folders.map(folder => folder._id);
            const convData = {
                folders: folderIds
            };
            let conversation = await convAccessor.insert(convData);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: user.email,
                receivers: req.body.receiverEmails,
                ccReceivers: req.body.ccReceiverEmails,
                bccReceivers: req.body.bccReceiverEmails,
                visibleBy: allReceiverEmails.concat(user.email),
                readBy: [user.email],
                conversation: conversation._id,
                files: req.body.files
            };

            let message = await messAccessor.insert(messageData);
            
            return res.status(200).json({
                error: false,
                message: 'Send message successfully',
                data: message
            });
        } catch (err) {
            console.log(err)
            return res.status(400).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async reply(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let allReceiverEmails = req.body.receiverEmails.concat(req.body.ccReceiverEmails).concat(req.body.bccReceiverEmails);

            const replyingMessage = {
                title: req.body.title,
                content: req.body.content,
                sender: user.email,
                receivers: req.body.receiverEmails,
                ccReceivers: req.body.ccReceiverEmails,
                bccReceivers: req.body.bccReceiverEmails,
                conversation: req.body.convId,  // Conversation id of the replied message
                visibleBy: allReceiverEmails.concat(user.email),
                replyTo: req.body.msgId,  // Id of the replied message
                files: req.body.files
            };

            let inboxFolders = await folderAccessor.findAllByEmails(allReceiverEmails);
            let conversation = await convAccessor.find(req.body.convId);
            let inboxFolderIds = inboxFolders.map(folder => folder._id);
            conversation.folders = Array.from(new Set(conversation.folders.concat(inboxFolderIds)));
            await conversation.save();
            await messAccessor.insert(replyingMessage);

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
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let drafts = await folderAccessor.findDrafts(user._id);
            let conversation = await convAccessor.findByFolderId(drafts._id);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: user.email,
                receivers: req.body.receiverEmails,
                ccReceivers: req.body.ccReceiverEmails,
                bccReceivers: req.body.bccReceiverEmails,
                conversation: conversation._id,
                visibleBy: [user.email],
                files: req.body.files,
                sentAt: null
            };

            await messAccessor.create(messageData);
            
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
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(req.body.msgId);
            let conversation = await convAccessor.find(message.conversation);
            let messages = await messAccessor.findAllNotDeleted(conversation._id, user.email);
            let trashFolder = await folderAccessor.findTrash(user._id);

            if (!conversation.folderds.includes(trashFolder._id)) {
                conversation.folders.push(trashFolder._id);
            }

            if (messages.length == 1) {
                let folder = await folderAccessor.find(req.body.currentFolderId);

                if (folder.name != 'Drafts' && folder.name != 'Spam') {
                    let index = conversation.folders.indexOf(folder._id);
                    conversation.folders.splice(index, 1);
                    await conversation.save();
                }
            }

            message.deletedBy.push(user.email);
            await message.save();

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
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(req.body.msgId);
            let conversation = await convAccessor.find(message.conversation);
            let messages = await messAccessor.findAllDeleted(conversation._id, user.email);

            if (messages.length == 1) {
                // This happens because the deleted message is the last message in the conversation
                if (conversation.folders.length > 1) {
                    // Remove the reference from conversation to trash folder of user
                    // Because this conversation still refers to other folders
                    let index = conversation.folders.indexOf(req.body.trashFolderId);
                    conversation.splice(index, 1);
                    await conversation.save();
                } else {
                    // Delete conversation permanently because there is no reference left
                    await convAccessor.delete(conversation._id);
                }
            }

            // Remove user from the visibleBy list of this message
            // So that this user can no longer see this message
            let index = message.visibleBy.indexOf(user.email);
            message.visibleBy.splice(index, 1);
            
            if (message.visibleBy.length == 0) {
                // If the message can't be visible from anyone, it should de deleted
                await messAccessor.delete(message._id);
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

    async markReadOrUnread(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = messAccessor.find(req.body.msgId);
            let index = message.readBy.indexOf(user.email);

            if (index < 0) {
                message.readBy.push(user.email);
            } else {
                message.readBy.splice(index, 1);
            }

            await message.save();
            
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

    async unmarkSpam(req, res, next) {
        try {
            let user  = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(req.body.msgId);
            let inboxFolder = await folderAccessor.findInbox(user._id);
            let conversation = await convAccessor.find(message.conversation);
            let index = conversation.folders.indexOf(req.body.convId);
            conversation.folders[index] = inboxFolder._id;
            await conversation.save();
            
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
