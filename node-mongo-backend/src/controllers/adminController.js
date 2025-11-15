const User = require('../models/userModel');
const Business = require('../models/businessModel');
const Location = require('../models/locationModel');
const News = require('../models/newsModel');
const Voucher = require('../models/voucherModel');

class AdminController {
  // GET /api/admin/stats
  async stats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const totalBusinesses = await Business.countDocuments();
      const totalLocations = await Location.countDocuments();
      const totalNews = await News.countDocuments();
      const totalPointsAgg = await User.aggregate([{ $group: { _id: null, sum: { $sum: '$points' } } }]);
      const totalPoints = (totalPointsAgg[0] && totalPointsAgg[0].sum) || 0;
      return res.json({ totalUsers, totalBusinesses, totalLocations, totalNews, totalPoints });
    } catch (err) {
      console.error('admin.stats error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/admin/users?limit=50&page=1
  async listUsers(req, res) {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;
      const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
      const total = await User.countDocuments();
      return res.json({ users, total, page, limit });
    } catch (err) {
      console.error('admin.listUsers error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/admin/users
  async createUser(req, res) {
    try {
      const { name, email, password, phone, address, role } = req.body;
      if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      const user = new User({ name, email, password, phone, address, role });
      await user.save();
      return res.status(201).json({ user: user.toJSON() });
    } catch (err) {
      console.error('admin.createUser error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // PUT /api/admin/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.email) {
        const exists = await User.findOne({ email: updates.email, _id: { $ne: id } });
        if (exists) return res.status(409).json({ message: 'Email already in use' });
      }
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      Object.keys(updates).forEach(k => { if (k === 'password') user.password = updates[k]; else if (k !== 'role') user[k] = updates[k]; });
      // allow role change by admin
      if (updates.role) user.role = updates.role;
      await user.save();
      return res.json({ user: user.toJSON() });
    } catch (err) {
      console.error('admin.updateUser error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // DELETE /api/admin/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json({ message: 'User deleted' });
    } catch (err) {
      console.error('admin.deleteUser error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/admin/businesses?pending=true
  async listBusinesses(req, res) {
    try {
      const filter = {};
      if (req.query.pending === 'true') filter.verified = false;
      const businesses = await Business.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email role').lean();
      return res.json({ businesses });
    } catch (err) {
      console.error('admin.listBusinesses error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/admin/businesses/:id/approve
  async approveBusiness(req, res) {
    try {
      const { id } = req.params;
      const business = await Business.findById(id);
      if (!business) return res.status(404).json({ message: 'Business not found' });
      business.verified = true;
      await business.save();
      return res.json({ message: 'Business approved', business: business.toJSON() });
    } catch (err) {
      console.error('admin.approveBusiness error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/admin/businesses
  async createBusiness(req, res) {
    try {
      const { userId, companyName, taxCode, verified } = req.body;
      if (!companyName || !taxCode) return res.status(400).json({ message: 'Missing companyName or taxCode' });
      // optional: ensure user exists if userId provided
      if (userId) {
        const u = await User.findById(userId);
        if (!u) return res.status(400).json({ message: 'Provided userId not found' });
      }
      const business = new (require('../models/businessModel'))({ userId: userId || undefined, companyName, taxCode, verified: !!verified });
      await business.save();
      return res.status(201).json({ business: business.toJSON() });
    } catch (err) {
      console.error('admin.createBusiness error', err);
      if (err.code === 11000) return res.status(409).json({ message: 'Business with that taxCode already exists' });
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // PUT /api/admin/businesses/:id
  async updateBusiness(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const business = await Business.findById(id);
      if (!business) return res.status(404).json({ message: 'Business not found' });
      if (updates.userId) {
        const u = await User.findById(updates.userId);
        if (!u) return res.status(400).json({ message: 'Provided userId not found' });
        business.userId = updates.userId;
      }
      if (updates.companyName) business.companyName = updates.companyName;
      if (updates.taxCode) business.taxCode = updates.taxCode;
      if (typeof updates.verified !== 'undefined') business.verified = !!updates.verified;
      await business.save();
      return res.json({ business: business.toJSON() });
    } catch (err) {
      console.error('admin.updateBusiness error', err);
      if (err.code === 11000) return res.status(409).json({ message: 'Business with that taxCode already exists' });
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // DELETE /api/admin/businesses/:id
  async deleteBusiness(req, res) {
    try {
      const { id } = req.params;
      const business = await Business.findByIdAndDelete(id);
      if (!business) return res.status(404).json({ message: 'Business not found' });
      return res.json({ message: 'Business deleted' });
    } catch (err) {
      console.error('admin.deleteBusiness error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/admin/vouchers
  async listVouchers(req, res) {
    try {
      const limit = Math.min(Number(req.query.limit) || 100, 1000);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;
      const filter = {};
      if (req.query.businessId) filter.businessId = req.query.businessId;
      const vouchers = await Voucher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('businessId', 'companyName').lean();
      const total = await Voucher.countDocuments(filter);
      return res.json({ vouchers, total, page, limit });
    } catch (err) {
      console.error('admin.listVouchers error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /api/admin/vouchers
  async createVoucher(req, res) {
    try {
      const { businessId, title, description, expiry, quantity, status, images, pointsRequired } = req.body;
      if (!title) return res.status(400).json({ message: 'Missing title' });
      let imgs = [];
      if (Array.isArray(images)) imgs = images;
      else if (typeof images === 'string' && images.trim()) imgs = images.split(',').map(s => s.trim()).filter(Boolean);
      const v = new Voucher({ businessId: businessId || undefined, title, description, expiry: expiry ? new Date(expiry) : undefined, images: imgs, quantity: Number(quantity) || 0, pointsRequired: Number(pointsRequired) || 0, status: status || 'active' });
      await v.save();
      return res.status(201).json({ voucher: v.toObject() });
    } catch (err) {
      console.error('admin.createVoucher error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // PUT /api/admin/vouchers/:id
  async updateVoucher(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const voucher = await Voucher.findById(id);
      if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
      if (typeof updates.title !== 'undefined') voucher.title = updates.title;
      if (typeof updates.description !== 'undefined') voucher.description = updates.description;
      if (typeof updates.expiry !== 'undefined') voucher.expiry = updates.expiry ? new Date(updates.expiry) : undefined;
      if (typeof updates.images !== 'undefined') {
        if (Array.isArray(updates.images)) voucher.images = updates.images;
        else if (typeof updates.images === 'string') voucher.images = updates.images.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (typeof updates.quantity !== 'undefined') voucher.quantity = Number(updates.quantity) || 0;
      if (typeof updates.pointsRequired !== 'undefined') voucher.pointsRequired = Number(updates.pointsRequired) || 0;
      if (typeof updates.status !== 'undefined') voucher.status = updates.status;
      if (typeof updates.businessId !== 'undefined') voucher.businessId = updates.businessId || undefined;
      await voucher.save();
      return res.json({ voucher: voucher.toObject() });
    } catch (err) {
      console.error('admin.updateVoucher error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // DELETE /api/admin/vouchers/:id
  async deleteVoucher(req, res) {
    try {
      const { id } = req.params;
      const v = await Voucher.findByIdAndDelete(id);
      if (!v) return res.status(404).json({ message: 'Voucher not found' });
      return res.json({ message: 'Voucher deleted' });
    } catch (err) {
      console.error('admin.deleteVoucher error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new AdminController();
