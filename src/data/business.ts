export const business = {
  name: "Bart's Barber Shop",
  legalName: "Bart's Full Service Barber Shop",
  siteUrl: 'https://www.bartsbarbershop.org',
  futureDomain: 'https://www.bartsbarbershop.com',
  description:
    "Family-owned Laurel barber shop with more than 60 years in the hair industry, offering walk-in haircuts and grooming for men, women, and children.",
  locationName: 'Laurel Shopping Center',
  establishedYear: '1956',
  address: {
    streetAddress: '356 Domer Ave',
    addressLocality: 'Laurel',
    addressRegion: 'MD',
    postalCode: '20707',
    addressCountry: 'US',
  },
  phoneDisplay: '(301) 317-9111',
  phoneHref: 'tel:+13013179111',
  directionsUrl:
    'https://www.google.com/maps/search/?api=1&query=Bart%27s%20Full%20Service%20Barber%20Shop%20356%20Domer%20Ave%20Laurel%20MD%2020707',
  mapEmbedUrl:
    'https://www.google.com/maps?q=Bart%27s%20Full%20Service%20Barber%20Shop%2C%20356%20Domer%20Ave%2C%20Laurel%2C%20MD%2020707&output=embed',
  geo: {
    latitude: '39.09647163221324',
    longitude: '-76.85446140851847',
  },
  openingHoursSpecification: [
    { dayOfWeek: 'Monday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Tuesday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Wednesday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Thursday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Friday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Saturday', opens: '08:30', closes: '16:30' },
  ],
  displayHours: [
    { dayOfWeek: 'Monday', hours: '9:00 AM - 6:00 PM' },
    { dayOfWeek: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
    { dayOfWeek: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
    { dayOfWeek: 'Thursday', hours: '9:00 AM - 6:00 PM' },
    { dayOfWeek: 'Friday', hours: '9:00 AM - 6:00 PM' },
    { dayOfWeek: 'Saturday', hours: '8:30 AM - 4:30 PM' },
    { dayOfWeek: 'Sunday', hours: 'Closed' },
  ],
  closedDays: ['Sunday'],
  paymentAccepted: ['Cash'],
  sameAs: [
    'https://www.bartsbarbershop.org/',
    'https://www.mapquest.com/us/maryland/barts-full-service-barber-shop-2535246',
    'https://www.yellowpages.com/laurel-md/mip/barts-full-service-barber-shop-531282185',
  ],
  mapEmbedTitle: "Map to Bart's Barber Shop",
} as const;

export type Business = typeof business;
