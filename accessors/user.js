const userModel = require('../models/user');

class UserAccessor {
    getByEmail(email) {
        return userModel.findOne({ email: email });
    }

    getById(id) {
        return userModel.findById(id);
    }

    insertUser(user) {
        return userModel.create(user);
    }
}

module.exports = new UserAccessor();
