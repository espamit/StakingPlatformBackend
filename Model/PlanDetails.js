const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    duration: {
        type: Number, 
        required: true,
    },
    minimumAmount: {
        type: Number,
        required: true,
    },
    rewardPercentage: {
        type: Number, 
        required: true,
    }
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
