// 중남미 및 캐나다 국가 시드
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Latin America + Canada countries
const countries = [
  // North America
  { code: 'CA', name: 'Canada', currency: 'CAD', timezone: 'America/Toronto' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', timezone: 'America/Mexico_City' },
  { code: 'US', name: 'United States', currency: 'USD', timezone: 'America/New_York' },
  
  // Central America
  { code: 'GT', name: 'Guatemala', currency: 'GTQ', timezone: 'America/Guatemala' },
  { code: 'BZ', name: 'Belize', currency: 'BZD', timezone: 'America/Belize' },
  { code: 'SV', name: 'El Salvador', currency: 'USD', timezone: 'America/El_Salvador' },
  { code: 'HN', name: 'Honduras', currency: 'HNL', timezone: 'America/Tegucigalpa' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO', timezone: 'America/Managua' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica' },
  { code: 'PA', name: 'Panama', currency: 'USD', timezone: 'America/Panama' },
  
  // Caribbean
  { code: 'CU', name: 'Cuba', currency: 'CUP', timezone: 'America/Havana' },
  { code: 'DO', name: 'Dominican Republic', currency: 'DOP', timezone: 'America/Santo_Domingo' },
  { code: 'HT', name: 'Haiti', currency: 'HTG', timezone: 'America/Port-au-Prince' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', timezone: 'America/Jamaica' },
  { code: 'PR', name: 'Puerto Rico', currency: 'USD', timezone: 'America/Puerto_Rico' },
  { code: 'TT', name: 'Trinidad and Tobago', currency: 'TTD', timezone: 'America/Port_of_Spain' },
  
  // South America
  { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
  { code: 'VE', name: 'Venezuela', currency: 'VES', timezone: 'America/Caracas' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', timezone: 'America/Guayaquil' },
  { code: 'PE', name: 'Peru', currency: 'PEN', timezone: 'America/Lima' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', timezone: 'America/Sao_Paulo' },
  { code: 'BO', name: 'Bolivia', currency: 'BOB', timezone: 'America/La_Paz' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG', timezone: 'America/Asuncion' },
  { code: 'CL', name: 'Chile', currency: 'CLP', timezone: 'America/Santiago' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', timezone: 'America/Buenos_Aires' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', timezone: 'America/Montevideo' },
  { code: 'GY', name: 'Guyana', currency: 'GYD', timezone: 'America/Guyana' },
  { code: 'SR', name: 'Suriname', currency: 'SRD', timezone: 'America/Paramaribo' },
  { code: 'GF', name: 'French Guiana', currency: 'EUR', timezone: 'America/Cayenne' },
];

async function seedCountries() {
  console.log('🌎 Seeding countries...');

  // Delete existing countries
  await prisma.country.deleteMany();
  console.log('✅ Cleared existing countries');

  // Insert countries
  for (const country of countries) {
    await prisma.country.create({ data: country });
  }

  console.log(`✅ Created ${countries.length} countries`);

  // List all countries
  const allCountries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
  console.log('\n📋 Countries:');
  allCountries.forEach(c => {
    console.log(`   ${c.code} - ${c.name} (${c.currency}, ${c.timezone})`);
  });

  console.log('\n🎉 Country seeding completed!');
}

seedCountries()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
