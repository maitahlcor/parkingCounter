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

// POST /vehicles  { plate, meta? { type?: string, ... } }
router.post('/vehicles', authRequired, async (req, res) => {
  const { teamId } = req.user;
  const { plate, meta = {} } = req.body || {};
  if (!plate) return res.status(400).json({ error: 'plate_required' });

  const n = normalizePlate(plate);

  // Normaliza/valida tipo
  const ALLOWED = ['MOTO', 'AUTO', 'AUTOBUS', 'CAMION_FURGON'];
  let type = (meta.type || '').toString().trim().toUpperCase();

  // sinónimos rápidos
  const map = {
    'CAMION': 'CAMION_FURGON', 'FURGON': 'CAMION_FURGON',
    'BUS': 'AUTOBUS', 'AUTOBÚS': 'AUTOBUS', 'AUTOBUS': 'AUTOBUS',
    'CARRO': 'AUTO', 'COCHE': 'AUTO'
  };
  type = map[type] || type;
  if (type && !ALLOWED.includes(type)) {
    return res.status(400).json({ error: 'invalid_vehicle_type', allowed: ALLOWED });
  }

  try {
    const v = await Vehicle.findOneAndUpdate(
      { teamId, normalizedPlate: n },
      { $setOnInsert: { teamId, plate, normalizedPlate: n, meta: { ...meta, ...(type ? { type } : {}) } } },
      { upsert: true, new: true }
    );
    res.status(201).json({ id: v._id, plate: v.plate, meta: v.meta || {} });
  } catch (e) {
    res.status(500).json({ error: 'vehicle_upsert_failed' });
  }
});

export default router;
