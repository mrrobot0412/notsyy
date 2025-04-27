const express= require("express");
const router= express.Router();
const folderController=require('../controllers/topic/resources');
// const upload=require('../config/multer');

// router.post('/',upload('./uploads/coverImages'),folderController.createFolder);
// router.get('/',folderController.getAllFolders);
router.get('/:id',folderController.getResourceById);
router.delete('/:id',folderController.deleteResourceById);

module.exports=router;