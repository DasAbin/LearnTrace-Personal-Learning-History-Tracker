import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const students: {
  rollNumber: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
}[] = [
  { rollNumber: '3201', firstName: 'Aarya',       lastName: 'Kale',              gender: 'female' },
  { rollNumber: '3202', firstName: 'Abindas',     lastName: 'P',                 gender: 'male'   },
  { rollNumber: '3203', firstName: 'Adarsh',      lastName: 'Rana',              gender: 'male'   },
  { rollNumber: '3204', firstName: 'Aditya',      lastName: 'Rawat',             gender: 'male'   },
  { rollNumber: '3205', firstName: 'Alubilli',    lastName: 'Monohar Naidu',     gender: 'male'   },
  { rollNumber: '3206', firstName: 'Aman',        lastName: 'Choudhary',         gender: 'male'   },
  { rollNumber: '3207', firstName: 'Ankit',       lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3208', firstName: 'Anuj',        lastName: 'Kumar Tomar',       gender: 'male'   },
  { rollNumber: '3209', firstName: 'Anuj',        lastName: 'Yadav',             gender: 'male'   },
  { rollNumber: '3210', firstName: 'Apurv',       lastName: 'Kumar Shukla',      gender: 'male'   },
  { rollNumber: '3211', firstName: 'Arjun',       lastName: 'Chaudhary',         gender: 'male'   },
  { rollNumber: '3212', firstName: 'Arpita',      lastName: 'Singh',             gender: 'female' },
  { rollNumber: '3213', firstName: 'Aryan',       lastName: 'Singh',             gender: 'male'   },
  { rollNumber: '3214', firstName: 'Aryan',       lastName: 'Singh Tomar',       gender: 'male'   },
  { rollNumber: '3215', firstName: 'Ashish',      lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3216', firstName: 'Ashish',      lastName: 'Yadav',             gender: 'male'   },
  { rollNumber: '3217', firstName: 'Ashutosh',    lastName: 'Mishra',            gender: 'male'   },
  { rollNumber: '3218', firstName: 'Atul',        lastName: 'Pratap',            gender: 'male'   },
  { rollNumber: '3219', firstName: 'Atul',        lastName: 'Kumar Krishania',   gender: 'male'   },
  { rollNumber: '3220', firstName: 'Ayush',       lastName: 'B Bhagwat',         gender: 'male'   },
  { rollNumber: '3221', firstName: 'Ayush',       lastName: 'Pratap Singh',      gender: 'male'   },
  { rollNumber: '3222', firstName: 'Ayushi',      lastName: 'Tripathi',          gender: 'female' },
  { rollNumber: '3223', firstName: 'Bhawesh',     lastName: 'Joshi',             gender: 'male'   },
  { rollNumber: '3224', firstName: 'Chandrapal',  lastName: 'Choudhary',         gender: 'male'   },
  { rollNumber: '3225', firstName: 'Deepanshu',   lastName: 'Saini',             gender: 'male'   },
  { rollNumber: '3226', firstName: 'Devkaran',    lastName: 'Singh',             gender: 'male'   },
  { rollNumber: '3227', firstName: 'Dikshu',      lastName: 'Chaudhary',         gender: 'male'   },
  { rollNumber: '3228', firstName: 'Harsh',       lastName: 'Sharma',            gender: 'male'   },
  { rollNumber: '3229', firstName: 'Himanshi',    lastName: 'Pathak',            gender: 'female' },
  { rollNumber: '3230', firstName: 'Hirender',    lastName: 'Singh',             gender: 'male'   },
  { rollNumber: '3231', firstName: 'Karan',       lastName: 'Singh Shekhawat',   gender: 'male'   },
  { rollNumber: '3232', firstName: 'Krish',       lastName: 'Tomar',             gender: 'male'   },
  { rollNumber: '3233', firstName: 'Laxmi',       lastName: 'Devi',              gender: 'female' },
  { rollNumber: '3234', firstName: 'Lokender',    lastName: 'Singh',             gender: 'male'   },
  { rollNumber: '3235', firstName: 'Manthan',     lastName: 'Jaswal',            gender: 'male'   },
  { rollNumber: '3236', firstName: 'Mohit',       lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3237', firstName: 'Naveen',      lastName: 'Kumar Sing',        gender: 'male'   },
  { rollNumber: '3238', firstName: 'Neha',        lastName: 'Biswas',            gender: 'female' },
  { rollNumber: '3239', firstName: 'Nitin',       lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3240', firstName: 'Parul',       lastName: 'Sharma',            gender: 'female' },
  { rollNumber: '3241', firstName: 'Piyush',      lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3242', firstName: 'Prathmesh',   lastName: 'Ashok Patil',       gender: 'male'   },
  { rollNumber: '3243', firstName: 'Praveen',     lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3244', firstName: 'Prince',      lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3245', firstName: 'Priya',       lastName: 'Rai',               gender: 'female' },
  { rollNumber: '3246', firstName: 'Rahul',       lastName: 'Singh',             gender: 'male'   },
  { rollNumber: '3247', firstName: 'Rahul',       lastName: 'Yadav',             gender: 'male'   },
  { rollNumber: '3248', firstName: 'Raj',         lastName: 'Srivastava',        gender: 'male'   },
  { rollNumber: '3249', firstName: 'Raj',         lastName: 'Raushan',           gender: 'male'   },
  { rollNumber: '3250', firstName: 'Rohit',       lastName: 'Choudhary',         gender: 'male'   },
  { rollNumber: '3251', firstName: 'Sagar',       lastName: 'Dhankhar',          gender: 'male'   },
  { rollNumber: '3252', firstName: 'Sahil',       lastName: 'Kumar',             gender: 'male'   },
  { rollNumber: '3253', firstName: 'Samiksha',    lastName: 'Sharma',            gender: 'female' },
  { rollNumber: '3254', firstName: 'Satyam',      lastName: 'Kumar Singh',       gender: 'male'   },
  { rollNumber: '3255', firstName: 'Suruchi',     lastName: 'Yadav',             gender: 'female' },
  { rollNumber: '3256', firstName: 'Tushar',      lastName: 'Singh',             gender: 'male'   },
  { rollNumber: '3257', firstName: 'Udit',        lastName: 'Pal',               gender: 'male'   },
  { rollNumber: '3258', firstName: 'Ujwal',       lastName: 'Panwar',            gender: 'male'   },
  { rollNumber: '3259', firstName: 'Vicky',       lastName: 'Yadav',             gender: 'male'   },
  { rollNumber: '3260', firstName: 'Vivek',       lastName: 'Kumar Singh',       gender: 'male'   },
  { rollNumber: '3261', firstName: 'Yash',        lastName: 'Raghuwanshi',       gender: 'male'   },
  { rollNumber: '3262', firstName: 'Pratik',      lastName: 'Kadam',             gender: 'male'   },
];

const COLLEGE     = 'Army Institute of Technology';
const CLASS       = 'Comp A';
const DEPT        = 'Computer Engineering';
const SALT_ROUNDS = 10;

// Password rule: first word of firstName, lowercase, + "@123"
// Example: "Ayushi" → "ayushi@123", "Aryan Singh" → "aryan@123"
function makePassword(firstName: string): string {
  return `${firstName.split(' ')[0].toLowerCase()}@123`;
}

// Email: rollNumber@ait.edu — unique and predictable
function makeEmail(rollNumber: string): string {
  return `${rollNumber}@ait.edu`;
}

async function main() {
  console.log(`\nSeeding ${students.length} students for ${COLLEGE} — ${CLASS}\n`);
  let created = 0, skipped = 0;

  for (const s of students) {
    const email    = makeEmail(s.rollNumber);
    const password = makePassword(s.firstName);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  SKIP  ${s.rollNumber}  ${s.firstName} ${s.lastName} — already exists`);
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        firstName:    s.firstName,
        lastName:     s.lastName || 'N/A',
        email,
        passwordHash,
        role:         'STUDENT',
        gender:       s.gender,
        collegeName:  COLLEGE,
        department:   DEPT,
        className:    CLASS,
        rollNumber:   s.rollNumber,
        emailVerified: true,
      },
    });

    console.log(`  OK  ${s.rollNumber}  ${s.firstName} ${s.lastName}  |  pwd: ${password}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
