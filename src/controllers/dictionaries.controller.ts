import { Request, Response } from 'express';
import { 
    getDictionaries, 
    createCurrency, 
    updateCurrency, 
    deleteCurrency, 
    getCurrencyById,
    createCountry, 
    updateCountry, 
    deleteCountry, 
    getCountryById 
} from '../services/dictionaries.service';
import { __ } from '../utils/i18n';

export const getDictionariesHandler = async (req: Request, res: Response) => {
    try {
        const dictionaries = await getDictionaries();

        res.status(200).json({
            success: true,
            message: __('dictionaries.retrieved_successfully'),
            data: dictionaries
        });
    } catch (error) {
        console.error('Error fetching dictionaries:', error);
        res.status(500).json({
            success: false,
            message: __('dictionaries.retrieval_failed')
        });
    }
};

// Currency admin endpoints
export const createCurrencyHandler = async (req: Request, res: Response) => {
    try {
        const currency = await createCurrency(req.body);
        res.status(201).json({
            success: true,
            message: __('dictionaries.currency_created_successfully'),
            data: currency
        });
    } catch (error: any) {
        console.error('Error creating currency:', error);
        if (error.code === 'P2002') {
            res.status(409).json({
                success: false,
                message: __('dictionaries.currency_already_exists')
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('dictionaries.currency_creation_failed')
            });
        }
    }
};

export const updateCurrencyHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currency = await updateCurrency(id, req.body);
        res.status(200).json({
            success: true,
            message: __('dictionaries.currency_updated_successfully'),
            data: currency
        });
    } catch (error: any) {
        console.error('Error updating currency:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: __('dictionaries.currency_not_found')
            });
        } else if (error.code === 'P2002') {
            res.status(409).json({
                success: false,
                message: __('dictionaries.currency_already_exists')
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('dictionaries.currency_update_failed')
            });
        }
    }
};

export const deleteCurrencyHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currency = await deleteCurrency(id);
        res.status(200).json({
            success: true,
            message: __('dictionaries.currency_deleted_successfully'),
            data: currency
        });
    } catch (error: any) {
        console.error('Error deleting currency:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: __('dictionaries.currency_not_found')
            });
        } else if (error.code === 'P2003') {
            res.status(409).json({
                success: false,
                message: __('dictionaries.currency_in_use')
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('dictionaries.currency_deletion_failed')
            });
        }
    }
};

export const getCurrencyByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const currency = await getCurrencyById(id);
        if (!currency) {
            res.status(404).json({
                success: false,
                message: __('dictionaries.currency_not_found')
            });
        } else {
            res.status(200).json({
                success: true,
                message: __('dictionaries.currency_retrieved_successfully'),
                data: currency
            });
        }
    } catch (error) {
        console.error('Error fetching currency:', error);
        res.status(500).json({
            success: false,
            message: __('dictionaries.currency_retrieval_failed')
        });
    }
};

// Country admin endpoints
export const createCountryHandler = async (req: Request, res: Response) => {
    try {
        const country = await createCountry(req.body);
        res.status(201).json({
            success: true,
            message: __('dictionaries.country_created_successfully'),
            data: country
        });
    } catch (error: any) {
        console.error('Error creating country:', error);
        if (error.code === 'P2002') {
            res.status(409).json({
                success: false,
                message: __('dictionaries.country_already_exists')
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('dictionaries.country_creation_failed')
            });
        }
    }
};

export const updateCountryHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const country = await updateCountry(id, req.body);
        res.status(200).json({
            success: true,
            message: __('dictionaries.country_updated_successfully'),
            data: country
        });
    } catch (error: any) {
        console.error('Error updating country:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: __('dictionaries.country_not_found')
            });
        } else if (error.code === 'P2002') {
            res.status(409).json({
                success: false,
                message: __('dictionaries.country_already_exists')
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('dictionaries.country_update_failed')
            });
        }
    }
};

export const deleteCountryHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const country = await deleteCountry(id);
        res.status(200).json({
            success: true,
            message: __('dictionaries.country_deleted_successfully'),
            data: country
        });
    } catch (error: any) {
        console.error('Error deleting country:', error);
        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: __('dictionaries.country_not_found')
            });
        } else if (error.code === 'P2003') {
            res.status(409).json({
                success: false,
                message: __('dictionaries.country_in_use')
            });
        } else {
            res.status(500).json({
                success: false,
                message: __('dictionaries.country_deletion_failed')
            });
        }
    }
};

export const getCountryByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const country = await getCountryById(id);
        if (!country) {
            res.status(404).json({
                success: false,
                message: __('dictionaries.country_not_found')
            });
        } else {
            res.status(200).json({
                success: true,
                message: __('dictionaries.country_retrieved_successfully'),
                data: country
            });
        }
    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({
            success: false,
            message: __('dictionaries.country_retrieval_failed')
        });
    }
};
