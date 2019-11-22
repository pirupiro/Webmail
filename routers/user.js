const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/user');

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.post('/profile', userController.editProfile);
userRouter.get('/', userController.findAllUsers);
userRouter.put('/block', userController.blockUser);
userRouter.put('/unblock', userController.unblockUser);

module.exports = userRouter;
