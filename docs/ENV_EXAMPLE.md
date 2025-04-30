# Npub.Health Environment Variables Configuration

This document provides a template for the required environment variables needed for the Bitvora Bitcoin payment integration with Blossom server deployment.

## Environment Variables Template

```env
# Database
DATABASE_URL=postgres://username:password@hostname:5432/npubhealth

# Node environment
NODE_ENV=production

# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=us-east-1

# Security Groups for each region 
# (create these in your AWS account with appropriate inbound rules)
SECURITY_GROUP_US_EAST=sg-xxxxxxxxxxxxxxxx
SECURITY_GROUP_US_WEST=sg-xxxxxxxxxxxxxxxx
SECURITY_GROUP_EU_CENTRAL=sg-xxxxxxxxxxxxxxxx
SECURITY_GROUP_AP_SOUTHEAST=sg-xxxxxxxxxxxxxxxx

# Bitcoin Payment Processing with Bitvora
BITVORA_API_KEY=47|53731320-10c3-4c6b-a0cb-3640620e47de
BITVORA_NETWORK=testnet # Use 'mainnet' for production

# Blossom server configuration
SERVER_URL=https://api.npubhealth.com
CLIENT_URL=https://app.npubhealth.com
```

## Setup Instructions

1. Create a `.env` file in the root directory of the project
2. Copy the template above and replace with your actual values
3. Ensure the file is not committed to version control (it should be in `.gitignore`)
4. For production deployments, securely manage these environment variables using your hosting provider's environment configuration

## Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgres://user:pass@localhost:5432/npubhealth` |
| NODE_ENV | Environment (development/production) | `production` |
| AWS_ACCESS_KEY_ID | AWS API access key ID | `AKIAIOSFODNN7EXAMPLE` |
| AWS_SECRET_ACCESS_KEY | AWS API secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| AWS_DEFAULT_REGION | Default AWS region | `us-east-1` |
| SECURITY_GROUP_* | Security group IDs for each region | `sg-0123456789abcdef` |
| BITVORA_API_KEY | API key for Bitvora Bitcoin payments | `47\|53731320-10c3-4c6b-a0cb-3640620e47de` |
| BITVORA_NETWORK | Bitvora network (testnet/mainnet) | `mainnet` |
| SERVER_URL | URL for the backend API | `https://api.npubhealth.com` |
| CLIENT_URL | URL for the frontend application | `https://app.npubhealth.com` | 