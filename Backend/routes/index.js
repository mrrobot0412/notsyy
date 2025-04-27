const express=require('express')
const router=express.Router();

const folderRouter=require('./folder');
const topicRouter=require('./topic');
const uploadRouter=require('./upload');
const resourceRouter=require('./resource');
const chatRouter=require('./chat')
const revisionNotesRouter=require('./revisionNotes')
const flashcardsRouter=require('./flashcards')

router.use('/folder',folderRouter);
router.use('/topic',topicRouter);
router.use('/upload',uploadRouter);
router.use('/resource',resourceRouter);
router.use('/chat',chatRouter);

router.use('/revisionNotes',revisionNotesRouter);
router.use('/flashcards',flashcardsRouter);


module.exports=router;