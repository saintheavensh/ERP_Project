@echo off
echo Stopping Docker containers and removing volumes...
docker-compose down -v

echo Starting Docker containers...
docker-compose up -d

echo Waiting for database to be ready (10 seconds)...
timeout /t 10 /nobreak

echo Running migrations...
cd apps/backend
call bun run db:push

echo Seeding database...
call bun run db:seed

echo Database reset complete!
cd ../..
pause
