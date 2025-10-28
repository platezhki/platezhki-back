import { Request, Response } from "express";
import { getRoles, createRole, updateRole } from "../services/roles.service";
import { __ } from "../utils/i18n";

export const getRolesHandler = async (req: Request, res: Response) => {
    try {
        const roles = await getRoles();
        res.status(200).json({
            success: true,
            message: __('roles.retrieved_successfully'),
            data: roles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: __('roles.retrieval_failed')
        });
    }
};

export const createRoleHandler = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: __('validation.required')
            });
        }

        const role = await createRole(name);
        res.status(201).json({
            success: true,
            message: __('roles.created_successfully'),
            data: role
        });
    } catch (error) {
        console.error('Error creating role:', error);
        if (error instanceof Error) {
            if (error.message === __('roles.name_exists')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: __('roles.creation_failed')
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: __('roles.creation_failed')
            });
        }
    }
};

export const updateRoleHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: __('validation.required')
            });
        }

        const role = await updateRole(Number(id), name);
        res.status(200).json({
            success: true,
            message: __('roles.updated_successfully'),
            data: role
        });
    } catch (error) {
        console.error('Error updating role:', error);
        if (error instanceof Error) {
            if (error.message === __('roles.not_found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else if (error.message === __('roles.name_exists')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: __('roles.update_failed')
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: __('roles.update_failed')
            });
        }
    }
};
