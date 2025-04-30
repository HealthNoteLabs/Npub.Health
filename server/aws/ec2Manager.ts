import { EC2Client, RunInstancesCommand, DescribeInstancesCommand, CreateTagsCommand, DescribeInstanceStatusCommand, GetConsoleOutputCommand } from "@aws-sdk/client-ec2";

// Map frontend region selections to AWS regions
const AWS_REGIONS = {
  'us-east': 'us-east-1',
  'us-west': 'us-west-2',
  'eu-central': 'eu-central-1',
  'ap-southeast': 'ap-southeast-1'
};

// Map tier selections to EC2 instance types
const INSTANCE_TYPES = {
  'basic': 't3.micro',
  'premium': 't3.small',
  'enterprise': 't3.medium'
};

// These AMI IDs need to be updated with the actual Amazon Linux 2023 AMIs in each region
// You can find the latest AMI IDs in the AWS console
const AMI_IDS = {
  'us-east-1': 'ami-0440d3b780d96b29d',
  'us-west-2': 'ami-0c0d141edc4f470cc',
  'eu-central-1': 'ami-06dd92ecc74ffdca4',
  'ap-southeast-1': 'ami-0c5a62863e48681e6'
};

// Security groups in each region
// These need to be created in each region with the appropriate inbound rules
const SECURITY_GROUPS = {
  'us-east-1': process.env.SECURITY_GROUP_US_EAST || '',
  'us-west-2': process.env.SECURITY_GROUP_US_WEST || '',
  'eu-central-1': process.env.SECURITY_GROUP_EU_CENTRAL || '',
  'ap-southeast-1': process.env.SECURITY_GROUP_AP_SOUTHEAST || ''
};

// Your installation script (Base64 encoded)
// This is the script you've already created
const USER_DATA_SCRIPT = `#!/bin/bash
# Blossom Server Installation Script for AWS EC2
# For Amazon Linux 2 / Amazon Linux 2023

# Update system
echo "Updating system packages..."
yum update -y

# Install required dependencies
echo "Installing dependencies..."
yum install -y docker git jq

# Start and enable Docker service
echo "Setting up Docker..."
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create Blossom server directory
echo "Creating Blossom server directory..."
mkdir -p /opt/blossom-server
cd /opt/blossom-server

# Create docker-compose.yml
echo "Creating docker-compose configuration..."
cat > docker-compose.yml << 'EOL'
version: '3.8'
services:
  blossom-server:
    image: ghcr.io/hzrd149/blossom-server:master
    container_name: blossom-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./config.yml:/app/config.yml
    environment:
      - NODE_ENV=production
EOL

# Create default config file
echo "Creating default configuration..."
cat > config.yml << 'EOL'
port: 3000
# Limits
maxFileSize: 500000000 # 500MB
allowedMimeTypes:
  - image/*
  - video/*
  - audio/*
  - application/json
  - text/plain
  - application/pdf
  - application/zip
  - application/x-gzip
storage:
  type: "filesystem"
  path: "./data/blobs"
verbose: false
host: "0.0.0.0"
EOL

# Create data directory
mkdir -p /opt/blossom-server/data

# Set proper permissions
chown -R ec2-user:ec2-user /opt/blossom-server

# Create systemd service for auto-start
echo "Creating systemd service for auto-start..."
cat > /etc/systemd/system/blossom-server.service << 'EOL'
[Unit]
Description=Blossom Server
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/opt/blossom-server
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
systemctl daemon-reload
systemctl enable blossom-server
systemctl start blossom-server

# Set up basic HTTP security headers with Nginx (optional)
echo "Installing Nginx as reverse proxy with security headers..."
yum install -y nginx
cat > /etc/nginx/conf.d/blossom.conf << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' wss://$host;" always;
    }
}
EOL

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx

echo "Installation complete! Blossom server is running at http://YOUR_SERVER_IP"
echo "You should configure your domain name to point to this server and set up HTTPS for production use."`;

/**
 * Launches a new EC2 instance with the Blossom server installation script
 */
export async function launchBlossomServer(params: {
  serverName: string;
  region: string;
  tier: string;
  serverId: string;
  userPubkey: string;
}) {
  const { serverName, region, tier, serverId, userPubkey } = params;
  
  // Get the AWS region code
  const awsRegion = AWS_REGIONS[region];
  if (!awsRegion) {
    throw new Error(`Invalid region: ${region}`);
  }
  
  // Get the AMI ID for the region
  const amiId = AMI_IDS[awsRegion];
  if (!amiId) {
    throw new Error(`No AMI configured for region: ${awsRegion}`);
  }
  
  // Get the security group for the region
  const securityGroupId = SECURITY_GROUPS[awsRegion];
  if (!securityGroupId) {
    throw new Error(`No security group configured for region: ${awsRegion}`);
  }
  
  // Initialize EC2 client
  const ec2Client = new EC2Client({ 
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  });
  
  // Encode the user data script in base64
  const userData = Buffer.from(USER_DATA_SCRIPT).toString('base64');
  
  // Create the RunInstancesCommand
  const command = new RunInstancesCommand({
    ImageId: amiId,
    InstanceType: INSTANCE_TYPES[tier],
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: [securityGroupId],
    UserData: userData,
    TagSpecifications: [{
      ResourceType: 'instance',
      Tags: [
        { Key: 'Name', Value: `blossom-${serverName}` },
        { Key: 'ServerID', Value: serverId },
        { Key: 'UserPubkey', Value: userPubkey },
        { Key: 'Project', Value: 'npub-health' }
      ]
    }]
  });
  
  try {
    // Launch the instance
    const data = await ec2Client.send(command);
    const instanceId = data.Instances?.[0]?.InstanceId;
    
    if (!instanceId) {
      throw new Error('Failed to get instance ID from launch response');
    }
    
    // Return the instance details
    return {
      instanceId,
      status: 'DEPLOYING',
      publicDnsName: data.Instances[0].PublicDnsName || null,
      publicIp: data.Instances[0].PublicIpAddress || null
    };
  } catch (error) {
    console.error('Error launching EC2 instance:', error);
    throw new Error(`Failed to launch Blossom server: ${error.message}`);
  }
}

/**
 * Checks the status of an EC2 instance
 */
export async function checkInstanceStatus(instanceId: string, region: string) {
  const awsRegion = AWS_REGIONS[region];
  if (!awsRegion) {
    throw new Error(`Invalid region: ${region}`);
  }
  
  const ec2Client = new EC2Client({ 
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  });
  
  const command = new DescribeInstancesCommand({
    InstanceIds: [instanceId]
  });
  
  try {
    const response = await ec2Client.send(command);
    const instance = response.Reservations?.[0]?.Instances?.[0];
    
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    
    // Determine status based on instance state and status checks
    let status = 'DEPLOYING';
    if (instance.State?.Name === 'running') {
      // Check if status checks have passed
      if (instance.StatusChecks?.InstanceStatus?.Status === 'ok' && 
          instance.StatusChecks?.SystemStatus?.Status === 'ok') {
        status = 'RUNNING';
      }
    } else if (instance.State?.Name === 'stopped') {
      status = 'STOPPED';
    } else if (instance.State?.Name === 'terminated' || instance.State?.Name === 'shutting-down') {
      status = 'ERROR';
    }
    
    return {
      instanceId,
      status,
      publicIp: instance.PublicIpAddress || null,
      publicDnsName: instance.PublicDnsName || null,
      state: instance.State?.Name
    };
  } catch (error) {
    console.error(`Error checking instance ${instanceId} status:`, error);
    throw error;
  }
}

/**
 * Fetch logs from an EC2 instance
 */
export async function getEC2InstanceLogs(instanceId: string, region: string): Promise<string[]> {
  // Create EC2 client with region
  const ec2Client = new EC2Client({ region });
  
  try {
    // First check if instance is running
    const statusResponse = await ec2Client.send(new DescribeInstanceStatusCommand({
      InstanceIds: [instanceId],
    }));
    
    if (statusResponse.InstanceStatuses?.length === 0 || 
        statusResponse.InstanceStatuses?.[0].InstanceState?.Name !== 'running') {
      return ['Instance is not running. Cannot fetch logs.'];
    }
    
    // Get console output
    const response = await ec2Client.send(new GetConsoleOutputCommand({
      InstanceId: instanceId,
    }));
    
    // Decode and process logs
    let logs: string[] = [];
    if (response.Output) {
      // Console output is Base64 encoded
      const decodedOutput = Buffer.from(response.Output, 'base64').toString('utf-8');
      logs = decodedOutput.split('\n');
    }
    
    // If there are too many logs, take just the most recent ones
    if (logs.length > 1000) {
      logs = logs.slice(logs.length - 1000);
    }
    
    return logs;
  } catch (error: any) {
    console.error(`Error fetching logs for instance ${instanceId}:`, error);
    return [`Error fetching logs: ${error.message}`];
  }
} 