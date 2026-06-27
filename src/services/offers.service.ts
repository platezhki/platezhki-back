import {PrismaClient} from "../generated/prisma";
import {z} from "zod";
import {getOffersSchema, filterOffersSchema} from "../schemas/offers.schema";
import {generateSlugForEntity} from "../utils/slug";
import {__} from "../utils/i18n";
import {dispatchNewOfferNotifications, dispatchOfferUpdateNotifications, diffOfferFields} from "./telegram.service";
import {saveBase64Document, deleteUploadedFile} from "../utils/file-upload";

const prisma = new PrismaClient();

const excludeFilters = ['page', 'limit'];

// Constants for reusable include configurations
const OFFER_INCLUDE_CONFIG = {
  countries: {
    include: {country: true}
  },
  currencies: {
    include: {currency: true}
  },
  paymentSystemTypes: {
    include: {paymentSystemType: true}
  },
  paymentMethods: {
    include: {paymentMethod: true}
  },
  trafficSources: {
    include: {trafficSource: true}
  },
  trafficTypes: {
    include: {trafficType: true}
  },
  connectionTypes: {
    include: {connectionType: true}
  },
  balanceTypes: {
    include: {balanceType: true}
  },
  paymentServices: {
    include: {
      paymentService: {
        select: {
          id: true,
          name: true,
          slug: true,
          user: {select: {id: true, averageRating: true, ratingsCount: true}}
        }
      }
    }
  },
  parameters: {
    orderBy: {order: 'asc'}
  },
  files: {
    orderBy: {createdAt: 'asc'}
  }
} as const;

const OFFER_INCLUDE_WITH_SETTLE_SPEED = {
  ...OFFER_INCLUDE_CONFIG,
  settleSpeed: true
} as const;

// Helper function to transform array values
const toArray = (value: any) => Array.isArray(value) ? value : (value === undefined || value === null ? [] : [value]);

const toIdArray = (value: any) => Array.from(new Set(
  toArray(value)
    .filter((v: any) => v != null && v !== undefined)
    .map((v: any) => Number(v))
    .filter((v: number) => Number.isFinite(v) && v > 0)
));

const normalizeFieldSettings = (fieldSettings: any) => {
  if (!Array.isArray(fieldSettings)) return [];
  return fieldSettings.map((fs: any, index: number) => ({
    key: String(fs.key),
    visible: fs.visible !== undefined ? Boolean(fs.visible) : true,
    order: fs.order !== undefined ? Number(fs.order) : index
  }));
};

const normalizeParameters = (parameters: any) => {
  if (!Array.isArray(parameters)) return [];
  return parameters.map((p: any, index: number) => ({
    name: String(p.name),
    value: p.value != null ? String(p.value) : '',
    order: p.order !== undefined ? Number(p.order) : index,
    isVisible: p.isVisible !== undefined ? Boolean(p.isVisible) : true
  }));
};

const saveOfferFiles = (files: any) => {
  if (!Array.isArray(files) || files.length === 0) return [];
  const saved: Array<{fileName: string; fileUrl: string; fileType: string | null; fileSize: number}> = [];
  try {
    for (const f of files) {
      saved.push(saveBase64Document(f.file, f.fileName));
    }
  } catch (error) {
    saved.forEach((s) => deleteUploadedFile(s.fileUrl));
    throw error;
  }
  return saved;
};

// Helper function to validate entity IDs
const validateEntityIds = async (ids: number[], entityName: string, prismaModel: any, errorKey: string) => {
  if (ids.length === 0) return;

  const count = await prismaModel.count({where: {id: {in: ids}}});
  if (count !== ids.length) {
    throw new Error(__(errorKey));
  }
};

// Helper function to update many-to-many relations
const updateRelation = async (
  offerId: number,
  relationModel: any,
  foreignKey: string,
  newIds: number[]
) => {
  await relationModel.deleteMany({where: {offerId}});

  if (newIds.length > 0) {
    await relationModel.createMany({
      data: newIds.map((id: number) => ({
        offerId,
        [foreignKey]: id
      }))
    });
  }
};

// Helper function to ensure payment service connection
const ensurePaymentServiceConnection = async (offerId: number, ownerId: number) => {
  const existingConnections = await prisma.paymentServiceOffer.findMany({
    where: {offerId}
  });

  if (existingConnections.length === 0) {
    const userPaymentService = await prisma.paymentService.findFirst({
      where: {
        ownerId,
        isActive: true
      }
    });

    if (userPaymentService) {
      await prisma.paymentServiceOffer.create({
        data: {
          paymentServiceId: userPaymentService.id,
          offerId
        }
      });
    }
  }
};

// Helper function to get offer with all relations
const getOfferWithRelations = async (where: any) => {
  return prisma.offer.findUnique({
    where,
    include: OFFER_INCLUDE_CONFIG
  });
};

// Helper function to transform offer data and remove duplicates
const transformOffer = (offer: any) => {
  const {paymentServices, ...offerWithoutPaymentServices} = offer;
  const transformed = {
    ...offerWithoutPaymentServices,
    // Convert BigInt fields to Number for JSON serialization
    trafficVolumeMin: offer.trafficVolumeMin != null ? Number(offer.trafficVolumeMin) : 0,
    trafficVolumeMax: offer.trafficVolumeMax != null ? Number(offer.trafficVolumeMax) : 0,
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

  // Ensure id is preserved
  if (offer.id) {
    transformed.id = offer.id;
  }

  return transformed;
};

export const createOffer = async (data: any) => {
  try {
    // Parse and validate input arrays
    const countries = toIdArray(data.countries);
    const currencies = toIdArray(data.currencies);
    const paymentSystemTypes = toIdArray(data.paymentSystemTypes);
    const paymentMethodIds = toIdArray(data.paymentMethods);
    const trafficSources = toIdArray(data.trafficSources);
    const trafficTypes = toIdArray(data.trafficTypes);
    const connectionTypes = toIdArray(data.connectionTypes);
    const balanceTypes = toIdArray(data.balanceTypes);

    const rawSettleSpeed = Number(data.settleSpeedId);
    let settleSpeedId = Number.isFinite(rawSettleSpeed) && rawSettleSpeed > 0 ? rawSettleSpeed : undefined;

    // Generate slug from name
    const slug = await generateSlugForEntity(data.name, 'Offer');

    // Find the payment service created by the same user
    const userPaymentService = await prisma.paymentService.findFirst({
      where: {
        ownerId: data.ownerId,
        isActive: true
      }
    });

    // Validate owner ID
    if (!data.ownerId) {
      throw new Error(__('offer.invalid_user_id'));
    }

    // Ensure we have a valid settleSpeedId
    if (settleSpeedId == null) {
      const firstSettleSpeed = await prisma.settleSpeed.findFirst({orderBy: {id: 'asc'}});
      if (!firstSettleSpeed) {
        throw new Error(__('offer.no_settle_speed_configured'));
      }
      settleSpeedId = firstSettleSpeed.id;
    }

    // Validate all referenced IDs in parallel
    await Promise.all([
      validateEntityIds(countries, 'Country', prisma.country, 'offer.invalid_country_ids'),
      validateEntityIds(currencies, 'Currency', prisma.currency, 'offer.invalid_currency_ids'),
      validateEntityIds(paymentSystemTypes, 'PaymentSystemType', prisma.paymentSystemType, 'offer.invalid_payment_system_type_ids'),
      validateEntityIds(paymentMethodIds, 'PaymentMethod', prisma.paymentMethod, 'offer.invalid_payment_method_ids'),
      validateEntityIds(trafficSources, 'TrafficSource', prisma.trafficSource, 'offer.invalid_traffic_source_ids'),
      validateEntityIds(trafficTypes, 'TrafficType', prisma.trafficType, 'offer.invalid_traffic_type_ids'),
      validateEntityIds(connectionTypes, 'ConnectionType', prisma.connectionType, 'offer.invalid_connection_type_ids'),
      validateEntityIds(balanceTypes, 'BalanceType', prisma.balanceType, 'offer.invalid_balance_type_ids'),
      validateEntityIds([settleSpeedId], 'SettleSpeed', prisma.settleSpeed, 'offer.invalid_settle_speed_id'),
      validateEntityIds([data.ownerId], 'User', prisma.user, 'offer.invalid_user_id')
    ]);

    const savedFiles = saveOfferFiles(data.files);

    const parameters = normalizeParameters(data.parameters);

    // Create offer with relations
    const offer = await prisma.offer.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        merchantOnly: data.merchantOnly ?? false,
        fieldSettings: normalizeFieldSettings(data.fieldSettings),
        countries: {create: countries.map((countryId: number) => ({countryId}))},
        currencies: {create: currencies.map((currencyId: number) => ({currencyId}))},
        paymentSystemTypes: {create: paymentSystemTypes.map((paymentSystemTypeId: number) => ({paymentSystemTypeId}))},
        paymentMethods: {create: paymentMethodIds.map((paymentMethodId: number) => ({paymentMethodId}))},
        trafficVolumeMin: BigInt(data.trafficVolumeMin ?? 0),
        trafficVolumeMax: BigInt(data.trafficVolumeMax ?? 0),
        payInFee: data.payInFee,
        payOutFee: data.payOutFee,
        payInMinLimit: data.payInMinLimit,
        payInMaxLimit: data.payInMaxLimit,
        payOutMinLimit: data.payOutMinLimit,
        payOutMaxLimit: data.payOutMaxLimit,
        support247: data.support247,
        settleSpeedId,
        trafficSources: {create: trafficSources.map((trafficSourceId: number) => ({trafficSourceId}))},
        trafficTypes: {create: trafficTypes.map((trafficTypeId: number) => ({trafficTypeId}))},
        balanceTypes: {create: balanceTypes.map((balanceTypeId: number) => ({balanceTypeId}))},
        connectionTypes: {create: connectionTypes.map((connectionTypeId: number) => ({connectionTypeId}))},
        legalPerson: data.legalPerson,
        automatics: data.automatics,
        slug,
        isActive: data.isActive ?? true,
        ownerId: data.ownerId,
        paymentServices: userPaymentService ? {
          create: [{paymentServiceId: userPaymentService.id}]
        } : undefined,
        parameters: parameters.length > 0 ? {create: parameters} : undefined,
        files: savedFiles.length > 0 ? {create: savedFiles} : undefined,
      },
      include: OFFER_INCLUDE_CONFIG
    });

    // Notify subscribers (Telegram). Fire-and-forget; safe to skip if the
    // offer is created in inactive state.
    if (offer.isActive) {
      dispatchNewOfferNotifications(offer);
    }

    return transformOffer(offer);
  } catch (error) {
    throw error;
  }
};

// Helper function to build where clause for offers
const buildOffersWhereClause = (filters?: any) => {
  const where: any = {};

  if (filters?.isActive !== undefined) {
    where.isActive = Boolean(filters.isActive);
  }

  if (filters?.countryId && filters.countryId.length > 0) {
    where.countries = {
      some: {
        countryId: {in: filters.countryId}
      }
    };
  }

  if (filters?.currencyId && filters.currencyId.length > 0) {
    where.currencies = {
      some: {
        currencyId: {in: filters.currencyId}
      }
    };
  }

  if (filters?.paymentMethodId && filters.paymentMethodId.length > 0) {
    where.paymentMethods = {
      some: {
        paymentMethodId: {in: filters.paymentMethodId}
      }
    };
  }

  if (filters?.paymentSystemTypeId && filters.paymentSystemTypeId.length > 0) {
    where.paymentSystemTypes = {
      some: {
        paymentSystemTypeId: {in: filters.paymentSystemTypeId}
      }
    };
  }

  if (filters?.trafficSourceId && filters.trafficSourceId.length > 0) {
    where.trafficSources = {
      some: {
        trafficSourceId: {in: filters.trafficSourceId}
      }
    };
  }

  if (filters?.trafficTypeId && filters.trafficTypeId.length > 0) {
    where.trafficTypes = {
      some: {
        trafficTypeId: {in: filters.trafficTypeId}
      }
    };
  }

  if (filters?.connectionTypeId && filters.connectionTypeId.length > 0) {
    where.connectionTypes = {
      some: {
        connectionTypeId: {in: filters.connectionTypeId}
      }
    };
  }

  if (filters?.q) {
    where.name = {
      contains: filters.q,
      mode: 'insensitive'
    };
  }

  return where;
};

export const getOffers = async (filters?: z.infer<typeof getOffersSchema>['query']) => {
  try {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause using helper
    const where = buildOffersWhereClause(filters);

    // Build orderBy clause
    const sortColumn = filters?.sort_column || 'name';
    const order = filters?.order || 'asc';
    const orderBy: any = {[sortColumn]: order};

    // Get total count
    const total = await prisma.offer.count({where});

    // Get offers with relations
    const offers = await prisma.offer.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: OFFER_INCLUDE_CONFIG
    });

    // Transform the response
    const cleanedOffers = offers.map(offer => transformOffer(offer));

    const pages = Math.ceil(total / limit);

    return {
      data: cleanedOffers,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      filters: Object.keys(filters || {}).filter(key => filters![key as keyof typeof filters] !== undefined && !excludeFilters.includes(key))
    };
  } catch (error) {
    throw error;
  }
};

export const getOfferById = async (id: number) => {
  try {
    const offer = await getOfferWithRelations({id});

    if (!offer) {
      throw new Error(__('offer.not_found'));
    }

    return transformOffer(offer);
  } catch (error) {
    throw error;
  }
};

export const getOfferBySlug = async (slug: string) => {
  try {
    const offer = await getOfferWithRelations({slug});

    if (!offer) {
      throw new Error(__('offer.not_found'));
    }

    return transformOffer(offer);
  } catch (error) {
    throw error;
  }
};

export const updateOffer = async (id: number, data: any) => {
  try {
    // Check if offer exists
    const existingOffer = await prisma.offer.findUnique({
      where: {id}
    });

    if (!existingOffer) {
      throw new Error(__('offer.not_found'));
    }

    // Generate slug if name is being updated
    let slug = existingOffer.slug;
    if (data.name && data.name !== existingOffer.name) {
      slug = data.slug || await generateSlugForEntity(data.name, 'Offer', id);
    } else if (data.slug) {
      slug = data.slug;
    }

    // Update offer
    await prisma.offer.update({
      where: {id},
      data: {
        name: data.name || existingOffer.name,
        description: data.description !== undefined ? data.description : existingOffer.description,
        merchantOnly: data.merchantOnly ?? existingOffer.merchantOnly,
        fieldSettings: data.fieldSettings !== undefined ? normalizeFieldSettings(data.fieldSettings) : (existingOffer.fieldSettings as any),
        slug,
        trafficVolumeMin: BigInt(data.trafficVolumeMin ?? existingOffer.trafficVolumeMin ?? 0),
        trafficVolumeMax: BigInt(data.trafficVolumeMax ?? existingOffer.trafficVolumeMax ?? 0),
        payInFee: data.payInFee ?? existingOffer.payInFee,
        payOutFee: data.payOutFee ?? existingOffer.payOutFee,
        settleSpeedId: data.settleSpeedId ?? existingOffer.settleSpeedId,
        payInMinLimit: data.payInMinLimit ?? existingOffer.payInMinLimit,
        payInMaxLimit: data.payInMaxLimit ?? existingOffer.payInMaxLimit,
        payOutMinLimit: data.payOutMinLimit ?? existingOffer.payOutMinLimit,
        payOutMaxLimit: data.payOutMaxLimit ?? existingOffer.payOutMaxLimit,
        support247: data.support247 ?? existingOffer.support247,
        automatics: data.automatics ?? existingOffer.automatics,
        legalPerson: data.legalPerson ?? existingOffer.legalPerson,
        isActive: data.isActive ?? existingOffer.isActive,
      }
    });

    // Handle relation updates if provided
    const relationUpdates = [
      {field: 'countries', model: prisma.offerCountry, foreignKey: 'countryId'},
      {field: 'currencies', model: prisma.offerCurrency, foreignKey: 'currencyId'},
      {field: 'paymentSystemTypes', model: prisma.offerPaymentSystemType, foreignKey: 'paymentSystemTypeId'},
      {field: 'trafficSources', model: prisma.offerTrafficSource, foreignKey: 'trafficSourceId'},
      {field: 'trafficTypes', model: prisma.offerTrafficType, foreignKey: 'trafficTypeId'},
      {field: 'connectionTypes', model: prisma.offerConnectionType, foreignKey: 'connectionTypeId'},
      {field: 'balanceTypes', model: prisma.offerBalanceType, foreignKey: 'balanceTypeId'},
      {field: 'paymentMethods', model: prisma.offerPaymentMethod, foreignKey: 'paymentMethodId'}
    ];

    for (const {field, model, foreignKey} of relationUpdates) {
      if (data[field]) {
        await updateRelation(id, model, foreignKey, data[field]);
      }
    }

    if (data.parameters !== undefined) {
      const parameters = normalizeParameters(data.parameters);
      await prisma.offerParameter.deleteMany({where: {offerId: id}});
      if (parameters.length > 0) {
        await prisma.offerParameter.createMany({
          data: parameters.map((p) => ({...p, offerId: id}))
        });
      }
    }

    if (data.files !== undefined && Array.isArray(data.files) && data.files.length > 0) {
      const savedFiles = saveOfferFiles(data.files);
      await prisma.offerFile.createMany({
        data: savedFiles.map((f) => ({...f, offerId: id}))
      });
    }

    // Ensure payment service connection
    await ensurePaymentServiceConnection(id, existingOffer.ownerId);

    // Get the final updated offer with all relations
    const finalOffer = await getOfferWithRelations({id});

    // Notify subscribers of favorited payment services about meaningful
    // changes. Skipped for inactive offers and when nothing material changed.
    if (finalOffer?.isActive && existingOffer.isActive) {
      const changedFields = diffOfferFields(existingOffer, finalOffer);
      if (changedFields.length) {
        dispatchOfferUpdateNotifications(finalOffer, changedFields);
      }
    }

    return transformOffer(finalOffer);
  } catch (error) {
    throw error;
  }
};

// Helper function to update offer status
const updateOfferStatus = async (id: number, isActive: boolean, errorKey: string) => {
  const existingOffer = await prisma.offer.findUnique({
    where: {id}
  });

  if (!existingOffer) {
    throw new Error(__('offer.not_found'));
  }

  if (existingOffer.isActive === isActive) {
    throw new Error(__(errorKey));
  }

  await ensurePaymentServiceConnection(id, existingOffer.ownerId);

  const updatedOffer = await prisma.offer.update({
    where: {id},
    data: {isActive},
    include: OFFER_INCLUDE_CONFIG
  });

  // Treat activation (inactive -> active) as a publish event so subscribers
  // also get notified for offers that were created in draft state.
  if (isActive && !existingOffer.isActive) {
    dispatchNewOfferNotifications(updatedOffer);
  }

  return transformOffer(updatedOffer);
};

export const activateOffer = async (id: number) => {
  try {
    return await updateOfferStatus(id, true, 'offer.already_active');
  } catch (error) {
    throw error;
  }
};

export const deactivateOffer = async (id: number) => {
  try {
    return await updateOfferStatus(id, false, 'offer.already_inactive');
  } catch (error) {
    throw error;
  }
};

export const deleteOffer = async (id: number) => {
  try {
    const existingOffer = await prisma.offer.findUnique({
      where: {id}
    });

    if (!existingOffer) {
      throw new Error(__('offer.not_found'));
    }

    const offerFiles = await prisma.offerFile.findMany({where: {offerId: id}});

    // Delete all related records in parallel
    await Promise.all([
      prisma.offerCountry.deleteMany({where: {offerId: id}}),
      prisma.offerCurrency.deleteMany({where: {offerId: id}}),
      prisma.offerPaymentSystemType.deleteMany({where: {offerId: id}}),
      prisma.offerTrafficSource.deleteMany({where: {offerId: id}}),
      prisma.offerTrafficType.deleteMany({where: {offerId: id}}),
      prisma.offerConnectionType.deleteMany({where: {offerId: id}}),
      prisma.offerBalanceType.deleteMany({where: {offerId: id}}),
      prisma.offerPaymentMethod.deleteMany({where: {offerId: id}}),
      prisma.paymentServiceOffer.deleteMany({where: {offerId: id}}),
      prisma.offerParameter.deleteMany({where: {offerId: id}}),
      prisma.offerFile.deleteMany({where: {offerId: id}})
    ]);

    offerFiles.forEach((f) => deleteUploadedFile(f.fileUrl));

    // Now delete the offer
    await prisma.offer.delete({
      where: {id}
    });

    return {message: __('offer.deleted_successfully')};
  } catch (error) {
    throw error;
  }
};

export const getUserOffers = async (ownerId: number, filters?: z.infer<typeof getOffersSchema>['query']) => {
  try {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {ownerId};

    if (filters?.isActive !== undefined) {
      where.isActive = Boolean(filters.isActive);
    }

    // Filter by currencies if provided
    if (filters?.currencyId && filters.currencyId.length > 0) {
      where.currencies = {
        some: {
          currencyId: {
            in: filters.currencyId
          }
        }
      };
    }

    // Filter by name search if provided
    if (filters?.q) {
      where.name = {
        contains: filters.q,
        mode: 'insensitive'
      };
    }

    // Build orderBy clause
    const sortColumn = filters?.sort_column || 'name';
    const order = filters?.order || 'asc';
    const orderBy: any = {};
    orderBy[sortColumn] = order;

    // Get total count
    const total = await prisma.offer.count({where});

    // Get offers with relations
    const offers = await prisma.offer.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: OFFER_INCLUDE_WITH_SETTLE_SPEED
    });

    // Transform the response to remove duplicates and clean up structure
    const cleanedOffers = offers.map(offer => transformOffer(offer));

    const pages = Math.ceil(total / limit);

    return {
      data: cleanedOffers,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  } catch (error) {
    throw error;
  }
};

export const filterOffersAndGetPaymentServices = async (filters?: z.infer<typeof filterOffersSchema>['query'], userId?: number) => {
  try {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;

    // For client-side filtering, we need to fetch all items first
    // then apply pagination after filtering

    // Build where clause for payment services (not offers)
    const where: any = {isActive: true};

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

    // Filter by countries - require the matched offer itself to cover at least one of the specified countries.
    // Filtering on the payment service profile alone would let services through that list a country
    // but have no active offer for it.
    if (filters?.countries && filters.countries.length > 0) {
      offerConditions.push({
        countries: {
          some: {
            countryId: {
              in: filters.countries
            }
          }
        }
      });
    }

    // Filter by payment method ids attached to payment services (payIn / payOut)
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

    // // Filter by offer name and payment service name search
    // if (filters?.q) {
    //     offerConditions.push({
    //         OR: [
    //                 {
    //                     offer: {
    //                         name: {
    //                             contains: filters.q,
    //                             mode: 'insensitive'
    //                         }
    //                     }
    //                 },
    //                 {
    //                     paymentService: {
    //                         name: {
    //                             contains: filters.q,
    //                             mode: 'insensitive'
    //                         }
    //                     }
    //                 }
    //             ]
    //         });
    // }

    // Filter by name search
    if (filters?.ids && filters.ids.length > 0) {
      where.id = {
        in: filters.ids
      };
    }

    // Filter by traffic volume min - find payment services that have offers where user's requirement falls within offer's range
    // (user wants traffic volume at least X, so offer's max should be >= X AND offer's min should be <= X)
    if (filters?.trafficVolumeMin) {
      offerConditions.push({
        AND: [
          {
            trafficVolumeMin: {
              lte: BigInt(filters.trafficVolumeMin)
            }
          },
          {
            trafficVolumeMax: {
              gte: BigInt(filters.trafficVolumeMin)
            }
          }
        ]
      });
    }

    // Filter by traffic volume max - find payment services that have offers where user's requirement falls within offer's range
    // (user wants traffic volume at most X, so offer's min should be <= X AND offer's max should be >= X)
    if (filters?.trafficVolumeMax) {
      offerConditions.push({
        AND: [
          {
            trafficVolumeMin: {
              lte: BigInt(filters.trafficVolumeMax)
            }
          },
          {
            trafficVolumeMax: {
              gte: BigInt(filters.trafficVolumeMax)
            }
          }
        ]
      });
    }

    // Filter by pay in min fee - filter payment services that have offers with payInFee >= filter value
    if (filters?.payInMinFee) {
      offerConditions.push({
        payInFee: {
          gte: Number(filters.payInMinFee)
        }
      });
    }

    // Filter by pay in max fee - filter payment services that have offers with payInFee <= filter value
    if (filters?.payInMaxFee) {
      offerConditions.push({
        payInFee: {
          lte: Number(filters.payInMaxFee)
        }
      });
    }

    // Filter by pay out min fee - filter payment services that have offers with payOutFee >= filter value
    if (filters?.payOutMinFee) {
      offerConditions.push({
        payOutFee: {
          gte: Number(filters.payOutMinFee)
        }
      });
    }

    // Filter by pay out max fee - filter payment services that have offers with payOutFee <= filter value
    if (filters?.payOutMaxFee) {
      offerConditions.push({
        payOutFee: {
          lte: Number(filters.payOutMaxFee)
        }
      });
    }

    // Filter by pay in min limit - filter payment services that have offers with payInMinLimit <= filter value
    // (user wants to pay in at least X, so offer's min limit should be <= X)
    if (filters?.payInMinLimit) {
      offerConditions.push({
        payInMinLimit: {
          lte: Number(filters.payInMinLimit)
        }
      });
    }

    // Filter by pay in max limit - exclude offers whose upper bound exceeds the provided maximum
    // (user wants max allowed to be X, so offer's payInMaxLimit should be <= X)
    if (filters?.payInMaxLimit) {
      offerConditions.push({
        payInMaxLimit: {
          lte: Number(filters.payInMaxLimit)
        }
      });
    }

    // Filter by pay out min limit - filter payment services that have offers with payOutMinLimit <= filter value
    // (user wants to pay out at least X, so offer's min limit should be <= X)
    if (filters?.payOutMinLimit) {
      offerConditions.push({
        payOutMinLimit: {
          lte: Number(filters.payOutMinLimit)
        }
      });
    }

    // Filter by pay out max limit - exclude offers whose upper bound exceeds the provided maximum
    // (user wants max allowed to be X, so offer's payOutMaxLimit should be <= X)
    if (filters?.payOutMaxLimit) {
      offerConditions.push({
        payOutMaxLimit: {
          lte: Number(filters.payOutMaxLimit)
        }
      });
    }

    // Filter by offer fields - these filter payment services that have offers with these characteristics
    if (filters?.legalPerson && filters.legalPerson.length > 0) {
      offerConditions.push({
        legalPerson: filters.legalPerson.length === 1 ?
          filters.legalPerson[0] :
          {in: filters.legalPerson}
      });
    }

    if (filters?.support247 && filters.support247.length > 0) {
      offerConditions.push({
        support247: filters.support247.length === 1 ?
          filters.support247[0] :
          {in: filters.support247}
      });
    }

    if (filters?.automatics && filters.automatics.length > 0) {
      offerConditions.push({
        automatics: filters.automatics.length === 1 ?
          filters.automatics[0] :
          {in: filters.automatics}
      });
    }

    if (filters?.trafficSources && filters.trafficSources.length > 0) {
      offerConditions.push({
        trafficSources: {
          some: {
            trafficSourceId: {
              in: filters.trafficSources
            }
          }
        }
      });
    }

    if (filters?.trafficTypes && filters.trafficTypes.length > 0) {
      offerConditions.push({
        trafficTypes: {
          some: {
            trafficTypeId: {
              in: filters.trafficTypes
            }
          }
        }
      });
    }

    if (filters?.balanceTypes && filters.balanceTypes.length > 0) {
      offerConditions.push({
        balanceTypes: {
          some: {
            balanceTypeId: {
              in: filters.balanceTypes
            }
          }
        }
      });
    }

    if (filters?.connectionTypes && filters.connectionTypes.length > 0) {
      offerConditions.push({
        connectionTypes: {
          some: {
            connectionTypeId: {
              in: filters.connectionTypes
            }
          }
        }
      });
    }

    // Filter by offer currencies - this should override the payment service currency filter
    if (filters?.currencies && filters.currencies.length > 0) {
      // Remove the payment service currency filter and use offer currency filter instead
      delete where.currencies;
      offerConditions.push({
        currencies: {
          some: {
            currencyId: {
              in: filters.currencies
            }
          }
        }
      });
    }

    // Build the base offer condition: always require at least one active offer
    const baseOfferCondition: any = { isActive: true };

    // Add additional offer filter conditions if any
    if (offerConditions.length > 0) {
      baseOfferCondition.AND = offerConditions;
    }

    // Handle search query - search both payment service names and offer names
    if (filters?.q) {
      // If we have a search query, we need to restructure the where clause
      // to support OR logic between payment service name and offer names
      const searchConditions = [];

      // Search by payment service name (but still must have active offers)
      searchConditions.push({
        name: {
          contains: filters.q,
          mode: 'insensitive'
        },
        paymentServiceOffers: {
          some: {
            offer: baseOfferCondition
          }
        }
      });

      // Search by offer name (with all offer conditions)
      const offerNameFilter: any = {
        ...baseOfferCondition,
        name: {
          contains: filters.q,
          mode: 'insensitive'
        }
      };

      searchConditions.push({
        paymentServiceOffers: {
          some: {
            offer: offerNameFilter
          }
        }
      });

      // Combine search with existing where conditions using AND
      const existingConditions = {...where};
      where.AND = [
        existingConditions,
        {OR: searchConditions}
      ];
    } else {
      // No search query - always require at least one active offer matching conditions
      where.paymentServiceOffers = {
        some: {
          offer: baseOfferCondition
        }
      };
    }

    // Get total count of payment services (DB-side filtered)
    const total = await prisma.paymentService.count({where});

    // Build offer where clause for counting total matching offers
    const offerWhere: any = {isActive: true};

    // Apply offer-specific filters (countries are now part of offerConditions and matched against the offer itself)
    if (offerConditions.length > 0) {
      offerWhere.AND = offerConditions;
    }

    // Apply search query to offers
    if (filters?.q) {
      offerWhere.OR = [
        {name: {contains: filters.q, mode: 'insensitive'}},
        {
          paymentServices: {
            some: {
              paymentService: {
                name: {contains: filters.q, mode: 'insensitive'}
              }
            }
          }
        }
      ];
    }

    // Apply ids filter to offers
    if (filters?.ids && filters.ids.length > 0) {
      offerWhere.paymentServices = {
        some: {
          paymentService: {
            id: {in: filters.ids}
          }
        }
      };
    }

    // Get total count of offers matching the filters
    const totalOffers = await prisma.offer.count({where: offerWhere});

    // Build orderBy clause for sorting (support sorting by owner average rating via nested relation)
    const sortColumn = (filters?.sortColumn || 'id') as any;
    const order = (filters?.order || 'DESC').toLowerCase();

    // Build orderBy array: isPromoted first (DESC = true first, false last), then user's sorting
    let orderBy: any[] = [
      { isPromoted: 'desc' }  // Promoted items first
    ];

    // Add user's sorting preference
    if (String(sortColumn) === 'averageRating') {
      orderBy.push({ user: { averageRating: order } });
      orderBy.push({ user: { ratingsCount: order } });
    } else {
      orderBy.push({ [sortColumn]: order });
    }

    // Get payment services with relations (DB-side pagination + sorting)
    const paymentServices = await prisma.paymentService.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: ({
        countries: {
          include: {country: true}
        },
        currencies: {
          include: {currency: true}
        },
        paymentSystemTypes: {
          include: {paymentSystemType: true}
        },
        payInMethods: {
          where: {methodType: 'payIn'},
          include: {paymentMethod: true}
        },
        payOutMethods: {
          where: {methodType: 'payOut'},
          include: {paymentMethod: true}
        },
        supportServiceLanguages: {
          include: {language: true}
        },
        // include owner user data to get denormalized averageRating/ratingsCount
        user: {
          select: {
            id: true,
            averageRating: true,
            ratingsCount: true
          }
        },
        // Include favorites ONLY for current user if userId is provided
        favorites: userId ? {
          where: {
            userId: userId
          }
        } : false,
        paymentServiceOffers: {
          where: {offer: baseOfferCondition},
          include: {
            offer: {
              include: {
                countries: {include: {country: true}},
                currencies: {include: {currency: true}},
                paymentSystemTypes: {include: {paymentSystemType: true}},
                paymentMethods: {include: {paymentMethod: true}},
                trafficSources: {include: {trafficSource: true}},
                trafficTypes: {include: {trafficType: true}},
                connectionTypes: {include: {connectionType: true}},
                balanceTypes: {include: {balanceType: true}},
                // include offer creator denormalized rating fields
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
      } as any)
    });

    // Transform payment services data
    // Capture userId before map to avoid scope issues
    const currentUserId = userId;
    const transformedPaymentServices = paymentServices.map(service => {
      const s = service as any; // relax typings for runtime fields included via `include as any`

      // Filter countries based on filter criteria
      let filteredCountries = s.countries?.map((c: any) => c.country) || [];
      if (filters?.countries && filters.countries.length > 0) {
        filteredCountries = filteredCountries.filter((country: any) =>
          filters.countries!.includes(country.id)
        );
      }

      // Filter currencies based on filter criteria
      let filteredCurrencies = s.currencies?.map((c: any) => c.currency) || [];
      if (filters?.currencies && filters.currencies.length > 0) {
        // If filtering by offer currencies, show currencies from the offers instead
        const offerCurrencies = s.paymentServiceOffers?.flatMap((psOffer: any) =>
          psOffer.offer?.currencies?.map((c: any) => c.currency) || []
        ) || [];

        // Filter to only show currencies that match the filter
        filteredCurrencies = offerCurrencies.filter((currency: any) =>
          filters.currencies!.includes(currency.id)
        );

        // Remove duplicates
        filteredCurrencies = filteredCurrencies.filter((currency: any, index: number, self: any) =>
          index === self.findIndex((c: any) => c.id === currency.id)
        );
      }

      // Filter payment system types based on filter criteria
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
        isFavorite: currentUserId ? (s.favorites && s.favorites.length > 0) : undefined
      };

      // Remove the paymentServiceOffers and favorites fields
      delete (transformedService as any).paymentServiceOffers;
      delete (transformedService as any).favorites;

      return transformedService;
    });

    // At this point DB already applied pagination; use `total` for pages
    const pages = Math.ceil(total / limit);

    return {
      data: transformedPaymentServices,
      pagination: {page, limit, total, pages},
      totalOffers,
      filters: Object.keys(filters || {}).filter(key => filters![key as keyof typeof filters] !== undefined)
    };
  } catch (error) {
    throw error;
  }
};

export const getOfferRanges = async () => {
  try {
    // Get all offers with the fields we need for ranges
    const offers = await prisma.offer.findMany({
      select: {
        payInFee: true,
        payOutFee: true,
        trafficVolumeMin: true,
        trafficVolumeMax: true,
        payInMinLimit: true,
        payInMaxLimit: true,
        payOutMinLimit: true,
        payOutMaxLimit: true,
      }
    });

    // Helper to calculate range from values
    const calculateRange = (values: (number | null)[]) => {
      const filtered = values.filter(v => v !== null) as number[];
      if (filtered.length === 0) return null;
      return {
        min: Math.min(...filtered),
        max: Math.max(...filtered)
      };
    };

    // Calculate ranges for all fields
    const ranges: any = {};

    const trafficVolumeRange = calculateRange([
      ...offers.map(o => o.trafficVolumeMin != null ? Number(o.trafficVolumeMin) : null),
      ...offers.map(o => o.trafficVolumeMax != null ? Number(o.trafficVolumeMax) : null)
    ]);
    if (trafficVolumeRange) ranges.trafficVolume = trafficVolumeRange;

    const payInFeeRange = calculateRange(offers.map(o => o.payInFee));
    if (payInFeeRange) ranges.payInFee = payInFeeRange;

    const payOutFeeRange = calculateRange(offers.map(o => o.payOutFee));
    if (payOutFeeRange) ranges.payOutFee = payOutFeeRange;

    const payInLimitRange = calculateRange([
      ...offers.map(o => o.payInMinLimit),
      ...offers.map(o => o.payInMaxLimit)
    ]);
    if (payInLimitRange) ranges.payInLimit = payInLimitRange;

    const payOutLimitRange = calculateRange([
      ...offers.map(o => o.payOutMinLimit),
      ...offers.map(o => o.payOutMaxLimit)
    ]);
    if (payOutLimitRange) ranges.payOutLimit = payOutLimitRange;

    return ranges;
  } catch (error) {
    throw error;
  }
};

export const getOfferFiles = async (offerId: number) => {
  const offer = await prisma.offer.findUnique({where: {id: offerId}});
  if (!offer) {
    throw new Error(__('offer.not_found'));
  }
  return prisma.offerFile.findMany({
    where: {offerId},
    orderBy: {createdAt: 'asc'}
  });
};

export const addOfferFiles = async (offerId: number, files: any) => {
  const offer = await prisma.offer.findUnique({where: {id: offerId}});
  if (!offer) {
    throw new Error(__('offer.not_found'));
  }

  const savedFiles = saveOfferFiles(files);

  await prisma.offerFile.createMany({
    data: savedFiles.map((f) => ({...f, offerId}))
  });

  return prisma.offerFile.findMany({
    where: {offerId},
    orderBy: {createdAt: 'asc'}
  });
};

export const getOfferFile = async (offerId: number, fileId: number) => {
  const file = await prisma.offerFile.findFirst({
    where: {id: fileId, offerId}
  });
  if (!file) {
    throw new Error(__('offer.file_not_found'));
  }
  return file;
};

export const deleteOfferFile = async (offerId: number, fileId: number) => {
  const file = await prisma.offerFile.findFirst({
    where: {id: fileId, offerId}
  });
  if (!file) {
    throw new Error(__('offer.file_not_found'));
  }

  await prisma.offerFile.delete({where: {id: fileId}});
  deleteUploadedFile(file.fileUrl);

  return {message: __('offer.file_deleted_successfully')};
};
