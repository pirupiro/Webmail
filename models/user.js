const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        trim: true
    },
    birthday: Date,
    gender: String,
    phone: String,
    isBlocked: {
        type: Boolean,
        default: false
    },
<<<<<<< HEAD
    isBlocked:{
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
=======
    isAdmin: {
        type: Boolean,
        default: false
    }
>>>>>>> e7171b854f20c85a980e6a03255ce935012df2e3
});

module.exports = mongoose.model('User', userSchema);
