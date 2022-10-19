// Import Dependencies
import mongoose  from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        maxlength:[40,'Name should be under 40 characters.']
    },
    password:{
        type:String,
        required:true,
        minlength:[6,"Password should be of atleast 6 characters."],
        // select:false  // so that password will not go with model , we don't have to do user.password=undefined
    },
    phoneNumber:{
        type:Number,
        required:true
    },
    otp:{
        type:String
    },
    status: {
        type: String,
        required: true,
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date
},
{
    timestamps:true
})

// encrypt password before save
userSchema.pre('save',async function(next) {
    if (!this.isModified('password')){
        return next();
    } 
    this.password=await bcrypt.hash(this.password,10)
})

// validate the password with passed on user password
userSchema.methods.isValidatedPassword= async function(usersendPassword, password){
    return await bcrypt.compare(usersendPassword,password);
}

// create and return jwt token
userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRY
    })
}

// generate forget password token (string)
userSchema.methods.getForgotPasswordToken = function(){
    // generate a long and random string
    const forgotToken = crypto.randomBytes(20).toString("hex");

    // getting a hash - make sure to get a hash on backend
    this.forgotPasswordToken=crypto.createHash("sha256").update(forgotToken).digest("hex")

    // time of token
    this.forgotPasswordExpiry=Date.now()+20*60*1000;  // 20 mins to expire password reset token

    return forgotToken;
}

const User = mongoose.model("User",userSchema);
export default User;