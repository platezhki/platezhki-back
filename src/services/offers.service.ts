import { PrismaClient } from "../generated/prisma";
import { z } from "zod";
import { getOffersSchema, filterOffersSchema } from "../schemas/offers.schema";
import { generateSlugForEntity } from "../utils/slug";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

const excludeFilters = ['page', 'limit'];

// Helper function to transform offer data and remove duplicates
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

    // Ensure id is preserved
    if (offer.id) {
        transformed.id = offer.id;
    }

    return transformed;
};

export const createOffer = async (data: any) => {
    try {
        const toArray = (value: any) => Array.isArray(value) ? value : (value === undefined || value === null ? [] : [value]);
        const toIdArray = (value: any) => Array.from(new Set(
            toArray(value)
                .filter((v: any) => v != null && v !== undefined)
                .map((v: any) => Number(v))
                .filter((v: number) => Number.isFinite(v) && v > 0)
        ));
        const countries = toIdArray(data.countries);
        const currencies = toIdArray(data.currencies);
        const paymentSystemTypes = toIdArray(data.paymentSystemTypes ?? data.paymentSystemTypeId);
        const paymentMethodIds = toIdArray(data.paymentMethodId);
        const trafficSources = toIdArray(data.trafficSources);
        const trafficTypes = toIdArray(data.trafficTypes);
        const connectionTypes = toIdArray(data.connectionTypes);
        const balanceTypes = toIdArray(data.balanceTypes);
        const rawSettleSpeed = Number(data.settleSpeedId ?? data.settleSpeeds);
        let settleSpeedId = Number.isFinite(rawSettleSpeed) && rawSettleSpeed > 0 ? rawSettleSpeed : undefined;
        // Generate slug from name (with unique counter if needed)
        const slug = await generateSlugForEntity(data.name, 'Offer');

        // Find the payment service created by the same user
        const userPaymentService = await prisma.paymentService.findFirst({
            where: {
                ownerId: data.ownerId,
                isActive: true
            }
        });


        // Validate referenced IDs to avoid FK violations
        if (!data.ownerId) {
            throw new Error(__('offer.invalid_user_id'));
        }
        // Ensure we have a valid settleSpeedId; fallback to first available to avoid FK with default
        if (settleSpeedId == null) {
            const firstSettleSpeed = await prisma.settleSpeed.findFirst({ orderBy: { id: 'asc' } });
            if (!firstSettleSpeed) {
                throw new Error(__('offer.no_settle_speed_configured'));
            }
            settleSpeedId = firstSettleSpeed.id;
        }

        const [
            countriesCount,
            currenciesCount,
            pstCount,
            pmCount,
            tsCount,
            ttCount,
            ctCount,
            btCount,
            settleSpeedExists,
            ownerExists,
        ] = await Promise.all([
            prisma.country.count({ where: { id: { in: countries } } }),
            prisma.currency.count({ where: { id: { in: currencies } } }),
            prisma.paymentSystemType.count({ where: { id: { in: paymentSystemTypes } } }),
            prisma.paymentMethod.count({ where: { id: { in: paymentMethodIds } } }),
            prisma.trafficSource.count({ where: { id: { in: trafficSources } } }),
            prisma.trafficType.count({ where: { id: { in: trafficTypes } } }),
            prisma.connectionType.count({ where: { id: { in: connectionTypes } } }),
            prisma.balanceType.count({ where: { id: { in: balanceTypes } } }),
            prisma.settleSpeed.count({ where: { id: settleSpeedId } }),
            prisma.user.count({ where: { id: data.ownerId } }),
        ]);

        if (countriesCount !== countries.length) throw new Error(__('offer.invalid_country_ids'));
        if (currenciesCount !== currencies.length) throw new Error(__('offer.invalid_currency_ids'));
        if (pstCount !== paymentSystemTypes.length) throw new Error(__('offer.invalid_payment_system_type_ids'));
        if (pmCount !== paymentMethodIds.length) throw new Error(__('offer.invalid_payment_method_ids'));
        if (tsCount !== trafficSources.length) throw new Error(__('offer.invalid_traffic_source_ids'));
        if (ttCount !== trafficTypes.length) throw new Error(__('offer.invalid_traffic_type_ids'));
        if (ctCount !== connectionTypes.length) throw new Error(__('offer.invalid_connection_type_ids'));
        if (btCount !== balanceTypes.length) throw new Error(__('offer.invalid_balance_type_ids'));
        if (settleSpeedExists !== 1) throw new Error(__('offer.invalid_settle_speed_id'));
        if (ownerExists !== 1) throw new Error(__('offer.invalid_user_id'));

        // Create offer with relations
        const offer = await prisma.offer.create({
            data: {
                name: data.name,
                countries: { create: countries.map((countryId: number) => ({ countryId })) },
                currencies: { create: currencies.map((currencyId: number) => ({ currencyId })) },
                paymentSystemTypes: { create: paymentSystemTypes.map((paymentSystemTypeId: number) => ({ paymentSystemTypeId })) },
                paymentMethods: { create: paymentMethodIds.map((paymentMethodId: number) => ({ paymentMethodId })) },
                trafficVolumeMin: data.trafficVolumeMin,
                trafficVolumeMax: data.trafficVolumeMax,
                payInFee: data.payInFee,
                payOutFee: data.payOutFee,
                payInMinLimit: data.payInMinLimit,
                payInMaxLimit: data.payInMaxLimit,
                payOutMinLimit: data.payOutMinLimit,
                payOutMaxLimit: data.payOutMaxLimit,
                support247: data.support247,
                settleSpeedId,
                trafficSources: { create: trafficSources.map((trafficSourceId: number) => ({ trafficSourceId })) },
                trafficTypes: { create: trafficTypes.map((trafficTypeId: number) => ({ trafficTypeId })) },
                balanceTypes: { create: balanceTypes.map((balanceTypeId: number) => ({ balanceTypeId })) },
                connectionTypes: { create: connectionTypes.map((connectionTypeId: number) => ({ connectionTypeId })) },
                legalPerson: data.legalPerson,
                automatics: data.automatics,
                slug,
                isActive: data.isActive ?? true,
                ownerId: data.ownerId,
                // Automatically connect to user's payment service if it exists
                paymentServices: userPaymentService ? {
                    create: [{ paymentServiceId: userPaymentService.id }]
                } : undefined,
            },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformOffer(offer);
    } catch (error) {
        throw error;
    }
};

export const getOffers = async (filters?: z.infer<typeof getOffersSchema>['query']) => {
    try {
        const page = Number(filters?.page) || 1;
        const limit = Number(filters?.limit) || 10;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = Boolean(filters.isActive);
        }

        if (filters?.countryId && filters.countryId.length > 0) {
            where.countries = {
                some: {
                    countryId: {
                        in: filters.countryId
                    }
                }
            };
        }

        if (filters?.currencyId && filters.currencyId.length > 0) {
            where.currencies = {
                some: {
                    currencyId: {
                        in: filters.currencyId
                    }
                }
            };
        }

        if (filters?.paymentMethodId && filters.paymentMethodId.length > 0) {
            where.paymentMethods = {
                some: {
                    paymentMethodId: {
                        in: filters.paymentMethodId
                    }
                }
            };
        }

        if (filters?.paymentSystemTypeId && filters.paymentSystemTypeId.length > 0) {
            where.paymentSystemTypes = {
                some: {
                    paymentSystemTypeId: {
                        in: filters.paymentSystemTypeId
                    }
                }
            };
        }

        if (filters?.trafficSourceId && filters.trafficSourceId.length > 0) {
            where.trafficSources = {
                some: {
                    trafficSourceId: {
                        in: filters.trafficSourceId
                    }
                }
            };
        }

        if (filters?.trafficTypeId && filters.trafficTypeId.length > 0) {
            where.trafficTypes = {
                some: {
                    trafficTypeId: {
                        in: filters.trafficTypeId
                    }
                }
            };
        }

        if (filters?.connectionTypeId && filters.connectionTypeId.length > 0) {
            where.connectionTypes = {
                some: {
                    connectionTypeId: {
                        in: filters.connectionTypeId
                    }
                }
            };
        }

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
        const total = await prisma.offer.count({ where });

        // Get offers with relations
        const offers = await prisma.offer.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
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
            },
            filters: Object.keys(filters || {}).filter(key => filters![key as keyof typeof filters] !== undefined && !excludeFilters.includes(key))
        };
    } catch (error) {
        throw error;
    }
};

export const getOfferById = async (id: number) => {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!offer) {
            throw new Error(__('offer.not_found'));
        }

        // Transform the response to remove duplicates and clean up structure
        return transformOffer(offer);
    } catch (error) {
        throw error;
    }
};

export const getOfferBySlug = async (slug: string) => {
    try {
        const offer = await prisma.offer.findUnique({
            where: { slug },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!offer) {
            throw new Error(__('offer.not_found'));
        }

        // Transform the response to remove duplicates and clean up structure
        return transformOffer(offer);
    } catch (error) {
        throw error;
    }
};

export const updateOffer = async (id: number, data: any) => {
    try {
        // Check if offer exists
        const existingOffer = await prisma.offer.findUnique({
            where: { id }
        });

        if (!existingOffer) {
            throw new Error(__('offer.not_found'));
        }

        // Generate slug if name is being updated
        let slug = existingOffer.slug;
        if (data.name && data.name !== existingOffer.name) {
            if (data.slug) {
                slug = data.slug;
            } else {
                slug = await generateSlugForEntity(data.name, 'Offer', id);
            }
        } else if (data.slug) {
            slug = data.slug;
        }

        // Update offer
        const updatedOffer = await prisma.offer.update({
            where: { id },
            data: {
                name: data.name || existingOffer.name,
                slug,
                trafficVolumeMin: data.trafficVolumeMin ?? existingOffer.trafficVolumeMin,
                trafficVolumeMax: data.trafficVolumeMax ?? existingOffer.trafficVolumeMax,
                // payment methods are managed via join table; no direct field on Offer
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
            },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                settleSpeed: true,
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        // Handle relation updates if provided
        if (data.countries) {
            // Delete existing relations
            await prisma.offerCountry.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerCountry.createMany({
                data: data.countries.map((countryId: number) => ({
                    offerId: id,
                    countryId
                }))
            });
        }

        if (data.currencies) {
            // Delete existing relations
            await prisma.offerCurrency.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerCurrency.createMany({
                data: data.currencies.map((currencyId: number) => ({
                    offerId: id,
                    currencyId
                }))
            });
        }

        if (data.paymentSystemTypes) {
            // Delete existing relations
            await prisma.offerPaymentSystemType.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerPaymentSystemType.createMany({
                data: data.paymentSystemTypes.map((paymentSystemTypeId: number) => ({
                    offerId: id,
                    paymentSystemTypeId
                }))
            });
        }

        if (data.trafficSources) {
            // Delete existing relations
            await prisma.offerTrafficSource.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerTrafficSource.createMany({
                data: data.trafficSources.map((trafficSourceId: number) => ({
                    offerId: id,
                    trafficSourceId
                }))
            });
        }

        if (data.trafficTypes) {
            // Delete existing relations
            await prisma.offerTrafficType.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerTrafficType.createMany({
                data: data.trafficTypes.map((trafficTypeId: number) => ({
                    offerId: id,
                    trafficTypeId
                }))
            });
        }

        if (data.connectionTypes) {
            // Delete existing relations
            await prisma.offerConnectionType.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerConnectionType.createMany({
                data: data.connectionTypes.map((connectionTypeId: number) => ({
                    offerId: id,
                    connectionTypeId
                }))
            });
        }

        if (data.balanceTypes) {
            // Delete existing relations
            await prisma.offerBalanceType.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerBalanceType.createMany({
                data: data.balanceTypes.map((balanceTypeId: number) => ({
                    offerId: id,
                    balanceTypeId
                }))
            });
        }

        if (data.paymentMethods) {
            // Delete existing relations
            await prisma.offerPaymentMethod.deleteMany({
                where: { offerId: id }
            });

            // Create new relations
            await prisma.offerPaymentMethod.createMany({
                data: data.paymentMethods.map((paymentMethodId: number) => ({
                    offerId: id,
                    paymentMethodId
                }))
            });
        }

        if (data.settleSpeed) {
            // Update settle speed
            await prisma.offer.update({
                where: { id },
                data: { settleSpeedId: data.settleSpeed }
            });
        }

        // Check if offer needs to be connected to user's payment service
        const existingConnections = await prisma.paymentServiceOffer.findMany({
            where: { offerId: id }
        });

        if (existingConnections.length === 0) {
            // Find the payment service created by the same user
            const userPaymentService = await prisma.paymentService.findFirst({
                where: {
                    ownerId: existingOffer.ownerId,
                    isActive: true
                }
            });

            if (userPaymentService) {
                // Create the connection
                await prisma.paymentServiceOffer.create({
                    data: {
                        paymentServiceId: userPaymentService.id,
                        offerId: id
                    }
                });
            }
        }

        // Get the final updated offer with all relations
        const finalOffer = await prisma.offer.findUnique({
            where: { id },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformOffer(finalOffer);
    } catch (error) {
        throw error;
    }
};

export const activateOffer = async (id: number) => {
    try {
        const existingOffer = await prisma.offer.findUnique({
            where: { id }
        });

        if (!existingOffer) {
            throw new Error(__('offer.not_found'));
        }

        if (existingOffer.isActive) {
            throw new Error(__('offer.already_active'));
        }

        // Check if offer needs to be connected to user's payment service
        const existingConnections = await prisma.paymentServiceOffer.findMany({
            where: { offerId: id }
        });

        if (existingConnections.length === 0) {
            // Find the payment service created by the same user
            const userPaymentService = await prisma.paymentService.findFirst({
                where: {
                    ownerId: existingOffer.ownerId,
                    isActive: true
                }
            });

            if (userPaymentService) {
                // Create the connection
                await prisma.paymentServiceOffer.create({
                    data: {
                        paymentServiceId: userPaymentService.id,
                        offerId: id
                    }
                });
            }
        }

        const updatedOffer = await prisma.offer.update({
            where: { id },
            data: { isActive: true },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformOffer(updatedOffer);
    } catch (error) {
        throw error;
    }
};

export const deactivateOffer = async (id: number) => {
    try {
        const existingOffer = await prisma.offer.findUnique({
            where: { id }
        });

        if (!existingOffer) {
            throw new Error(__('offer.not_found'));
        }

        if (!existingOffer.isActive) {
            throw new Error(__('offer.already_inactive'));
        }

        // Check if offer needs to be connected to user's payment service
        const existingConnections = await prisma.paymentServiceOffer.findMany({
            where: { offerId: id }
        });

        if (existingConnections.length === 0) {
            // Find the payment service created by the same user
            const userPaymentService = await prisma.paymentService.findFirst({
                where: {
                    ownerId: existingOffer.ownerId,
                    isActive: true
                }
            });

            if (userPaymentService) {
                // Create the connection
                await prisma.paymentServiceOffer.create({
                    data: {
                        paymentServiceId: userPaymentService.id,
                        offerId: id
                    }
                });
            }
        }

        const updatedOffer = await prisma.offer.update({
            where: { id },
            data: { isActive: false },
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformOffer(updatedOffer);
    } catch (error) {
        throw error;
    }
};

export const deleteOffer = async (id: number) => {
    try {
        const existingOffer = await prisma.offer.findUnique({
            where: { id }
        });

        if (!existingOffer) {
            throw new Error(__('offer.not_found'));
        }

        // Delete all related records first
        await prisma.offerCountry.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerCurrency.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerPaymentSystemType.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerTrafficSource.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerTrafficType.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerConnectionType.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerBalanceType.deleteMany({
            where: { offerId: id }
        });

        await prisma.offerPaymentMethod.deleteMany({
            where: { offerId: id }
        });

        await prisma.paymentServiceOffer.deleteMany({
            where: { offerId: id }
        });

        // Now delete the offer
        await prisma.offer.delete({
            where: { id }
        });

        return { message: __('offer.deleted_successfully') };
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
        const where: any = { ownerId };

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
        const total = await prisma.offer.count({ where });

        // Get offers with relations
        const offers = await prisma.offer.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                countries: {
                    include: {
                        country: true
                    }
                },
                currencies: {
                    include: {
                        currency: true
                    }
                },
                paymentSystemTypes: {
                    include: {
                        paymentSystemType: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                trafficSources: {
                    include: {
                        trafficSource: true
                    }
                },
                trafficTypes: {
                    include: {
                        trafficType: true
                    }
                },
                connectionTypes: {
                    include: {
                        connectionType: true
                    }
                },
                balanceTypes: {
                    include: {
                        balanceType: true
                    }
                },
                settleSpeed: true,
                paymentServices: {
                    include: {
                        paymentService: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                user: { select: { id: true, averageRating: true, ratingsCount: true } }
                            }
                        }
                    }
                }
            }
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

// Helper function to parse category ranges
const parseCategoryRange = (category: string) => {
    const [min, max] = category.split('-').map(Number);
    return { min, max };
};

export const filterOffersAndGetPaymentServices = async (filters?: z.infer<typeof filterOffersSchema>['query']) => {
    try {
        const page = Number(filters?.page) || 1;
        const limit = Number(filters?.limit) || 10;

        // For client-side filtering, we need to fetch all items first
        // then apply pagination after filtering

        // Build where clause for payment services (not offers)
        const where: any = { isActive: true };

        // Filter by countries - return payment services that have at least one of the specified countries
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
                            lte: Number(filters.trafficVolumeMin)
                        }
                    },
                    {
                        trafficVolumeMax: {
                            gte: Number(filters.trafficVolumeMin)
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
                            lte: Number(filters.trafficVolumeMax)
                        }
                    },
                    {
                        trafficVolumeMax: {
                            gte: Number(filters.trafficVolumeMax)
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
                    { in: filters.legalPerson }
            });
        }

        if (filters?.support247 && filters.support247.length > 0) {
            offerConditions.push({
                support247: filters.support247.length === 1 ?
                    filters.support247[0] :
                    { in: filters.support247 }
            });
        }

        if (filters?.automatics && filters.automatics.length > 0) {
            offerConditions.push({
                automatics: filters.automatics.length === 1 ?
                    filters.automatics[0] :
                    { in: filters.automatics }
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

        // Handle search query - search both payment service names and offer names
        if (filters?.q) {
            // If we have a search query, we need to restructure the where clause
            // to support OR logic between payment service name and offer names
            const searchConditions = [];

            // Search by payment service name
            searchConditions.push({
                name: {
                    contains: filters.q,
                    mode: 'insensitive'
                }
            });

            // Search by offer name
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

            // If there are other offer conditions, combine them with AND
            if (offerConditions.length > 0) {
                offerNameCondition.paymentServiceOffers.some.offer.AND = offerConditions;
            }

            searchConditions.push(offerNameCondition);

            // Combine search with existing where conditions using AND
            const existingConditions = { ...where };
            where.AND = [
                existingConditions,
                { OR: searchConditions }
            ];
        } else if (offerConditions.length > 0) {
            // No search query, just apply offer conditions normally
            where.paymentServiceOffers = {
                some: {
                    offer: {
                        AND: offerConditions
                    }
                }
            };
        }

        // Get total count of payment services (DB-side filtered)
        const total = await prisma.paymentService.count({ where });

        // Build orderBy clause for sorting (support sorting by owner average rating via nested relation)
        let orderBy: any;
        const sortColumn = (filters?.sortColumn || 'id') as any;
        const order = (filters?.order || 'DESC').toLowerCase();

        // If sorting by averageRating -> first by user.averageRating, then by user.ratingsCount as tie-breaker
        if (String(sortColumn) === 'averageRating') {
            // prisma supports array orderBy to apply multiple ordering levels
            orderBy = [
                { user: { averageRating: order } },
                { user: { ratingsCount: order } }
            ];
        } else {
            // single-level order
            orderBy = { [sortColumn]: order };
        }

        // Get payment services with relations (DB-side pagination + sorting)
        const paymentServices = await prisma.paymentService.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: ({
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
                // include owner user data to get denormalized averageRating/ratingsCount
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
             };

            // Remove the paymentServiceOffers field
            delete (transformedService as any).paymentServiceOffers;

            return transformedService;
        });

        // At this point DB already applied pagination; use `total` for pages
        const pages = Math.ceil(total / limit);

        return {
            data: transformedPaymentServices.filter((s: any) => s.offers && s.offers.length > 0),
            pagination: { page, limit, total, pages },
            filters: Object.keys(filters || {}).filter(key => filters![key as keyof typeof filters] !== undefined)
        };
    } catch (error) {
        throw error;
    }
};

// Helper function to connect existing offers to their user's payment services
export const connectOffersToPaymentServices = async () => {
    try {
        // Get all offers that don't have payment service connections
        const offersWithoutConnections = await prisma.offer.findMany({
            where: {
                paymentServices: {
                    none: {}
                }
            },
            include: {
                paymentServices: true
            }
        });


        for (const offer of offersWithoutConnections) {
            // Find the payment service for this offer's owner
            const userPaymentService = await prisma.paymentService.findFirst({
                where: {
                    ownerId: offer.ownerId,
                    isActive: true
                }
            });

            if (userPaymentService) {
                // Create the connection
                await prisma.paymentServiceOffer.create({
                    data: {
                        paymentServiceId: userPaymentService.id,
                        offerId: offer.id
                    }
                });
            } else {
            }
        }

        return {
            message: `Connected ${offersWithoutConnections.length} offers to their payment services`,
            connected: offersWithoutConnections.length
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

        // Calculate min and max values for each field
        const ranges: any = {};

        // Traffic Volume ranges
        const trafficVolumeMinValues = offers.map(o => o.trafficVolumeMin).filter(v => v !== null);
        const trafficVolumeMaxValues = offers.map(o => o.trafficVolumeMax).filter(v => v !== null);
        if (trafficVolumeMinValues.length > 0 || trafficVolumeMaxValues.length > 0) {
            ranges.trafficVolume = {
                min: trafficVolumeMinValues.length > 0 ? Math.min(...trafficVolumeMinValues) : null,
                max: trafficVolumeMaxValues.length > 0 ? Math.max(...trafficVolumeMaxValues) : null
            };
        }

       // get pay in fee ranges
       const payInFeeValues = offers.map(o => o.payInFee).filter(v => v !== null);
       if (payInFeeValues.length > 0) {
        ranges.payInFee = {
            min: payInFeeValues.length > 0 ? Math.min(...payInFeeValues) : null,
            max: payInFeeValues.length > 0 ? Math.max(...payInFeeValues) : null
        };
       }

       // get pay out fee ranges
       const payOutFeeValues = offers.map(o => o.payOutFee).filter(v => v !== null);
       if (payOutFeeValues.length > 0) {
        ranges.payOutFee = {
            min: payOutFeeValues.length > 0 ? Math.min(...payOutFeeValues) : null,
            max: payOutFeeValues.length > 0 ? Math.max(...payOutFeeValues) : null
        };
       }

        // Pay In Limit ranges
        const payInMinLimitValues = offers.map(o => o.payInMinLimit).filter(v => v !== null);
        const payInMaxLimitValues = offers.map(o => o.payInMaxLimit).filter(v => v !== null);
        if (payInMinLimitValues.length > 0 || payInMaxLimitValues.length > 0) {
            ranges.payInLimit = {
                min: payInMinLimitValues.length > 0 ? Math.min(...payInMinLimitValues) : null,
                max: payInMaxLimitValues.length > 0 ? Math.max(...payInMaxLimitValues) : null
            };
        }

        // Pay Out Limit ranges
        const payOutMinLimitValues = offers.map(o => o.payOutMinLimit).filter(v => v !== null);
        const payOutMaxLimitValues = offers.map(o => o.payOutMaxLimit).filter(v => v !== null);
        if (payOutMinLimitValues.length > 0 || payOutMaxLimitValues.length > 0) {
            ranges.payOutLimit = {
                min: payOutMinLimitValues.length > 0 ? Math.min(...payOutMinLimitValues) : null,
                max: payOutMaxLimitValues.length > 0 ? Math.max(...payOutMaxLimitValues) : null
            };
        }

        return ranges;
    } catch (error) {
        throw error;
    }
};
