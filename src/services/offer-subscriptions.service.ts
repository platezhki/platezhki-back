import { PrismaClient } from "../generated/prisma";
import { z } from "zod";
import { getOffersSchema } from "../schemas/offers.schema";
import { OFFER_INCLUDE_CONFIG, transformOffer } from "./offers.service";
import { __ } from "../utils/i18n";

const prisma = new PrismaClient();

export const subscribeToOffer = async (userId: number, offerId: number) => {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) {
    throw new Error(__('offer.not_found'));
  }

  const existing = await prisma.offerSubscription.findUnique({
    where: { userId_offerId: { userId, offerId } }
  });

  if (existing) {
    throw new Error(__('offer_subscriptions.already_subscribed'));
  }

  return prisma.offerSubscription.create({
    data: { userId, offerId }
  });
};

export const unsubscribeFromOffer = async (userId: number, offerId: number) => {
  const existing = await prisma.offerSubscription.findUnique({
    where: { userId_offerId: { userId, offerId } }
  });

  if (!existing) {
    throw new Error(__('offer_subscriptions.not_found'));
  }

  await prisma.offerSubscription.delete({
    where: { userId_offerId: { userId, offerId } }
  });

  return { message: __('offer_subscriptions.removed_successfully') };
};

export const isSubscribedToOffer = async (userId: number, offerId: number) => {
  const existing = await prisma.offerSubscription.findUnique({
    where: { userId_offerId: { userId, offerId } }
  });
  return { isSubscribed: !!existing };
};

export const getSubscribedOfferIds = async (
  userId: number,
  offerIds: number[]
): Promise<Set<number>> => {
  if (!offerIds.length) return new Set();
  const rows = await prisma.offerSubscription.findMany({
    where: { userId, offerId: { in: offerIds } },
    select: { offerId: true }
  });
  return new Set(rows.map((r) => r.offerId));
};

export const getUserSubscribedOffers = async (
  userId: number,
  filters?: z.infer<typeof getOffersSchema>['query']
) => {
  const page = Number(filters?.page) || 1;
  const limit = Number(filters?.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    subscriptions: { some: { userId } }
  };

  const total = await prisma.offer.count({ where });

  const offers = await prisma.offer.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: OFFER_INCLUDE_CONFIG
  });

  const data = offers.map((offer) => ({
    ...transformOffer(offer),
    isSubscribed: true
  }));

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};
