const jwt = require('jsonwebtoken');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

class MessageController {
    async send(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let sentFolder = await folderAccessor.findSent(decoded._id);
            let inboxFolders = await folderAccessor.findAllInbox(
                req.body.receivers
                .concat(req.body.ccReceivers)
                .concat(req.body.bccReceivers)
            );
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
            
            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: decoded._id,
                receivers: req.body.receivers,
                ccReceivers: req.body.ccReceivers,
                bccReceivers: req.body.bccReceivers,
                conversation: req.body.message.conversation,
                replyTo: req.body.message,
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

    async saveToDraft(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let draft = await folderAccessor.findDraft(decoded._id);
            let conversation = await convAccessor.find(draft._id);

            const messageData = {
                title: req.body.title,
                content: req.body.content,
                sender: decoded._id,
                receivers: req.body.receivers,
                ccReceivers: req.body.ccReceivers,
                bccReceivers: req.body.bccReceivers,
                conversation: conversation._id,
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
}

module.exports = new MessageController();
