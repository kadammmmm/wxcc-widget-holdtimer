#!/bin/bash

# ==============================================================================
# WXCC Widget Deployment Script
# ==============================================================================
# 
# This script automates the deployment process to GitHub Pages.
# Run this after making changes to deploy your widget.
#
# Usage: ./deploy.sh "Your commit message"
#
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get commit message from argument or use default
COMMIT_MSG=${1:-"Deploy widget update - $(date '+%Y-%m-%d %H:%M')"}

echo -e "${YELLOW}🚀 Starting deployment...${NC}"

# 1. Make sure we're on main
echo -e "${GREEN}Step 1: Switching to main branch${NC}"
git checkout main

# 2. Add and commit any changes
echo -e "${GREEN}Step 2: Committing changes to main${NC}"
git add .
git commit -m "$COMMIT_MSG" || echo "Nothing new to commit"

# 3. Push to main
echo -e "${GREEN}Step 3: Pushing to main${NC}"
git push origin main

# 4. Build the widget
echo -e "${GREEN}Step 4: Building widget${NC}"
npm run build

# 5. Verify build succeeded
if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ Build failed - dist/index.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# 6. Switch to gh-pages
echo -e "${GREEN}Step 5: Switching to gh-pages branch${NC}"
git checkout gh-pages

# 7. Copy built file
echo -e "${GREEN}Step 6: Copying built file${NC}"
cp dist/index.js .

# 8. Commit and push
echo -e "${GREEN}Step 7: Deploying to gh-pages${NC}"
git add index.js
git commit -m "Deploy: $COMMIT_MSG"
git push origin gh-pages

# 9. Switch back to main
echo -e "${GREEN}Step 8: Switching back to main${NC}"
git checkout main

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "Your widget is available at:"
echo -e "${YELLOW}https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/index.js${NC}"
