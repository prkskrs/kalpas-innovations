// Import Model
import User from "../models/User.js"
import axios from "axios"
import fast2sms from "fast-two-sms"
import { cookieToken } from "../utils/cookieToken.js";
import otpGenerator from "otp-generator";

// Making Promise
import bigPromise from "../middlewares/bigPromise.js"


export const signUp = bigPromise(async(req,res,next)=>{
    const {name,password,phoneNumber}=req.body;
    if((!name) || (!phoneNumber) || (!password)){
        return res.status(400).json({
            success:false,
            message:"All fields are required!"
        })
    }

    // check existing user
    const existingUser = await User.findOne({phoneNumber:phoneNumber})
    if(existingUser){
        return res.status(501).json({
            success:true,
            message:"User Already Exists !",
        })
    }
    else{
        // generate 6 digit OTP
         const otp = otpGenerator.generate(6, {
            digits:true,
            lowerCaseAlphabets:false,
            upperCaseAlphabets: false,
            specialChars: false,
        });
        // console.log(otp)

        // Fast-Two-sms config
        var options={
            authorization:process.env.FAST_2_SMS_API_KEY,
            message:`Dear ${name}, your OTP for registration is ${otp}. Use this otp to validate your login.`,
            numbers:[phoneNumber]
        }
        
        fast2sms.sendMessage(options)
        .then((response)=>{
            // console.log("He")
            console.log(response)
        })
        .catch((error)=>{
            console.log(error) 
        })

        const user = await User.create({
            name,
            password,
            phoneNumber,
            status: "PENDING",
            otp:otp
        })

        cookieToken(user,res,"Otp Sent Successfully!");

    }


})

export const verifyOtp = bigPromise(async(req,res,next)=>{
    const {phoneNumber, enteredOtp} = req.body;
    // console.log(req.body)

    const user = await User.findOne({phoneNumber:phoneNumber})
    // console.log(user)
    
    if(!enteredOtp){
        return res.status(411).json({
            success:false,
            message:"Enter otp to verify!"
        })
    }
    
    if(enteredOtp===user.otp){
        await User.updateOne(
            { phoneNumber: phoneNumber},
            { $set: { status: "VERIFIED" }})
        
        return res.status(200).json({
            success:true,
            message:`Account Verified ! Now, Please Login.`
        })
    }

    else{
        return res.status(411).json({
            success:false,
            message:`You've entered wrong otp.`
        })
    }

});


export const login = bigPromise(async(req,res,next)=>{
    const {phoneNumber,upassword}=req.body;
    if(!phoneNumber & !upassword){
        return res.status(401).json({
            success:false,
            message:"phoneNumber and Password are required to login!"
        })
    }
    const foundUser = await User.findOne({phoneNumber:phoneNumber})

    if(!foundUser){
        return res.status(401).json({
            success:false,
            message:"User not found with this phoneNumber!"
        })
    }
    const isMatch = await foundUser.isValidatedPassword(upassword,foundUser.password)

    if(!isMatch){
        return res.status(401).json({
            success:false,
            message:"Password is incorrect!"
        })
    }

    cookieToken(foundUser,res,"Loggined Successfully!")
})