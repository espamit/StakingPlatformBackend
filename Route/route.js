const express = require('express');
const router = express.Router();
const Staking = require('../Model/StakingSchema');
const Users = require('../Model/model');
const Plan = require('../Model/PlanDetails');
// const authenticateToken = require(../)
const mongoose = require('mongoose');

const userController = require('../Controller/Controller');

router.post('/users', userController.users);

// Route to create a new plan
router.post('/plans', async (req, res) => {
    const { planName, duration, minimumAmount, rewardPercentage } = req.body;

    try {
        // Create a new plan with the provided details
        const plan = new Plan({
            planName,
            duration,
            minimumAmount,
            rewardPercentage
        });

        // Save the new plan to the database
        await plan.save();
        console.log('Plan created successfully:', plan);
        res.status(200).json({ message: 'Plan created successfully', plan });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ message: 'Error creating plan', error });
    }
});


router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find();
        if (plans.length === 0) {
            return res.status(404).json({ message: 'No plans found' });
        }

        res.status(200).json({
            success: true,
            message: 'Plans retrieved successfully',
            data: plans
        });
    } catch (error) {
        console.error('Error retrieving plans:', error);
        res.status(500).json({ message: 'Error retrieving plans', error });
    }
});

router.post('/stake', async (req, res) => {
    try {
        const { userId, planid, amount } = req.body; 

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await Users.findById(userId); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const plan = await Plan.findById(planid);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        if (amount <= plan.minimumAmount) {
            return res.status(400).json({ message: `Minimum staking amount for this plan is ${plan.minimumAmount}` });
        }

        const staking = new Staking({
            userId: userId,
            planId: plan._id,
            planName: plan.planName,
            amountStaked: amount,
            duration: plan.duration,
            rewardPercent: plan.rewardPercentage,
            startDate: new Date(),
            endDate: new Date(Date.now() + plan.duration * 60 * 1000)
        });

        await staking.save();
        res.status(200).json({ message: 'Staking successful', staking });
    } catch (error) {
        console.error('Error during staking:', error.message);
        res.status(500).json({ message: 'Error staking funds', error });
    }
});

router.get('/stake/:userid', async (req, res) => {
    const { userid } = req.params;

    try {
        const user = await Users.findById(userid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all staking records for the user
        const stakedData = await Staking.find({ userId: userid });
        if (stakedData.length === 0) {
            return res.status(404).json({ message: 'No staking data found for this user' });
        }

        // Fetch plan details for each staking record
        const detailedStakings = await Promise.all(
            stakedData.map(async (stake) => {
                try {
                    const planDetail = await Plan.findById(stake.planId);
                    if (!planDetail) {
                        throw new Error('Plan not found');
                    }

                    // Calculate endDate and rewards
                    const endDate = new Date(stake.startDate.getTime() + planDetail.duration * 60 * 1000);
                    const rewardsEarned = (stake.amountStaked * planDetail.rewardPercentage) / 100;

                    return {
                        ...stake.toObject(),
                        planName: planDetail.planName,
                        endDate: endDate,
                        rewardsEarned: rewardsEarned,
                    };
                } catch (error) {
                    console.error(`Error fetching plan details for staking ID ${stake._id}:`, error.message);
                    return null; // Or handle this case as needed
                }
            })
        );

        // Filter out any null results from failed plan fetches
        const validStakings = detailedStakings.filter(stake => stake !== null);

        res.status(200).json({
            message: 'Staking details retrieved successfully',
            stakedData: validStakings
        });
    } catch (error) {
        console.error('Error retrieving staking data:', error.message || error);
        res.status(500).json({ message: 'Error retrieving staking data', error: error.message || error });
    }
});


module.exports = router;
