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
        console.log(req.body)
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("qwertyui" , planid);

        const plan = await Plan.findById(planid);
        console.log("qwertyui" , plan);
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
        console.log("Staking succesfull");
        res.status(200).json({ message: 'Staking successful', staking });
    } catch (error) {
        console.error('Error during staking:', error.message);
        res.status(500).json({ message: 'Error staking funds', error });
    }
});

router.post('/update-stake', async (req, res) => {
    console.log("/update-stake");
    try {
        const { stakingId, amount } = req.body;
        console.log("check", req.body);

        if (!stakingId) {
            return res.status(400).json({ message: 'Staking ID is required' });
        }

        if (amount === undefined) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        // Find the existing staking record
        const staking = await Staking.findById(stakingId);
        if (!staking) {
            return res.status(404).json({ message: 'Staking record not found' });
        }

        // Find the plan associated with this staking
        const plan = await Plan.findById(staking.planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Update the staking record
        // if (amount === 'full') {
        //     // Set amount to 0 if unstaking the full amount
        //     staking.amountStaked = 0;
        // } else {
        //     // Update the staking amount
        //     staking.amountStaked = amount;
        // }

        // Update endDate based on the staking plan's duration
        const createdAt = new Date(staking.createdAt); // Ensure this is a Date object
        const durationInMinutes = plan.duration || 0;
        staking.endDate = new Date(createdAt.getTime() + durationInMinutes * 60 * 1000);

        staking.isUnstaked = true;

        await staking.save();
        res.status(200).json({ message: 'Staking details updated successfully', staking });
    } catch (error) {
        console.error('Error during staking update:', error.message || error);
        res.status(500).json({ message: 'Error updating staking details', error: error.message || error });
    }
});


router.get('/stake/:userid', async (req, res) => {
    const { userid } = req.params;
    try {
        const user = await Users.findById(userid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stakedData = await Staking.find({ userId: userid });
        if (stakedData.length === 0) {
            return res.status(404).json({ message: 'No staking data found for this user' });
        }
        const detailedStakings = await Promise.all(
            stakedData.map(async (stake) => {
                try {
                    const planDetail = await Plan.findById(stake.planId);
                    if (!planDetail) {
                        throw new Error('Plan not found');
                    }

                    const createdAt = new Date(stake.createdAt); // Ensure this is a Date object
                    const durationInMinutes = planDetail.duration || 0;
                    const endDate = new Date(createdAt.getTime() + durationInMinutes * 60 * 1000);

                    // Ensure amounts and percentages are numbers
                    const amountStaked = parseFloat(stake.amountStaked) || 0;
                    const rewardPercentage = parseFloat(planDetail.rewardPercentage) || 0;
                    const rewardsEarned = (amountStaked * rewardPercentage) / 100;

                    return {
                        ...stake.toObject(),
                        planName: planDetail.planName,
                        endDate,
                        rewardsEarned,
                    };
                } catch (error) {
                    console.error(`Error fetching plan details for staking ID ${stake._id}:`, error.message);
                    // Return a default or null value in case of error
                    return {
                        ...stake.toObject(),
                        planName: 'Unknown',
                        endDate: null,
                        rewardsEarned: 0,
                    };
                }
            })
        );


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

router.post('/claim-rewards', async (req, res) => {
    console.log("/claim-rewards");
    try {
        const { stakeId } = req.body;

        if (!stakeId) {
            return res.status(400).json({ message: 'Stake ID is required' });
        }

        // Find the existing staking record
        const staking = await Staking.findById(stakeId);
        if (!staking) {
            return res.status(404).json({ message: 'Staking record not found' });
        }

        // Check if rewards have already been claimed
        if (staking.isRewardClaimed) {
            return res.status(400).json({ message: 'Rewards already claimed for this stake' });
        }

        if (staking.totalClaimedRewards) {
            return res.status(400).json({ message: "No record found"})
        }

        // Calculate the rewards (example: rewardPercentage * amountStaked)
        const plan = await Plan.findById(staking.planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        const reward = (staking.amountStaked * plan.rewardPercentage) / 100;

        // Mark rewards as claimed
        staking.isRewardClaimed = true;

        await staking.save();

        res.status(200).json({ message: 'Rewards claimed successfully', claimedAmount: reward });
    } catch (error) {
        console.error('Error during reward claim:', error.message);
        res.status(500).json({ message: 'Error claiming rewards', error });
    }
});





module.exports = router;
