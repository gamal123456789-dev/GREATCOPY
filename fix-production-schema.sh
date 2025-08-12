#!/bin/bash

# Production Schema Fix Script
# This script fixes the missing resetToken fields in production database

echo "🔧 Starting production schema fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Production Schema Fix Summary:${NC}"
echo "- Adding resetToken and resetTokenExpiry fields to User model"
echo "- Updating production database schema"
echo "- Regenerating Prisma client"
echo ""

# Step 1: Backup current schema
echo -e "${YELLOW}📦 Creating schema backup...${NC}"
cp prisma/schema.prisma prisma/schema.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Schema backup created${NC}"

# Step 2: Copy production schema to main schema
echo -e "${YELLOW}🔄 Updating main schema with production schema...${NC}"
cp prisma/schema.production.prisma prisma/schema.prisma
echo -e "${GREEN}✅ Schema updated${NC}"

# Step 3: Generate Prisma client
echo -e "${YELLOW}🔨 Generating Prisma client...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated successfully${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi

# Step 4: Create migration (for reference)
echo -e "${YELLOW}📝 Creating migration file...${NC}"
mkdir -p prisma/migrations/$(date +%Y%m%d_%H%M%S)_add_reset_token_fields
cp add-reset-token-fields.sql prisma/migrations/$(date +%Y%m%d_%H%M%S)_add_reset_token_fields/migration.sql
echo -e "${GREEN}✅ Migration file created${NC}"

# Step 5: Test build
echo -e "${YELLOW}🏗️ Testing build...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo -e "${YELLOW}🔄 Restoring backup schema...${NC}"
    cp prisma/schema.backup.* prisma/schema.prisma 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Production schema fix completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps for production deployment:${NC}"
echo "1. Run the SQL migration on production database:"
echo "   psql \$DATABASE_URL -f add-reset-token-fields.sql"
echo ""
echo "2. Deploy the updated application"
echo ""
echo "3. Test password reset functionality"
echo ""
echo -e "${YELLOW}⚠️  Important: Make sure to run the SQL migration before deploying!${NC}"