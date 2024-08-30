const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    walletAddress: {
        type: String,
        required: true,
        trim: true,
        unique:true
    }
}, { timestamps: true });

const users = mongoose.model('users', usersSchema);

module.exports = users;

