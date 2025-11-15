const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

router.get('/stats', verifyToken, isAdmin, adminController.stats.bind(adminController));
router.get('/users', verifyToken, isAdmin, adminController.listUsers.bind(adminController));
router.post('/users', verifyToken, isAdmin, adminController.createUser.bind(adminController));
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser.bind(adminController));
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser.bind(adminController));
router.get('/businesses', verifyToken, isAdmin, adminController.listBusinesses.bind(adminController));
router.post('/businesses/:id/approve', verifyToken, isAdmin, adminController.approveBusiness.bind(adminController));
router.post('/businesses', verifyToken, isAdmin, adminController.createBusiness ? adminController.createBusiness.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));
router.put('/businesses/:id', verifyToken, isAdmin, adminController.updateBusiness ? adminController.updateBusiness.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));
router.delete('/businesses/:id', verifyToken, isAdmin, adminController.deleteBusiness ? adminController.deleteBusiness.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));

// Vouchers admin CRUD
router.get('/vouchers', verifyToken, isAdmin, adminController.listVouchers ? adminController.listVouchers.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));
router.post('/vouchers', verifyToken, isAdmin, adminController.createVoucher ? adminController.createVoucher.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));
router.put('/vouchers/:id', verifyToken, isAdmin, adminController.updateVoucher ? adminController.updateVoucher.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));
router.delete('/vouchers/:id', verifyToken, isAdmin, adminController.deleteVoucher ? adminController.deleteVoucher.bind(adminController) : (req,res)=>res.status(501).json({message:'Not implemented'}));

module.exports = router;
