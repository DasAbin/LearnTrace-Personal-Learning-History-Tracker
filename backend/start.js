const { execSync } = require('child_process');

console.log("==========================================");
console.log("    RAILWAY STARTUP DIAGNOSTIC SCRIPT     ");
console.log("==========================================");

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.trim() === '') {
  console.error("❌ CRITICAL ERROR: DATABASE_URL is missing in process.env!");
  console.error("👉 Please ensure you added DATABASE_URL to the 'Variables' tab of your Backend service exactly as named.");
  console.log("Current keys in process.env:");
  console.log(Object.keys(process.env).join(", "));
  process.exit(1);
}

console.log("✅ DATABASE_URL is present. (Length: " + dbUrl.length + ", Type: " + typeof dbUrl + ")");

try {
  console.log("🚀 Running database push (npx prisma db push)...");
  
  // Explicitly inject the environment variables into the child process.
  // This bypasses any Prisma bugs with Alpine Linux and missing .env files.
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    env: Object.assign({}, process.env)
  });
  
  console.log("✅ Database synced successfully. Starting app...");
  
  // Start the main application
  require('./dist/index.js');
  
} catch (error) {
  console.error("❌ Startup failed!", error.message);
  process.exit(1);
}
