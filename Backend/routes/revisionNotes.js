const express = require('express');
const router = express.Router();
const { createRevisionNotes, getRevisionNotes } = require('../controllers/topic/revisionNotes');

router.post('/', createRevisionNotes);
router.get('/', getRevisionNotes); // Changed to GET

module.exports = router;