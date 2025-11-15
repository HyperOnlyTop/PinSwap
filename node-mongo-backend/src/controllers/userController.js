const User = require('../models/userModel');

class UserController {
    async createUser(req, res) {
        try {
            const { name, email, password, phone, address, role } = req.body;
            if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

            const exists = await User.findOne({ email });
            if (exists) return res.status(409).json({ message: 'Email already in use' });

            const user = new User({ name, email, password, phone, address, role });
            await user.save();
            return res.status(201).json(user.toJSON());
        } catch (err) {
            console.error('createUser error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            return res.json(user.toJSON());
        } catch (err) {
            console.error('getUser error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    // Get profile for current user
    async getMe(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
            return res.json(user.toJSON());
        } catch (err) {
            console.error('getMe error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            // Prevent email change to an existing email
            if (updates.email) {
                const exists = await User.findOne({ email: updates.email, _id: { $ne: id } });
                if (exists) return res.status(409).json({ message: 'Email already in use' });
            }
            const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
            if (!user) return res.status(404).json({ message: 'User not found' });
            return res.json(user.toJSON());
        } catch (err) {
            console.error('updateUser error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByIdAndDelete(id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            return res.json({ message: 'User deleted' });
        } catch (err) {
            console.error('deleteUser error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    // Update profile for current user
    async updateMe(req, res) {
        try {
            const updates = req.body;
            // Prevent email change to an existing email
            if (updates.email) {
                const exists = await User.findOne({ email: updates.email, _id: { $ne: req.userId } });
                if (exists) return res.status(409).json({ message: 'Email already in use' });
            }

            // If password is present, it will be hashed by pre-save hook if we use save();
            // For simplicity, we use findById and set fields then save to trigger hooks when needed.
            const user = await User.findById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            Object.keys(updates).forEach((k) => {
                // do not allow role changes from profile
                if (k === 'role') return;
                user[k] = updates[k];
            });

            await user.save();
            return res.json(user.toJSON());
        } catch (err) {
            console.error('updateMe error', err);
            if (err.name === 'ValidationError') {
                const details = Object.keys(err.errors).reduce((acc, key) => {
                    acc[key] = err.errors[key].message;
                    return acc;
                }, {});
                return res.status(400).json({ message: 'Validation error', errors: details });
            }
            return res.status(500).json({ message: 'Server error' });
        }
    }

    // change password for current user
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing currentPassword or newPassword' });

            const user = await User.findById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const match = await user.comparePassword(currentPassword);
            if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

            user.password = newPassword;
            await user.save(); // pre-save hook will hash
            return res.json({ message: 'Password changed successfully' });
        } catch (err) {
            console.error('changePassword error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = UserController;