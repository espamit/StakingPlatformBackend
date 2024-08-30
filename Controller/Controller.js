const usersModel = require('../Model/model');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'qwertyui';

exports.users = async (req, res) => {
    try {
        const { username, password, walletAddress } = req.body;

        console.log(req.body);

        // Find the user by walletAddress
        let data = await usersModel.findOne({ walletAddress });

        if (data) {
            // Check if the username and password match
            if (data.username === username && data.password === password) {
                
                // Generate a JWT token
                const token = jwt.sign({ id: data._id, walletAddress: data.walletAddress }, JWT_SECRET, { expiresIn: '1h' });

                // Convert Mongoose document to a plain object and omit internal fields
                const userData = data.toObject();
                delete userData.password; // Remove sensitive data
                delete userData.__v;      // Remove version key
                delete userData.createdAt;
                delete userData.updatedAt;
                delete userData.__v;

                // Return success response with token and user data
                return res.status(200).send({ 
                    success: true, 
                    msg: 'User details', 
                    data: { ...userData, token }
                });
            } else {
                // Return error if username or password is incorrect
                return res.status(401).send({ success: false, msg: 'Invalid username or password' });
            }
        } else {
            // If user does not exist, create a new user
            let createUser = new usersModel({ username, password, walletAddress });
            await createUser.save();
            
            // Generate a JWT token for the newly created user
            const token = jwt.sign({ id: createUser._id, walletAddress: createUser.walletAddress }, JWT_SECRET, { expiresIn: '1h' });

            // Convert Mongoose document to a plain object and omit internal fields
            const newUserData = createUser.toObject();
            delete newUserData.password; // Remove sensitive data
            delete newUserData.__v;      // Remove version key
            delete newUserData.createdAt;
            delete newUserData.updatedAt;

            // Return success response with token and new user data
            return res.status(200).send({ 
                success: true, 
                msg: 'Registered successfully', 
                data: { ...newUserData, token }
            });
        }
    } catch (error) {
        console.error(error); // Added: log the error for debugging purposes
        return res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
};;
