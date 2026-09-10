import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create a Doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@sanjeevani.org' },
    update: {},
    create: {
      email: 'doctor@sanjeevani.org',
      name: 'Dr. Rahul Sharma',
      passwordHash: passwordHash,
      role: 'SENIOR_CONSULTANT',
      isVerified: true
    }
  });

  // 2. Create a Nurse
  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@sanjeevani.org' },
    update: {},
    create: {
      email: 'nurse@sanjeevani.org',
      name: 'Nurse Priya Patel',
      passwordHash: passwordHash,
      role: 'TRIAGE_NURSE',
      isVerified: true
    }
  });

  // 3. Create a Patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'amit@example.com' },
    update: {},
    create: {
      email: 'amit@example.com',
      name: 'Amit Kumar',
      passwordHash: passwordHash,
      role: 'PATIENT',
      isVerified: true
    }
  });

  // 4. Create Patient Profile with ABHA ID
  const patientProfile = await prisma.patientProfile.upsert({
    where: { abhaNumber: '91-1234-5678-9012' },
    update: {},
    create: {
      userId: patientUser.id,
      abhaNumber: '91-1234-5678-9012',
      fullName: 'Amit Kumar',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      bloodGroup: 'O+',
      contactNumber: '+919876543210'
    }
  });

  console.log({ doctor, nurse, patientProfile });
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
