import 'dotenv/config';
import fs from 'fs';
import { parse } from 'csv-parse';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file) {
    // eslint-disable-next-line no-console
    console.error('Usage: ts-node-dev scripts/import-csv.ts <file.csv>');
    process.exit(1);
  }

  const parser = fs
    .createReadStream(file)
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const row of parser) {
    const lead = {
      firstName: row.firstName || row.firstname || row.FirstName || 'First',
      lastName: row.lastName || row.lastname || row.LastName || 'Last',
      phoneE164: row.phoneE164 || row.phone || row.Phone || '',
      email: row.email || row.Email || undefined,
      state: row.state || row.State || undefined,
      timezone: row.timezone || row.Timezone || undefined,
      consentText: row.consentText || row.ConsentText || 'User consented via web form',
      consentTimestamp: new Date(row.consentTimestamp || row.ConsentTimestamp || new Date()).toISOString(),
      consentIp: row.consentIp || row.ConsentIp || undefined,
      consentPageUrl: row.consentPageUrl || row.ConsentPageUrl || undefined,
      trustedFormToken: row.trustedFormToken || row.TrustedFormToken || undefined,
      expressWrittenConsent: String(row.expressWrittenConsent || row.ExpressWrittenConsent || 'false') === 'true',
    };

    if (!lead.phoneE164) continue;

    await prisma.lead.upsert({
      where: { phoneE164: lead.phoneE164 },
      create: { ...lead, consentTimestamp: new Date(lead.consentTimestamp) },
      update: { ...lead, consentTimestamp: new Date(lead.consentTimestamp) },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Import complete');
}

main().finally(() => prisma.$disconnect());


