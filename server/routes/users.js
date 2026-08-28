const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);

module.exports = router;
