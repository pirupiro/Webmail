const userModel = require('../models/user');

class UserAccessor {
    findByEmail(email) {
        return userModel.findOne({ email: email });
    }

    findById(id) {
        return userModel.findById(id);
    }

    findAllByIds(ids) {
        return userModel.find({
            _id: {
                $in: ids
            }
        });
    }

    findAll() {
        return userModel.find();
    }

    insert(user) {
        return userModel.create(user);
    }

    updateById(id, user) {
        return userModel.findByIdAndUpdate(id, user, { new: true });
    }

    block(id) {
        return userModel.findByIdAndUpdate(id, { isBlocked: !isBlocked });
    }
}

module.exports = new UserAccessor();
