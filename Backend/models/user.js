const mongoose = require('mongoose')
const bCrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
    minLength: 3,
    maxLength: 50
  },
  email: {
    type: String,
    required: [true, 'please provide email'],
    match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'plz provide email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'please provide password'],
    minLength: 6
  }
}, { timestamps: true })



//used to hash the password before saving
userSchema.pre('save',async function(){
    if(!this.isModified('password'))return ;
    const salt =await bCrypt.genSalt(10);
    this.password=await bCrypt.hash(this.password,salt)
})

userSchema.methods.createJWT = function() {
  return jwt.sign(
    { userId: this._id, name: this.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  )
}

userSchema.methods.comparePassword = async function(password) {
  const isMatch = await bCrypt.compare(password, this.password)
  return isMatch
}

module.exports = mongoose.model('User', userSchema)