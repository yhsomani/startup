#!/bin/bash

CERT_DIR="$(dirname "$0")/../nginx/certs"
COUNTRY="US"
STATE="California"
CITY="San Francisco"
ORG="TalentSphere"
OU="Development"
CN="localhost"
DAYS=365

mkdir -p "$CERT_DIR"

echo "Generating SSL certificate for local development..."
echo "Certificate directory: $CERT_DIR"

openssl req -x509 -nodes -days $DAYS \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$OU/CN=$CN" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

if [ $? -eq 0 ]; then
    echo ""
    echo "Certificate generated successfully!"
    echo "  Key: $CERT_DIR/server.key"
    echo "  Cert: $CERT_DIR/server.crt"
    echo ""
    echo "Nginx configuration already points to these files."
    echo "Add to your hosts file if needed: 127.0.0.1 localhost"
else
    echo "Failed to generate certificate" >&2
    exit 1
fi
