# Npub.Health Blossom Server Production Deployment Guide

This guide outlines the steps required to deploy the Npub.Health Blossom server integration to production.

## Prerequisites

- AWS account with appropriate permissions
- PostgreSQL database server
- Node.js 18+ installed on deployment environment
- DNS domain for your application

## Step 1: AWS Configuration

### IAM User Setup

1. Log in to the AWS Console at https://408488939834.signin.aws.amazon.com/console with the provided credentials
2. Navigate to IAM → Users → Create user
3. Create a user with programmatic access only
4. Attach the following policies:
   - AmazonEC2FullAccess
   - AmazonVPCReadOnlyAccess
   - CloudWatchLogsFullAccess

Or for more restricted permissions, create a custom policy with only these specific permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:CreateTags",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeVpcs",
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

### Security Group Setup

1. Run the security group creation script:

```bash
node scripts/create_aws_security_groups.js
```

2. Note the security group IDs for each region and add them to your `.env` file:

```
SECURITY_GROUP_US_EAST=sg-xxxxxxxx
SECURITY_GROUP_US_WEST=sg-xxxxxxxx
SECURITY_GROUP_EU_CENTRAL=sg-xxxxxxxx
SECURITY_GROUP_AP_SOUTHEAST=sg-xxxxxxxx
```

### AWS Credentials

Add your AWS credentials to the `.env` file:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

For production environments, consider using AWS EC2 instance roles instead of hardcoded credentials.

## Step 2: Database Setup

1. Create a PostgreSQL database:
   - For AWS, consider using Amazon RDS PostgreSQL
   - Ensure it's accessible from your application server

2. Run the database setup script:

```bash
node scripts/setup_database.js
```

3. Ensure the `DATABASE_URL` is properly set in your `.env` file:

```
DATABASE_URL=postgres://username:password@hostname:5432/npubhealth
```

## Step 3: Bitcoin Payment Processing

For production, you'll need to:

1. Generate unique Bitcoin addresses for each payment request
2. Monitor the Bitcoin blockchain for confirmations
3. Set up a secure wallet for receiving payments

Options include:
- Integrating with a Bitcoin payment processor API (BTCPay Server, OpenNode, etc.)
- Running your own Bitcoin node with wallet capabilities
- Using a third-party Bitcoin payment processing service

Add the necessary configuration to `.env`:

```
BITCOIN_PAYMENT_PROCESSOR=btcpay
BTCPAY_API_KEY=your_api_key
BTCPAY_SERVER_URL=https://your-btcpay-server.com
```

## Step 4: Application Configuration

Create a complete `.env` file with all required configuration:

```
# Environment
NODE_ENV=production
PORT=5000

# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Security Groups
SECURITY_GROUP_US_EAST=sg-xxxxxxxx
SECURITY_GROUP_US_WEST=sg-xxxxxxxx
SECURITY_GROUP_EU_CENTRAL=sg-xxxxxxxx
SECURITY_GROUP_AP_SOUTHEAST=sg-xxxxxxxx

# Database
DATABASE_URL=postgres://username:password@hostname:5432/npubhealth

# Application Settings
SERVER_URL=https://app.npubhealth.com
CLIENT_URL=https://app.npubhealth.com

# Bitcoin Payment Settings
BITCOIN_PAYMENT_PROCESSOR=btcpay
BTCPAY_API_KEY=your_api_key
BTCPAY_SERVER_URL=https://your-btcpay-server.com
```

## Step 5: Server Deployment

### Option 1: Traditional Server Deployment

1. Clone the repository:

```bash
git clone https://github.com/your-org/npub-health.git
cd npub-health
```

2. Install dependencies:

```bash
npm install --production
```

3. Build the application:

```bash
npm run build
```

4. Start the application:

```bash
npm start
```

For production environments, consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "npub-health" -- start
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

1. Build the Docker image:

```bash
docker build -t npub-health .
```

2. Run the container:

```bash
docker run -d \
  --name npub-health \
  -p 5000:5000 \
  --env-file .env \
  npub-health
```

### Option 3: Cloud Provider Deployment

For AWS:

1. Package the application:

```bash
npm run build
zip -r deploy.zip dist package.json node_modules .env
```

2. Deploy to Elastic Beanstalk or EC2

## Step 6: DNS Configuration

1. Set up DNS A records pointing to your application server
2. For proper Blossom server hostname resolution, you may need to set up a wildcard DNS record:

```
*.blossom.yourdomain.com → [IP of your API server]
```

## Step 7: Monitoring and Logging

1. Configure AWS CloudWatch for EC2 instance monitoring
2. Set up server logs forwarding to a centralized logging service
3. Implement health checks for your application and the deployed Blossom servers

## Troubleshooting

### EC2 Instance Deployment Issues

1. Check the logs:
   - Application logs
   - AWS EC2 instance console output
   - CloudWatch logs for the instance

2. Verify security group configurations allow necessary ports

3. Check AMI availability in the selected region

### Database Connection Issues

1. Verify database connection string in `.env`
2. Ensure database server allows connections from your application
3. Check database user permissions

### Payment Processing Issues

1. Validate Bitcoin payment processor configuration
2. Test webhook endpoints
3. Check blockchain confirmations of payments

## Production Checklist

- [ ] Security groups configured in all regions
- [ ] Database created and migrated
- [ ] Bitcoin payment processing configured
- [ ] Environment variables properly set
- [ ] Application built and deployed
- [ ] DNS records configured
- [ ] SSL certificates installed
- [ ] Monitoring and alerting configured
- [ ] Database backups scheduled
- [ ] Security scanning and updates scheduled

## Maintenance

1. Regularly update AMI IDs in `server/aws/ec2Manager.ts` as new Amazon Linux versions are released
2. Monitor EC2 instance costs and adjust tier pricing if needed
3. Implement a regular backup process for the database
4. Set up security updates automation for deployed EC2 instances

## Support

If you encounter issues during deployment, please contact support@npubhealth.com or open an issue on the repository. 