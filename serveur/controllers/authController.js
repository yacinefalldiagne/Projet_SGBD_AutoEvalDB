const user = require('../models/user');
const { hashPassword, comparePassword, hashPassword } = require('../helpers/auth')

const test = (req, res) => {
    res.json("Hello from auth controller");
};

const hashPassword = await hashPassword(password)


const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const exist = await user.findOne({ email });
        if (exist) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await user.create({ name, email, password: hashPassword });
        if (user) {
            return res.status(201).json({ message: "User created successfully" });
        }

    } catch (error) {

    }

}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await user.findOne({ email });
        if (user) {
            return res.json({
                error: 'No user found'
            })
        }

        const match = await comparePassword(password, user.password)
        if (match) {
            res.json('password match')
        }

    } catch (error) {

    }
}


module.exports = {
    test,
    registerUser,
    loginUser,

};