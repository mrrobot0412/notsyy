const {StatusCodes}=require('http-status-codes');
const { CustomAPIError,UnauthenticatedError,NotFoundError,BadRequestError}=require('../../errors/index');
const folder = require('../../models/notebook/folder');
const topicModel=require('../../models/topic/topicIndex')


const createFolder = async (req, res) => {
    const name = req.body.name;
    const userId = req.user.userId;
    try {
        if (!req.files || !req.files['coverImage']) {
            throw new BadRequestError('please provide folder image');
        }
        // Fix the image path
        const imagePath = `/uploads/coverImages/${req.files['coverImage'][0].filename}`;

        const newFolder = await folder.findOne({ name: name, userId: userId });
        if (newFolder) {
            throw new BadRequestError('folder already exists');
        }
        const folderData = await folder.create({
            name: name,
            path: imagePath,
            userId: userId
        });
        return res.status(StatusCodes.CREATED).json({
            msg: 'folder created',
            folder: folderData
        });
    } catch (error) {
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'internal server error'});
    }
}

const getFolderById=async(req,res)=>{
    const folderId=req.params.id;
    const userId=req.user.userId;
    try {
        const folderData=await folder.findOne({_id:folderId,userId:userId});
        const topics=await topicModel.Topic.find({folderId:folderId});
        if(!folderData){
            throw new NotFoundError('folder not found');
        }
        return res.status(StatusCodes.OK).json({msg:'folder found',folder:folderData,topics});
    } catch (error) {
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'internal server error'});
    }
}
const getAllFolders=async(req,res)=>{
    const userId=req.user.userId;
    try {
        const folders=await folder.find({userId:userId}).sort({createdAt:-1});
        if(folders.length===0){
            // return res.status(StatusCodes.NOT_FOUND).json({msg:'no folders found'});
            throw new NotFoundError('no folders found');
        }
        return res.status(StatusCodes.OK).json({
            msg:'all folders',
            count:folders.length,
            folders:folders
        });
    } catch (error) {
        if(error instanceof CustomAPIError){
            return res.status(error.statusCode).json({msg:error.message});
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'internal server error'});
    }
}

const deleteFolder = async (req, res) => {
    console.log('hii');
    const folderId = req.params.id; // If using path params
    const userId = req.user.userId;

    try {
        // 1. Verify folder exists
        console.log(folderId);
        const folderToDelete = await folder.findOne({ _id: folderId, userId });
        if (!folderToDelete) {
            throw new NotFoundError('Folder not found');
        }

        // 2. Get all topics in this folder
        const topicsInFolder = await topicModel.Topic.find({ folderId });

        // 3. Extract topic IDs
        const topicIds = topicsInFolder.map(t => t._id);

        // 4. Delete ALL related data safely
        const deletionResults = await Promise.all([
            folder.deleteOne({ _id: folderId, userId }),
            topicModel.Topic.deleteMany({ folderId }),
            
            topicModel.Resource.deleteMany({ topicId: { $in: topicIds } }),
            topicModel.Chat.deleteMany({ topicId: { $in: topicIds } }),
            topicModel.Flashcard.deleteMany({ topicId: { $in: topicIds } }),
        ]);

        console.log('Deletion Results:', deletionResults);
        // const folders=await folder.find({userId:userId}).sort({createdAt:-1});
        const folders=await folder.find({userId:userId}).sort({createdAt:-1});

        return res.status(StatusCodes.OK).json({
            message: 'Folder and all related content deleted successfully',
            folders:folders
        });
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'An error occurred while deleting the folder',
            error: error.message,
        });
    }
};


module.exports={
    createFolder,
    getAllFolders,
    deleteFolder,
    getFolderById
}
