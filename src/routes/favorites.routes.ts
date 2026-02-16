import { Router } from 'express';
import {
  addToFavoritesHandler,
  removeFromFavoritesHandler,
  getUserFavoritesHandler,
} from '../controllers/favorites.controller';
import {
  addToFavoritesSchema,
  removeFromFavoritesSchema,
} from '../schemas/favorites.schema';
import { filterOffersSchema } from '../schemas/offers.schema';
import { validateParams, validateQuery } from '../middlewares/validate';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All favorites routes require authentication
router.use(authenticateToken);

// Get user's favorites with filtering (same as /api/offers/filter/)
router.get('/', validateQuery(filterOffersSchema.shape.query), getUserFavoritesHandler);

// Add to favorites
router.post('/:id', validateParams(addToFavoritesSchema.shape.params), addToFavoritesHandler);

// Remove from favorites
router.delete('/:id', validateParams(removeFromFavoritesSchema.shape.params), removeFromFavoritesHandler);

export default router;

