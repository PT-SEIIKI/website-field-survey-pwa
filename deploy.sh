#!/bin/bash

# SEIIKI Survey PWA Deployment Script
# Usage: ./deploy.sh

echo "🚀 Starting SEIIKI Survey PWA Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Reset to HEAD and pull latest changes
print_status "Step 1: Updating code from repository..."
git reset --hard HEAD
if [ $? -ne 0 ]; then
    print_error "Failed to reset git HEAD"
    exit 1
fi

git pull origin main
if [ $? -ne 0 ]; then
    print_error "Failed to pull latest changes"
    exit 1
fi

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."
npm i
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Database migration
print_status "Step 3: Running database migration..."
npm run db:push
if [ $? -ne 0 ]; then
    print_error "Database migration failed"
    exit 1
fi

# Step 4: Build application
print_status "Step 4: Building application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

# Step 5: Restart PM2 processes
print_status "Step 5: Restarting PM2 processes..."
pm2 restart all
if [ $? -ne 0 ]; then
    print_warning "PM2 restart failed, but deployment may still work"
fi

# Step 6: Show PM2 status
print_status "Step 6: Checking PM2 status..."
pm2 status

print_status "🎉 Deployment completed successfully!"
print_status "📱 SEIIKI Survey PWA is now live and ready!"

# Show useful URLs
echo ""
echo "🔗 Useful URLs:"
echo "   Main App: https://survei.seyiki.com"
echo "   Admin Panel: https://survei.seyiki.com/admin"
echo "   Login: https://survei.seyiki.com/login"
echo "   Dashboard: https://survei.seyiki.com/survey/dashboard"
echo ""

# Check if the app is responding
print_status "Checking application health..."
sleep 5

if curl -f -s https://survei.seyiki.com > /dev/null; then
    print_status "✅ Application is responding correctly!"
else
    print_warning "⚠️  Application might not be responding yet. Please check manually."
fi

print_status "Deployment finished at $(date)"
