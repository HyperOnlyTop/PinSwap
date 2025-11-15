const Location = require('../models/locationModel');
const User = require('../models/userModel');
const Business = require('../models/businessModel');

class LocationController {
  // public list with optional type/status filters
  async list(req, res) {
    try {
      const { type, status } = req.query;
      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      const locations = await Location.find(filter).sort({ createdAt: -1 });
      return res.json(locations);
    } catch (err) {
      console.error('location.list error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const item = await Location.findById(id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('location.get error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // create (admin or business owning user)
  async create(req, res) {
    try {
      const { businessId: bodyBusinessId, name, address, latitude, longitude, openHours, type } = req.body;
      if (!name || latitude == null || longitude == null) return res.status(400).json({ message: 'Missing required fields: name/latitude/longitude' });

      // If requester is business user, associate location with their business automatically
      let businessId = bodyBusinessId || null;
      if (req.userId) {
        const requester = await User.findById(req.userId);
        if (requester && requester.role === 'business') {
          const biz = await Business.findOne({ userId: requester._id });
          if (!biz) return res.status(403).json({ message: 'Business account not found for this user' });
          businessId = biz._id;
        } else if (requester && requester.role !== 'admin' && !businessId) {
          // non-admin non-business users cannot create locations
          return res.status(403).json({ message: 'Forbidden' });
        }
      }

      const location = new Location({ businessId, name, address, latitude, longitude, openHours, type });
      await location.save();
      return res.status(201).json(location);
    } catch (err) {
      console.error('location.create error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // update (admin or owning business)
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const item = await Location.findById(id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      // Authorization: admin can update any; business owner can update their own
      if (req.userId) {
        const requester = await User.findById(req.userId);
        if (!requester) return res.status(403).json({ message: 'Forbidden' });
        if (requester.role !== 'admin') {
          if (requester.role === 'business') {
            const biz = await Business.findOne({ userId: requester._id });
            if (!biz || !item.businessId || item.businessId.toString() !== biz._id.toString()) {
              return res.status(403).json({ message: 'Forbidden' });
            }
          } else {
            return res.status(403).json({ message: 'Forbidden' });
          }
        }
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const updated = await Location.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      return res.json(updated);
    } catch (err) {
      console.error('location.update error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // soft-delete or delete (admin or owning business)
  async remove(req, res) {
    try {
      const { id } = req.params;
      const item = await Location.findById(id);
      if (!item) return res.status(404).json({ message: 'Not found' });

      if (req.userId) {
        const requester = await User.findById(req.userId);
        if (!requester) return res.status(403).json({ message: 'Forbidden' });
        if (requester.role !== 'admin') {
          if (requester.role === 'business') {
            const biz = await Business.findOne({ userId: requester._id });
            if (!biz || !item.businessId || item.businessId.toString() !== biz._id.toString()) {
              return res.status(403).json({ message: 'Forbidden' });
            }
          } else {
            return res.status(403).json({ message: 'Forbidden' });
          }
        }
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const deleted = await Location.findByIdAndUpdate(id, { status: 'deleted' }, { new: true });
      return res.json({ message: 'Deleted', item: deleted });
    } catch (err) {
      console.error('location.remove error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new LocationController();
