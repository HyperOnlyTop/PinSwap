const News = require('../models/newsModel');
const newsletterService = require('../services/newsletterService');

class NewsController {
  async list(req, res) {
    try {
      const news = await News.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
      return res.json(news);
    } catch (err) {
      console.error('news.list error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const item = await News.findById(id).populate('createdBy', 'name email');
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('news.get error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async create(req, res) {
    try {
      const { title, content, thumbnail } = req.body;
      const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? String(req.body.images).split(',').map(s => s.trim()).filter(Boolean) : []);
      if (!title || !content) return res.status(400).json({ message: 'Missing title or content' });
      const news = new News({ title, content, thumbnail, images, createdBy: req.userId });
      await news.save();
      const populated = await News.findById(news._id).populate('createdBy', 'name email');
      // trigger newsletter sending in background (do not block response)
      (async () => {
        try {
          await newsletterService.sendNewsletterToSubscribers(populated);
        } catch (bgErr) {
          console.error('Background newsletter error', bgErr);
        }
      })();

      return res.status(201).json(populated);
    } catch (err) {
      console.error('news.create error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      if (updates.images && typeof updates.images === 'string') {
        updates.images = updates.images.split(',').map(s => s.trim()).filter(Boolean);
      }
      const item = await News.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('createdBy', 'name email');
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('news.update error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      const item = await News.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json({ message: 'Deleted' });
    } catch (err) {
      console.error('news.remove error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new NewsController();
