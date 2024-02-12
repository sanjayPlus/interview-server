// express server
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const data = require('./data');
const cors = require("cors");
// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to DB");
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

const userAuth = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) {
        return res.status(400).send("Token not found");
    }
    try {
        const decoded = jwt.verify(token, "secret");
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(400).send("Invalid Token");
    }
};

app.get("/", async (req, res) => {
    res.send("Hello World");
});

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // validate
        if (!name || !email || !password) {
            return res.status(400).send("All fields are required");
        }

        // check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        // create user
        const newUser = new User({ name, email, password });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, "secret");

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // validate
        if (!email || !password) {
            return res.status(400).send("All fields are required");
        }

        // check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send("User does not exist");
        }

        // check password
        if (user.password !== password) {
            return res.status(400).send("Invalid Credentials");
        }

        // create token
        const token = jwt.sign({ id: user._id }, "secret");

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get("/api/users", userAuth, async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    res.status(200).json(user);
});

app.put("/api/update-user", userAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, password } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).send("User does not exist");
        }

        if (name) {
            user.name = name;
        }

        if (password) {
            user.password = password;
        }

        await user.save();
        res.status(200).send("User updated");
    } catch (error) {
        res.status(401).send(error.message);
    }
});

app.delete('/api/delete-user', userAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        await User.findByIdAndDelete(userId);
        res.status(200).send("User deleted");
    } catch (error) {
        res.status(401).send(error.message);
    }
});

app.get("/api/items", (req, res) => {
    res.status(200).json(data);
});

app.get("/api/protected", userAuth, (req, res) => {
    res.status(200).json({ message: "This is a protected route" });
});

app.listen(3001, () => {
    console.log("Server is running on port 3000");
});
