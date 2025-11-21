import { z } from "zod";
import { __ } from "../utils/i18n";

export const createPaymentServiceSchema = z.object({
    name: z.string().min(1, __("validation.name_required")).max(255, __("validation.name_too_long")),
    logo: z.object({
      file: z.string().min(1, __("validation.logo_file_required")),
      fileName: z.string().min(1, __("validation.logo_filename_required"))
    }),
    description: z.string().max(255, __("validation.description_too_long")),
    establishedAt: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, __("validation.invalid_date_format")),
    contacts: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, __("validation.contacts_unique")).optional(),
    email: z.string().email(__("validation.invalid_email")).optional(),
    payInMethods: z.array(z.number()).min(1, __("validation.payin_methods_required")),
    payOutMethods: z.array(z.number()).min(1, __("validation.payout_methods_required")),
    countries: z.array(z.number()).min(1, __("validation.countries_required")),
    currencies: z.array(z.number()).min(1, __("validation.currencies_required")),
    paymentSystemType: z.array(z.number()).min(1, __("validation.payment_system_type_required")),
    languageSupport: z.array(z.number()).min(1, __("validation.language_support_required")),
    paymentPageExampleLink: z.string().url(__("validation.invalid_payment_page_link")).optional(),
    paymentPageExampleImageUrls: z.array(z.object({
      file: z.string().min(1, __("validation.image_file_required")),
      fileName: z.string().min(1, __("validation.image_filename_required"))
    })).optional(),
    cabinetExampleLink: z.string().url(__("validation.invalid_cabinet_link")).optional(),
    cabinetExampleImageUrls: z.array(z.object({
      file: z.string().min(1, __("validation.image_file_required")),
      fileName: z.string().min(1, __("validation.image_filename_required"))
    })).optional(),
    isActive: z.boolean().optional().default(true),
});

export const getPaymentServicesSchema = z.object({
  query: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
    isActive: z.boolean().optional().default(true),
    countryId: z.array(z.number()).optional(),
    currencyId: z.array(z.number()).optional(),
    paymentMethodId: z.array(z.number()).optional(),
    q: z.string().optional(),
    // Sorting
    sortColumn: z.enum(['id', 'createdAt', 'name', 'averageRating']).optional().default('id'),
    order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  }).optional(),
});

export const getPaymentServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
});

export const updatePaymentServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1, __("validation.name_required")).max(255, __("validation.name_too_long")).optional(),
    logo: z.union([
      z.object({
        file: z.string().min(1, __("validation.logo_file_required")),
        fileName: z.string().min(1, __("validation.logo_filename_required"))
      }),
      z.string().url(__("validation.invalid_logo_url"))
    ]).optional(),
    description: z.string().max(255, __("validation.description_too_long")).optional(),
    establishedAt: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, __("validation.invalid_date_format")).optional(),
    contacts: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, __("validation.contacts_unique")).optional(),
    email: z.string().email(__("validation.invalid_email")).optional(),
    payInMethods: z.array(z.number()).min(1, __("validation.payin_methods_required")).optional(),
    payOutMethods: z.array(z.number()).min(1, __("validation.payout_methods_required")).optional(),
    countries: z.array(z.number()).min(1, __("validation.countries_required")).optional(),
    currencies: z.array(z.number()).min(1, __("validation.currencies_required")).optional(),
    paymentSystemType: z.array(z.number()).min(1, __("validation.payment_system_type_required")).optional(),
    languageSupport: z.array(z.number()).min(1, __("validation.language_support_required")).optional(),
    paymentPageExampleLink: z.string().url(__("validation.invalid_payment_page_link")).optional(),
    paymentPageExampleImageUrls: z.array(z.union([
      z.object({
        file: z.string().min(1, __("validation.image_file_required")),
        fileName: z.string().min(1, __("validation.image_filename_required"))
      }),
      z.string().url(__("validation.invalid_image_url"))
    ])).optional(),
    cabinetExampleLink: z.string().url(__("validation.invalid_cabinet_link")).optional(),
    cabinetExampleImageUrls: z.array(z.union([
      z.object({
        file: z.string().min(1, __("validation.image_file_required")),
        fileName: z.string().min(1, __("validation.image_filename_required"))
      }),
      z.string().url(__("validation.invalid_image_url"))
    ])).optional(),
    slug: z.string().min(1, __("validation.slug_required")).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const activatePaymentServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const deactivatePaymentServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const deletePaymentServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, __("validation.id_required")),
  }),
});

export const getPaymentServiceBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, __("validation.slug_required")),
  }),
});

// Direct body schemas (user-friendly)
export const createPaymentServiceBodySchema = z.object({
  name: z.string().min(1, __("validation.name_required")).max(255, __("validation.name_too_long")),
  logo: z.object({
    file: z.string().min(1, __("validation.logo_file_required")),
    fileName: z.string().min(1, __("validation.logo_filename_required"))
  }),
  description: z.string().max(255, __("validation.description_too_long")),
  establishedAt: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, __("validation.invalid_date_format")),
  contacts: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, __("validation.contacts_unique")).optional(),
  email: z.string().email(__("validation.invalid_email")).optional(),
  payInMethods: z.array(z.number()).min(1, __("validation.payin_methods_required")),
  payOutMethods: z.array(z.number()).min(1, __("validation.payout_methods_required")),
  countries: z.array(z.number()).min(1, __("validation.countries_required")),
  currencies: z.array(z.number()).min(1, __("validation.currencies_required")),
  paymentSystemType: z.array(z.number()).min(1, __("validation.payment_system_type_required")),
  languageSupport: z.array(z.number()).min(1, __("validation.language_support_required")),
  paymentPageExampleLink: z.string().url(__("validation.invalid_payment_page_link")).optional(),
  paymentPageExampleImageUrls: z.array(z.object({
    file: z.string().min(1, __("validation.image_file_required")),
    fileName: z.string().min(1, __("validation.image_filename_required"))
  })).optional(),
  cabinetExampleLink: z.string().url(__("validation.invalid_cabinet_link")).optional(),
  cabinetExampleImageUrls: z.array(z.object({
    file: z.string().min(1, __("validation.image_file_required")),
    fileName: z.string().min(1, __("validation.image_filename_required"))
  })).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updatePaymentServiceBodySchema = z.object({
  name: z.string().min(1, __("validation.name_required")).max(255, __("validation.name_too_long")).optional(),
  logo: z.union([
    z.object({
      file: z.string().min(1, __("validation.logo_file_required")),
      fileName: z.string().min(1, __("validation.logo_filename_required"))
    }),
    z.string().url(__("validation.invalid_logo_url"))
  ]).optional(),
  description: z.string().max(255, __("validation.description_too_long")).optional(),
  establishedAt: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, __("validation.invalid_date_format")).optional(),
  contacts: z.array(z.string()).refine((arr) => new Set(arr).size === arr.length, __("validation.contacts_unique")).optional(),
  email: z.string().email(__("validation.invalid_email")).optional(),
  payInMethods: z.array(z.number()).min(1, __("validation.payin_methods_required")).optional(),
  payOutMethods: z.array(z.number()).min(1, __("validation.payout_methods_required")).optional(),
  countries: z.array(z.number()).min(1, __("validation.countries_required")).optional(),
  currencies: z.array(z.number()).min(1, __("validation.currencies_required")).optional(),
  paymentSystemType: z.array(z.number()).min(1, __("validation.payment_system_type_required")).optional(),
  languageSupport: z.array(z.number()).min(1, __("validation.language_support_required")).optional(),
  paymentPageExampleLink: z.string().url(__("validation.invalid_payment_page_link")).optional(),
  paymentPageExampleImageUrls: z.array(z.union([
    z.object({
      file: z.string().min(1, __("validation.image_file_required")),
      fileName: z.string().min(1, __("validation.image_filename_required"))
    }),
    z.string().url(__("validation.invalid_image_url"))
  ])).optional(),
  cabinetExampleLink: z.string().url(__("validation.invalid_cabinet_link")).optional(),
  cabinetExampleImageUrls: z.array(z.union([
    z.object({
      file: z.string().min(1, __("validation.image_file_required")),
      fileName: z.string().min(1, __("validation.image_filename_required"))
    }),
    z.string().url(__("validation.invalid_image_url"))
  ])).optional(),
  slug: z.string().min(1, __("validation.slug_required")).optional(),
  isActive: z.boolean().optional(),
});
