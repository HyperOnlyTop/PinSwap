const Voucher = require('../models/voucherModel');
const VoucherHistory = require('../models/voucherHistoryModel');
const Business = require('../models/businessModel');
const User = require('../models/userModel');

class VoucherController {
  async list(req, res) {
    try {
      const vouchers = await Voucher.find({ status: 'active', quantity: { $gt: 0 } }).populate('businessId', 'companyName');
      return res.json(vouchers);
    } catch (err) {
      console.error('voucher.list error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const voucher = await Voucher.findById(id).populate('businessId', 'companyName');
      if (!voucher) return res.status(404).json({ message: 'Not found' });
      return res.json(voucher);
    } catch (err) {
      console.error('voucher.get error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Exchange a voucher: protected route
  async exchange(req, res) {
    try {
      const userId = req.userId;
      const { voucherId } = req.body;
      if (!voucherId) return res.status(400).json({ message: 'Missing voucherId' });

      const voucher = await Voucher.findById(voucherId);
      if (!voucher || voucher.status !== 'active' || (voucher.quantity || 0) <= 0) return res.status(400).json({ message: 'Voucher not available' });

      const pointsNeeded = Number(voucher.pointsRequired || 0);

      // If points are required, try to deduct from user first (atomic-ish)
      let userAfterDeduct = null;
      if (pointsNeeded > 0) {
        userAfterDeduct = await User.findOneAndUpdate({ _id: userId, points: { $gte: pointsNeeded } }, { $inc: { points: -pointsNeeded } }, { new: true });
        if (!userAfterDeduct) return res.status(400).json({ message: 'Insufficient points' });
      }

      // decrement voucher quantity atomically
      const updated = await Voucher.findOneAndUpdate({ _id: voucherId, quantity: { $gt: 0 } }, { $inc: { quantity: -1 } }, { new: true });
      if (!updated) {
        // rollback user points if we deducted
        if (pointsNeeded > 0) {
          await User.findByIdAndUpdate(userId, { $inc: { points: pointsNeeded } });
        }
        return res.status(400).json({ message: 'Voucher not available' });
      }

      // Create history record and return code
      const code = `VCHR-${Date.now().toString().slice(-6)}`;
      const history = new VoucherHistory({ userId, voucherId, businessId: voucher.businessId, code, pointsUsed: pointsNeeded });
      await history.save();

      return res.json({ success: true, code, voucher: updated, remainingPoints: userAfterDeduct ? userAfterDeduct.points : undefined });
    } catch (err) {
      console.error('voucher.exchange error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async history(req, res) {
    try {
      const userId = req.userId;
      const list = await VoucherHistory.find({ userId }).populate('voucherId').sort({ createdAt: -1 });
      return res.json(list);
    } catch (err) {
      console.error('voucher.history error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Create voucher - admin or business only
  async create(req, res) {
    try {
      const { businessId, title, description, pointsRequired, quantity, expiryDate, images, discount } = req.body;
      
      // Validate required fields
      if (!title || !pointsRequired || !quantity) {
        return res.status(400).json({ message: 'Missing required fields: title, pointsRequired, quantity' });
      }

      // If user is business role, use their own businessId
      let finalBusinessId = businessId;
      if (req.user && req.user.role === 'business') {
        finalBusinessId = req.userId; // business user's ID is their business ID
      }

      const voucher = new Voucher({
        businessId: finalBusinessId,
        title,
        description,
        pointsRequired: Number(pointsRequired),
        quantity: Number(quantity),
        expiryDate,
        images: images || [],
        discount: discount ? Number(discount) : undefined,
        status: 'active'
      });

      await voucher.save();
      const populated = await Voucher.findById(voucher._id).populate('businessId', 'companyName');
      
      return res.status(201).json({ success: true, voucher: populated });
    } catch (err) {
      console.error('voucher.create error', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  // Update voucher - admin or business only
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, pointsRequired, quantity, expiryDate, images, discount, status } = req.body;
      
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      // If user is business, check they own this voucher
      if (req.user && req.user.role === 'business') {
        if (voucher.businessId.toString() !== req.userId) {
          return res.status(403).json({ message: 'You can only update your own vouchers' });
        }
      }

      // Update fields
      if (title !== undefined) voucher.title = title;
      if (description !== undefined) voucher.description = description;
      if (pointsRequired !== undefined) voucher.pointsRequired = Number(pointsRequired);
      if (quantity !== undefined) voucher.quantity = Number(quantity);
      if (expiryDate !== undefined) voucher.expiryDate = expiryDate;
      if (images !== undefined) voucher.images = images;
      if (discount !== undefined) voucher.discount = Number(discount);
      if (status !== undefined) voucher.status = status;

      await voucher.save();
      const populated = await Voucher.findById(voucher._id).populate('businessId', 'companyName');
      
      return res.json({ success: true, voucher: populated });
    } catch (err) {
      console.error('voucher.update error', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  // Delete voucher - admin or business only
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      // If user is business, check they own this voucher
      if (req.user && req.user.role === 'business') {
        if (voucher.businessId.toString() !== req.userId) {
          return res.status(403).json({ message: 'You can only delete your own vouchers' });
        }
      }

      await Voucher.findByIdAndDelete(id);
      
      return res.json({ success: true, message: 'Voucher deleted successfully' });
    } catch (err) {
      console.error('voucher.delete error', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }

  // Get vouchers by business - for business to manage their own vouchers
  async getByBusiness(req, res) {
    try {
      let businessId = req.params.businessId;
      
      // If user is business role, only allow them to see their own vouchers
      if (req.user && req.user.role === 'business') {
        businessId = req.userId;
      }

      const vouchers = await Voucher.find({ businessId }).populate('businessId', 'companyName').sort({ createdAt: -1 });
      return res.json(vouchers);
    } catch (err) {
      console.error('voucher.getByBusiness error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new VoucherController();
