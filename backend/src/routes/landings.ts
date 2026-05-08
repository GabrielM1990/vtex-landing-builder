import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.any()).optional(),
  children: z.array(z.any()).optional(),
});

const landingSchema = z.object({
  name: z.string().min(1),
  route: z.string().min(1).regex(/^[a-z0-9\-\/]+$/, 'Route must be lowercase alphanumeric with hyphens and slashes'),
  blocks: z.array(blockSchema),
});

// Helper functions for serialization
const serializeLanding = (landing: any) => ({
  ...landing,
  blocks: typeof landing.blocks === 'string' ? landing.blocks : JSON.stringify(landing.blocks),
});

const deserializeLanding = (landing: any) => ({
  ...landing,
  blocks: typeof landing.blocks === 'string' ? JSON.parse(landing.blocks) : landing.blocks,
});

const deserializeLandings = (landings: any[]) => landings.map(deserializeLanding);

// GET /api/landings - List all landings
router.get('/', async (req, res) => {
  try {
    const landings = await prisma.landing.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json(deserializeLandings(landings));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch landings' });
  }
});

// GET /api/landings/:id - Get specific landing
router.get('/:id', async (req, res) => {
  try {
    const landing = await prisma.landing.findUnique({
      where: { id: req.params.id },
      include: { deployments: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    
    if (!landing) {
      return res.status(404).json({ error: 'Landing not found' });
    }
    
    res.json(deserializeLanding(landing));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch landing' });
  }
});

// POST /api/landings - Create new landing
router.post('/', async (req, res) => {
  try {
    const data = landingSchema.parse(req.body);
    
    // Check for duplicate route
    const existing = await prisma.landing.findUnique({
      where: { route: data.route },
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Route already exists' });
    }
    
    const landing = await prisma.landing.create({
      data: {
        ...data,
        blocks: JSON.stringify(data.blocks),
        status: 'draft',
      },
    });
    
    res.status(201).json(deserializeLanding(landing));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create landing' });
  }
});

// PUT /api/landings/:id - Update landing
router.put('/:id', async (req, res) => {
  try {
    const data = landingSchema.partial().parse(req.body);
    
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    
    if (data.blocks) {
      updateData.blocks = JSON.stringify(data.blocks);
    }
    
    const landing = await prisma.landing.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json(deserializeLanding(landing));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update landing' });
  }
});

// DELETE /api/landings/:id - Delete landing
router.delete('/:id', async (req, res) => {
  try {
    await prisma.landing.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete landing' });
  }
});

// POST /api/landings/:id/deploy - Deploy landing to production
router.post('/:id/deploy', async (req, res) => {
  try {
    const landing = await prisma.landing.findUnique({
      where: { id: req.params.id },
    });
    
    if (!landing) {
      return res.status(404).json({ error: 'Landing not found' });
    }
    
    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        landingId: landing.id,
        status: 'pending',
        message: 'Deployment queued',
      },
    });
    
    // Update landing status
    await prisma.landing.update({
      where: { id: landing.id },
      data: {
        status: 'deployed',
        deployedAt: new Date(),
      },
    });
    
    // TODO: Trigger actual deployment to GitHub
    
    res.json({ deployment, message: 'Deployment initiated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deploy landing' });
  }
});

export { router as landingsRouter };
