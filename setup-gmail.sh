#!/bin/bash

echo "📧 Gmail App Password Setup Assistant"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "Follow these steps to get your Gmail App Password:"
echo ""
echo "1️⃣  Open this link: https://myaccount.google.com/security"
echo "2️⃣  Enable 2-Step Verification if not already enabled"
echo "3️⃣  Scroll down and click on 'App passwords'"
echo "4️⃣  Generate a new App Password:"
echo "     - App: Mail"
echo "     - Device: Other (Custom name) - type 'Student Marketplace'"
echo "5️⃣  Copy the 16-character password (remove spaces!)"
echo ""

# Prompt for Gmail address
echo "Enter your Gmail address:"
read -p "Gmail: " gmail_address

# Prompt for App Password
echo ""
echo "Enter your Gmail App Password (16 characters, no spaces):"
read -s -p "App Password: " app_password
echo ""

# Update .env file
if [ ! -z "$gmail_address" ] && [ ! -z "$app_password" ]; then
    # Backup original .env
    cp .env .env.backup
    
    # Update EMAIL_HOST
    if grep -q "^EMAIL_HOST=" .env; then
        sed -i '' "s|^EMAIL_HOST=.*|EMAIL_HOST=smtp.gmail.com|" .env
    else
        echo "EMAIL_HOST=smtp.gmail.com" >> .env
    fi
    
    # Update EMAIL_PORT
    if grep -q "^EMAIL_PORT=" .env; then
        sed -i '' "s|^EMAIL_PORT=.*|EMAIL_PORT=587|" .env
    else
        echo "EMAIL_PORT=587" >> .env
    fi
    
    # Update EMAIL_USER
    if grep -q "^EMAIL_USER=" .env; then
        sed -i '' "s|^EMAIL_USER=.*|EMAIL_USER=$gmail_address|" .env
    else
        echo "EMAIL_USER=$gmail_address" >> .env
    fi
    
    # Update EMAIL_PASSWORD
    if grep -q "^EMAIL_PASSWORD=" .env; then
        sed -i '' "s|^EMAIL_PASSWORD=.*|EMAIL_PASSWORD=$app_password|" .env
    else
        echo "EMAIL_PASSWORD=$app_password" >> .env
    fi
    
    echo ""
    echo "✅ .env file updated successfully!"
    echo "📋 Backup saved as .env.backup"
    echo ""
    echo "Next steps:"
    echo "1. Test configuration: npm run test-gmail"
    echo "2. Start server: npm run dev"
    echo "3. Try registration!"
    echo ""
else
    echo "❌ Invalid input. Please try again."
    exit 1
fi
