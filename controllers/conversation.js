const jwt = require('jsonwebtoken');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');
const folderAccessor = require('../accessors/folder');

class ConversationController {
    async findAllMessages() {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            // Find all messages stored in a specific conversation and visible by decoded user
            let folderName = req.body.name;
            let folders = await folderAccessor.findAllByUserId(decoded._id);
            let folderNames = folders.map(folder => folder.name.toLowerCase());

            if (folderNames.includes(folderName.toLowerCase())) {
                let convId = req.params.id;
                let messages;

                if (folderName == 'Trash') {
                    messages = await messAccessor.findAllDeleted(convId, decoded._id);
                } else {
                    messages = await messAccessor.findAllNotDeleted(convId, decoded._id);
                }
    
                return res.status(200).json({
                    error: false,
                    message: null,
                    data: messages
                });
            } else {
                return res.status(400).json({
                    error: true,
                    messages: 'Your folder name is invalid',
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

    async delete() {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let sourceFolder = await folderAccessor.findByName(decoded._id, req.body.name);
            let trashFolder = await folderAccessor.findTrash(decoded._id);
            let convs = await convAccessor.findAllByIds(req.body.convIds);

            for (let i = 0; i < convs.length; i++) {
                // Change the reference from source folder to destination folder (trash folder)
                let index = convs[i].folders.indexOf(sourceFolder._id);
                convs[i].folders[index] = trashFolder._id;
                convs[i].save();
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

    async deletePermanently() {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let trashFolder = await folderAccessor.findTrash(decoded._id);
            let convs = await convAccessor.findAllByIds(req.body.convIds);
            
            for (let i = 0; i < convs.length; i++) {
                if (convs[i].folders.length > 1) {
                    // This doesn't really delete conversation permanently
                    // It only deletes the reference between the conversation and the trash folder of user
                    let index = convs[i].folders.indexOf(trashFolder._id);
                    convs[i].folders.splice(index, 1);
                    convs[i].save();
                } else {
                    // Permanently deletes conversations
                    // This also deletes all messages stored in each conversation
                    let messages = await messAccessor.findAll(convs[i]._id);
                    let messageIds = messages.map(message => message._id);

                    for (let i = 0; i < message.length; i++) {
                        messAccessor.deleteAllByIds(messageIds);
                    }

                    convAccessor.delete(convs[i]._id);
                }
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

module.exports = new ConversationController();
