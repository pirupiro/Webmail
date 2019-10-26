const jwt = require('jsonwebtoken');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

class FolderController {
    async findAllInboxConversations(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folder = await folderAccessor.findInbox(decoded._id);
            let convs = await convAccessor.findAll(folder._id);
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
            let convs = await convAccessor.findAll(folder._id);
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

    async findAllTrashConversations(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folder = await folderAccessor.findTrash(decoded._id);
            let convs = await convAccessor.findAll(folder._id);
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

    async findAllDraftMessages(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let folder = await folderAccessor.findDrafts(decoded._id);
            let conv = await convAccessor.find(folder._id);
            let messages = await messAccessor.findAll(conv._id);
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
            let folder = await folderAccessor.findSpam(decoded._id);
            let conv = await convAccessor.find(folder._id);
            let messages = await messAccessor.findAll(conv._id);
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
            let folder = await folderAccessor.find(decoded._id, req.params.name);
            let convs = await convAccessor.findAll(folder._id);
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
            let folder = folderAccessor.find(decoded._id, req.params.name);
            let convs = convAccessor.findAll(folder._id);

            if (convs) {
                for (let i = 0; i < convs.length; i++) {
                    let index = convs[i].folders.indexOf(folder._id);
                    convs[i].folders.splice(index, 1);
                    convs[i].save();
                }
            }

            folderAccessor.delete(folder._id);
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
