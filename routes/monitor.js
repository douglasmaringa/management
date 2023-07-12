const express = require("express");
const jwt = require("jsonwebtoken");
const Monitor = require("../models/Monitor");
const UptimeEvent = require("../models/UptimeEvent");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Monitor
 *   description: API endpoints for managing monitors
 */

/**
 * @swagger
 * /api/monitor/monitors:
 *   post:
 *     summary: Create a new monitor
 *     tags: [Monitor]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               port:
 *                 type: number
 *               frequency:
 *                 type: number
 *               token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Monitor created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: An internal server error occurred
 */

// Create a new monitor
router.post("/monitors", verifyToken, async (req, res) => {
  try {
    const { url,port,frequency } = req.body;

    // Extract user ID from the token
    const userId = req.user.userId;

    // Create a new monitor for the user
    const newMonitor = new Monitor({
      user: userId,
      url,
      isPaused: false,
      port,
      frequency
    });

    // Save the monitor to the database
    await newMonitor.save();

    res.status(201).json({ message: "Monitor created successfully" });
  } catch (error) {
    console.error("Error creating monitor:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});


/**
 * @swagger
 * /api/monitor/monitors/all:
 *   post:
 *     summary: Fetch all monitors for the user
 *     tags: [Monitor]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Monitors fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monitors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user:
 *                         type: string
 *                       url:
 *                         type: string
 *                       isPaused:
 *                         type: boolean
 *                       port:
 *                         type: number
 *                       frequency:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: An internal server error occurred
 */
// Fetch all monitors for the user
router.post("/monitors/all", verifyToken, async (req, res) => {
  try {
    // Extract user ID from the token
    const userId = req.user.userId;

    // Find all monitors belonging to the user
    const monitors = await Monitor.find({ user: userId });

    res.status(200).json({ monitors });
  } catch (error) {
    console.error("Error fetching monitors:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

/**
 * @swagger
 * /api/monitor/monitors/uptimeevents:
 *   post:
 *     summary: Fetch all uptime events for a monitor, sorted by latest
 *     tags: [Monitor]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Uptime events fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Url:
 *                   type: string
 *                 frequency:
 *                   type: number
 *                 port:
 *                   type: number
 *                 uptimeEvents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       monitor:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                       isUp:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor not found
 *       500:
 *         description: An internal server error occurred
 */
// Fetch all uptime events for a monitor, sorted by latest
router.post("/monitors/uptimeevents", verifyToken, async (req, res) => {
  try {
    const { id } = req.body;

     // Extract user ID from the token
    const userId = req.user.userId;

      // Find the monitor and ensure it belongs to the user
      const monitor = await Monitor.findOne({ _id: id, user: userId });
      if (!monitor) {
        return res.status(404).json({ error: "Monitor not found" });
      }

      // Fetch all uptime events for the monitor, sorted by the latest
      const uptimeEvents = await UptimeEvent.find({ monitor: id })
        .sort({ timestamp: -1 })
        .exec();

      res.status(200).json({ Url:monitor?.url,frequency:monitor?.frequency,port:monitor?.port,uptimeEvents:uptimeEvents });
    
  } catch (error) {
    console.error("Error fetching uptime events:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

/**
 * @swagger
 * /api/monitor/monitors/{id}/pause:
 *   put:
 *     summary: Update a monitor and set isPaused to true
 *     tags: [Monitor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the monitor to be updated
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Monitor not found
 *       500:
 *         description: An internal server error occurred
 */


// Update a monitor and set isPaused to true
router.put("/monitors/:id/pause", async (req, res) => {
  try {
    const monitorId = req.params.id;
    // Find the monitor and ensure it belongs to the user
    const monitor = await Monitor.findOne({ _id: monitorId });
    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Update the monitor and set isPaused to true
    monitor.isPaused = true;
    await monitor.save();

    res.status(200).json({ message: "Monitor paused successfully" });
  } catch (error) {
    console.error("Error pausing monitor:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});


// Middleware function to verify the JWT token
function verifyToken(req, res, next) {
    const token = req.body.token;
  
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    jwt.verify(token, "secret", (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }
  
      req.user = decoded;
      next();
    });
  }

module.exports = router;
