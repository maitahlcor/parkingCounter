import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import Event from '../models/Event.js';
import { normalizePlate } from '../utils/normalizePlate.js';

const router = Router();

async function recordEvent({ teamId, userId, plate, direction, at, clientAt, location, notes, idempotencyKey }) {
  const n = normalizePlate(plate);
  const vehicle = await Vehicle.findOneAndUpdate(
    { teamId, normalizedPlate: n },
    { $setOnInsert: { teamId, plate, normalizedPlate: n } },
    { upsert: true, new: true }
  );
  if (!vehicle) throw new Error('vehicle_upsert_failed');

  if (idempotencyKey) {
    try {
      await Event.create({
        teamId, userId, vehicleId: vehicle._id, direction,
        at: at ? new Date(at) : new Date(), clientAt: clientAt ? new Date(clientAt) : undefined,
        location, notes, idempotencyKey
      });
    } catch (e) {
      if (e.code === 11000) return { duplicate: true };
      throw e;
    }
  } else {
    await Event.create({
      teamId, userId, vehicleId: vehicle._id, direction,
      at: at ? new Date(at) : new Date(), clientAt: clientAt ? new Date(clientAt) : undefined,
      location, notes
    });
  }
  return { ok: true };
}

// POST /events
router.post('/events', authRequired, async (req, res) => {
  const { teamId, sub: userId } = req.user;
  const { plate, direction, at, clientAt, location, notes, idempotencyKey } = req.body || {};
  if (!plate || !direction) return res.status(400).json({ error: 'plate_and_direction_required' });
  if (!['IN','OUT'].includes(direction)) return res.status(400).json({ error: 'invalid_direction' });
  try {
    const r = await recordEvent({ teamId, userId, plate, direction, at, clientAt, location, notes, idempotencyKey });
    res.status(r?.duplicate ? 200 : 201).json({ ok: true, duplicate: !!r?.duplicate });
  } catch (e) {
    res.status(500).json({ error: 'event_failed' });
  }
});

// GET /events?plate=ABC123&from=2025-01-01&to=2025-12-31
router.get('/events', authRequired, async (req, res) => {
  const { teamId } = req.user;
  const { plate, from, to } = req.query;
  const query = { teamId };
  if (plate) {
    const n = normalizePlate(plate.toString());
    const v = await Vehicle.findOne({ teamId, normalizedPlate: n });
    query.vehicleId = v ? v._id : null;
  }
  if (from || to) {
    query.at = {};
    if (from) query.at.$gte = new Date(from.toString());
    if (to) query.at.$lte = new Date(to.toString());
  }
  const items = await Event.find(query).sort({ at: -1 }).limit(200);
  res.json(items);
});

export default router;
