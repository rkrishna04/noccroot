@echo off
echo ========================================
echo NOCC ROOT - Vercel Deployment Setup
echo ========================================
echo.

echo Step 1: Database Setup
echo ----------------------
echo You need a PostgreSQL database. Choose one:
echo.
echo Option A: Neon.tech (Recommended - Free)
echo 1. Go to https://neon.tech
echo 2. Sign up for free account
echo 3. Create a new project
echo 4. Copy the connection string
echo.
echo Option B: Supabase (Also Free)
echo 1. Go to https://supabase.com
echo 2. Create new project
echo 3. Go to Settings ^> Database ^> Connection string
echo 4. Copy the URI
echo.
echo Option C: Local PostgreSQL
echo 1. Install PostgreSQL locally
echo 2. Create database 'noccroot'
echo 3. Use connection string: postgresql://username:password@localhost:5432/noccroot
echo.

set /p db_url="Enter your DATABASE_URL: "
echo %db_url% > temp_db_url.txt

echo.
echo Step 2: Updating .env file...
echo DATABASE_URL=%db_url% > .env
echo JWT_SECRET=noccroot_super_secret_jwt_key_2026 >> .env

echo.
echo Step 3: Setting up Prisma...
call npx prisma generate
call npx prisma db push

echo.
echo Step 4: Seeding database...
call npx prisma db seed

echo.
echo Step 5: Deploying to Vercel...
echo Note: You'll need to set DATABASE_URL and JWT_SECRET in Vercel dashboard
echo.
call npx vercel --prod

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Default login credentials:
echo Email: root@gov.in
echo Password: Admin@123
echo.
echo Access your app at the URL shown above.
echo.

pause