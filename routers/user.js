const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/user');

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/profile', userController.viewProfile);
userRouter.post('/profile', userController.changeProfile);
userRouter.get('/', userController.findAllUsers);
userRouter.put('/block', userController.blockOrUnblockUser);

module.exports = userRouter;
