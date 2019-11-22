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

Array.prototype.has = function(item) {
    return this.some(element => {
        return item.equals(element);
    });
};

class MessageController {
    async send(req, res, next) {
        try {
            let user = req.body.user;
            let allReceiverEmails = req.body.receiverEmails
                                    .concat(req.body.ccReceiverEmails)
                                    .concat(req.body.bccReceiverEmails);

            let allReceivers = await userAccessor.findAllByEmails(allReceiverEmails);
            let allReceiverIds = allReceivers.map(receiver => receiver._id);
            let folders;
            let isSpam = false;  // This will be replaced by calling spam filter API

            if (isSpam) {
                folders = await folderAccessor.findAllSpam(allReceiverIds);
            } else {
                folders = await folderAccessor.findAllInbox(allReceiverIds);
            }
            
            let folderIds = folders.map(folder => folder._id);
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
            let user = req.body.user;
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
                data: replyingMessage
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
            let user = req.body.user;
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

            await messAccessor.insert(messageData);
            
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
            let user = req.body.user;
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            let conversation = await convAccessor.find(message.conversation);
            
            message.deletedBy.push(user.email);
            await message.save();

            let trashFolderId = ObjectId(req.body.trashFolderId);

            if (!conversation.folders.has(trashFolderId)) {
                conversation.folders.push(trashFolderId);
                await conversation.save();
            }

            let messages = await messAccessor.findAllNotDeleted(conversation._id, user.email);

            if (messages.length == 0) {
                // There is no not deleted message left in this conversation
                let currentFolderId = ObjectId(req.body.currentFolderId);
                let folder = await folderAccessor.find(currentFolderId);

                if (folder.name != 'Drafts') {
                    let index = conversation.folders.indexOf(folder._id);
                    conversation.folders.splice(index, 1);
                    await conversation.save();
                }
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

    async deletePermanently(req, res, next) {
        try {
            let user = req.body.user;
            let message = await messAccessor.find(ObjectId(req.body.msgId));
            let conversation = await convAccessor.find(message.conversation);

            // Remove user from the visibleBy list of this message
            // So that this user can no longer see this message
            let index = message.visibleBy.indexOf(user.email);
            message.visibleBy.splice(index, 1);
            
            if (message.visibleBy.length == 0) {
                // If the message cannot be visible from anyone, it should de deleted
                await messAccessor.delete(message._id);
            } else {
                await message.save();
            }

            let messages = await messAccessor.findAllDeleted(conversation._id, user.email);

            if (messages.length == 0) {
                // There is no deleted message left in this conversation
                if (conversation.folders.length > 1) {
                    // Remove the reference from this conversation to the trash folder of user
                    // Because this conversation still refers to other folders
                    let trashFolderId = ObjectId(req.body.trashFolderId);
                    
                    for (let i = 0; i < conversation.folders.length; i++) {
                        if (conversation.folders[i].equals(trashFolderId)) {
                            conversation.folders.splice(i, 1);
                            break;
                        }
                    }
                    
                    await conversation.save();
                } else {
                    // Delete conversation permanently because there is no reference left
                    await convAccessor.delete(conversation._id);
                }
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

    async restore(req, res, next) {
        try {
            let user = req.body.user;
            let message = messAccessor.find(ObjectId(req.body.msgId));
            let conversation = convAccessor.find(message.conversation);
            let index = message.deletedBy.indexOf(user.email);
            message.deletedBy.splice(index, 1);
            await message.save();

            let messages = await messAccessor.findAllDeleted(conversation._id, user.email);

            if (messages.length == 0) {
                // There is no deleted message left in this conversation
                // Remove this conversation from trash folder
                let trashFolderId = ObjectId(req.body.trashFolderId);
                let index = conversation.folders.indexOf(trashFolderId);
                conversation.folders.splice(index, 1);
                await conversation.save();
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
            let user = req.body.user;
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
            let user = req.body.user;
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
            let user = req.body.user;
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
