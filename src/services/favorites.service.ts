import { PrismaClient } from "../generated/prisma";
import { z } from "zod";
import { filterOffersSchema } from "../schemas/offers.schema";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

// Helper function to transform offer data (reused from offers.service.ts)
const transformOffer = (offer: any) => {
  const { paymentServices, ...offerWithoutPaymentServices } = offer;
  const transformed = {
    ...offerWithoutPaymentServices,
    countries: offer?.countries?.map((c: any) => c.country) || [],
    currencies: offer?.currencies?.map((c: any) => c.currency) || [],
    paymentSystemTypes: offer?.paymentSystemTypes?.[0]?.paymentSystemType || null,
    paymentMethods: offer?.paymentMethods?.map((pm: any) => pm.paymentMethod).filter((pm: any) => pm != null) || [],
    trafficSources: offer?.trafficSources?.map((t: any) => t.trafficSource) || [],
    trafficTypes: offer?.trafficTypes?.map((t: any) => t.trafficType) || [],
    connectionTypes: offer?.connectionTypes?.map((c: any) => c.connectionType) || [],
    balanceTypes: offer?.balanceTypes?.map((b: any) => b.balanceType) || [],
    paymentServices: offer?.paymentServices?.map((ps: any) => ({
      paymentServiceId: ps.paymentService.id,
      name: ps.paymentService.name,
      slug: ps.paymentService.slug
    })) || [],
    paymentServiceId: offer?.paymentServices?.[0]?.paymentService?.id || null
  };

  if (offer.id) {
    transformed.id = offer.id;
  }

  return transformed;
};

/**
 * Add payment service to user's favorites
 */
export const addToFavorites = async (userId: number, paymentServiceId: number) => {
  try {
    // Check if payment service exists and is active
    const paymentService = await prisma.paymentService.findUnique({
      where: { id: paymentServiceId }
    });

    if (!paymentService) {
      throw new Error(__('payment_service.not_found'));
    }

    // Check if already in favorites
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_paymentServiceId: {
          userId,
          paymentServiceId
        }
      }
    });

    if (existing) {
      throw new Error(__('favorites.already_added'));
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        paymentServiceId
      },
      include: {
        paymentService: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true
          }
        }
      }
    });

    return favorite;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove payment service from user's favorites
 */
export const removeFromFavorites = async (userId: number, paymentServiceId: number) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_paymentServiceId: {
          userId,
          paymentServiceId
        }
      }
    });

    if (!favorite) {
      throw new Error(__('favorites.not_found'));
    }

    await prisma.favorite.delete({
      where: {
        userId_paymentServiceId: {
          userId,
          paymentServiceId
        }
      }
    });

    return { message: __('favorites.removed_successfully') };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's favorites with the same filtering as /api/offers/filter/
 */
export const getUserFavorites = async (userId: number, filters?: z.infer<typeof filterOffersSchema>['query']) => {
  try {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;

    // Build where clause for payment services
    const where: any = { isActive: true };

    // Filter by countries
    if (filters?.countries && filters.countries.length > 0) {
      where.countries = {
        some: {
          countryId: {
            in: filters.countries
          }
        }
      };
    }

    // Filter by currencies
    if (filters?.currencies && filters.currencies.length > 0) {
      where.currencies = {
        some: {
          currencyId: {
            in: filters.currencies
          }
        }
      };
    }

    const offerConditions = [];

    // Filter by payment methods
    if (filters?.payMethods && filters.payMethods.length > 0) {
      offerConditions.push({
        paymentMethods: {
          some: {
            paymentMethodId: {
              in: filters.payMethods
            }
          }
        }
      });
    }

    // Filter by payment system types
    if (filters?.paymentSystemTypes && filters.paymentSystemTypes.length > 0) {
      offerConditions.push({
        paymentSystemTypes: {
          some: {
            paymentSystemTypeId: {
              in: filters.paymentSystemTypes
            }
          }
        }
      });
    }

    // Filter by ids
    if (filters?.ids && filters.ids.length > 0) {
      where.id = {
        in: filters.ids
      };
    }

    // Traffic volume filters
    if (filters?.trafficVolumeMin) {
      offerConditions.push({
        AND: [
          { trafficVolumeMin: { lte: Number(filters.trafficVolumeMin) } },
          { trafficVolumeMax: { gte: Number(filters.trafficVolumeMin) } }
        ]
      });
    }

    if (filters?.trafficVolumeMax) {
      offerConditions.push({
        AND: [
          { trafficVolumeMin: { lte: Number(filters.trafficVolumeMax) } },
          { trafficVolumeMax: { gte: Number(filters.trafficVolumeMax) } }
        ]
      });
    }

    // Fee filters
    if (filters?.payInMinFee) {
      offerConditions.push({ payInFee: { gte: Number(filters.payInMinFee) } });
    }
    if (filters?.payInMaxFee) {
      offerConditions.push({ payInFee: { lte: Number(filters.payInMaxFee) } });
    }
    if (filters?.payOutMinFee) {
      offerConditions.push({ payOutFee: { gte: Number(filters.payOutMinFee) } });
    }
    if (filters?.payOutMaxFee) {
      offerConditions.push({ payOutFee: { lte: Number(filters.payOutMaxFee) } });
    }

    // Limit filters
    if (filters?.payInMinLimit) {
      offerConditions.push({ payInMinLimit: { lte: Number(filters.payInMinLimit) } });
    }
    if (filters?.payInMaxLimit) {
      offerConditions.push({ payInMaxLimit: { lte: Number(filters.payInMaxLimit) } });
    }
    if (filters?.payOutMinLimit) {
      offerConditions.push({ payOutMinLimit: { lte: Number(filters.payOutMinLimit) } });
    }
    if (filters?.payOutMaxLimit) {
      offerConditions.push({ payOutMaxLimit: { lte: Number(filters.payOutMaxLimit) } });
    }

    // Offer boolean filters
    if (filters?.legalPerson && filters.legalPerson.length > 0) {
      offerConditions.push({
        legalPerson: filters.legalPerson.length === 1 ? filters.legalPerson[0] : { in: filters.legalPerson }
      });
    }

    if (filters?.support247 && filters.support247.length > 0) {
      offerConditions.push({
        support247: filters.support247.length === 1 ? filters.support247[0] : { in: filters.support247 }
      });
    }

    if (filters?.automatics && filters.automatics.length > 0) {
      offerConditions.push({
        automatics: filters.automatics.length === 1 ? filters.automatics[0] : { in: filters.automatics }
      });
    }

    // Traffic and connection filters
    if (filters?.trafficSources && filters.trafficSources.length > 0) {
      offerConditions.push({
        trafficSources: {
          some: {
            trafficSourceId: { in: filters.trafficSources }
          }
        }
      });
    }

    if (filters?.trafficTypes && filters.trafficTypes.length > 0) {
      offerConditions.push({
        trafficTypes: {
          some: {
            trafficTypeId: { in: filters.trafficTypes }
          }
        }
      });
    }

    if (filters?.balanceTypes && filters.balanceTypes.length > 0) {
      offerConditions.push({
        balanceTypes: {
          some: {
            balanceTypeId: { in: filters.balanceTypes }
          }
        }
      });
    }

    if (filters?.connectionTypes && filters.connectionTypes.length > 0) {
      offerConditions.push({
        connectionTypes: {
          some: {
            connectionTypeId: { in: filters.connectionTypes }
          }
        }
      });
    }

    // Override currency filter for offers
    if (filters?.currencies && filters.currencies.length > 0) {
      delete where.currencies;
      offerConditions.push({
        currencies: {
          some: {
            currencyId: { in: filters.currencies }
          }
        }
      });
    }

    // Search query
    if (filters?.q) {
      const searchConditions = [];

      searchConditions.push({
        name: {
          contains: filters.q,
          mode: 'insensitive'
        }
      });

      const offerNameCondition: any = {
        paymentServiceOffers: {
          some: {
            offer: {
              name: {
                contains: filters.q,
                mode: 'insensitive'
              }
            }
          }
        }
      };

      if (offerConditions.length > 0) {
        offerNameCondition.paymentServiceOffers.some.offer.AND = offerConditions;
      }

      searchConditions.push(offerNameCondition);

      const existingConditions = { ...where };
      where.AND = [
        existingConditions,
        { OR: searchConditions }
      ];
    } else if (offerConditions.length > 0) {
      where.paymentServiceOffers = {
        some: {
          offer: {
            AND: offerConditions
          }
        }
      };
    }

    // Add favorites filter - only show favorites for this user
    where.favorites = {
      some: {
        userId
      }
    };

    // Get total count
    const total = await prisma.paymentService.count({ where });

    // Build offer where clause for counting
    const offerWhere: any = { isActive: true };
    if (offerConditions.length > 0) {
      offerWhere.AND = offerConditions;
    }

    if (filters?.countries && filters.countries.length > 0) {
      offerWhere.paymentServices = {
        some: {
          paymentService: {
            isActive: true,
            countries: {
              some: {
                countryId: { in: filters.countries }
              }
            }
          }
        }
      };
    }

    if (filters?.q) {
      offerWhere.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        {
          paymentServices: {
            some: {
              paymentService: {
                name: { contains: filters.q, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    if (filters?.ids && filters.ids.length > 0) {
      offerWhere.paymentServices = {
        some: {
          paymentService: {
            id: { in: filters.ids }
          }
        }
      };
    }

    const totalOffers = await prisma.offer.count({ where: offerWhere });

    // Build orderBy
    const sortColumn = (filters?.sortColumn || 'id') as any;
    const order = (filters?.order || 'DESC').toLowerCase();

    let orderBy: any[] = [
      { isPromoted: 'desc' }
    ];

    if (String(sortColumn) === 'averageRating') {
      orderBy.push({ user: { averageRating: order } });
      orderBy.push({ user: { ratingsCount: order } });
    } else {
      orderBy.push({ [sortColumn]: order });
    }

    // Get favorites with payment services
    const paymentServices = await prisma.paymentService.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        countries: {
          include: { country: true }
        },
        currencies: {
          include: { currency: true }
        },
        paymentSystemTypes: {
          include: { paymentSystemType: true }
        },
        payInMethods: {
          where: { methodType: 'payIn' },
          include: { paymentMethod: true }
        },
        payOutMethods: {
          where: { methodType: 'payOut' },
          include: { paymentMethod: true }
        },
        supportServiceLanguages: {
          include: { language: true }
        },
        user: {
          select: {
            id: true,
            averageRating: true,
            ratingsCount: true
          }
        },
        paymentServiceOffers: {
          where: { offer: { isActive: true } },
          include: {
            offer: {
              include: {
                countries: { include: { country: true } },
                currencies: { include: { currency: true } },
                paymentSystemTypes: { include: { paymentSystemType: true } },
                paymentMethods: { include: { paymentMethod: true } },
                trafficSources: { include: { trafficSource: true } },
                trafficTypes: { include: { trafficType: true } },
                connectionTypes: { include: { connectionType: true } },
                balanceTypes: { include: { balanceType: true } },
                createdBy: {
                  select: {
                    id: true,
                    averageRating: true,
                    ratingsCount: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform payment services data (same as in filterOffersAndGetPaymentServices)
    const transformedPaymentServices = paymentServices.map(service => {
      const s = service as any;

      let filteredCountries = s.countries?.map((c: any) => c.country) || [];
      if (filters?.countries && filters.countries.length > 0) {
        filteredCountries = filteredCountries.filter((country: any) =>
          filters.countries!.includes(country.id)
        );
      }

      let filteredCurrencies = s.currencies?.map((c: any) => c.currency) || [];
      if (filters?.currencies && filters.currencies.length > 0) {
        const offerCurrencies = s.paymentServiceOffers?.flatMap((psOffer: any) =>
          psOffer.offer?.currencies?.map((c: any) => c.currency) || []
        ) || [];

        filteredCurrencies = offerCurrencies.filter((currency: any) =>
          filters.currencies!.includes(currency.id)
        );

        filteredCurrencies = filteredCurrencies.filter((currency: any, index: number, self: any) =>
          index === self.findIndex((c: any) => c.id === currency.id)
        );
      }

      let filteredPaymentSystemTypes = s.paymentSystemTypes?.map((p: any) => p.paymentSystemType) || [];
      if (filters?.paymentSystemTypes && filters.paymentSystemTypes.length > 0) {
        filteredPaymentSystemTypes = filteredPaymentSystemTypes.filter((pst: any) =>
          filters.paymentSystemTypes!.includes(pst.id)
        );
      }

      const transformedService = {
        ...service,
        countries: filteredCountries,
        currencies: filteredCurrencies,
        paymentSystemTypes: filteredPaymentSystemTypes,
        payInMethods: s.payInMethods?.map((p: any) => ({
          ...p.paymentMethod,
          methodType: p.methodType
        })) || [],
        payOutMethods: s.payOutMethods?.map((p: any) => ({
          ...p.paymentMethod,
          methodType: p.methodType
        })) || [],
        supportServiceLanguages: service.supportServiceLanguages?.map((l: any) => l.language) || [],
        offers: s.paymentServiceOffers?.map((psOffer: any) => transformOffer(psOffer.offer)) || [],
        isFavorite: true // Mark as favorite
      };

      delete (transformedService as any).paymentServiceOffers;
      delete (transformedService as any).favorites;

      return transformedService;
    });

    const pages = Math.ceil(total / limit);

    return {
      data: transformedPaymentServices.filter((s: any) => s.offers && s.offers.length > 0),
      pagination: { page, limit, total, pages },
      totalOffers,
      filters: Object.keys(filters || {}).filter(key => filters![key as keyof typeof filters] !== undefined)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Check if payment service is in user's favorites
 */
export const isFavorite = async (userId: number, paymentServiceId: number) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_paymentServiceId: {
          userId,
          paymentServiceId
        }
      }
    });

    return { isFavorite: !!favorite };
  } catch (error) {
    throw error;
  }
};

