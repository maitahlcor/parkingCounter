import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Team from '../models/Team.js';
import User from '../models/User.js';

const router = Router();

function signAccessToken({ userId, teamId, role }) {
  const ttlMin = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '30', 10);
  return jwt.sign(
    { sub: userId.toString(), teamId: teamId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: `${ttlMin}m` }
  );
}

// POST /auth/login  { accessCode, displayName, phoneOrId? }
router.post('/login', async (req, res) => {
  const { accessCode, displayName, phoneOrId } = req.body || {};
  if (!accessCode || !displayName) {
    return res.status(400).json({ error: 'accessCode_and_displayName_required' });
  }
  const teams = await Team.find({ isActive: true }).limit(200);
  // ideal: índice directo por hash (ver seed)
  let team = null;
  for (const t of teams) {
    const ok = await bcrypt.compare(accessCode, t.accessCodeHash);
    if (ok) { team = t; break; }
  }
  if (!team) return res.status(401).json({ error: 'invalid_access_code' });

  let user = await User.findOne({ teamId: team._id, displayName, phoneOrId });
  if (!user) {
    user = await User.create({ teamId: team._id, displayName, phoneOrId, role: 'OPERATOR' });
  }
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({ userId: user._id, teamId: team._id, role: user.role });
  res.json({ accessToken, user: { id: user._id, displayName: user.displayName, role: user.role }, team: { id: team._id, name: team.name } });
});

export default router;
