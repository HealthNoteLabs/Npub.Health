# Npub.Health

A decentralized health records platform built on Nostr protocol.

## Project Overview

Npub.Health provides a secure, user-controlled platform for managing health data using the Nostr protocol. This application gives individuals ownership over their health information while enabling selective sharing with healthcare providers.

## Features

- Secure health record storage using Nostr protocol
- User-controlled data sharing and permissions
- Provider verification system
- Cross-platform support (web, mobile)
- End-to-end encryption for sensitive health data

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js
- **Database**: SQLite with Drizzle ORM
- **Protocol**: Nostr

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/HealthNoteLabs/Npub.Health.git
   cd Npub.Health
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Project Structure

```
Npub.Health/
├── client/           # Frontend React application
├── server/           # Backend Node.js server
├── shared/           # Shared utilities and types
├── scripts/          # Utility scripts
└── ...
```

## Development

### Running the app in development mode

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or feedback, please open an issue on this repository.

## AWS Integration for Blossom Server Deployment

This project includes AWS integration to automatically deploy Blossom servers for users. The implementation allows users to create their own private Blossom servers on AWS EC2 instances.

### Setup Steps

1. **Install AWS SDK**:
   ```
   npm install @aws-sdk/client-ec2
   ```

2. **Create Security Groups**:
   The `scripts/create_aws_security_groups.js` script will create the necessary security groups in each AWS region:
   ```
   node scripts/create_aws_security_groups.js
   ```
   Make sure to update the VPC ID in the script for each region.

3. **Configure AWS Credentials**:
   Create a `.env` file with the following variables:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   
   # Security Groups for each region (output from the script)
   SECURITY_GROUP_US_EAST=sg-xxxxxxxxxxxxxxxx
   SECURITY_GROUP_US_WEST=sg-xxxxxxxxxxxxxxxx
   SECURITY_GROUP_EU_CENTRAL=sg-xxxxxxxxxxxxxxxx
   SECURITY_GROUP_AP_SOUTHEAST=sg-xxxxxxxxxxxxxxxx
   
   # Database URL
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/npubhealth
   ```

4. **Set up PostgreSQL database**:
   Follow these steps to set up the database:
   - Install PostgreSQL
   - Create a database named `npubhealth`
   - Run migrations to create tables:
     ```
     npm run db:push
     ```

5. **Test the integration**:
   ```
   npm run dev
   ```

### Architecture

The AWS integration consists of:

1. **EC2 Manager** (`server/aws/ec2Manager.ts`): Handles creating and checking EC2 instances.
2. **Server Monitor** (`server/aws/serverMonitor.ts`): Periodically checks and updates server status.
3. **API Endpoints** (`server/routes.ts`): Provides REST endpoints for server management.
4. **Database Integration** (`server/db`): Persists server information and status.

### User Flow

1. User selects a server tier, region, and name
2. System generates a payment address
3. User sends payment (simulated in development)
4. System deploys an EC2 instance with the Blossom server installation script
5. UI polls for server status until it's running
6. User connects to their personal Blossom server

### Security Considerations

- The security groups allow HTTP, HTTPS, and the Blossom server port (3000)
- SSH access should be restricted to specific IPs in production
- AWS credentials should have limited permissions following the principle of least privilege
- For production, consider using IAM roles instead of credentials

### Troubleshooting

If you encounter issues:

1. Check AWS credentials and permissions
2. Verify that security groups are properly configured
3. Look at server logs for deployment errors
4. Check the database for server status information

For more information about the AWS SDK, refer to the [official documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html). 