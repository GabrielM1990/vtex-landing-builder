import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

module.exports = router;
