const express = require('express');
const router = express.Router();
const { createRequest, getRequests, getRequestById } = require('../controllers/requestController');

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);

module.exports = router;