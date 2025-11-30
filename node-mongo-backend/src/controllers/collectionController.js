const Collection = require('../models/collectionModel');
const User = require('../models/userModel');

class CollectionController {
  // create a new collection record and add points to user
  async create(req, res) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const { items, totalPoints, location, method } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Missing items' });
      const col = new Collection({ userId: req.userId, items, totalPoints: Number(totalPoints) || 0, location, method });
      await col.save();

      // increment user points
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.points = (user.points || 0) + Number(totalPoints || 0);
      await user.save();

      return res.status(201).json({ collection: col, points: user.points });
    } catch (err) {
      console.error('collection.create error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // list collections for current user (or admin can list all)
  async list(req, res) {
    try {
      const filter = {};
      if (req.userId) filter.userId = req.userId;
      const collections = await Collection.find(filter).sort({ createdAt: -1 }).limit(100);
      return res.json({ collections });
    } catch (err) {
      console.error('collection.list error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new CollectionController();
