import {PrismaClient} from "../generated/prisma";
import {hashPassword, comparePasswords} from "../utils/crypto";
import {__} from "../utils/i18n";
import {generateTokenPair, verifyRefreshToken} from "../utils/jwt";
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from './email.service';

const prisma = new PrismaClient();

export const loginUser = async (identifier: string, password: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
      include: { role: true },
    });

    if (!user) {
      throw new Error(__('auth.user_not_found'));
    }

    if (user.isActive === false) {
      throw new Error(__('auth.unauthorized'));
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error(__('auth.invalid_password'));
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

export const registerUser = async (username: string, password: string, email: string) => {
  try {
    // Check for existing username
    const existingUsername = await prisma.user.findFirst({
      where: {username}
    });

    if (existingUsername) {
      throw new Error(__('auth.username_exists'));
    }

    // Check for existing email
    const existingEmail = await prisma.user.findFirst({
      where: {email}
    });

    if (existingEmail) {
      throw new Error(__('auth.email_exists'));
    }

    const hashedPassword = await hashPassword(password);

    // Find an existing admin user to use as owner, or use self-reference
    const adminUser = await prisma.user.findFirst({
      where: {roleId: 1}, // Find any admin user
      select: {id: true}
    });

    const roleUser = await prisma.role.findFirst({
      where: {name: 'USER'},
      select: {id: true}
    });

    if (!roleUser) {
      throw new Error(__('auth.role_not_exists'));
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        roleId: roleUser.id,
        ownerId: adminUser?.id || 1,
      },
      include: {
        role: true,
      },
    });

    // Update user to be their own owner
    const updatedUser = await prisma.user.update({
      where: {id: user.id},
      data: {ownerId: user.id},
      include: {role: true}
    });

    const {password: _, ...userWithoutPassword} = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

// Аутентификация через Google OAuth по полученному авторизационному коду
export const loginWithGoogle = async (code: string, referralCode?: string) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(__('auth.google_config_missing'));
    }

    const googleClient = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    });

    const tokenResponse = await googleClient.getToken(code);
    const tokens = tokenResponse.tokens;
    if (!tokens.id_token) {
      throw new Error(__('auth.google_id_token_missing'));
    }

    const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error(__('auth.google_email_missing'));
    }

    const email = payload.email;
    const givenName = payload.given_name || '';
    const familyName = payload.family_name || '';

    // Найти пользователя по email
    let user = await prisma.user.findFirst({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      // Подготовить уникальный username
      const baseUsername = (email.split('@')[0] || 'user').slice(0, 20);
      let usernameCandidate = baseUsername;
      const exists = async (u: string) => prisma.user.findFirst({ where: { username: u } });
      let suffix = 0;
      // Генерируем случайный пароль, т.к. вход по паролю не используется
      const randomPasswordPlain = Math.random().toString(36).slice(-12);
      const hashedPassword = await hashPassword(randomPasswordPlain);

      while (await exists(usernameCandidate)) {
        suffix += 1;
        usernameCandidate = `${baseUsername}${suffix}`.slice(0, 30);
      }

      // Найдём роль USER
      const roleUser = await prisma.role.findFirst({ where: { name: 'USER' }, select: { id: true } });
      if (!roleUser) {
        throw new Error(__('auth.role_not_exists'));
      }

      // Выберем владельца (админ) при создании
      const adminUser = await prisma.user.findFirst({ where: { roleId: 1 }, select: { id: true } });

      user = await prisma.user.create({
        data: {
          username: usernameCandidate,
          password: hashedPassword,
          email,
          roleId: roleUser.id,
          ownerId: adminUser?.id || 1,
        },
        include: { role: true },
      });

      // user = await prisma.user.update({ where: { id: user.id }, data: { ownerId: user.id }, include: { role: true } });
    }

    if (user.isActive === false) {
      throw new Error(__('auth.unauthorized'));
    }

    const { accessToken, refreshToken, tokenId } = generateTokenPair({
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

    const { password: _, ...userWithoutPassword } = user as any;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find the token in database
    const authToken = await prisma.authToken.findFirst({
      where: {
        refreshToken,
        userId: payload.userId,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!authToken) {
      throw new Error(__('auth.invalid_refresh_token'));
    }

    if (authToken.user.isActive === false) {
      throw new Error(__('auth.unauthorized'));
    }

    // Check if token is expired
    if (authToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.authToken.delete({
        where: {id: authToken.id},
      });
      throw new Error(__('auth.refresh_token_expired'));
    }

    // Generate new token pair
    const {accessToken: newAccessToken, refreshToken: newRefreshToken, tokenId} = generateTokenPair({
      id: authToken.user.id,
      username: authToken.user.username,
    });

    // Calculate new expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update the token in database
    await prisma.authToken.update({
      where: {id: authToken.id},
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async (refreshToken: string) => {
  try {
    // Find and delete the token
    const authToken = await prisma.authToken.findFirst({
      where: {refreshToken},
    });

    if (authToken) {
      await prisma.authToken.delete({
        where: {id: authToken.id},
      });
    }

    return {message: __('auth.logout_success')};
  } catch (error) {
    throw error;
  }
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    throw new Error(__('auth.user_not_found'));
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await (prisma as any).passwordReset.create({ data: { userId: user.id, email, code, expiresAt } });

  const frontendUrl = process.env.FRONTEND_URL_RESET_PASSWORD;
  if (!frontendUrl) throw new Error(__('general.server_error'));
  const link = `${frontendUrl}${encodeURIComponent(code)}`;

  await sendEmail({
    to: email,
    subject: __('auth.password_reset_subject'),
    text: __('auth.password_reset_text', { link, minutes: 15 }),
    html: __('auth.password_reset_html', { link, minutes: 15 }),
  });

  return { message: __('auth.password_reset_link_sent') };
};

export const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    throw new Error(__('auth.user_not_found'));
  }

  const record = await (prisma as any).passwordReset.findFirst({
    where: { email, code, userId: user.id, isUsed: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new Error(__('auth.password_reset_code_invalid'));
  if (record.expiresAt < new Date()) throw new Error(__('auth.password_reset_code_expired'));

  const hashed = await hashPassword(newPassword);

  await prisma.$transaction([
    (prisma as any).passwordReset.update({ where: { id: record.id }, data: { isUsed: true } }),
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
  ]);

  return { message: __('auth.password_reset_success') };
};
