const Event = require('../models/eventModel');
const EventRegistration = require('../models/eventRegistrationModel');
const User = require('../models/userModel');

class EventController {
  async list(req, res) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.q) filter.title = new RegExp(req.query.q, 'i');

      const total = await Event.countDocuments(filter);
      const items = await Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean();

      return res.json({ items, total, page, limit });
    } catch (err) {
      console.error('event.list error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const item = await Event.findById(id).lean();
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('event.get error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async create(req, res) {
    try {
      const { title, description, location, date, sponsor } = req.body;
      const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? String(req.body.images).split(',').map(s => s.trim()).filter(Boolean) : []);
      const thumbnail = req.body.thumbnail || (images && images[0]) || '';
      if (!title || !date) return res.status(400).json({ message: 'Missing title or date' });
      const ev = new Event({ title, description, location, date: new Date(date), sponsor, images, thumbnail, createdBy: req.userId });
      await ev.save();
      return res.status(201).json(ev);
    } catch (err) {
      console.error('event.create error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      if (updates.date) updates.date = new Date(updates.date);
      if (updates.images && typeof updates.images === 'string') {
        updates.images = updates.images.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (updates.images && Array.isArray(updates.images) && (!updates.thumbnail || updates.thumbnail === '')) {
        updates.thumbnail = updates.images[0] || '';
      }
      const item = await Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json(item);
    } catch (err) {
      console.error('event.update error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      const item = await Event.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json({ message: 'Deleted' });
    } catch (err) {
      console.error('event.remove error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Event Registration Methods
  async register(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      // Check if already registered
      const existing = await EventRegistration.findOne({ eventId, userId });
      if (existing) {
        if (existing.status === 'cancelled') {
          // Re-register
          existing.status = 'registered';
          await existing.save();
          return res.json({ message: 'Re-registered successfully', registration: existing });
        }
        return res.status(400).json({ message: 'Already registered for this event' });
      }

      // Create new registration
      const registration = new EventRegistration({ eventId, userId, status: 'registered' });
      await registration.save();

      return res.status(201).json({ message: 'Registered successfully', registration });
    } catch (err) {
      console.error('event.register error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async cancelRegistration(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      const registration = await EventRegistration.findOne({ eventId, userId });
      if (!registration) return res.status(404).json({ message: 'Registration not found' });

      registration.status = 'cancelled';
      await registration.save();

      return res.json({ message: 'Registration cancelled', registration });
    } catch (err) {
      console.error('event.cancelRegistration error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async getRegistrations(req, res) {
    try {
      const { eventId } = req.params;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);
      const skip = (page - 1) * limit;

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const filter = { eventId, status: 'registered' };
      
      const total = await EventRegistration.countDocuments(filter);
      const registrations = await EventRegistration.find(filter)
        .populate('userId', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.json({ 
        event: { id: event._id, title: event.title, date: event.date },
        registrations, 
        total, 
        page, 
        limit 
      });
    } catch (err) {
      console.error('event.getRegistrations error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async getMyRegistrations(req, res) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const skip = (page - 1) * limit;

      const filter = { userId, status: 'registered' };
      
      const total = await EventRegistration.countDocuments(filter);
      const registrations = await EventRegistration.find(filter)
        .populate('eventId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return res.json({ registrations, total, page, limit });
    } catch (err) {
      console.error('event.getMyRegistrations error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async checkRegistration(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      const registration = await EventRegistration.findOne({ eventId, userId, status: 'registered' });
      
      return res.json({ isRegistered: !!registration, registration });
    } catch (err) {
      console.error('event.checkRegistration error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new EventController();
