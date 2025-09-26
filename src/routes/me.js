import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import User from '../models/User.js';
import Team from '../models/Team.js';

const router = Router();

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.sub);
  const team = await Team.findById(req.user.teamId);
  if (!user || !team) return res.status(404).json({ error: 'not_found' });
  res.json({
  user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
  team: { id: team._id, name: team.name }
});

});

export default router;
