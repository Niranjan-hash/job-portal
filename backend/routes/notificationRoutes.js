const express = require('express');
const router = express.Router();
const Notification = require('../model/notification');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 for performance
      
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipientId: req.user.id, 
      isRead: false 
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ 
      _id: req.params.id, 
      recipientId: req.user.id 
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

module.exports = router;
