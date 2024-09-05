const adminModel = require('../Model/adminModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'qwertyui';

// Controller function to authenticate or create admin users
exports.admin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username and password were provided
        if (!username || !password) {
            return res.status(400).send({ success: false, msg: 'Username and password are required' });
        }

        // Find the admin by username
        const data = await adminModel.findOne({ username });

        if (!data) {
            // If admin does not exist, create a new admin
            const createAdmin = new adminModel({ username, password });
            await createAdmin.save();

            // Generate a JWT token for the newly created admin
            const token = jwt.sign({ id: createAdmin._id }, JWT_SECRET, { expiresIn: '1h' });

            // Convert Mongoose document to a plain object and omit internal fields
            const newAdminData = createAdmin.toObject();
            delete newAdminData.password; // Remove sensitive data
            delete newAdminData.__v;      // Remove version key
            delete newAdminData.createdAt;
            delete newAdminData.updatedAt;

            // Return success response with token and new admin data
            return res.status(200).send({
                success: true,
                msg: 'Admin registered successfully',
                data: { ...newAdminData, token }
            });
        }

        // Check if the password matches for an existing admin
        if (data.password !== password) {
            return res.status(401).send({ success: false, msg: 'Invalid username or password' });
        }

        // Generate a JWT token for the existing admin
        const token = jwt.sign({ id: data._id }, JWT_SECRET, { expiresIn: '1h' });

        // Convert Mongoose document to a plain object and omit internal fields
        const adminData = data.toObject();
        delete adminData.password; // Remove sensitive data
        delete adminData.__v;      // Remove version key
        delete adminData.createdAt;
        delete adminData.updatedAt;

        // Return success response with token and admin data
        return res.status(200).send({
            success: true,
            msg: 'Admin authenticated successfully',
            data: { ...adminData, token }
        });

    } catch (error) {
        console.error("Error in admin controller:", error);
        return res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
};
