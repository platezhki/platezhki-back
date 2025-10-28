import { PrismaClient } from "../generated/prisma";
import { z } from "zod";
import { getPaymentServicesSchema } from "../schemas/payment-services.schema";
import { generateSlug, generateSlugForEntity } from "../utils/slug";
import { __ } from "../utils/i18n";
import { saveBase64File, saveBase64Files } from "../utils/file-upload";

const prisma = new PrismaClient();

const excludeFilters = ['page', 'limit'];

// Helper function to transform payment service data and remove duplicates
const transformPaymentService = (paymentService: any) => {
    const transformed = {
        ...paymentService,
        countries: paymentService?.countries?.map((c: any) => c.country) || [],
        currencies: paymentService?.currencies?.map((c: any) => c.currency) || [],
        paymentSystemTypes: paymentService?.paymentSystemTypes?.map((p: any) => p.paymentSystemType) || [],
        payInMethods: paymentService?.payInMethods?.filter((p: any) => p.methodType === 'payin' || p.methodType === 'payIn').map((p: any) => ({
            ...p.paymentMethod,
            methodType: p.methodType.toLowerCase()
        })) || [],
        payOutMethods: paymentService?.payOutMethods?.filter((p: any) => p.methodType === 'payout' || p.methodType === 'payOut').map((p: any) => ({
            ...p.paymentMethod,
            methodType: p.methodType.toLowerCase()
        })) || [],
        supportServiceLanguages: paymentService?.supportServiceLanguages?.map((l: any) => l.language) || []
    };
    
    // Ensure id is preserved
    if (paymentService.id) {
        transformed.id = paymentService.id;
    }
    
    return transformed;
};

export const createPaymentService = async (data: any, userRoleId?: number, userId?: number) => {
    try {
        // Check if user is trying to create a payment service for someone else
        // Only admin (roleId 1) and super_admin (roleId 1) can create payment services for other users
        if (userRoleId && userRoleId > 2 && data.ownerId && data.ownerId !== userId) {
            throw new Error(__('payment_service.insufficient_permissions_to_create_for_others'));
        }

        // Ensure regular users can only create payment services for themselves
        if (userRoleId && userRoleId > 2) {
            data.ownerId = userId;
            data.userId = userId;
        }

        // Handle logo upload
        let logoUrl = '';
        if (data.logo) {
            if (typeof data.logo === 'string') {
                // It's a URL string - use as is
                logoUrl = data.logo;
            } else if (data.logo.file && data.logo.fileName) {
                // It's a new file upload - create new file
                logoUrl = saveBase64File(data.logo.file, data.logo.fileName);
            }
        } else if (data.logoUrl) {
            // Handle logoUrl field (for backward compatibility)
            if (typeof data.logoUrl === 'string') {
                // It's a URL string - use as is
                logoUrl = data.logoUrl;
            }
        }

        // Handle payment page example images
        let paymentPageExampleImageUrls: string[] = [];
        if (data.paymentPageExampleImageUrls && data.paymentPageExampleImageUrls.length > 0) {
            // Check if items are file uploads or URLs
            const fileUploads = data.paymentPageExampleImageUrls.filter((item: any) => item && typeof item === 'object' && item.file);
            const urlStrings = data.paymentPageExampleImageUrls.filter((item: any) => typeof item === 'string');
            
            if (fileUploads.length > 0) {
                const newFileUrls = saveBase64Files(fileUploads, 'uploads/payment-pages');
                paymentPageExampleImageUrls = [...urlStrings, ...newFileUrls];
            } else {
                paymentPageExampleImageUrls = urlStrings;
            }
        }

        // Handle cabinet example images
        let cabinetExampleImageUrls: string[] = [];
        if (data.cabinetExampleImageUrls && data.cabinetExampleImageUrls.length > 0) {
            // Check if items are file uploads or URLs
            const fileUploads = data.cabinetExampleImageUrls.filter((item: any) => item && typeof item === 'object' && item.file);
            const urlStrings = data.cabinetExampleImageUrls.filter((item: any) => typeof item === 'string');
            
            if (fileUploads.length > 0) {
                const newFileUrls = saveBase64Files(fileUploads, 'uploads/cabinets');
                cabinetExampleImageUrls = [...urlStrings, ...newFileUrls];
            } else {
                cabinetExampleImageUrls = urlStrings;
            }
        }

        // Generate slug from name
        const slug = await generateSlugForEntity(data.name, 'PaymentService');

        // Parse establishedAt date
        const [day, month, year] = data.establishedAt.split('.');
        const establishedAt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Check if user already has a payment service (by ownerId)
        const existingByOwner = await prisma.paymentService.findFirst({
            where: { ownerId: userId }
        });

        // If user already has a payment service, update it instead of creating a new one
        if (existingByOwner) {
            // Check if there are multiple payment services for the same user
            const allUserPaymentServices = await prisma.paymentService.findMany({
                where: { ownerId: userId }
            });
            
            if (allUserPaymentServices.length > 1) {
                // First, try to find a payment service with the same name (if user is trying to update an existing one)
                let targetService = allUserPaymentServices.find(service => service.name === data.name);
                
                // If no service with the same name, use the one with the lowest ID (oldest)
                if (!targetService) {
                    const sortedServices = allUserPaymentServices.sort((a, b) => a.id - b.id);
                    targetService = sortedServices[0];
                }
                
                // Update the target service
                return await updatePaymentService(targetService.id, data, userRoleId, userId);
            } else {
                // Update existing payment service
                return await updatePaymentService(existingByOwner.id, data, userRoleId, userId);
            }
        }

        // Check if payment service with same name already exists (for other users)
        const existingByName = await prisma.paymentService.findFirst({
            where: { name: data.name }
        });

        if (existingByName) {
            throw new Error(__('payment_service.name_exists'));
        }

        // Check if payment service with same slug already exists (for other users)
        const existingBySlug = await prisma.paymentService.findFirst({
            where: { slug }
        });

        if (existingBySlug) {
            throw new Error(__('payment_service.slug_exists'));
        }
        // Validate foreign keys before creation to avoid FK violations
        const validateIds = async () => {
            // Ensure ownerId and userId are present
            const resolvedOwnerId = data.ownerId ?? userId;
            const resolvedUserId = data.userId ?? userId;
            if (resolvedOwnerId == null || resolvedUserId == null) {
                throw new Error(__('payment_service.invalid_user_ids'));
            }
            const uniqueUserIds = resolvedOwnerId === resolvedUserId ? [resolvedOwnerId] : [resolvedOwnerId, resolvedUserId];
            const [usersCount, countriesCount, currenciesCount, pstCount, pmCount, langCount] = await Promise.all([
                prisma.user.count({ where: { id: { in: uniqueUserIds } } }),
                prisma.country.count({ where: { id: { in: data.countries || [] } } }),
                prisma.currency.count({ where: { id: { in: data.currencies || [] } } }),
                prisma.paymentSystemType.count({ where: { id: { in: data.paymentSystemType || [] } } }),
                prisma.paymentMethod.count({ where: { id: { in: Array.from(new Set([...(data.payInMethods || []), ...(data.payOutMethods || [])])) } } }),
                prisma.language.count({ where: { id: { in: data.languageSupport || [] } } }),
            ]);
            if (usersCount !== uniqueUserIds.length) throw new Error(__('payment_service.invalid_user_ids'));
            if ((data.countries?.length || 0) !== countriesCount) throw new Error(__('payment_service.invalid_country_ids'));
            if ((data.currencies?.length || 0) !== currenciesCount) throw new Error(__('payment_service.invalid_currency_ids'));
            if ((data.paymentSystemType?.length || 0) !== pstCount) throw new Error(__('payment_service.invalid_payment_system_type_ids'));
            const expectedPm = Array.from(new Set([...(data.payInMethods || []), ...(data.payOutMethods || [])])).length;
            if (expectedPm !== pmCount) throw new Error(__('payment_service.invalid_payment_method_ids'));
            if ((data.languageSupport?.length || 0) !== langCount) throw new Error(__('payment_service.invalid_language_ids'));
            // Assign resolved ids back
            data.ownerId = resolvedOwnerId;
            data.userId = resolvedUserId;
        };
        await validateIds();
        // Create payment service with relations
        const paymentService = await prisma.paymentService.create({
            data: {
                name: data.name,
                description: data.description,
                serviceUrl: data.serviceUrl,
                establishedAt,
                email: data.email,
                contacts: data.contacts,
                paymentPageExampleLink: data.paymentPageExampleLink,
                paymentPageExampleImageUrls,
                cabinetExampleLink: data.cabinetExampleLink,
                cabinetExampleImageUrls,
                logoUrl,
                slug,
                isActive: data.isActive ?? true,
                ownerId: data.ownerId,
                userId: data.userId,
                // Create relations
                countries: {
                    create: data.countries.map((countryId: number) => ({ countryId }))
                },
                currencies: {
                    create: data.currencies.map((currencyId: number) => ({ currencyId }))
                },
                paymentSystemTypes: {
                    create: data.paymentSystemType.map((paymentSystemTypeId: number) => ({ paymentSystemTypeId }))
                },
                payInMethods: {
                    create: data.payInMethods.map((paymentMethodId: number) => ({ 
                        paymentMethodId, 
                        methodType: 'payIn' 
                    }))
                },
                payOutMethods: {
                    create: data.payOutMethods.map((paymentMethodId: number) => ({ 
                        paymentMethodId, 
                        methodType: 'payOut' 
                    }))
                },
                supportServiceLanguages: {
                    create: data.languageSupport.map((languageId: number) => ({ languageId }))
                }
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformPaymentService(paymentService);
    } catch (error) {
        throw error;
    }
};

export const getPaymentServices = async (filters?: z.infer<typeof getPaymentServicesSchema>['query']) => {
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
            where.OR = [
                {
                    payInMethods: {
                        some: {
                            paymentMethodId: {
                                in: filters.paymentMethodId
                            }
                        }
                    }
                },
                {
                    payInMethods: {
                        some: {
                            paymentMethodId: {
                                in: filters.paymentMethodId
                            },
                            methodType: 'payOut'
                        }
                    }
                }
            ];
        }

        if (filters?.q) {
            where.name = {
                contains: filters.q,
                mode: 'insensitive'
            };
        }

        // Get total count
        const total = await prisma.paymentService.count({ where });

        // Get payment services with relations
        const paymentServices = await prisma.paymentService.findMany({
                where,
                skip,
            take: limit,
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        const cleanedPaymentServices = paymentServices.map(service => transformPaymentService(service));

        const pages = Math.ceil(total / limit);

        return {
            data: cleanedPaymentServices,
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

export const getPaymentServiceById = async (id: number) => {
    try {
        const paymentService = await prisma.paymentService.findUnique({
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        if (!paymentService) {
            throw new Error(__('payment_service.not_found'));
        }

        // Transform the response to remove duplicates and clean up structure
        return transformPaymentService(paymentService);
    } catch (error) {
        throw error;
    }
};

export const updatePaymentService = async (id: number, data: any, userRoleId?: number, userId?: number) => {
    try {
        // Check if payment service exists
        const existingService = await prisma.paymentService.findUnique({
            where: { id }
        });

        if (!existingService) {
            throw new Error(__('payment_service.not_found'));
        }

        // Check ownership - only admin/super_admin can update any payment service
        // Regular users can only update their own payment services
        if (userRoleId && userRoleId > 2 && existingService.ownerId !== userId) {
            throw new Error(__('payment_service.insufficient_permissions_to_update'));
        }

        // Handle logo update
        let logoUrl = existingService.logoUrl;
        if (data.logo) {
            if (typeof data.logo === 'string') {
                // It's a URL string - do nothing, keep existing logo
                logoUrl = existingService.logoUrl;
            } else if (data.logo.file && data.logo.fileName) {
                // It's a new file upload - create new file and update logo URL
                logoUrl = saveBase64File(data.logo.file, data.logo.fileName);
            }
        } else if (data.logoUrl) {
            // Handle logoUrl field (for backward compatibility)
            if (typeof data.logoUrl === 'string') {
                // It's a URL string - do nothing, keep existing logo
                logoUrl = existingService.logoUrl;
            }
        }

        // Handle payment page example images
        let paymentPageExampleImageUrls = existingService.paymentPageExampleImageUrls;
        if (data.paymentPageExampleImageUrls !== undefined) {
            if (data.paymentPageExampleImageUrls.length === 0) {
                paymentPageExampleImageUrls = [];
            } else {
                // Check if items are file uploads or URLs
                const fileUploads = data.paymentPageExampleImageUrls.filter((item: any) => item.file);
                const urlStrings = data.paymentPageExampleImageUrls.filter((item: any) => typeof item === 'string');
                
                if (fileUploads.length > 0) {
                    const newFileUrls = saveBase64Files(fileUploads, 'uploads/payment-pages');
                    paymentPageExampleImageUrls = [...urlStrings, ...newFileUrls];
                } else {
                    paymentPageExampleImageUrls = urlStrings;
                }
            }
        }

        // Handle cabinet example images
        let cabinetExampleImageUrls = existingService.cabinetExampleImageUrls;
        if (data.cabinetExampleImageUrls !== undefined) {
            if (data.cabinetExampleImageUrls.length === 0) {
                cabinetExampleImageUrls = [];
            } else {
                // Check if items are file uploads or URLs
                const fileUploads = data.cabinetExampleImageUrls.filter((item: any) => item.file);
                const urlStrings = data.cabinetExampleImageUrls.filter((item: any) => typeof item === 'string');
                
                if (fileUploads.length > 0) {
                    const newFileUrls = saveBase64Files(fileUploads, 'uploads/cabinets');
                    cabinetExampleImageUrls = [...urlStrings, ...newFileUrls];
                } else {
                    cabinetExampleImageUrls = urlStrings;
                }
            }
        }

        // Generate slug if name is being updated
        let slug = existingService.slug;
        if (data.name && data.name !== existingService.name) {
            if (data.slug) {
                // Use provided slug
                slug = data.slug;
            } else {
                // Generate new slug from name
                slug = generateSlug(data.name);
            }
        } else if (data.slug) {
            slug = data.slug;
        }

        // Parse establishedAt date if provided
        let establishedAt = existingService.establishedAt;
        if (data.establishedAt) {
            const [day, month, year] = data.establishedAt.split('.');
            establishedAt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // Check for name conflicts if name is being updated
        if (data.name && data.name !== existingService.name) {
            const existingByName = await prisma.paymentService.findFirst({
                where: { 
                    name: data.name,
                    id: { not: id }
                }
            });

            if (existingByName) {
                // If the conflicting payment service belongs to the same user, rename it temporarily
                if (existingByName.ownerId === userId) {
                    const tempName = `${existingByName.name}_old_${Date.now()}`;
                    await prisma.paymentService.update({
                        where: { id: existingByName.id },
                        data: { name: tempName }
                    });
                } else {
                    throw new Error(__('payment_service.name_exists'));
                }
            }
        }

        // Check for slug conflicts if slug is being updated
        if (slug !== existingService.slug) {
            const existingBySlug = await prisma.paymentService.findFirst({
                where: { 
                    slug,
                    id: { not: id }
                }
            });

            if (existingBySlug) {
                // If the conflicting payment service belongs to the same user, rename its slug temporarily
                if (existingBySlug.ownerId === userId) {
                    const tempSlug = `${existingBySlug.slug}_old_${Date.now()}`;
                    await prisma.paymentService.update({
                        where: { id: existingBySlug.id },
                        data: { slug: tempSlug }
                    });
                } else {
                    throw new Error(__('payment_service.slug_exists'));
                }
            }
        }

        // Update payment service
        const updatedService = await prisma.paymentService.update({
            where: { id },
            data: {
                name: data.name || existingService.name,
                description: data.description ?? existingService.description,
                serviceUrl: data.serviceUrl ?? existingService.serviceUrl,
                establishedAt,
                email: data.email ?? existingService.email,
                contacts: data.contacts ?? existingService.contacts,
                paymentPageExampleLink: data.paymentPageExampleLink ?? existingService.paymentPageExampleLink,
                paymentPageExampleImageUrls,
                cabinetExampleLink: data.cabinetExampleLink ?? existingService.cabinetExampleLink,
                cabinetExampleImageUrls,
                logoUrl,
                slug,
                isActive: data.isActive ?? existingService.isActive,
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        // Handle relation updates if provided
        if (data.countries) {
            // Delete existing relations
            await prisma.paymentServiceCountry.deleteMany({
                where: { paymentServiceId: id }
            });

            // Create new relations
            await prisma.paymentServiceCountry.createMany({
                data: data.countries.map((countryId: number) => ({
                    paymentServiceId: id,
                    countryId
                }))
            });
        }

        if (data.currencies) {
            // Delete existing relations
            await prisma.paymentServiceCurrency.deleteMany({
                where: { paymentServiceId: id }
            });

            // Create new relations
            await prisma.paymentServiceCurrency.createMany({
                data: data.currencies.map((currencyId: number) => ({
                    paymentServiceId: id,
                    currencyId
                }))
            });
        }

        if (data.paymentSystemType) {
            // Delete existing relations
            await prisma.paymentServicePaymentSystemType.deleteMany({
                where: { paymentServiceId: id }
            });

            // Create new relations
            await prisma.paymentServicePaymentSystemType.createMany({
                data: data.paymentSystemType.map((paymentSystemTypeId: number) => ({
                    paymentServiceId: id,
                    paymentSystemTypeId
                }))
            });
        }

        if (data.payInMethods || data.payOutMethods) {
            // Delete existing payment method relations
            await prisma.paymentServicePaymentMethod.deleteMany({
                where: { 
                    paymentServiceId: id
                }
            });

            // Create new payment method relations
            const paymentMethods = [];
            if (data.payInMethods) {
                paymentMethods.push(...data.payInMethods.map((paymentMethodId: number) => ({
                    paymentServiceId: id,
                    paymentMethodId,
                    methodType: 'payIn'
                })));
            }
            if (data.payOutMethods) {
                paymentMethods.push(...data.payOutMethods.map((paymentMethodId: number) => ({
                    paymentServiceId: id,
                    paymentMethodId,
                    methodType: 'payOut'
                })));
            }

            if (paymentMethods.length > 0) {
                await prisma.paymentServicePaymentMethod.createMany({
                    data: paymentMethods
                });
            }
        }

        if (data.languageSupport) {
            // Delete existing relations
            await prisma.paymentServiceLanguage.deleteMany({
                where: { paymentServiceId: id }
            });

            // Create new relations
            await prisma.paymentServiceLanguage.createMany({
                data: data.languageSupport.map((languageId: number) => ({
                    paymentServiceId: id,
                    languageId
                }))
            });
        }

        // Get the final updated service with all relations
        const finalService = await prisma.paymentService.findUnique({
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformPaymentService(finalService);
    } catch (error) {
        throw error;
    }
};

export const activatePaymentService = async (id: number, userRoleId?: number, userId?: number) => {
    try {
        const existingService = await prisma.paymentService.findUnique({
            where: { id }
        });

        if (!existingService) {
            throw new Error(__('payment_service.not_found'));
        }

        // Check ownership - only admin/super_admin can activate any payment service
        // Regular users can only activate their own payment services
        if (userRoleId && userRoleId > 2 && existingService.ownerId !== userId) {
            throw new Error(__('payment_service.insufficient_permissions_to_update'));
        }

        if (existingService.isActive) {
            throw new Error(__('payment_service.already_active'));
        }

        const updatedService = await prisma.paymentService.update({
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformPaymentService(updatedService);
    } catch (error) {
        throw error;
    }
};

export const deactivatePaymentService = async (id: number, userRoleId?: number, userId?: number) => {
    try {
        const existingService = await prisma.paymentService.findUnique({
            where: { id }
        });

        if (!existingService) {
            throw new Error(__('payment_service.not_found'));
        }

        // Check ownership - only admin/super_admin can deactivate any payment service
        // Regular users can only deactivate their own payment services
        if (userRoleId && userRoleId > 2 && existingService.ownerId !== userId) {
            throw new Error(__('payment_service.insufficient_permissions_to_update'));
        }

        if (!existingService.isActive) {
            throw new Error(__('payment_service.already_inactive'));
        }

        const updatedService = await prisma.paymentService.update({
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        // Transform the response to remove duplicates and clean up structure
        return transformPaymentService(updatedService);
    } catch (error) {
        throw error;
    }
};

export const deletePaymentService = async (id: number, userRoleId?: number, userId?: number) => {
    try {
        const existingService = await prisma.paymentService.findUnique({
            where: { id }
        });

        if (!existingService) {
            throw new Error(__('payment_service.not_found'));
        }

        // Check ownership - only admin/super_admin can delete any payment service
        // Regular users can only delete their own payment services
        if (userRoleId && userRoleId > 2 && existingService.ownerId !== userId) {
            throw new Error(__('payment_service.insufficient_permissions_to_update'));
        }

        await prisma.paymentService.delete({
            where: { id }
        });

        return { message: __('payment_service.deleted_successfully') };
    } catch (error) {
        throw error;
    }
};

export const getUserPaymentService = async (ownerId: number) => {
    try {
        // Since one user can have only one payment service, find the single service
        const paymentService = await prisma.paymentService.findFirst({
            where: { ownerId },
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                }
            }
        });

        if (!paymentService) {
            return null; // User has no payment service
        }

        // Transform the response to remove duplicates and clean up structure
        return transformPaymentService(paymentService);
    } catch (error) {
        throw error;
    }
};

export const getPaymentServiceBySlug = async (slug: string) => {
    try {
        const paymentService = await prisma.paymentService.findUnique({
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
                payInMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                payOutMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                supportServiceLanguages: {
                    include: {
                        language: true
                    }
                },
                paymentServiceOffers: {
                    where: { offer: { isActive: true } },
                    include: {
                        offer: {
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
                            }
                        }
                    }
                }
            }
        });

        if (!paymentService) {
            throw new Error(__('payment_service.not_found'));
        }

        // Transform the response to remove duplicates and clean up structure
        const transformedService = transformPaymentService(paymentService);
        
        // Transform offers and remove paymentServices from each offer
        const transformedOffers = paymentService.paymentServiceOffers.map(psOffer => {
            const offer = psOffer.offer;
            return {
                ...offer,
                countries: offer?.countries?.map((c: any) => c.country) || [],
                currencies: offer?.currencies?.map((c: any) => c.currency) || [],
                paymentSystemTypes: offer?.paymentSystemTypes?.map((p: any) => p.paymentSystemType) || [],
                paymentMethods: offer?.paymentMethods?.map((p: any) => p.paymentMethod) || [],
                trafficSources: offer?.trafficSources?.map((t: any) => t.trafficSource) || [],
                trafficTypes: offer?.trafficTypes?.map((t: any) => t.trafficType) || [],
                connectionTypes: offer?.connectionTypes?.map((c: any) => c.connectionType) || [],
                balanceTypes: offer?.balanceTypes?.map((b: any) => b.balanceType) || []
            };
        });

        return {
            ...transformedService,
            offers: transformedOffers
        };
    } catch (error) {
        throw error;
    }
};