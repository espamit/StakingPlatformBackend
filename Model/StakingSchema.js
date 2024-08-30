const mongoose = require('mongoose');

const stakingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Reference to User model
        required: true,
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan', // Reference to Plan model
        required: true,
    },
    amountStaked: {
        type: Number,
        required: true,
    },
    isRewardClaimed: {
        type: Boolean,
        default: false,
    },
    isUnstaked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Staking = mongoose.model('Staking', stakingSchema);

module.exports = Staking;
