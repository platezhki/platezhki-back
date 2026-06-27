import { z } from "zod";
import { __ } from "../utils/i18n";

// Helper to accept either a single number or array of numbers and always transform to number[]
const numOrArray = z.union([z.number(), z.array(z.number())]).transform((v) => Array.isArray(v) ? v : [v]);

const fieldSettingSchema = z.object({
  key: z.string().min(1),
  visible: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

const offerParameterSchema = z.object({
  name: z.string().min(1, __("validation.name_required")).max(255, __("validation.name_too_long")),
  value: z.string().max(1000),
  order: z.number().int().optional().default(0),
  isVisible: z.boolean().optional().default(true),
});

const offerFileInputSchema = z.object({
  file: z.string().min(1),
  fileName: z.string().min(1),
});

export const createOfferSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, __("validation.name_required"))
      .max(255, __("validation.name_too_long")),
    description: z.string().max(600, __("validation.description_too_long")).optional(),
    merchantOnly: z.boolean().optional().default(false),
    fieldSettings: z.array(fieldSettingSchema).optional(),
    parameters: z.array(offerParameterSchema).optional(),
    files: z.array(offerFileInputSchema).optional(),
    countries: z.array(z.number()).min(1, __("validation.countries_required")),
    currencies: z.array(z.number()).min(1, __("validation.currencies_required")),
    paymentSystemTypes: numOrArray.refine((arr) => arr.length > 0, __("validation.payment_system_types_required")),
    trafficVolumeMin: z.number().min(0, __("validation.traffic_volume_min_invalid")),
    trafficVolumeMax: z.number().min(0, __("validation.traffic_volume_max_invalid")),
    paymentMethods: numOrArray,
    payInFee: z.number().min(0, __("validation.payin_fee_invalid")).max(100, __("validation.payin_fee_invalid")),
    payOutFee: z.number().min(0, __("validation.payout_fee_invalid")).max(100, __("validation.payout_fee_invalid")),
    payInMinLimit: z.number().min(0, __("validation.payin_min_limit_invalid")),
    payInMaxLimit: z.number().min(0, __("validation.payin_max_limit_invalid")),
    payOutMinLimit: z.number().min(0, __("validation.payout_min_limit_invalid")),
    payOutMaxLimit: z.number().min(0, __("validation.payout_max_limit_invalid")),
    support247: z.boolean(),
    automatics: z.boolean(),
    trafficSources: numOrArray.refine((arr) => arr.length > 0, __("validation.traffic_sources_required")),
    trafficTypes: numOrArray.refine((arr) => arr.length > 0, __("validation.traffic_types_required")),
    connectionTypes: numOrArray.refine((arr) => arr.length > 0, __("validation.connection_types_required")),
    balanceTypes: numOrArray.optional(),
    legalPerson: z.boolean(),
    isActive: z.boolean().optional().default(true),
    settleSpeedId: z.number().optional(),
  })
    .refine((data) => {
      const pm1 = Array.isArray((data as any).paymentMethods) ? (data as any).paymentMethods : undefined;
      return (pm1 && pm1.length > 0) ;
    }, {
      message: __("validation.payment_method_required"),
      path: ["paymentMethods"]
    }).refine((data) => data.trafficVolumeMax >= data.trafficVolumeMin, {
      message: __("validation.traffic_volume_max_gte_min"),
      path: ["trafficVolumeMax"]
    }).refine((data) => data.payInMaxLimit >= data.payInMinLimit, {
      message: __("validation.payin_max_limit_gte_min"),
      path: ["payInMaxLimit"]
    }).refine((data) => data.payOutMaxLimit >= data.payOutMinLimit, {
      message: __("validation.payout_max_limit_gte_min"),
      path: ["payOutMaxLimit"]
    }),
});

export const getOffersSchema = z.object({
  query: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
    isActive: z.boolean().optional(),
    countryId: z.array(z.number()).optional(),
    currencyId: z.array(z.number()).optional(),
    paymentMethodId: z.array(z.number()).optional(),
    paymentSystemTypeId: z.array(z.number()).optional(),
    trafficSourceId: z.array(z.number()).optional(),
    trafficTypeId: z.array(z.number()).optional(),
    connectionTypeId: z.array(z.number()).optional(),
    q: z.string().optional(),
    sort_column: z.enum(['name', 'id', 'createdAt']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    // Whether to prefer promoted offers first when no conflicting filters
    promotedFirst: z.boolean().optional().default(true),
  }).optional(),
});

export const getOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const updateOfferSchema = z.object({
  body: z.object({
    name: z.string().min(1, __("validation.name_required")).max(255, __("validation.name_too_long")).optional(),
    description: z.string().max(600, __("validation.description_too_long")).optional(),
    merchantOnly: z.boolean().optional(),
    fieldSettings: z.array(fieldSettingSchema).optional(),
    parameters: z.array(offerParameterSchema).optional(),
    files: z.array(offerFileInputSchema).optional(),
    countries: z.array(z.number()).min(1, __("validation.countries_required")).optional(),
    currencies: z.array(z.number()).min(1, __("validation.currencies_required")).optional(),
    paymentSystemTypes: numOrArray.refine((arr) => arr.length > 0, __("validation.payment_system_types_required")).optional(),
    trafficVolumeMin: z.number().min(0, __("validation.traffic_volume_min_invalid")).optional(),
    trafficVolumeMax: z.number().min(0, __("validation.traffic_volume_max_invalid")).optional(),
    paymentMethods: numOrArray.optional(),
    payInFee: z.number().min(0, __("validation.payin_fee_invalid")).max(100, __("validation.payin_fee_invalid")).optional(),
    payOutFee: z.number().min(0, __("validation.payout_fee_invalid")).max(100, __("validation.payout_fee_invalid")).optional(),
    payInMinLimit: z.number().min(0, __("validation.payin_min_limit_invalid")).optional(),
    payInMaxLimit: z.number().min(0, __("validation.payin_max_limit_invalid")).optional(),
    payOutMinLimit: z.number().min(0, __("validation.payout_min_limit_invalid")).optional(),
    payOutMaxLimit: z.number().min(0, __("validation.payout_max_limit_invalid")).optional(),
    support247: z.boolean().optional(),
    automatics: z.boolean().optional(),
    trafficSources: numOrArray.refine((arr) => arr.length > 0, __("validation.traffic_sources_required")).optional(),
    trafficTypes: numOrArray.refine((arr) => arr.length > 0, __("validation.traffic_types_required")).optional(),
    connectionTypes: numOrArray.refine((arr) => arr.length > 0, __("validation.connection_types_required")).optional(),
    balanceTypes: numOrArray.optional(),
    legalPerson: z.boolean().optional(),
    slug: z.string().min(1, __("validation.slug_required")).optional(),
    isActive: z.boolean().optional(),
    settleSpeedId: z.number().optional(),
  }).refine((data) => {
    if (data.trafficVolumeMin !== undefined && data.trafficVolumeMax !== undefined) {
      return data.trafficVolumeMax >= data.trafficVolumeMin;
    }
    return true;
  }, {
    message: __("validation.traffic_volume_max_gte_min"),
    path: ["trafficVolumeMax"]
  }).refine((data) => {
    if (data.payInMinLimit !== undefined && data.payInMaxLimit !== undefined) {
      return data.payInMaxLimit >= data.payInMinLimit;
    }
    return true;
  }, {
    message: __("validation.payin_max_limit_gte_min"),
    path: ["payInMaxLimit"]
  }).refine((data) => {
    if (data.payOutMinLimit !== undefined && data.payOutMaxLimit !== undefined) {
      return data.payOutMaxLimit >= data.payOutMinLimit;
    }
    return true;
  }, {
    message: __("validation.payout_max_limit_gte_min"),
    path: ["payOutMaxLimit"]
  }),
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const activateOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const deactivateOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const deleteOfferSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const getOfferBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, __("validation.slug_required")),
  }),
});

export const uploadOfferFileSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
  body: z.object({
    files: z.array(offerFileInputSchema).min(1, __("validation.files_required")),
  }),
});

export const offerFileParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
    fileId: z.string().min(1, __("validation.id_required")),
  }),
});

export const getUserOffersSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    isActive: z.string().optional(),
    sort_column: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    currencyId: z.string().transform((val) =>
      val.split(',').map(id => parseInt(id.trim()))
    ).optional(),
    q: z.string().optional(),
  }).optional(),
});

// Helper function to handle both single values and arrays (also supports comma-separated string like "1,2,3")
const arrayOrSingle = z.union([
  z.array(z.string().transform(val => parseInt(val))),
  z.string().transform(val => val.split(',').map(s => parseInt(s.trim())))
]);

export const filterOffersSchema = z.object({
  query: z.object({
    countries: arrayOrSingle.optional(),
    currencies: arrayOrSingle.optional(),
    paymentSystemTypes: arrayOrSingle.optional(),
    trafficVolumeMin: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    trafficVolumeMax: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payInMinFee: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payInMaxFee: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payOutMinFee: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payOutMaxFee: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payInMinLimit: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payInMaxLimit: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payOutMinLimit: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payOutMaxLimit: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    payOutLimits: z.union([z.string().transform(val => parseInt(val)), z.number()]).optional(),
    support247: arrayOrSingle.optional(),
    automatics: arrayOrSingle.optional(),
    trafficSources: arrayOrSingle.optional(),
    trafficTypes: arrayOrSingle.optional(),
    balanceTypes: arrayOrSingle.optional(),
    connectionTypes: arrayOrSingle.optional(),
    legalPerson: arrayOrSingle.optional(),
    payMethods: arrayOrSingle.optional(),
    // Pagination
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("12"),

    // Search
    q: z.string().optional(),

    // Favorites
    ids: z.array(z.number()).optional(),

    // Sorting
    sortColumn: z.enum(['id', 'createdAt', 'name', 'averageRating', 'payInMethodsCount', 'payOutMethodsCount']).optional().default('id'),
    order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  }).optional(),
});

