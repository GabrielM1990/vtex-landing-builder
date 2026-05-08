import { Router, Request, Response } from 'express';
import { VtexCollection } from '../types';

const router = Router();

// GET /api/vtex/collections - List VTEX collections
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const account = process.env.VTEX_ACCOUNT;
    const appKey = process.env.VTEX_APP_KEY;
    const appToken = process.env.VTEX_APP_TOKEN;

    if (!account || !appKey || !appToken) {
      return res.status(500).json({ error: 'VTEX credentials not configured' });
    }

    // Using VTEX Catalog API to get collections
    const response = await fetch(
      `https://${account}.myvtex.com/api/catalog_system/pvt/collection/list`,
      {
        headers: {
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`VTEX API error: ${response.status}`);
    }

    const collections = await response.json() as VtexCollection[];

    // Filter by search term if provided
    const filtered = search
      ? collections.filter((c: VtexCollection) =>
          c.name.toLowerCase().includes((search as string).toLowerCase())
        )
      : collections;

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/vtex/collections/:id - Get specific collection
router.get('/collections/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const account = process.env.VTEX_ACCOUNT;
    const appKey = process.env.VTEX_APP_KEY;
    const appToken = process.env.VTEX_APP_TOKEN;

    if (!account || !appKey || !appToken) {
      return res.status(500).json({ error: 'VTEX credentials not configured' });
    }

    const response = await fetch(
      `https://${account}.myvtex.com/api/catalog/pvt/collection/${id}`,
      {
        headers: {
          'X-VTEX-API-AppKey': appKey,
          'X-VTEX-API-AppToken': appToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`VTEX API error: ${response.status}`);
    }

    const collection = await response.json() as VtexCollection;
    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

export { router as vtexRouter };
