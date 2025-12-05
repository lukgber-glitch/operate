#!/bin/bash

echo "========================================="
echo "Micro-Interactions Verification Script"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL=0
PASSED=0
FAILED=0

check_file() {
  TOTAL=$((TOTAL + 1))
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
    FAILED=$((FAILED + 1))
  fi
}

echo "Checking Core Files:"
check_file "src/styles/animations.css"
check_file "src/hooks/useAnimations.ts"
check_file "tailwind.config.js"
check_file "src/app/globals.css"

echo ""
echo "Checking Component Files:"
check_file "src/components/ui/AnimatedButton.tsx"
check_file "src/components/ui/AnimatedCard.tsx"
check_file "src/components/ui/AnimatedIcon.tsx"
check_file "src/components/ui/animated.tsx"

echo ""
echo "Checking Enhanced Components:"
check_file "src/components/chat/SuggestionCard.enhanced.tsx"
check_file "src/components/chat/ChatInput.enhanced.tsx"

echo ""
echo "Checking Documentation:"
check_file "MICRO_INTERACTIONS_GUIDE.md"
check_file "MICRO_INTERACTIONS_SUMMARY.md"
check_file "IMPLEMENTATION_CHECKLIST.md"

echo ""
echo "Checking Demo Page:"
check_file "src/app/(demo)/micro-interactions/page.tsx"

echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo -e "Total Checks: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: ${FAILED}${NC}"
else
  echo -e "${GREEN}Failed: ${FAILED}${NC}"
fi

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All micro-interaction files are in place!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run 'npm run dev' to start the development server"
  echo "2. Visit http://localhost:3000/micro-interactions to see the demo"
  echo "3. Review MICRO_INTERACTIONS_GUIDE.md for usage examples"
else
  echo ""
  echo -e "${RED}✗ Some files are missing. Please review the output above.${NC}"
  exit 1
fi
