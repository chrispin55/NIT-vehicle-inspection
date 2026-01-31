const express = require('express');
const router = express.Router();
const { logger } = require('../utils/errorHandler');
const { authenticateToken } = require('../middleware/auth');

// Report client-side errors
router.post('/report', async (req, res) => {
  try {
    const errorData = {
      ...req.body,
      serverTimestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Log the error
    logger.error('Client-side error report:', errorData);

    // In production, you might want to send this to an error tracking service
    // like Sentry, Bugsnag, or a custom monitoring solution

    res.status(200).json({
      message: 'Error reported successfully',
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    logger.error('Failed to process error report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process error report'
    });
  }
});

// Get system health and error statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Read error log file (simplified version)
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const logPath = path.join(__dirname, '../logs/error.log');
      const logContent = await fs.readFile(logPath, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      
      // Parse recent errors (last 50)
      const recentErrors = logLines.slice(-50).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, timestamp: new Date().toISOString() };
        }
      });

      res.json({
        totalErrors: logLines.length,
        recentErrors: recentErrors.slice(-10), // Last 10 errors
        systemHealth: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } catch (fileError) {
      // If log file doesn't exist or can't be read
      res.json({
        totalErrors: 0,
        recentErrors: [],
        systemHealth: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      });
    }
  } catch (error) {
    logger.error('Failed to get error statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve error statistics'
    });
  }
});

// Clear error logs (admin only)
router.delete('/logs', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const logPath = path.join(__dirname, '../logs/error.log');
      await fs.writeFile(logPath, '');
      
      logger.info('Error logs cleared by admin', {
        adminId: req.user.id,
        adminUsername: req.user.username
      });

      res.json({
        message: 'Error logs cleared successfully'
      });
    } catch (fileError) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to clear error logs'
      });
    }
  } catch (error) {
    logger.error('Failed to clear error logs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to clear error logs'
    });
  }
});

module.exports = router;
