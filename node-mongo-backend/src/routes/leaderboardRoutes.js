const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Collection = require('../models/collectionModel');
const { verifyToken } = require('../middlewares/auth');

// Get leaderboard
router.get('/', verifyToken, async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (range === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { createdAt: { $gte: monthAgo } };
    }
    
    // Get all users (only citizens/regular users, exclude business and admin)
    const users = await User.find({ role: { $in: ['citizen', 'user'] } })
      .select('fullName email phone points role avatar')
      .lean();
    
    console.log(`Found ${users.length} users`);
    
    // Get collection stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const collections = await Collection.find({
          userId: user._id,
          ...dateFilter
        });
        
        const totalPins = collections.reduce((sum, collection) => {
          return sum + (collection.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
        }, 0);
        
        return {
          ...user,
          totalPins
        };
      })
    );
    
    console.log('Users with stats:', usersWithStats.length);
    
    // Sort by pins (descending) - only include users with data
    const byPins = [...usersWithStats]
      .filter(u => u.totalPins > 0 || u.points > 0)
      .sort((a, b) => b.totalPins - a.totalPins)
      .slice(0, 50); // Top 50
    
    // Sort by points (descending) - only include users with data
    const byPoints = [...usersWithStats]
      .filter(u => u.totalPins > 0 || u.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 50); // Top 50
    
    console.log(`Returning ${byPins.length} users by pins, ${byPoints.length} users by points`);
    
    res.json({
      byPins,
      byPoints
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Lỗi khi tải bảng xếp hạng', error: error.message });
  }
});

module.exports = router;
