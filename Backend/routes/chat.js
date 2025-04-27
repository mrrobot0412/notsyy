const express= require("express");
const router= express.Router();
const chatController=require('../controllers/chat');
// const upload=require('../config/multer');

router.post('/',chatController.chat);
// router.get('/',folderController.getAllFolders);
// router.get('/:id',chatController.getChat);
// router.delete('/:id',folderController.deleteFolder);

module.exports=router;