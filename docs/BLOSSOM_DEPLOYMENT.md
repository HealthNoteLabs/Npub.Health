# Blossom Server Deployment Guide

This guide covers the deployment, management, and best practices for working with your private Blossom server for Npub.Health.

## Table of Contents

1. [What is a Blossom Server?](#what-is-a-blossom-server)
2. [One-Click Deployment](#one-click-deployment)
3. [Server Management](#server-management)
4. [Data Security](#data-security)
5. [Backup and Recovery](#backup-and-recovery)
6. [Troubleshooting](#troubleshooting)
7. [Technical Details](#technical-details)

## What is a Blossom Server?

A Blossom server is your private, dedicated server for storing encrypted health data. It provides:

- End-to-end encryption for all your health data
- Complete ownership and control over your data
- Independence from centralized storage
- API access for integration with health apps and devices

## One-Click Deployment

### Step 1: Choose Your Server Options

1. Log in to Npub.Health using your Nostr account
2. Navigate to "Blossom Server" in the sidebar
3. Click "Create Server" and select:
   - **Server Name**: A unique name for your server
   - **Region**: The geographic location where your server will be hosted
   - **Server Tier**: Storage capacity and performance level

### Step 2: Payment

1. Complete the payment using Bitcoin
2. The system will automatically verify your payment

### Step 3: Deployment

1. Once payment is confirmed, deployment begins automatically
2. Deployment typically takes 3-5 minutes
3. You'll receive a notification when your server is ready

### Step 4: Connection

1. After deployment completes, click "Connect to Server"
2. The system will automatically configure your Npub.Health client to use your Blossom server
3. You can now export health data to your private server

## Server Management

### Viewing Server Status

The dashboard provides real-time information about your server:

- **Status**: Current operational state
- **Storage Usage**: Amount of storage used vs. total capacity
- **Server URL**: The URL to access your server directly
- **Server Details**: Region, tier, creation date, etc.

### Server Logs

The logs panel provides two types of logs:

- **Deployment Logs**: Details of the server creation process
- **Runtime Logs**: Ongoing server operations and activities

You can:
- Refresh logs manually
- Download logs for troubleshooting
- View logs in real-time during deployment

## Data Security

### Encryption Keys

Your health data is encrypted using strong encryption before being sent to your Blossom server. The encryption keys are:

1. Created automatically when you first use the service
2. Stored securely in your browser's local storage
3. Never sent to the server or shared with anyone

### Key Rotation

For enhanced security, you can rotate your encryption keys:

1. Go to "Server Management" and select the "Security" tab
2. Click "Rotate Encryption Keys"
3. All your data will be re-encrypted with a new key

**Note**: This process may take time depending on how much data you have stored.

## Backup and Recovery

### Creating Backups

Regular backups protect your data against server or hardware failures.

1. Go to "Server Management" and click "Create Backup"
2. The system will create a complete backup of your encrypted data
3. Backups are stored in a separate, secure location

### Restoring from Backup

If you need to restore your server:

1. Go to "Server Management" and select the "Backups" tab
2. Choose the backup you want to restore from
3. Click "Restore" and confirm the action

## Troubleshooting

### Common Issues

#### Server Shows "Error" Status

Possible causes:
- Network connectivity issues
- Region-specific AWS outage
- Resource allocation errors

Solutions:
1. Check the deployment logs for specific error messages
2. Try redeploying the server in a different region
3. Contact support if the issue persists

#### Cannot Connect to Server

Possible causes:
- Server not fully deployed
- Network or firewall issues
- Incorrect URL

Solutions:
1. Ensure server status shows "Running"
2. Check your network connection
3. Try accessing the server URL directly in your browser

#### Data Not Appearing

Possible causes:
- Connection issues
- Encryption key mismatch
- Permission problems

Solutions:
1. Verify connection to the correct server
2. Check that you're using the same device/browser where data was uploaded
3. Examine server logs for permission errors

### Contact Support

If you're experiencing issues not covered here, contact support at:
- Email: support@npubhealth.com
- Nostr: npub1support...

## Technical Details

### Architecture

Your Blossom server runs on:
- AWS EC2 instance (size depends on selected tier)
- Node.js backend with encrypted storage
- RESTful API with authentication
- TLS/SSL encryption for all connections

### API Access

For developers, the server provides a RESTful API at:
```
https://<your-server-url>/api/
```

Authentication requires:
- Bearer token in request headers
- Nostr-based authorization

### Monitoring and Maintenance

The system automatically:
- Monitors server health and availability
- Applies security updates
- Scales resources based on usage (premium tiers only)
- Alerts administrators of potential issues

---

For more technical details, see our [Developer Documentation](./BLOSSOM_API.md). 