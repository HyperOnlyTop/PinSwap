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
}

module.exports = new VoucherController();
