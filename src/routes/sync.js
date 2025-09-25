import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import Event from '../models/Event.js';
import { normalizePlate } from '../utils/normalizePlate.js';

const router = Router();

async function upsertAndCreate(teamId, userId, e) {
  const n = normalizePlate(e.plate);
  const vehicle = await Vehicle.findOneAndUpdate(
    { teamId, normalizedPlate: n },
    { $setOnInsert: { teamId, plate: e.plate, normalizedPlate: n } },
    { new: true, upsert: true }
  );
  try {
    await Event.create({
      teamId, userId, vehicleId: vehicle._id,
      direction: e.direction, at: e.at ? new Date(e.at) : new Date(),
      clientAt: e.clientAt ? new Date(e.clientAt) : undefined,
      location: e.location, notes: e.notes,
      idempotencyKey: e.idempotencyKey
    });
    return 'saved';
  } catch (err) {
    if (err?.code === 11000) return 'duplicate';
    throw err;
  }
}

// POST /sync/batch { events: [...] }
router.post('/sync/batch', authRequired, async (req, res) => {
  const { teamId, sub: userId } = req.user;
  const events = Array.isArray(req.body.events) ? req.body.events : [];
  const savedKeys = [];
  const duplicateKeys = [];
  for (const e of events) {
    const result = await upsertAndCreate(teamId, userId, e);
    if (e.idempotencyKey) {
      if (result === 'saved') savedKeys.push(e.idempotencyKey);
      if (result === 'duplicate') duplicateKeys.push(e.idempotencyKey);
    }
  }
  res.json({ savedKeys, duplicateKeys });
});

export default router;
