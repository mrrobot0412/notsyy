const express= require("express");
const router= express.Router();
const folderController=require('../controllers/notebook/folder');
const upload=require('../config/multer');

router.post('/',upload('./uploads/coverImages'),folderController.createFolder);//working fine
router.get('/',folderController.getAllFolders); //working fine
router.get('/:id',folderController.getFolderById);//working fine
router.delete('/:id',folderController.deleteFolder);//working fine

module.exports=router;