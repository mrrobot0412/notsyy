const express=require('express')
const router=express.Router();
const topicController=require('../controllers/topic/topic');
const upload=require('../config/multer');

router.post('/',upload('./uploads/coverImages'),topicController.createTopic);// check error msg for cover image
router.get('/',topicController.getAllTopics);//done
router.get('/:id',topicController.getTopicById);//done
router.delete('/:id',topicController.deleteTopic);//error while deleting  connected graphs

module.exports=router;