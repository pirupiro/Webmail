const jwt = require('jsonwebtoken');
const convAccessor = require('../accessors/conversation');
const messAccessor = require('../accessors/message');

class ConversationController {
    async findAllMessages() {
        try {
            let messages = await messAccessor.findAll(req.params.id);
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
}

module.exports = new ConversationController();
