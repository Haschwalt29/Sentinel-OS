const express = require('express');
const router = express.Router();
const Threat = require('../models/Threat');

// @desc    Verify a threat
// @route   PATCH /api/admin/threat/:id/verify
// @access  Admin only
router.patch('/threat/:id/verify', async (req, res) => {
  try {
    const threat = await Threat.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    );

    if (!threat) {
      return res.status(404).json({ message: 'Threat not found' });
    }

    res.json(threat);
  } catch (error) {
    console.error('Error verifying threat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a threat
// @route   DELETE /api/admin/threat/:id
// @access  Admin only
router.delete('/threat/:id', async (req, res) => {
  try {
    const threat = await Threat.findByIdAndDelete(req.params.id);

    if (!threat) {
      return res.status(404).json({ message: 'Threat not found' });
    }

    res.json({ message: 'Threat deleted successfully' });
  } catch (error) {
    console.error('Error deleting threat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 