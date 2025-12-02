import { PrismaClient } from '../generated/prisma';
import { hashPassword } from '../utils/crypto';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: 'SUPER_ADMIN' },
      { name: 'ADMIN' },
      { name: 'MANAGER' },
      { name: 'USER' },
      { name: 'PAYMENT' },
      { name: 'MERCHANT' },
    ],
    skipDuplicates: true,
  });

  const hashedPassword = await hashPassword('Zaqwsx_123');

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (superAdminRole) {
    // First, check if admin user already exists
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      // Create admin user - we'll use a workaround for the self-reference
      try {
        adminUser = await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            roleId: superAdminRole.id,
            ownerId: 1, // Will be updated to self-reference after creation
          },
        });

        // Update ownerId to self-reference
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { ownerId: adminUser.id },
        });
      } catch (error) {
        // Try to find existing admin user
        adminUser = await prisma.user.findUnique({
          where: { email: 'admin@example.com' },
        });
      }
    }
  }

  await prisma.country.createMany({
    data: [
      { name: 'Russia', flagUrl: 'flags/ru.png' },
      { name: 'Georgia', flagUrl: 'flags/ge.png' },
      { name: 'Kazakhstan', flagUrl: 'flags/kz.png' },
      { name: 'Uzbekistan', flagUrl: 'flags/uz.png' },
      { name: 'Ukraine', flagUrl: 'flags/ua.png' },
      { name: 'Europe', flagUrl: 'flags/eu.png' },
    ],
    skipDuplicates: true,
  });

  await prisma.currency.createMany({
    data: [
      { name: 'RUB' },
      { name: 'UAH' },
      { name: 'KZT' },
      { name: 'UZS' },
      { name: 'USD' },
      { name: 'EUR' },
    ],
    skipDuplicates: true,
  });


  await prisma.paymentSystemType.createMany({
    data: [
      { name: 'P2P' },
      { name: 'Crypto' },
      { name: 'Matching' },
      { name: 'Gateway' },
      { name: 'Acquiring' },
      { name: 'OCT' },
    ],
    skipDuplicates: true,
  });

  await prisma.paymentMethod.createMany({
    data: [
      { name: 'C2C' },
      { name: 'SBP' },
      { name: 'QR' },
      { name: 'Mobile' },
      { name: 'Crypto address' },
      { name: 'E-Wallet' },
      { name: 'Virtual Cards' },
      { name: 'Bank Transfer' },
    ],
    skipDuplicates: true,
  });

  await prisma.trafficSource.createMany({
    data: [
      { name: 'High Risk' },
      { name: 'Low Risk' },
    ],
    skipDuplicates: true,
  });

  await prisma.trafficType.createMany({
    data: [
      { name: 'FTD' },
      { name: 'TD' },
      // { name: 'VIP' },
      // { name: 'Primary' },
    ],
    skipDuplicates: true,
  });

  await prisma.connectionType.createMany({
    data: [
      { name: 'Redirect' },
      { name: 'H2H' },
      { name: 'Manual' },
    ],
    skipDuplicates: true,
  });

  await prisma.balanceType.createMany({
    data: [
      { name: 'Fiat' },
      { name: 'Crypto' },
      { name: 'USDT' },
      { name: 'BTC' },
    ],
    skipDuplicates: true,
  });

  await prisma.settleSpeed.createMany({
    data: [
      { name: 'T+0' },
      { name: 'T+1' },
      { name: 'T+2' },
      { name: 'T+3' },
      { name: 'T+4' },
      { name: 'T+5' },
      { name: 'T+6' },
      { name: 'T+7' },
    ],
    skipDuplicates: true,
  });

  // Get the admin user for ownerId
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (adminUser) {
    await prisma.language.createMany({
      data: [
        { name: 'Russian', shortName: 'RUS', code: 'ru', flagUrl: 'flags/ru.png', ownerId: adminUser.id },
        { name: 'English', shortName: 'ENG', code: 'en', flagUrl: 'flags/en.png', ownerId: adminUser.id },
        { name: 'Uzbek', shortName: 'UZB', code: 'uz', flagUrl: 'flags/uz.png', ownerId: adminUser.id },
        { name: 'Kazakh', shortName: 'KAZ', code: 'kz', flagUrl: 'flags/kz.png', ownerId: adminUser.id },
        { name: 'Georgian', shortName: 'GEO', code: 'ge', flagUrl: 'flags/ge.png', ownerId: adminUser.id },
        { name: 'Ukrainian', shortName: 'UKR', code: 'ua', flagUrl: 'flags/ua.png', ownerId: adminUser.id },
      ],
      skipDuplicates: true,
    });

    // Get all the created entities for relations
    const countries = await prisma.country.findMany();
    const currencies = await prisma.currency.findMany();
    const paymentMethods = await prisma.paymentMethod.findMany();
    const languages = await prisma.language.findMany();
    const paymentSystemTypes = await prisma.paymentSystemType.findMany();

    // Create sample PaymentServices
    const samplePaymentServices = [
      {
        name: 'QIWI Wallet',
        description: 'Popular Russian payment system for online transactions',
        serviceUrl: 'https://qiwi.com',
        establishedAt: new Date('2007-01-01'),
        email: 'support@qiwi.com',
        contacts: ['+7-800-707-77-59', 'support@qiwi.com'],
        paymentPageExampleLink: 'https://qiwi.com/payment-example',
        paymentPageExampleImageUrls: ['/uploads/payment-pages/qiwi-payment.png'],
        cabinetExampleLink: 'https://qiwi.com/cabinet-example',
        cabinetExampleImageUrls: ['/uploads/cabinets/qiwi-cabinet.png'],
        logoUrl: '/uploads/logos/qiwi-logo.png',
        slug: 'qiwi-wallet',
        isActive: true,
        ownerId: adminUser.id,
        userId: adminUser.id,
        countries: [countries[0].id, countries[1].id], // Russia, Georgia
        currencies: [currencies[0].id, currencies[4].id], // RUB, USD
        paymentSystemTypes: [paymentSystemTypes[0].id, paymentSystemTypes[4].id], // P2P Exchange, Money Transfer
        payInMethods: [paymentMethods[0].id, paymentMethods[1].id], // C2C, SBP
        payOutMethods: [paymentMethods[0].id], // C2C
        languageSupport: [languages[0].id, languages[1].id], // Russian, English
      },
      {
        name: 'YooMoney',
        description: 'Russian digital wallet and payment service',
        serviceUrl: 'https://yoomoney.ru',
        establishedAt: new Date('2002-01-01'),
        email: 'support@yoomoney.ru',
        contacts: ['+7-495-974-35-86', 'support@yoomoney.ru'],
        paymentPageExampleLink: 'https://yoomoney.ru/payment-example',
        paymentPageExampleImageUrls: ['/uploads/payment-pages/yoomoney-payment.png'],
        cabinetExampleLink: 'https://yoomoney.ru/cabinet-example',
        cabinetExampleImageUrls: ['/uploads/cabinets/yoomoney-cabinet.png'],
        logoUrl: '/uploads/logos/yoomoney-logo.png',
        slug: 'yoomoney',
        isActive: true,
        ownerId: adminUser.id,
        userId: adminUser.id,
        countries: [countries[0].id], // Russia
        currencies: [currencies[0].id, currencies[4].id], // RUB, USD
        paymentSystemTypes: [paymentSystemTypes[0].id], // P2P Exchange
        payInMethods: [paymentMethods[0].id, paymentMethods[2].id], // C2C, QR
        payOutMethods: [paymentMethods[0].id], // C2C
        languageSupport: [languages[0].id], // Russian
      },
      {
        name: 'WebMoney',
        description: 'International payment system and digital wallet',
        serviceUrl: 'https://webmoney.ru',
        establishedAt: new Date('1998-01-01'),
        email: 'support@webmoney.ru',
        contacts: ['+7-495-988-88-88', 'support@webmoney.ru'],
        paymentPageExampleLink: 'https://webmoney.ru/payment-example',
        paymentPageExampleImageUrls: ['/uploads/payment-pages/webmoney-payment.png'],
        cabinetExampleLink: 'https://webmoney.ru/cabinet-example',
        cabinetExampleImageUrls: ['/uploads/cabinets/webmoney-cabinet.png'],
        logoUrl: '/uploads/logos/webmoney-logo.png',
        slug: 'webmoney',
        isActive: true,
        ownerId: adminUser.id,
        userId: adminUser.id,
        countries: [countries[0].id, countries[1].id, countries[2].id], // Russia, Georgia, Kazakhstan
        currencies: [currencies[0].id, currencies[4].id, currencies[5].id], // RUB, USD, EUR
        paymentSystemTypes: [paymentSystemTypes[0].id, paymentSystemTypes[1].id], // P2P Exchange, Crypto Exchange
        payInMethods: [paymentMethods[0].id], // C2C
        payOutMethods: [paymentMethods[0].id], // C2C
        languageSupport: [languages[0].id, languages[1].id], // Russian, English
      },
      {
        name: 'PayPal',
        description: 'Global online payment system',
        serviceUrl: 'https://paypal.com',
        establishedAt: new Date('1998-12-01'),
        email: 'support@paypal.com',
        contacts: ['+1-402-935-2050', 'support@paypal.com'],
        paymentPageExampleLink: 'https://paypal.com/payment-example',
        paymentPageExampleImageUrls: ['/uploads/payment-pages/paypal-payment.png'],
        cabinetExampleLink: 'https://paypal.com/cabinet-example',
        cabinetExampleImageUrls: ['/uploads/cabinets/paypal-cabinet.png'],
        logoUrl: '/uploads/logos/paypal-logo.png',
        slug: 'paypal',
        isActive: true,
        ownerId: adminUser.id,
        userId: adminUser.id,
        countries: [countries[4].id, countries[5].id], // Ukraine, Europe
        currencies: [currencies[4].id, currencies[5].id], // USD, EUR
        paymentSystemTypes: [paymentSystemTypes[2].id], // Payment Gateway
        payInMethods: [paymentMethods[0].id], // C2C
        payOutMethods: [paymentMethods[0].id], // C2C
        languageSupport: [languages[1].id], // English
      },
      {
        name: 'Stripe',
        description: 'Online payment processing for internet businesses',
        serviceUrl: 'https://stripe.com',
        establishedAt: new Date('2010-01-01'),
        email: 'support@stripe.com',
        contacts: ['+1-650-318-6670', 'support@stripe.com'],
        paymentPageExampleLink: 'https://stripe.com/payment-example',
        paymentPageExampleImageUrls: ['/uploads/payment-pages/stripe-payment.png'],
        cabinetExampleLink: 'https://stripe.com/cabinet-example',
        cabinetExampleImageUrls: ['/uploads/cabinets/stripe-cabinet.png'],
        logoUrl: '/uploads/logos/stripe-logo.png',
        slug: 'stripe',
        isActive: true,
        ownerId: adminUser.id,
        userId: adminUser.id,
        countries: [countries[4].id, countries[5].id], // Ukraine, Europe
        currencies: [currencies[4].id, currencies[5].id], // USD, EUR
        paymentSystemTypes: [paymentSystemTypes[2].id, paymentSystemTypes[3].id], // Payment Gateway, Acquiring Service
        payInMethods: [paymentMethods[0].id], // C2C
        payOutMethods: [paymentMethods[0].id], // C2C
        languageSupport: [languages[1].id], // English
      }
    ];

    // Create PaymentServices with relations
    for (const serviceData of samplePaymentServices) {
      const { countries, currencies, paymentSystemTypes, payInMethods, payOutMethods, languageSupport, ...service } = serviceData;

      const createdService = await prisma.paymentService.create({
        data: {
          ...service,
          countries: {
            create: countries.map(countryId => ({ countryId }))
          },
          currencies: {
            create: currencies.map(currencyId => ({ currencyId }))
          },
          paymentSystemTypes: {
            create: paymentSystemTypes.map(paymentSystemTypeId => ({ paymentSystemTypeId }))
          },
          payInMethods: {
            create: [
              ...payInMethods.map(paymentMethodId => ({
                paymentMethodId,
                methodType: 'payin'
              })),
              ...payOutMethods.map(paymentMethodId => ({
                paymentMethodId,
                methodType: 'payout'
              }))
            ]
          },
          supportServiceLanguages: {
            create: languageSupport.map(languageId => ({ languageId }))
          }
        }
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
