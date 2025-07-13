#!/bin/bash

# Cloudflare Worker Deployment Script for LuckSeeker Bot

echo "🚀 LuckSeeker Bot - Cloudflare Worker Deployment"
echo "================================================"

# Check if wrangler is installed
if ! command -v npx wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
echo "📋 Checking Cloudflare authentication..."
if ! npx wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare:"
    npx wrangler login
fi

# Build the worker
echo "🔧 Building Worker files..."
npm run build:worker

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check your code and try again."
    exit 1
fi

# Check if KV namespace exists
# echo "💾 Checking KV storage setup..."
# KV_OUTPUT=$(npx wrangler kv:namespace list 2>/dev/null | grep "LUCKSEEKER_KV")

# if [ -z "$KV_OUTPUT" ]; then
#     echo "📦 Creating KV namespaces..."
#     npm run worker:kv:create
#     echo ""
#     echo "⚠️  Please update wrangler.toml with the KV namespace IDs shown above"
#     echo "   Then run this script again."
#     exit 1
# fi

# Check required environment variables
echo "🔑 Checking environment variables..."
REQUIRED_VARS=("LINE_CHANNEL_ACCESS_TOKEN" "LINE_CHANNEL_SECRET" "LIFF_ID" "OPENAI_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! npx wrangler secret list | grep -q "$var"; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set them using:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   npx wrangler secret put $var"
    done
    exit 1
fi

# Ask for deployment environment
echo ""
echo "📍 Select deployment environment:"
echo "1) Production"
echo "2) Staging"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        ENV="production"
        echo "🌟 Deploying to Production..."
        npx wrangler deploy
        ;;
    2)
        ENV="staging"
        echo "🧪 Deploying to Staging..."
        npx wrangler deploy --env staging
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🔗 Your bot is now available at:"
    
    if [ "$ENV" = "production" ]; then
        WORKER_URL=$(npx wrangler dev --dry-run 2>&1 | grep -o 'https://.*\.workers\.dev' | head -1)
        if [ -z "$WORKER_URL" ]; then
            WORKER_URL="https://luckseeker-bot.your-subdomain.workers.dev"
        fi
    else
        WORKER_URL="https://luckseeker-bot-staging.your-subdomain.workers.dev"
    fi
    
    echo "   🏠 Home: $WORKER_URL/"
    echo "   🪝 Webhook: $WORKER_URL/webhook"
    echo "   📱 LIFF: $WORKER_URL/liff"
    echo "   ❤️  Health: $WORKER_URL/health"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update LINE Webhook URL to: $WORKER_URL/webhook"
    echo "2. Test your bot by sending a message"
    echo "3. Monitor logs with: npm run worker:logs"
    echo ""
    echo "🎉 Happy fortune telling!"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi