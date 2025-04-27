const {StatusCodes}=require('http-status-codes')
const {CustomAPIError,NotFoundError,BadRequestError}=require('../../errors/index')
const topicModel=require('../../models/topic/topicIndex')   

const getResourceById = async (req, res) => {
    const resourceId = req.params.id;
    const userId = req.user.userId;

    try {
        const resource = await topicModel.Resource.findById(resourceId)
            .lean() // Add this for better performance
            .exec();
        
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }
        const chat =await topicModel.Chat.findOne({resourceId:resourceId});
        // if (!chat) {
        //     throw new NotFoundError('Chat not found for this resource');
        // }

        // Add this debug log
        // console.log('Resource being sent:', resource);
        
        // if (!Array.isArray(resource.source)) {
        //     resource.source = [resource.source]; // Ensure source is always an array
        // }
        
        return res.status(StatusCodes.OK).json({ resource ,chat});
    } catch (error) {
        console.error('Error details:', error);
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Something went wrong' });
    }
};

const deleteResourceById=async(req,res)=>{
    try {
        const resourceId=req.params.id;
        const userId=req.user.userId;

        const resource=await topicModel.Resource.findByIdAndDelete(resourceId);
        if(!resource){
            throw new NotFoundError('Resource not found')
        }
        const chat=await topicModel.Chat.deleteMany({resourceId:resourceId});

    
        return res.status(StatusCodes.OK).json({msg:'Resource and associated chat deleted successfully'})
    } catch (error) {
        if (error instanceof CustomAPIError) {
            return res.status(error.statusCode).json({ msg: error.message });
        }else{
            console.log('Error details in deleting resource:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Something went wrong' });
        }
    }
}

module.exports={
    getResourceById,
    deleteResourceById
   
}