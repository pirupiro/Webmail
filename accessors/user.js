const userModel = require('../models/user');

class UserAccessor {
    findByEmail(email) {
        return userModel.findOne({ email: email });
    }

    findById(id) {
        return userModel.findById(id);
    }

    findAll(ids) {
        return userModel.find({
            _id: {
                $in: ids
            }
        });
    }

    insert(user) {
        return userModel.create(user);
    }

    updateById(id, user) {
        return userModel.findByIdAndUpdate(id, user, { new: true });
    }
}

module.exports = new UserAccessor();
