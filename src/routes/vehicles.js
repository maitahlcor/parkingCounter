import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import { normalizePlate } from '../utils/normalizePlate.js';

const router = Router();

// GET /vehicles?search=ABC  (autocomplete)
router.get('/vehicles', authRequired, async (req, res) => {
  const { teamId } = req.user;
  const q = (req.query.search || '').toString();
  const n = normalizePlate(q);
  if (!n) return res.json([]);

  const items = await Vehicle.find({
    teamId,
    normalizedPlate: { $regex: '^' + n }
  }, { plate: 1 }).limit(10);

  res.json(items.map(v => v.plate));
});

// POST /vehicles  { plate, meta? }
router.post('/vehicles', authRequired, async (req, res) => {
  const { teamId } = req.user;
  const { plate, meta } = req.body || {};
  if (!plate) return res.status(400).json({ error: 'plate_required' });
  const n = normalizePlate(plate);

  try {
    const v = await Vehicle.findOneAndUpdate(
      { teamId, normalizedPlate: n },
      { $setOnInsert: { teamId, plate, normalizedPlate: n, meta } },
      { upsert: true, new: true }
    );
    res.status(201).json({ id: v._id, plate: v.plate });
  } catch (e) {
    res.status(500).json({ error: 'vehicle_upsert_failed' });
  }
});

export default router;
