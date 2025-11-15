const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/auth');

const userController = new UserController();

// Public create
router.post('/', userController.createUser.bind(userController));

// Profile endpoints (require authentication)
router.get('/me', verifyToken, userController.getMe.bind(userController));
router.put('/me', verifyToken, userController.updateMe.bind(userController));
router.post('/me/change-password', verifyToken, userController.changePassword.bind(userController));

// Admin / generic CRUD (keep existing)
router.get('/:id', userController.getUser.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

module.exports = router;