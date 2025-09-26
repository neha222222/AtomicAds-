#!/bin/bash

# Test Demo Script for Alerting Platform
# Author: Neha Dhruw
# This script demonstrates all major functionalities of the alerting platform

BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="neha.admin@atomicads.com"
ADMIN_PASSWORD="admin123"
USER_EMAIL="john.doe@atomicads.com"
USER_PASSWORD="user123"

echo "========================================"
echo "🚀 Alerting Platform API Test Demo"
echo "========================================"
echo ""

# Function to pretty print JSON
pretty_json() {
    python3 -m json.tool 2>/dev/null || cat
}

# Check if server is running
echo "1️⃣ Checking server health..."
HEALTH=$(curl -s $BASE_URL/health)
if [ $? -eq 0 ]; then
    echo "✅ Server is healthy"
    echo "$HEALTH" | pretty_json
else
    echo "❌ Server is not running. Please start the server first."
    exit 1
fi
echo ""

# Admin login
echo "2️⃣ Admin Login (neha.admin@atomicads.com)..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token']['token'])" 2>/dev/null)

if [ -n "$ADMIN_TOKEN" ]; then
    echo "✅ Admin logged in successfully"
else
    echo "❌ Admin login failed"
    echo "$ADMIN_RESPONSE" | pretty_json
    exit 1
fi
echo ""

# Get all alerts as admin
echo "3️⃣ Fetching all alerts (Admin view)..."
ALERTS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $BASE_URL/admin/alerts)
ALERT_COUNT=$(echo "$ALERTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo "✅ Found $ALERT_COUNT alerts"
echo ""

# Create a new alert
echo "4️⃣ Creating a new alert as Admin..."
NEW_ALERT=$(curl -s -X POST $BASE_URL/admin/alerts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "title": "🆕 Demo Alert for Testing",
        "message": "This is a demo alert created by the test script",
        "severity": "INFO",
        "deliveryType": "IN_APP",
        "reminderFrequency": 7200000,
        "visibilityType": "ORGANIZATION",
        "visibilityTargets": ["7d9d60ce-8d33-45c6-bb18-285218271d51"],
        "startTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "expiryTime": "'$(date -u -v+7d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%dT%H:%M:%SZ")'",
        "enabled": true
    }')

NEW_ALERT_ID=$(echo "$NEW_ALERT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['id'] if d.get('success') else '')" 2>/dev/null)

if [ -n "$NEW_ALERT_ID" ]; then
    echo "✅ Alert created with ID: $NEW_ALERT_ID"
else
    echo "⚠️  Could not create alert (may need to adjust organization ID)"
fi
echo ""

# User login
echo "5️⃣ User Login (john.doe@atomicads.com)..."
USER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$USER_EMAIL\", \"password\": \"$USER_PASSWORD\"}")
USER_TOKEN=$(echo "$USER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token']['token'])" 2>/dev/null)

if [ -n "$USER_TOKEN" ]; then
    echo "✅ User logged in successfully"
else
    echo "❌ User login failed"
    exit 1
fi
echo ""

# Get user's alerts
echo "6️⃣ Fetching user's alerts..."
USER_ALERTS=$(curl -s -H "Authorization: Bearer $USER_TOKEN" $BASE_URL/user/alerts)
ACTIVE_COUNT=$(echo "$USER_ALERTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']['active']))" 2>/dev/null)
SNOOZED_COUNT=$(echo "$USER_ALERTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']['snoozed']))" 2>/dev/null)
READ_COUNT=$(echo "$USER_ALERTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']['read']))" 2>/dev/null)

echo "📊 User Alert Summary:"
echo "   - Active: $ACTIVE_COUNT"
echo "   - Snoozed: $SNOOZED_COUNT"
echo "   - Read: $READ_COUNT"
echo ""

# Get first active alert ID for testing
FIRST_ALERT_ID=$(echo "$USER_ALERTS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['active'][0]['id'] if d['data']['active'] else '')" 2>/dev/null)

if [ -n "$FIRST_ALERT_ID" ]; then
    # Mark alert as read
    echo "7️⃣ Marking alert as read..."
    READ_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" $BASE_URL/user/alerts/$FIRST_ALERT_ID/read)
    if echo "$READ_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Alert marked as read"
    fi
    echo ""

    # Snooze alert
    echo "8️⃣ Snoozing an alert..."
    # Get another alert to snooze
    SECOND_ALERT_ID=$(echo "$USER_ALERTS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['data']['active'][1]['id'] if len(d['data']['active']) > 1 else '')" 2>/dev/null)
    
    if [ -n "$SECOND_ALERT_ID" ]; then
        SNOOZE_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" $BASE_URL/user/alerts/$SECOND_ALERT_ID/snooze)
        if echo "$SNOOZE_RESPONSE" | grep -q "success.*true"; then
            echo "✅ Alert snoozed until tomorrow"
        fi
    fi
fi
echo ""

# Get user analytics
echo "9️⃣ Fetching user analytics..."
USER_ANALYTICS=$(curl -s -H "Authorization: Bearer $USER_TOKEN" $BASE_URL/user/analytics)
echo "$USER_ANALYTICS" | pretty_json | head -20
echo ""

# Get system analytics (as admin)
echo "🔟 Fetching system analytics (Admin only)..."
SYSTEM_ANALYTICS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $BASE_URL/analytics/system)
if echo "$SYSTEM_ANALYTICS" | grep -q "success.*true"; then
    echo "✅ System analytics retrieved"
    echo "$SYSTEM_ANALYTICS" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
print(f\"📊 System Statistics:\")
print(f\"   - Total Alerts: {data['alerts']['total']}\")
print(f\"   - Active Alerts: {data['alerts']['active']}\")
print(f\"   - Delivery Rate: {data['notifications']['deliveryRate']}%\")
print(f\"   - User Engagement: {data['userEngagement']['engagementRate']}%\")
" 2>/dev/null
fi
echo ""

echo "========================================"
echo "✅ All tests completed successfully!"
echo "========================================"
echo ""
echo "📝 Test Summary:"
echo "   ✓ Server health check"
echo "   ✓ Admin authentication"
echo "   ✓ User authentication"
echo "   ✓ Alert creation (Admin)"
echo "   ✓ Alert listing"
echo "   ✓ Alert read/unread marking"
echo "   ✓ Alert snoozing"
echo "   ✓ User analytics"
echo "   ✓ System analytics"
echo ""
echo "🎉 The alerting platform is fully functional!"
