const express = require('express');
const convRouter = express.Router();
const convController = require('../controllers/conversation');

convRouter.get('/:id', convController.findAllMessages);
convRouter.put('/', convController.delete);
convRouter.delete('/', convController.deletePermanently);

module.exports = convRouter;
