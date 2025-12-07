#!/bin/bash
#
# Generate SSL Certificate Pins for operate.guru
#
# This script generates SHA-256 certificate pins for SSL pinning.
# Run this script whenever the SSL certificate is renewed.
#
# Usage:
#   ./scripts/generate-ssl-pins.sh operate.guru
#   ./scripts/generate-ssl-pins.sh operate.guru 443
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
HOSTNAME="${1:-operate.guru}"
PORT="${2:-443}"
CERT_FILE="temp-${HOSTNAME}.pem"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   SSL Certificate Pin Generator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for required tools
echo -e "${YELLOW}Checking dependencies...${NC}"
for cmd in openssl; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}Error: $cmd is not installed${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ All dependencies found${NC}"
echo ""

# Fetch certificate
echo -e "${YELLOW}Fetching certificate from ${HOSTNAME}:${PORT}...${NC}"
openssl s_client -connect ${HOSTNAME}:${PORT} -servername ${HOSTNAME} < /dev/null 2>/dev/null | \
  openssl x509 -outform PEM > ${CERT_FILE}

if [ ! -s ${CERT_FILE} ]; then
  echo -e "${RED}Error: Failed to fetch certificate${NC}"
  rm -f ${CERT_FILE}
  exit 1
fi
echo -e "${GREEN}✓ Certificate fetched${NC}"
echo ""

# Display certificate info
echo -e "${YELLOW}Certificate Information:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
openssl x509 -in ${CERT_FILE} -noout -subject -issuer -dates -fingerprint -sha256
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Generate certificate pin
echo -e "${YELLOW}Generating certificate pin...${NC}"
PIN=$(openssl x509 -in ${CERT_FILE} -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64)

echo -e "${GREEN}✓ Certificate pin generated${NC}"
echo ""

# Display pin
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Certificate Pin (SHA-256):${NC}"
echo -e "${YELLOW}${PIN}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get expiration date
EXPIRY=$(openssl x509 -in ${CERT_FILE} -noout -enddate | cut -d= -f2)
echo -e "${YELLOW}Certificate expires: ${EXPIRY}${NC}"
echo ""

# Generate TypeScript configuration
echo -e "${YELLOW}TypeScript Configuration:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat <<EOF
export const CERTIFICATE_PINS: Record<string, string[]> = {
  '${HOSTNAME}': [
    '${PIN}', // Current certificate (expires: ${EXPIRY})
    'BACKUP_PIN_HERE', // Backup certificate for rotation
  ],
};
EOF
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Instructions
echo -e "${GREEN}Next Steps:${NC}"
echo -e "  1. Copy the pin above"
echo -e "  2. Update ${BLUE}apps/web/src/lib/security/ssl-pinning.ts${NC}"
echo -e "  3. Replace placeholder pin with the generated pin"
echo -e "  4. Generate backup pin from next certificate (before rotation)"
echo -e "  5. Test on both iOS and Android devices"
echo ""

echo -e "${YELLOW}Certificate Rotation Reminder:${NC}"
echo -e "  - Generate new pin ${RED}30 days before expiry${NC}"
echo -e "  - Add new pin as backup"
echo -e "  - Deploy app update with both pins"
echo -e "  - Wait for users to update"
echo -e "  - Renew certificate"
echo -e "  - Remove old pin in next update"
echo ""

# Cleanup
rm -f ${CERT_FILE}
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
