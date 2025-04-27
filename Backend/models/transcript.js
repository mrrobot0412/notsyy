const mongoose=require('mongoose')

const transciptSchema=new mongoose.Schema({
    videoID:{
        type:String,
        required:true,
        // unique:true
    },
    transcript:{
        type:String,
        required:true,
    },
    topic:{
        type:String
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }
})
// Create a unique index on videoID and user fields
transciptSchema.index({ videoID: 1, user: 1 }, { unique: true });
module.exports=mongoose.model('Transcript',transciptSchema)