const jwt = require('jsonwebtoken');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

class FolderController {
    async findAllInboxConversations(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let inbox = await folderAccessor.findInbox(decoded._id);
            let convs = await convAccessor.findAllByFolderId(inbox._id);
            let lastMessages = [];

            for (let i = 0; i < convs.length; i++) {
                // Find all messages stored in convs[i] and visible by decoded user
                lastMessages.push(messAccessor.findLast(convs[i]._id, decoded._id));
            }

            Promise
            .all(lastMessages)
            .then(values => {
                let lastMessages = [];

                for (let i = 0; i < values.length; i++) {
                    lastMessages = lastMessages.concat(values[i]);
                }

                let senderIds = lastMessages.map(msg => msg.sender);

                userAccessor
                .findAllByIds(senderIds)
                .then(senders => {
                    let data = [];

                    for (let i = 0; i < lastMessages.length; i++) {
                        data.push({
                            conversation: convs[i]._id,
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
                    })
                });
            })
            .catch(err => {
                return res.status(500).json({
                    error: true,
                    message: err.message,
                    data: null
                });
            });
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async findAllSentConversations(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folder = await folderAccessor.findSent(decoded._id);
            let convs = await convAccessor.findAllByFolderId(folder._id);
            let lastMessages = [];

            for (let i = 0; i < convs.length; i++) {
                // Find all messages stored in convs[i] and visible by decoded user
                lastMessages.push(messAccessor.findLast(convs[i]._id, decoded._id));
            }

            Promise
            .all(lastMessages)
            .then(values => {
                let lastMessages = [];

                for (let i = 0; i < values.length; i++) {
                    lastMessages = lastMessages.concat(values[i]);
                }

                let senderIds = lastMessages.map(msg => msg.sender);

                userAccessor
                .findAllByIds(senderIds)
                .then(senders => {
                    let data = [];

                    for (let i = 0; i < lastMessages.length; i++) {
                        data.push({
                            conversation: convs[i]._id,
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
                    })
                });
            })
            .catch(err => {
                return res.status(500).json({
                    error: true,
                    message: err.message,
                    data: null
                });
            })
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async findAllTrashConversations(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folder = await folderAccessor.findTrash(decoded._id);
            let convs = await convAccessor.findAllByFolderId(folder._id);
            let lastMessages = [];

            for (let i = 0; i < convs.length; i++) {
                // Find all messages stored in convs[i] and visible by decoded user
                lastMessages.push(messAccessor.findLast(convs[i]._id, decoded._id));
            }

            Promise
            .all(lastMessages)
            .then(values => {
                let lastMessages = [];

                for (let i = 0; i < values.length; i++) {
                    lastMessages = lastMessages.concat(values[i]);
                }

                let senderIds = lastMessages.map(msg => msg.sender);

                userAccessor
                .findAllByIds(senderIds)
                .then(senders => {
                    let data = [];

                    for (let i = 0; i < lastMessages.length; i++) {
                        data.push({
                            conversation: convs[i]._id,
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
                    })
                });
            })
            .catch(err => {
                return res.status(500).json({
                    error: true,
                    message: err.message,
                    data: null
                });
            })
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async findAllDraftsMessages(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let drafts = await folderAccessor.findDrafts(decoded._id);
            let conv = await convAccessor.findAllByFolderId(drafts._id);
            let messages = await messAccessor.findAllNotDeleted(conv._id, decoded._id);
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

    async findAllSpamMessages(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let spam = await folderAccessor.findSpam(decoded._id);
            let conv = await convAccessor.findAllByFolderId(spam._id);
            let messages = await messAccessor.findAllNotDeleted(conv._id, decoded._id);
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

    async findAllDefinedFolderConversations(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folder = await folderAccessor.findByName(decoded._id, req.params.name);
            let convs = await convAccessor.findAllByFolderId(folder._id);
            let convIds = convs.map(conv => conv._id);
            let lastMessages = [];

            for (let i = 0; i < convIds.length; i++) {
                lastMessages.push(messAccessor.findLast(convIds[i], decoded._id));
            }

            Promise
            .all(lastMessages)
            .then(values => {
                let lastMessages = [];

                for (let i = 0; i < values.length; i++) {
                    lastMessages = lastMessages.concat(values[i]);
                }

                const data = lastMessages.map(message => ({
                    title: message.title,
                    content: message.content,
                    sender: message.sender,
                    sentAt: message.sentAt
                }));

                return res.status(200).json({
                    error: false,
                    message: null,
                    data: data
                })
            })
            .catch(err => {
                return res.status(500).json({
                    error: true,
                    message: err.message,
                    data: null
                });
            })
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
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folders = await folderAccessor.findAllByUserId(decoded._id);
            let folderNames = folders.map(folder => folder.name.toLowerCase());

            if (folderNames.includes(req.params.name.toLowerCase())) {
                return res.status(400).json({
                    error: true,
                    message: 'Your folder name is dulicated with other folder name',
                    data: null
                });
            }

            folderAccessor.insert(decoded._id, req.params.name);
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
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folders = await folderAccessor.findAllByUserId(decode._id);
            let folderNames = folders.map(folder => folder.name.toLowerCase());

            if (folderNames.includes(req.params.name.toLowerCase())) {
                let folder = folderAccessor.findByName(decoded._id, req.params.name);
                let convs = convAccessor.findAllByFolderId(folder._id);

                for (let i = 0; i < convs.length; i++) {
                    if (convs[i].folders.length > 1) {
                        // Remove the reference between conversations and their folder
                        let index = convs[i].folders.indexOf(folder._id);
                        convs[i].folders.splice(index, 1);
                        convs[i].save();
                    } else {
                        // Permanently deletes conversations
                        // This also deletes all messages stored in each conversation
                        let messages = await messAccessor.findAll(convs[i]._id);
                        let messageIds = messages.map(message => message._id);

                        for (let i = 0; i < messages.length; i++) {
                            messAccessor.deleteAllByIds(messageIds);
                        }

                        convAccessor.delete(convs[i]._id);
                    }
                }

                folderAccessor.delete(folder._id);
                return res.status(200).json({
                    error: false,
                    message: null,
                    data: null
                });
            } else {
                return res.status(400).json({
                    error: true,
                    message: 'Your folder name is invalid',
                    data: null
                });
            }
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
