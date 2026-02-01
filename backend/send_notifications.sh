#!/bin/bash

# Email notification checker script
# This script calls the FastAPI endpoint to send due email notifications

# Configuration
API_URL="http://localhost:8000"
LOG_FILE="/tmp/syllabus_notifications.log"

# Use JWT token for authentication
JWT_TOKEN="eyJhbGciOiJFUzI1NiIsImtpZCI6ImNiZjBiZTFjLTgwMmEtNDI2ZS1iZTdkLWU2OWE0YjM5ZTIxZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3d6eGNmdXhpaXFnZnl0dWNuY2lrLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmYTZhZWExYi0xZmVkLTQyZmEtYTQ0Yi03YmU2MjczMGI0ODAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY5OTMzMzY0LCJpYXQiOjE3Njk5Mjk3NjQsImVtYWlsIjoidmljdG9yaWFnYW9qaW5nQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTGlJbnlGd0pTUGd2S1NTZjdiM0lRYktZaXQwM2dkVnRwVHRjYmtadU5CZUR5TDFpUT1zOTYtYyIsImVtYWlsIjoidmljdG9yaWFnYW9qaW5nQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJWaWN0b3JpYSBHYW8iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiVmljdG9yaWEgR2FvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTGlJbnlGd0pTUGd2S1NTZjdiM0lRYktZaXQwM2dkVnRwVHRjYmtadU5CZUR5TDFpUT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTA0MjM2MTczNTM3MDQyNjA0OTczIiwic3ViIjoiMTA0MjM2MTczNTM3MDQyNjA0OTczIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3Njk5Mjk3NjR9XSwic2Vzc2lvbl9pZCI6ImRhZmMyZjc0LTc5ODMtNDNmMi1hMjVjLTY4NGMyNWIyOThkNSIsImlzX2Fub255bW91cyI6ZmFsc2V9.Yf5TvW0R4onMcWkMA36AeFzOKEMEnvoGnSm4OzqdbKPivQJuz2JQzEoP-iOt7rSEH6sXFsx5qLbs5wjmDV7hcQ"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Make the API call
log_message "Starting notification check..."

response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/syllabus/send-due-notifications" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -o /tmp/notification_response.json)

http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    sent_count=$(cat /tmp/notification_response.json | grep -o '"sent_count":[0-9]*' | cut -d':' -f2)
    failed_count=$(cat /tmp/notification_response.json | grep -o '"failed_count":[0-9]*' | cut -d':' -f2)
    log_message "Success: Sent $sent_count notifications, $failed_count failed"
else
    log_message "Error: HTTP $http_code - $(cat /tmp/notification_response.json)"
fi

# Cleanup
rm -f /tmp/notification_response.json

log_message "Notification check completed"