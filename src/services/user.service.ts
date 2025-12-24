import { PrismaClient } from "../generated/prisma";
import { __ } from "../utils/i18n";
import bcrypt from "bcrypt";
import { sendEmail } from './email.service';
import {generateTokenPair} from "../utils/jwt";

const prisma = new PrismaClient();

export const getUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
            },
            include: {
                role: true,
            },
        });

        return users;
    } catch (error) {
        throw error;
    }
};

export const getUser = async (id: number) => {
    try {
        const existingUser = await prisma.user.findFirst({
            where: { id },
            include: { role: true },
        });

        if (!existingUser) {
            throw new Error(__('user.user_not_found'));
        }

        const { password: _, ...userWithoutPassword } = existingUser as any;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = async (userId: number) => {
    try {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true,
            },
            include: {
                role: true,
            },
        });

        if (!user) {
            throw new Error(__('user.user_not_found'));
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export const createUser = async (createData: {
    username: string;
    email: string;
    password: string;
    roleId: number;
}, creatorUserId: number) => {
    try {
        // Check if username already exists
        const usernameExists = await prisma.user.findFirst({
            where: {
                username: createData.username,
            },
        });

        if (usernameExists) {
            throw new Error(__('auth.username_exists'));
        }

        // Check if email already exists
        const emailExists = await prisma.user.findFirst({
            where: {
                email: createData.email,
            },
        });

        if (emailExists) {
            throw new Error(__('auth.email_exists'));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createData.password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                username: createData.username,
                email: createData.email,
                password: hashedPassword,
                roleId: createData.roleId,
                ownerId: creatorUserId,
            },
            include: {
                role: true,
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export const updateUser = async (userId: number, updateData: {
    username?: string;
    password?: string;
}) => {
    try {
        const existingUser = await prisma.user.findFirst({
            where: { id: userId, isActive: true },
        });
        if (!existingUser) {
            throw new Error(__('user.user_not_found'));
        }

        const data: any = {};

        if (updateData.username && updateData.username !== existingUser.username) {
            const usernameExists = await prisma.user.findFirst({
                where: { username: updateData.username, id: { not: userId } },
            });
            if (usernameExists) {
                throw new Error(__('auth.username_exists'));
            }
            data.username = updateData.username;
        }

        if (updateData.password && updateData.password.length >= 6) {
            const hashed = await bcrypt.hash(updateData.password, 10);
            data.password = hashed;
        }

        if (Object.keys(data).length === 0) {
            // Нет валидных изменений
            return existingUser;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
            include: { role: true },
        });

        const { password: _, ...userWithoutPassword } = updatedUser as any;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

// Update or create user activity record for a device (cookieHash). If userId provided, save it too.
export const touchUserActivity = async (cookieHash: string, userId?: number) => {
    try {
        const now = new Date();
        // Use prisma.userActivity upsert — cast prisma as any in case client not generated yet
        const p: any = prisma as any;
        const existing = await p.userActivity.findUnique({ where: { cookieHash } });
        if (existing) {
            await p.userActivity.update({ where: { cookieHash }, data: { lastSeenAt: now, userId: userId ?? existing.userId } });
        } else {
            await p.userActivity.create({ data: { cookieHash, userId: userId ?? null, lastSeenAt: now } });
        }
        return true;
    } catch (error) {
        console.error('touchUserActivity error', error);
        return false;
    }
};

// Count unique active user activities in the last `minutes` minutes
export const countActiveUsers = async (minutes = 5) => {
    try {
        const p: any = prisma as any;
        const since = new Date(Date.now() - minutes * 60 * 1000);
        // Count distinct cookieHash where lastSeenAt >= since
        const count = await p.userActivity.count({ where: { lastSeenAt: { gte: since } } });
        return count;
    } catch (error) {
        console.error('countActiveUsers error', error);
        return 0;
    }
};

export const sendEmailVerificationCode = async (userId: number) => {
    try {
        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) {
            throw new Error(__('user.user_not_found'));
        }
        if ((user as any).emailVerified) {
            return { message: __('auth.email_already_verified') };
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

        await prisma.emailVerification.create({
            data: { userId: user.id, email: user.email, code, expiresAt },
        });

        const frontendUrl = process.env.FRONTEND_URL_VERIFY_EMAIL;
        if (!frontendUrl) {
            throw new Error(__('general.server_error'));
        }
        const link = `${frontendUrl}${encodeURIComponent(code)}`;

        const subject = __('auth.email_code_subject');
        const text = __('auth.email_link_text', { link, minutes: 15 });
        const html = __('auth.email_link_html', { link, minutes: 15 });

        await sendEmail({
            to: user.email,
            subject,
            text,
            html,
        });

        return { message: __('auth.email_code_sent') };
    } catch (error) {
        throw error;
    }
};

export const verifyEmailCode = async (userId: number, code: string) => {
    try {
        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) {
            throw new Error(__('user.user_not_found'));
        }
        if ((user as any).emailVerified) {
            return { message: __('auth.email_already_verified') };
        }

        const record = await prisma.emailVerification.findFirst({
            where: { email: user.email, code, userId: user.id, isUsed: false },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            throw new Error(__('auth.email_code_invalid'));
        }
        if (record.expiresAt < new Date()) {
            throw new Error(__('auth.email_code_expired'));
        }

        await prisma.$transaction([
            prisma.emailVerification.update({ where: { id: record.id }, data: { isUsed: true } }),
            prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
        ]);

        return { message: __('auth.email_verified_success') };
    } catch (error) {
        throw error;
    }
};

export const getUsersAdmin = async (query: {
  page?: number;
  limit?: number;
  q?: string;
  id?: number;
  ids?: string; // space-separated IDs
  roleId?: number;
  ownerId?: number;
  isActive?: boolean;
  emailVerified?: boolean;
  username?: string;
  email?: string;
  averageRatingMin?: number;
  averageRatingMax?: number;
  ratingsCountMin?: number;
  ratingsCountMax?: number;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  updatedAtFrom?: Date;
  updatedAtTo?: Date;
  lastActivityFrom?: Date;
  lastActivityTo?: Date;
  sort_column?: 'id'|'username'|'email'|'roleId'|'averageRating'|'ratingsCount'|'createdAt'|'updatedAt'|'lastActivity'|'ownerId'|'isActive'|'emailVerified';
  order?: 'asc'|'desc';
}) => {

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Parse multiple IDs from `ids` only (ids are space-separated numeric tokens)
  const parseIds = (text?: string) => {
    if (!text) return [] as number[];
    return text
      .trim()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && /^\d+$/.test(t))
      .map((t) => parseInt(t, 10));
  };

  const idsList: number[] = typeof query.ids === 'string' && query.ids.trim().length > 0
    ? Array.from(new Set(parseIds(query.ids)))
    : [];

  // If `ids` provided, use it as primary filter
  if (idsList.length > 0) {
    where.id = { in: idsList };
  }

  // Text search by q for username/email (works only when ids not used)
  if (query.q) {
    where.OR = [
      { username: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  if (query.id !== undefined) where.id = query.id;
  if (query.roleId !== undefined) where.roleId = query.roleId;
  if (query.ownerId !== undefined) where.ownerId = query.ownerId;
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.emailVerified !== undefined) where.emailVerified = query.emailVerified;
  if (query.username) where.username = { contains: query.username, mode: 'insensitive' };
  if (query.email) where.email = { contains: query.email, mode: 'insensitive' };

  const AND: any[] = [];
  if (query.averageRatingMin !== undefined) AND.push({ averageRating: { gte: query.averageRatingMin } });
  if (query.averageRatingMax !== undefined) AND.push({ averageRating: { lte: query.averageRatingMax } });
  if (query.ratingsCountMin !== undefined) AND.push({ ratingsCount: { gte: query.ratingsCountMin } });
  if (query.ratingsCountMax !== undefined) AND.push({ ratingsCount: { lte: query.ratingsCountMax } });
  if (query.createdAtFrom) AND.push({ createdAt: { gte: query.createdAtFrom } });
  if (query.createdAtTo) AND.push({ createdAt: { lte: query.createdAtTo } });
  if (query.updatedAtFrom) AND.push({ updatedAt: { gte: query.updatedAtFrom } });
  if (query.updatedAtTo) AND.push({ updatedAt: { lte: query.updatedAtTo } });
  if (query.lastActivityFrom) AND.push({ lastActivity: { gte: query.lastActivityFrom } });
  if (query.lastActivityTo) AND.push({ lastActivity: { lte: query.lastActivityTo } });
  if (AND.length) where.AND = (where.AND || []).concat(AND);

  const orderBy: any = {};
  const sortCol = query.sort_column || 'createdAt';
  orderBy[sortCol] = query.order || 'desc';

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { role: true },
    }),
  ]);

  const data = users.map((u: any) => {
    const { password, ...rest } = u;
    return rest;
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };
};

export const updateUserAdmin = async (id: number, data: {
  username?: string;
  email?: string;
  password?: string;
  roleId?: number;
  ownerId?: number;
  isActive?: boolean;
  emailVerified?: boolean;
}) => {
  // Check exists
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('user.user_not_found');
  }

  const update: any = {};

  if (data.username && data.username !== user.username) {
    const exists = await prisma.user.findFirst({ where: { username: data.username, id: { not: id } } });
    if (exists) throw new Error('auth.username_exists');
    update.username = data.username;
  }

  if (data.email && data.email !== user.email) {
    const exists = await prisma.user.findFirst({ where: { email: data.email, id: { not: id } } });
    if (exists) throw new Error('auth.email_exists');
    update.email = data.email;
  }

  if (data.password) {
    update.password = await bcrypt.hash(data.password, 10);
  }

  if (typeof data.roleId === 'number') update.roleId = data.roleId;
  if (typeof data.ownerId === 'number') update.ownerId = data.ownerId;
  if (typeof data.isActive === 'boolean') update.isActive = data.isActive;
  if (typeof data.emailVerified === 'boolean') update.emailVerified = data.emailVerified;

  if (Object.keys(update).length === 0) {
    const { password: _pw, ...rest } = user as any;
    return rest;
  }

  const updated = await prisma.user.update({ where: { id }, data: update, include: { role: true } });
  const { password: _pw, ...rest } = updated as any;
  return rest;
};

export const getTokenByUserId = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new Error(__('auth.user_not_found'));
    }

    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      username: user.username,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  } catch (error) {
    throw error;
  }
};
