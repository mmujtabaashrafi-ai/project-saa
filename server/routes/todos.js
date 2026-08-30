'use strict';

const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/daily-summary', todoController.getDailySummary);
router.get('/', todoController.getTodos);
router.post('/', todoController.createTodo);
router.patch('/:id', todoController.updateTodo);
router.delete('/completed', todoController.clearCompleted);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
