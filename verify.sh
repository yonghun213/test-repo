#!/bin/bash
echo "🔍 Verification Checklist"
echo "========================"
echo ""

# Check build
echo "✓ Build Status:"
npm run build > /dev/null 2>&1 && echo "  ✅ Build successful" || echo "  ❌ Build failed"

# Check database
echo ""
echo "✓ Database:"
[ -f prisma/dev.db ] && echo "  ✅ Database exists" || echo "  ❌ Database missing"

# Check migrations
echo ""
echo "✓ Migrations:"
[ -d prisma/migrations ] && echo "  ✅ Migrations directory exists" || echo "  ❌ Migrations missing"

# Check key files
echo ""
echo "✓ Key Files:"
[ -f README.md ] && echo "  ✅ README.md" || echo "  ❌ README.md missing"
[ -f package.json ] && echo "  ✅ package.json" || echo "  ❌ package.json missing"
[ -f .env ] && echo "  ✅ .env" || echo "  ❌ .env missing"
[ -f prisma/schema.prisma ] && echo "  ✅ Prisma schema" || echo "  ❌ Prisma schema missing"

# Check critical directories
echo ""
echo "✓ Directory Structure:"
[ -d app/dashboard/stores ] && echo "  ✅ Stores pages" || echo "  ❌ Stores pages missing"
[ -d app/api/stores ] && echo "  ✅ API routes" || echo "  ❌ API routes missing"
[ -d components ] && echo "  ✅ Components" || echo "  ❌ Components missing"
[ -d lib ] && echo "  ✅ Libraries" || echo "  ❌ Libraries missing"

echo ""
echo "========================"
echo "✅ Verification Complete!"
