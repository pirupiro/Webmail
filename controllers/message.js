const jwt = require('jsonwebtoken');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');
const ObjectId = require('mongoose').Types.ObjectId;

Array.prototype.diff = function(array) {
    return this.filter(element1 => {
        return array.every(element2 => {
            return !element1.equals(element2);
        });
    });
};

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
            let folderIds = inboxFolders.map(folder => folder._id);
            folderIds.push(ObjectId(req.body.sentFolderId));
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
                message: null,
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
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let allReceiverEmails = req.body.receiverEmails
                                    .concat(req.body.ccReceiverEmails)
                                    .concat(req.body.bccReceiverEmails);

            const replyingMessage = {
                title: req.body.title,
                content: req.body.content,
                sender: user.email,
                receivers: req.body.receiverEmails,
                ccReceivers: req.body.ccReceiverEmails,
                bccReceivers: req.body.bccReceiverEmails,
                visibleBy: allReceiverEmails.concat(user.email),
                readBy: [user.email],
                conversation: ObjectId(req.body.convId),  // Conversation id of the replied message
                replyTo: ObjectId(req.body.msgId),  // Id of the replied message
                files: req.body.files
            };

            let allReceivers = await userAccessor.findAllByEmails(allReceiverEmails);
            let allReceiverIds = allReceivers.map(receiver => receiver._id);
            let inboxFolders = await folderAccessor.findAllInbox(allReceiverIds);
            let inboxFolderIds = inboxFolders.map(folder => folder._id);
            let conversation = await convAccessor.find(ObjectId(req.body.convId));
            let difference = inboxFolderIds.diff(conversation.folders);
            conversation.folders = conversation.folders.concat(difference);
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
            let draftsId = ObjectId(req.body.draftsFolderId);
            let conversation = await convAccessor.findByFolderId(draftsId);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: user.email,
                receivers: req.body.receiverEmails,
                ccReceivers: req.body.ccReceiverEmails,
                bccReceivers: req.body.bccReceiverEmails,
                conversation: conversation._id,
                visibleBy: [user.email],
                readBy: [user.email],
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
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            let conversation = await convAccessor.find(message.conversation);
            let messages = await messAccessor.findAllNotDeleted(conversation._id, user.email);
            let trashId = ObjectId(req.body.trashFolderId);

            if (!conversation.folders.includes(trashId)) {
                conversation.folders.push(trashId);
            }

            if (messages.length == 1) {
                let folder = await folderAccessor.find(ObjectId(req.body.currentFolderId));

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
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            let conversation = await convAccessor.find(message.conversation);
            let messages = await messAccessor.findAllDeleted(conversation._id, user.email);

            if (messages.length == 1) {
                // This happens because the deleted message is the last message in the conversation
                if (conversation.folders.length > 1) {
                    // Remove the reference from conversation to trash folder of user
                    // Because this conversation still refers to other folders
                    let index = conversation.folders.indexOf(ObjectId(req.body.trashFolderId));
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

    async markRead(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            message.readBy.push(user.email);
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

    async markUnread(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            let index = message.readBy.indexOf(user.email);
            message.readBy.splice(index, 1);
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
            let user 
            = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            let inboxFolder = ObjectId(req.body.inboxFolderId);
            let conversation = await convAccessor.find(message.conversation);
            let index = conversation.folders.indexOf(ObjectId(req.body.convId));
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
