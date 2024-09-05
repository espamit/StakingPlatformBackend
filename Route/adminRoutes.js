const express = require('express');
const router = express.Router();

const adminController = require('../Controller/adminController');

const stakingModel = require('../Model/StakingSchema')

router.post('/admin', adminController.admin);


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

router.get('/stake', async (req, res) => {
    try {
        console.log('api call sdfjsdjs')
        let staking = await stakingModel.find()
        if(staking.length > 0){
            return res.status(200).send({success: true, message:  'Staking details retrieved successfully', staking})
        }else{
            return res.status(200).send({success: true, message:  'No data found'})
        }

    } catch (error) {
        console.error('Error retrieving staking data:', error.message || error);
        res.status(500).json({ message: 'Error retrieving staking data', error: error.message || error });
    }
});



module.exports = router;
