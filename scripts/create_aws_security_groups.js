#!/usr/bin/env node

/**
 * Script to create AWS security groups for Blossom servers in production
 * 
 * Usage:
 * 1. Set AWS credentials using environment variables or AWS CLI profile
 * 2. Run: node scripts/create_aws_security_groups.js
 */

const { EC2Client, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, DescribeVpcsCommand } = require('@aws-sdk/client-ec2');

// AWS Regions to create security groups in
const REGIONS = [
  'us-east-1',    // US East (N. Virginia)
  'us-west-2',    // US West (Oregon)
  'eu-central-1', // EU (Frankfurt)
  'ap-southeast-1' // Asia Pacific (Singapore)
];

// For production, restrict SSH access to specific IPs
const ADMIN_IP = process.env.ADMIN_IP || '0.0.0.0/0'; // Replace with your actual IP in production

async function getDefaultVpc(client) {
  try {
    const command = new DescribeVpcsCommand({
      Filters: [
        {
          Name: 'isDefault',
          Values: ['true']
        }
      ]
    });
    
    const response = await client.send(command);
    
    if (!response.Vpcs || response.Vpcs.length === 0) {
      throw new Error('No default VPC found in region');
    }
    
    return response.Vpcs[0].VpcId;
  } catch (error) {
    console.error('Error getting default VPC:', error);
    throw error;
  }
}

async function createSecurityGroup(region) {
  console.log(`\n=== Creating security group in ${region} ===`);
  
  const client = new EC2Client({ region });
  
  try {
    // Get the default VPC ID
    const vpcId = await getDefaultVpc(client);
    console.log(`Using default VPC: ${vpcId}`);
    
    // Create the security group
    const securityGroupName = `Blossom-Server-SG-${region}`;
    const createCommand = new CreateSecurityGroupCommand({
      GroupName: securityGroupName,
      Description: 'Security group for Blossom servers with secure access configuration',
      VpcId: vpcId,
    });
    
    const createResponse = await client.send(createCommand);
    const groupId = createResponse.GroupId;
    
    console.log(`✓ Security group created: ${groupId}`);
    
    // Add inbound rules
    const rulesCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: groupId,
      IpPermissions: [
        // HTTP
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'Allow HTTP access' }]
        },
        // HTTPS
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'Allow HTTPS access' }]
        },
        // Blossom Server port
        {
          IpProtocol: 'tcp',
          FromPort: 3000,
          ToPort: 3000,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'Allow Blossom server access' }]
        },
        // SSH (restricted to admin IP)
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: ADMIN_IP, Description: 'Admin SSH access' }]
        }
      ]
    });
    
    await client.send(rulesCommand);
    console.log(`✓ Security group inbound rules added`);
    
    return { 
      region, 
      groupId, 
      vpcId,
      name: securityGroupName
    };
  } catch (error) {
    if (error.name === 'InvalidGroup.Duplicate') {
      console.error(`⚠ Security group already exists in ${region}`);
      return { region, error: 'Security group already exists' };
    } else {
      console.error(`✖ Error creating security group in ${region}:`, error.message);
      return { region, error: error.message };
    }
  }
}

async function main() {
  console.log('=== Creating Blossom Server Security Groups ===');
  console.log('This script will create security groups in all required AWS regions');
  console.log('For production, please set ADMIN_IP environment variable to restrict SSH access');
  
  if (ADMIN_IP === '0.0.0.0/0') {
    console.log('⚠ WARNING: SSH access is not restricted (0.0.0.0/0). This is not recommended for production!');
  }
  
  const results = [];
  
  for (const region of REGIONS) {
    try {
      const result = await createSecurityGroup(region);
      results.push(result);
    } catch (error) {
      console.error(`✖ Failed to process region ${region}:`, error.message);
      results.push({ region, error: error.message });
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Add these values to your .env file for production:');
  console.log('-------------------------------------------------');
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    if (result.groupId) {
      let envName = '';
      if (result.region === 'us-east-1') envName = 'SECURITY_GROUP_US_EAST';
      else if (result.region === 'us-west-2') envName = 'SECURITY_GROUP_US_WEST';
      else if (result.region === 'eu-central-1') envName = 'SECURITY_GROUP_EU_CENTRAL';
      else if (result.region === 'ap-southeast-1') envName = 'SECURITY_GROUP_AP_SOUTHEAST';
      
      console.log(`${envName}=${result.groupId}`);
      successCount++;
    } else {
      console.log(`# Error in ${result.region}: ${result.error}`);
      errorCount++;
    }
  });
  
  console.log('-------------------------------------------------');
  console.log(`✓ Successfully created ${successCount} security groups`);
  
  if (errorCount > 0) {
    console.log(`✖ Failed to create ${errorCount} security groups`);
  }
  
  console.log('\n=== Next Steps ===');
  console.log('1. Add the security group IDs to your .env file');
  console.log('2. Ensure AWS credentials are properly configured');
  console.log('3. Update AMI IDs in server/aws/ec2Manager.ts if needed');
  console.log('4. Check Bitcoin payment processing setup');
  console.log('5. Configure production database connection');
}

main().catch(error => {
  console.error('✖ Unhandled error:', error.message);
  process.exit(1);
}); 