import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Simple slug generation from a string
 * @param text - The text to convert to slug
 * @returns Generated slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Generate unique slug for a specific entity type
 * @param text - The text to convert to slug
 * @param entityType - The entity type (e.g., 'PaymentService', 'Offer')
 * @param excludeId - Optional ID to exclude from uniqueness check (for updates)
 * @returns Generated unique slug
 */
export const generateUniqueSlug = async (
  text: string, 
  entityType: string, 
  excludeId?: number
): Promise<string> => {
  const baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let exists = false;

    switch (entityType) {
      case 'PaymentService':
        const existingPaymentService = await prisma.paymentService.findFirst({
          where: {
            slug,
            ...(excludeId && { id: { not: excludeId } })
          }
        });
        exists = !!existingPaymentService;
        break;

      case 'Offer':
        const existingOffer = await prisma.offer.findFirst({
          where: {
            slug,
            ...(excludeId && { id: { not: excludeId } })
          }
        });
        exists = !!existingOffer;
        break;

      // Add more entity types as needed
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    if (!exists) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Generate slug with entity type validation
 * @param text - The text to convert to slug
 * @param entityType - The entity type
 * @param excludeId - Optional ID to exclude from uniqueness check
 * @returns Generated unique slug
 */
export const generateSlugForEntity = async (
  text: string,
  entityType: 'PaymentService' | 'Offer' | 'User' | 'Country' | 'Currency' | 'PaymentMethod' | 'Language',
  excludeId?: number
): Promise<string> => {
  return generateUniqueSlug(text, entityType, excludeId);
};
