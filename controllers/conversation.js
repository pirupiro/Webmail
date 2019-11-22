const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');
const ObjectId = require('mongoose').Types.ObjectId;

class ConversationController {
    async findAllMessages(req, res, next) {
        try {
            let user = req.body.user
            let messages;

            // Find all messages stored in a specific conversation and visible by user
            if (req.body.isTrashFolder) {
                messages = await messAccessor.findAllDeleted(ObjectId(req.body.convId), user.email);
            } else {
                messages = await messAccessor.findAllNotDeleted(ObjectId(req.body.convId), user.email);
            }
            
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

    async delete(req, res, next) {
        try {
            let convIds = req.body.convIds.map(ObjectId);
            let convs = await convAccessor.findAllByIds(convIds);

            for (let i = 0; i < convs.length; i++) {
                // Change the reference from source folder to destination folder (trash folder)
                let index = convs[i].folders.indexOf(ObjectId(req.body.currentFolderId));
                convs[i].folders[index] = ObjectId(req.body.trashFolderId);
                await convs[i].save();
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
            let convIds = req.body.convIds.map(ObjectId);
            let convs = await convAccessor.findAllByIds(convIds);
            
            for (let i = 0; i < convs.length; i++) {
                if (convs[i].folders.length > 1) {
                    // This doesn't really delete conversation permanently
                    // It only deletes the reference between the conversation and the trash folder of user
                    let index = convs[i].folders.indexOf(ObjectId(req.body.trashFolderId));
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

    async move(req, res, next) {
        try {
            let convIds = req.body.convIds.map(ObjectId);
            let convs = await convAccessor.findAllByIds(convIds);

            for (let i = 0; i < convs.length; i++) {
                let index = convs[i].folders.indexOf(ObjectId(req.body.srcFolderId));
                convs[i].folders[index] = ObjectId(req.body.desFolderId);
                await convs[i].save();
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
}

module.exports = new ConversationController();
