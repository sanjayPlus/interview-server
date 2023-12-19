//express server
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const data = require('./data');
//middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));

mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("Connected to DB");
})

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String

});
const User = mongoose.model("User",userSchema);
const userAuth = (req,res,next)=>{
    const token = req.headers["x-access-token"];
    if(!token){
        return res.status(400).send("Token not found");
    }
    try {
        const decoded = jwt.verify(token,"secret");
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(400).send("Invalid Token");
    }
}

app.get("/",async(req,res)=>{
    res.send("Hello World");
})
app.post("/register",async(req,res)=>{
    try {
        
        const {name,email,password} = req.body;
        //validate
        if(!name || !email || !password){
            return res.status(400).send("All fields are required");
        }
        //check if user already exists
        const user = User.findOne({email});
        if(user){
            return res.status(400).send("User already exists");
        }
        //create user
        const newUser = new User({name,email,password});
        await newUser.save();
        res.status(200).send("User created");
    } catch (error) {
        res.status(500).send(error);
    }
})
app.post("/login",async(req,res)=>{
    try {
        const {email,password} = req.body;
        //validate
        if(!email || !password){
            return res.status(400).send("All fields are required");
        }
        //check if user already exists
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).send("User does not exists");
        }
        //check password
        if(user.password !== password){
            return res.status(400).send("Invalid Credentials");
        }
        res.status(200).send("User logged in");
    } catch (error) {
        res.status(500).send(error);
    }
})
app.get("/users",userAuth,async(req,res)=>{
    const userId = req.user.id;
    const users = await User.findById(userId);
    res.status(200).send(users);
})
app.get("/items",async(req,res)=>{
    res.status(200).json(data);
})
app.get("/protected",userAuth,async(req,res)=>{
    res.status(200).json({message:"This is protected route"});
})

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})