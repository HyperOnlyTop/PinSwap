const Feedback = require('../models/feedbackModel');

class FeedbackController {
  async create(req, res) {
    try {
      const { userId, message } = req.body || {};
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const fb = new Feedback({ userId: userId || undefined, message });
      await fb.save();
      return res.status(201).json(fb);
    } catch (err) {
      console.error('feedback.create error', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  }

  async list(req, res) {
    try {
      const hasPaging = typeof req.query.page !== 'undefined' || typeof req.query.limit !== 'undefined';
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      // allow filtering by userId to show history for a specific user
      const filter = {};
      if (req.query.userId) filter.userId = req.query.userId;

      if (hasPaging) {
        const [items, total] = await Promise.all([
          Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
          Feedback.countDocuments(filter)
        ]);
        return res.json({ items, total, page, limit });
      }

      const items = await Feedback.find(filter).sort({ createdAt: -1 });
      return res.json(items);
    } catch (err) {
      console.error('feedback.list error', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  }

  async get(req, res) {
    try {
      const id = req.params.id;
      const item = await Feedback.findById(id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('feedback.get error', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  }

  async remove(req, res) {
    try {
      const id = req.params.id;
      const item = await Feedback.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json({ success: true });
    } catch (err) {
      console.error('feedback.remove error', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      const { message, userId } = req.body || {};
      const updates = {};
      if (message && typeof message === 'string') updates.message = message;
      if (userId) updates.userId = userId;
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates provided' });

      const item = await Feedback.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('feedback.update error', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  }

  async listByUser(req, res) {
    try {
      const uid = req.userId;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const hasPaging = typeof req.query.page !== 'undefined' || typeof req.query.limit !== 'undefined';
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const filter = { userId: uid };

      if (hasPaging) {
        const [items, total] = await Promise.all([
          Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
          Feedback.countDocuments(filter)
        ]);
        return res.json({ items, total, page, limit });
      }

      const items = await Feedback.find(filter).sort({ createdAt: -1 });
      return res.json(items);
    } catch (err) {
      console.error('feedback.listByUser error', err);
      return res.status(500).json({ error: 'Server error', detail: err.message });
    }
  }
}

module.exports = new FeedbackController();
