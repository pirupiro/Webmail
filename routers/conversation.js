const express = require('express');
const convRouter = express.Router();
const convController = require('../controllers/conversation');

convRouter.get('/', convController.findAllMessages);
convRouter.put('/', convController.delete);
convRouter.delete('/', convController.deletePermanently);
convRouter.put('/move', convController.move);

module.exports = convRouter;
