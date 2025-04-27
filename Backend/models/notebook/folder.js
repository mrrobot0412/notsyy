const mongoose =require('mongoose')

const folderSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please provide folder name'],
        maxLength:20
    },
    path:{
        type:String,
        // required:true,
        unique:true
    },
    path:{
        type:String,
        // required:true,
        unique:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true})

module.exports=mongoose.model('Folder',folderSchema)