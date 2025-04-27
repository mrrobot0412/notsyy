// const topic=require('../../models/topic')
const {StatusCodes}=require('http-status-codes')
const {CustomAPIError,NotFoundError,BadRequestError}=require('../../errors/index')
const topicModel=require('../../models/topic/topicIndex')
const Graph=require('../../models/notebook/graph')

const createTopic=async(req,res)=>{
  console.log('hi')
    const userId=req.user.userId;
    const {folderId,topic}=req.body;
    try {
      
      const topicExist=await topicModel.Topic.findOne({title:topic,folderId,userId})
      if(topicExist){
        throw new BadRequestError('Topic already exists')
      }

      const imagePath=`/uploads/coverImages/${req.files['coverImage'][0].filename}`;

      const newTopic =await topicModel.Topic.create({title:topic,path:imagePath,folderId:folderId,userId:userId});
      // console.log('hi')
        res.status(StatusCodes.CREATED).json({newTopic});
            
    } catch (error) {
        if(error instanceof CustomAPIError){
            res.status(error.statusCode).json({msg:error.message})
        }else{
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'Something went wrong'})
        }
    }
}

const getTopicById=async(req,res)=>{
    const userId=req.user.userId;
    const topicId=req.params.id;
    try {
        // const topic=await topicModel.Topic.findOne({userId,topicId});
        const topic=await topicModel.Topic.findById(topicId)
        if(!topic){
            throw new NotFoundError('Topic not found')
        }
        const resources=await topicModel.Resource.find({topicId});
        res.status(StatusCodes.OK).json({topic,resources})
    } catch (error) {
        if(error instanceof CustomAPIError){
            res.status(error.statusCode).json({msg:error.message})
        }else{
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'Something went wrong'})
        }
    }
}
const getAllTopics=async(req,res)=>{
    const userId=req.user.userId;
    const {folderId}=req.body;
    try {
        const topics=await topicModel.Topic.find({userId,folderId});
        if(!topics){
            throw new NotFoundError('No topics found')
        }
        res.status(StatusCodes.OK).json({length:topics.length,topics})
    } catch (error) {
        if(error instanceof CustomAPIError){
            res.status(error.statusCode).json({msg:error.message})
        }else{
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'Something went wrong'})
        }
    }
}
const deleteTopic = async (req, res) => {
    const userId = req.user.userId;
    const topicId = req.params.id;
    const folderId=req.body.folderId;
  
    try {
      console.log('before 1')
      // 1. Verify that the topic exists and belongs to the user
      const topicToDelete = await topicModel.Topic.findOne({ _id: topicId, userId });
      if (!topicToDelete) {
        throw new NotFoundError('Topic not found');
      }
  
      console.log('before 2')
      // 2. Delete the topic itself
      await topicToDelete.deleteOne();
  
      console.log('before 3')
      // 3. Cascade deletion:
      await Promise.all([
        // Delete all Resources related to this topic
        topicModel.Resource.deleteMany({ topicId }),
        // Delete all Chats related to this topic
        topicModel.Chat.deleteMany({ topicId }),
        // Delete all Flashcards related to this topic
        topicModel.Flashcard.deleteMany({ topicId })
      ]);
console.log('before 4')
      // 4. Update the Graph collection to remove nodes and edges related to this topic
      // await Graph.updateMany(
      //   { userId },
      //   {
      //     $pull: {
      //       nodes: { nodeId: topicId },
      //       edges: {
      //         $or: [
      //           { source: topicId },
      //           { target: topicId }
      //         ]
      //       }
      //     }
      //   }
      // );
      const topics=await topicModel.Topic.find({userId,folderId});

      return res.status(StatusCodes.OK).json({ msg: 'Topic and all related content deleted successfully',topics });
    } catch (error) {
      if (error instanceof CustomAPIError) {
        return res.status(error.statusCode).json({ msg: error.message });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Internal server error' });
    }
  };

  module.exports={
    createTopic,
    getAllTopics,
    deleteTopic,
    getTopicById
  }