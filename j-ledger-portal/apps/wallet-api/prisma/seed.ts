import { PrismaClient } from '@prisma/client-wallet';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Error Codes...');

  const errorCodes = [
    {
      code: 'INSUFFICIENT_BALANCE',
      severity: 'ERROR',
      internalMessage: 'Account does not have enough balance for this transaction',
      messages: {
        create: [
          { language: 'en', userMessage: 'Insufficient balance.', recoveryAction: 'Please top up your account.' },
          { language: 'th', userMessage: 'ยอดเงินไม่เพียงพอ', recoveryAction: 'กรุณาเติมเงินเข้าบัญชี' },
        ],
      },
    },
    {
      code: 'PIN_INVALID',
      severity: 'ERROR',
      internalMessage: 'The provided PIN is incorrect',
      messages: {
        create: [
          { language: 'en', userMessage: 'Invalid PIN.', recoveryAction: 'Please try again.' },
          { language: 'th', userMessage: 'รหัส PIN ไม่ถูกต้อง', recoveryAction: 'กรุณาลองใหม่อีกครั้ง' },
        ],
      },
    },
    {
      code: 'KYC_PENDING',
      severity: 'WARNING',
      internalMessage: 'User has not completed KYC',
      messages: {
        create: [
          { language: 'en', userMessage: 'KYC verification is pending.', recoveryAction: 'Please complete your KYC.' },
          { language: 'th', userMessage: 'อยู่ระหว่างการตรวจสอบ KYC', recoveryAction: 'กรุณากรอกข้อมูล KYC ให้ครบถ้วน' },
        ],
      },
    },
  ];

  for (const ec of errorCodes) {
    await prisma.errorCode.upsert({
      where: { code: ec.code },
      update: {},
      create: ec,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
