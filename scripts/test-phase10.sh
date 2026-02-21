#!/bin/bash
# TalentSphere Phase 10 - Quick Test Script
# Tests all new endpoints to verify deployment

BASE_URL="http://localhost:8000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "TalentSphere Phase 10 - API Health Check"
echo "========================================="
echo ""

# Test AI Assistant
echo "Testing AI Assistant..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5005/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓${NC} AI Assistant: OK (Port 5005)"
else
    echo -e "${RED}✗${NC} AI Assistant: FAIL (Port 5005)"
fi

# Test Recruitment
echo "Testing Recruitment Service..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5006/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Recruitment: OK (Port 5006)"
else
    echo -e "${RED}✗${NC} Recruitment: FAIL (Port 5006)"
fi

# Test Gamification
echo "Testing Gamification Service..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5007/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Gamification: OK (Port 5007)"
else
    echo -e "${RED}✗${NC} Gamification: FAIL (Port 5007)"
fi

echo ""
echo "Testing API Gateway Routes..."

# Test AI Chat
echo "Testing AI Chat endpoint..."
response=$(curl -s -X POST ${BASE_URL}/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' | jq -r '.response')
if [ ! -z "$response" ]; then
    echo -e "${GREEN}✓${NC} AI Chat: OK"
else
    echo -e "${RED}✗${NC} AI Chat: FAIL"
fi

# Test Candidate Search
echo "Testing Candidate Search..."
response=$(curl -s "${BASE_URL}/api/v1/candidates/search?skill=python" | jq -r 'length')
if [ "$response" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Candidate Search: OK (Found $response candidates)"
else
    echo -e "${RED}✗${NC} Candidate Search: FAIL"
fi

echo ""
echo "========================================="
echo "Test Complete!"
echo "========================================="
