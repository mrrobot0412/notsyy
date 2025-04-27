const express = require('express');
const router = express.Router();
const { createFlashcards,getFlashcards } = require('../controllers/topic/flashcards');

// Route to create flashcards
router.post('/',  createFlashcards);
router.get('/', getFlashcards);

module.exports = router;