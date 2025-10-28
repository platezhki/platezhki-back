import { PrismaClient } from "../generated/prisma";
import { CreateCurrencyInput, UpdateCurrencyInput, CreateCountryInput, UpdateCountryInput } from "../schemas/dictionaries.schema";

const prisma = new PrismaClient();

export const getDictionaries = async () => {
    try {
        // Fetch all dictionary data in parallel
        const [
            countries,
            currencies,
            languages,
            exchangeTypes,
            connectionTypes,
            paymentMethods,
            trafficTypes,
            trafficSources,
            paymentSystemTypes,
            balanceTypes,
            settleSpeeds
        ] = await Promise.all([
            prisma.country.findMany({
                select: { id: true, name: true, flagUrl: true },
                orderBy: { id: 'asc' }
            }),
            prisma.currency.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.language.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.exchangeType.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.connectionType.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.paymentMethod.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.trafficType.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.trafficSource.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.paymentSystemType.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.balanceType.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            }),
            prisma.settleSpeed.findMany({
                select: { id: true, name: true },
                orderBy: { id: 'asc' }
            })
        ]);

        return {
            countries,
            currencies,
            languages,
            exchangeTypes,
            connectionTypes,
            paymentMethods,
            trafficTypes,
            trafficSources,
            paymentSystemTypes,
            balanceTypes,
            // Fee ranges for filtering
            payInFeeRanges: [
                { id: 1, name: '0%', min: 0, max: 0 },
                { id: 2, name: '1-5%', min: 1, max: 5 },
                { id: 3, name: '6-10%', min: 6, max: 10 },
                { id: 4, name: '11-20%', min: 11, max: 20 },
                { id: 5, name: '21-30%', min: 21, max: 30 }
            ],
            payOutFeeRanges: [
                { id: 1, name: '0%', min: 0, max: 0 },
                { id: 2, name: '1-5%', min: 1, max: 5 },
                { id: 3, name: '6-10%', min: 6, max: 10 },
                { id: 4, name: '11-20%', min: 11, max: 20 },
                { id: 5, name: '21-30%', min: 21, max: 30 }
            ],
            // Limit ranges for filtering
            payInLimitRanges: [
                { id: 1, name: '0-1000', min: 0, max: 1000 },
                { id: 2, name: '1001-10000', min: 1001, max: 10000 },
                { id: 3, name: '10001-50000', min: 10001, max: 50000 },
                { id: 4, name: '50001-100000', min: 50001, max: 100000 }
            ],
            payOutLimitRanges: [
                { id: 1, name: '0-1000', min: 0, max: 1000 },
                { id: 2, name: '1001-10000', min: 1001, max: 10000 },
                { id: 3, name: '10001-50000', min: 10001, max: 50000 },
                { id: 4, name: '50001-100000', min: 50001, max: 100000 }
            ],
            // Traffic volume ranges
            trafficVolumeRanges: [
                { id: 1, name: '0-1000', min: 0, max: 1000 },
                { id: 2, name: '1001-10000', min: 1001, max: 10000 },
                { id: 3, name: '10001-50000', min: 10001, max: 50000 },
                { id: 4, name: '50001-100000', min: 50001, max: 100000 }
            ],
            settleSpeeds
        };
    } catch (error) {
        throw error;
    }
};

// Currency CRUD operations
export const createCurrency = async (data: CreateCurrencyInput) => {
    try {
        const currency = await prisma.currency.create({
            data: {
                name: data.name,
            },
        });
        return currency;
    } catch (error) {
        throw error;
    }
};

export const updateCurrency = async (id: number, data: UpdateCurrencyInput) => {
    try {
        const currency = await prisma.currency.update({
            where: { id },
            data: {
                name: data.name,
            },
        });
        return currency;
    } catch (error) {
        throw error;
    }
};

export const deleteCurrency = async (id: number) => {
    try {
        const currency = await prisma.currency.delete({
            where: { id },
        });
        return currency;
    } catch (error) {
        throw error;
    }
};

export const getCurrencyById = async (id: number) => {
    try {
        const currency = await prisma.currency.findUnique({
            where: { id },
        });
        return currency;
    } catch (error) {
        throw error;
    }
};

// Country CRUD operations
export const createCountry = async (data: CreateCountryInput) => {
    try {
        const country = await prisma.country.create({
            data: {
                name: data.name,
                flagUrl: data.flagUrl || 'flags/default.png',
            },
        });
        return country;
    } catch (error) {
        throw error;
    }
};

export const updateCountry = async (id: number, data: UpdateCountryInput) => {
    try {
        const country = await prisma.country.update({
            where: { id },
            data: {
                name: data.name,
                flagUrl: data.flagUrl,
            },
        });
        return country;
    } catch (error) {
        throw error;
    }
};

export const deleteCountry = async (id: number) => {
    try {
        const country = await prisma.country.delete({
            where: { id },
        });
        return country;
    } catch (error) {
        throw error;
    }
};

export const getCountryById = async (id: number) => {
    try {
        const country = await prisma.country.findUnique({
            where: { id },
        });
        return country;
    } catch (error) {
        throw error;
    }
};
