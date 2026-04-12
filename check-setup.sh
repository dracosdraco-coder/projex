#!/bin/bash

echo "🔍 PROJEX - Environment Check"
echo "================================"
echo ""

# Check Node version
echo "📦 Node.js version:"
node -v
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local file exists"
    
    # Check for spaces in env vars
    if grep -q "= " .env.local; then
        echo "⚠️  WARNING: Found spaces after = in .env.local"
        echo "   This will cause issues. Remove spaces after = signs."
    else
        echo "✅ Environment variables properly formatted"
    fi
    
    # Check if variables are set
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local; then
        echo "✅ Supabase credentials found"
    else
        echo "❌ Missing Supabase credentials in .env.local"
    fi
else
    echo "❌ .env.local file not found!"
    echo "   Copy .env.local.example to .env.local and add your credentials"
fi
echo ""

# Check package.json dependencies
echo "📚 Checking dependencies..."
if grep -q "next-auth" package.json; then
    echo "⚠️  WARNING: next-auth still in package.json (should be removed)"
fi

if grep -q "prisma" package.json; then
    echo "⚠️  WARNING: prisma still in package.json (should be removed)"
fi

if grep -q "@supabase/supabase-js" package.json; then
    echo "✅ Supabase client installed"
fi

if grep -q "@supabase/auth-helpers-nextjs" package.json; then
    echo "✅ Supabase auth helpers installed"
else
    echo "⚠️  WARNING: @supabase/auth-helpers-nextjs not installed"
    echo "   Run: npm install @supabase/auth-helpers-nextjs"
fi
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules not found. Run: npm install"
fi
echo ""

# Check middleware
if [ -f "src/middleware.ts" ]; then
    echo "📄 Checking middleware.ts..."
    if grep -q "next-auth" src/middleware.ts; then
        echo "⚠️  WARNING: middleware.ts still references next-auth"
        echo "   Needs to be updated to use Supabase"
    else
        echo "✅ Middleware.ts looks correct"
    fi
else
    echo "❌ src/middleware.ts not found"
fi
echo ""

echo "================================"
echo "🎯 NEXT STEPS:"
echo ""
echo "1. Fix any ❌ or ⚠️  issues above"
echo "2. Run: npm install"
echo "3. Apply supabase-schema.sql in Supabase Dashboard"
echo "4. Disable email confirmation in Supabase Dashboard"
echo "5. Run: npm run dev"
echo "6. Test login at http://localhost:3000/login"
echo ""
echo "📖 See SETUP-GUIDE.md for detailed instructions"
