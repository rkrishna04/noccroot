@echo off
echo NOCC ROOT - Quick Vercel Deployment
echo ====================================
echo.

if not exist ".env" (
    echo Error: .env file not found!
    echo Please run deploy.bat first to set up your database.
    pause
    exit /b 1
)

echo Setting up database...
call npx prisma generate
call npx prisma db push
call npx prisma db seed

echo.
echo Deploying to Vercel...
call npx vercel --prod

echo.
echo Deployment complete! Check the URL above.
echo Default login: root@gov.in / Admin@123
echo.

pause