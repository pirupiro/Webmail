const bcrypt = require('bcrypt');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');

class UserController {
    /*
    *   User Region
    */
    async register(req, res, next) {
        try {
            let pattern = /^[a-z_]+@piru\.com$/;

            if (!pattern.test(req.body.email)) {
                return res.status(200).json({
                    error: true,
                    message: 'Email is invalid',
                    data: null
                });              
            }
            
            const userData = {
                email: req.body.email,
                password: req.body.password,
                name: req.body.name,
                birthday: req.body.birthday,
                gender: req.body.gender,
                phone: req.body.phone
            };
            
            let queryUser = await userAccessor.findByEmail(userData.email);

            if (!queryUser) {
                // Hash password before saving to database
                userData.password = await bcrypt.hash(userData.password, 10);
                let user = await userAccessor.insert(userData);
                
                let folders = await Promise.all([
                    folderAccessor.insert(user._id, 'Inbox'),
                    folderAccessor.insert(user._id, 'Sent'),
                    folderAccessor.insert(user._id, 'Trash'),
                    folderAccessor.insert(user._id, 'Spam'),
                    folderAccessor.insert(user._id, 'Drafts')
                ]);

                const draftsConv = {
                    folders: [folders[4]._id]  // Drafts folder
                };

                await convAccessor.insert(draftsConv);

                return res.status(200).json({
                    error: false,
                    message: user.email + ' successfully registered',
                    data: null
                });
            } else {
                return res.status(200).json({
                    error: true,
                    message: 'Account has already existed',
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

    async login(req, res, next) {
        try {
            let user = await userAccessor.findByEmail(req.body.email);

            if (user) {
                if (user.isBlocked) {
                    return res.status(200).json({
                        error: true,
                        message: 'Your account is blocked',
                        data: null
                    });
                } else if (bcrypt.compareSync(req.body.password, user.password)) {
                    const userData = {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        birthday: user.birthday,
                        gender: user.gender,
                        phone: user.phone,
                        isAdmin: user.isAdmin
                    };

                    let folders = await folderAccessor.findAllByUserId(user._id);
                    let subsetFolders = folders.map(folder => ({
                        _id: folder._id,
                        name: folder.name
                    }));
    
                    return res.status(200).json({
                        error: false,
                        message: null,
                        data: {
                            user: userData,
                            folders: subsetFolders
                        }
                    });
                } else {
                    return res.status(200).json({
                        error: true,
                        message: 'Wrong password',
                        data: null
                    });
                }
            } else {
                return res.status(200).json({
                    error: true,
                    message: 'Account does not exist',
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

    async editProfile(req, res, next) {
        try {
            let user = req.body.user;

            let userData = {
                name: req.body.name,
                birthday: req.body.birthday,
                gender: req.body.gender,
                phone: req.body.phone
            };

            if (req.body.changePassword) {
                if (req.body.newPassword == req.body.reNewPassword) {
                    userData.password = await bcrypt.hash(req.body.newPassword, 10);
                } else {
                    return res.status(200).json({
                        error: true,
                        message: 'Password mismatch',
                        data: null
                    });
                }
            }

            let updatedUser = await userAccessor.updateByEmail(user.email, userData);
            let subset = ({ name, birthday, gender, phone }) => ({ name, birthday, gender, phone });
            
            return res.status(200).json({
                error: false,
                message: 'Profile changed successfully',
                data: subset(updatedUser)
            });
        }
        catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    /*
    *   Admin Region
    */
    async findAllUsers(req, res, next) {
        try {
            let user = req.body.user;

            if (user.isAdmin) {
                let users = await userAccessor.findAll();
                let subset = ({ email, name, birthday, gender, phone, isBlocked }) => ({ email, name, birthday, gender, phone, isBlocked });

                return res.status(200).json({
                    error: false,
                    message: null,
                    data: subset(users)
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: 'You are not authorized to view this information',
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

    async blockUser(req, res, next) {
        try {
            let user = req.body.user;

            if (user.isAdmin) {
                await userAccessor.block(req.body.email);

                return res.status(200).json({
                    error: false,
                    message: req.body.email + ' account is blocked',
                    data: null
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: 'You are not authorized to do this',
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

    async unblockUser(req, res, next) {
        try {
            let user = req.body.user;

            if (user.isAdmin) {
                await userAccessor.unblock(req.body.email);

                return res.status(200).json({
                    error: false,
                    message: req.body.email + ' account unblocked',
                    data: null
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: 'You are not authorized to do this',
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

module.exports = new UserController();
