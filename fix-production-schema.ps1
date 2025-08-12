# Production Schema Fix Script for Windows PowerShell
# This script fixes the missing resetToken fields in production database

Write-Host "🔧 Starting production schema fix..." -ForegroundColor Blue

Write-Host "📋 Production Schema Fix Summary:" -ForegroundColor Blue
Write-Host "- Adding resetToken and resetTokenExpiry fields to User model"
Write-Host "- Updating production database schema"
Write-Host "- Regenerating Prisma client"
Write-Host ""

# Step 1: Backup current schema
Write-Host "📦 Creating schema backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "prisma/schema.backup.$timestamp"
Copy-Item "prisma/schema.prisma" $backupFile
Write-Host "✅ Schema backup created: $backupFile" -ForegroundColor Green

# Step 2: Copy production schema to main schema
Write-Host "🔄 Updating main schema with production schema..." -ForegroundColor Yellow
Copy-Item "prisma/schema.production.prisma" "prisma/schema.prisma"
Write-Host "✅ Schema updated" -ForegroundColor Green

# Step 3: Generate Prisma client
Write-Host "🔨 Generating Prisma client..." -ForegroundColor Yellow
try {
    & npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 4: Create migration directory and file
Write-Host "📝 Creating migration file..." -ForegroundColor Yellow
$migrationDir = "prisma/migrations/$timestamp" + "_add_reset_token_fields"
New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
Copy-Item "add-reset-token-fields.sql" "$migrationDir/migration.sql"
Write-Host "✅ Migration file created in $migrationDir" -ForegroundColor Green

# Step 5: Test build
Write-Host "🏗️ Testing build..." -ForegroundColor Yellow
try {
    & npm run build
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "🔄 Restoring backup schema..." -ForegroundColor Yellow
    Copy-Item $backupFile "prisma/schema.prisma"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Production schema fix completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps for production deployment:" -ForegroundColor Blue
Write-Host "1. Run the SQL migration on production database:"
Write-Host "   psql `$DATABASE_URL -f add-reset-token-fields.sql"
Write-Host ""
Write-Host "2. Deploy the updated application"
Write-Host ""
Write-Host "3. Test password reset functionality"
Write-Host ""
Write-Host "⚠️  Important: Make sure to run the SQL migration before deploying!" -ForegroundColor Yellow