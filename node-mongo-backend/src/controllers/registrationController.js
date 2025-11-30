const EventRegistration = require('../models/eventRegistrationModel');

async function register(req, res) {
  try {
    const userId = req.userId;
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: 'eventId is required' });

    // upsert registration (if previously cancelled, set to registered)
    const doc = await EventRegistration.findOneAndUpdate(
      { eventId, userId },
      { $set: { status: 'registered' }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(doc);
  } catch (err) {
    console.error('registration.register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function cancel(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params; // registration id
    // allow cancel by registration id or by eventId via body
    if (id) {
      const doc = await EventRegistration.findOne({ _id: id, userId });
      if (!doc) return res.status(404).json({ message: 'Not found' });
      doc.status = 'cancelled';
      await doc.save();
      return res.json({ message: 'Cancelled' });
    }

    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: 'eventId is required' });
    const doc = await EventRegistration.findOneAndUpdate({ eventId, userId }, { $set: { status: 'cancelled' } }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Registration not found' });
    return res.json(doc);
  } catch (err) {
    console.error('registration.cancel error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function myRegistrations(req, res) {
  try {
    const userId = req.userId;
    const regs = await EventRegistration.find({ userId }).populate('eventId').sort({ createdAt: -1 }).lean();
    return res.json(regs);
  } catch (err) {
    console.error('registration.myRegistrations error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, cancel, myRegistrations };
