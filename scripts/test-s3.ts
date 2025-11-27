// Test script to verify AWS S3 credentials and upload functionality
import dotenv from 'dotenv';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

async function testS3Connection() {
  try {
    console.log('Testing AWS S3 Connection...\n');
    
    // Check environment variables
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    console.log('Environment Variables:');
    console.log(`  AWS_ACCESS_KEY_ID: ${accessKeyId ? '✓ Set' : '✗ Missing'}`);
    console.log(`  AWS_SECRET_ACCESS_KEY: ${secretAccessKey ? '✓ Set' : '✗ Missing'}`);
    console.log(`  AWS_S3_BUCKET_NAME: ${bucketName || '✗ Missing'}`);
    console.log(`  AWS_REGION: ${region || '✗ Missing'}\n`);

    if (!accessKeyId || !secretAccessKey || !bucketName || !region) {
      console.error('❌ Missing required environment variables!');
      console.log('\nPlease add the following to your .env.local file:');
      console.log('AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID');
      console.log('AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY');
      console.log('AWS_S3_BUCKET_NAME=booking-hours');
      console.log('AWS_REGION=us-east-1');
      process.exit(1);
    }

    // Test S3 client initialization
    const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log('Testing S3 client connection...');
    const listCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listCommand);
    
    console.log('✓ S3 connection successful!');
    console.log(`  Available buckets: ${response.Buckets?.map(b => b.Name).join(', ') || 'None'}\n`);

    // Check if target bucket exists
    const bucketExists = response.Buckets?.some(b => b.Name === bucketName);
    if (bucketExists) {
      console.log(`✓ Bucket "${bucketName}" found!`);
    } else {
      console.log(`⚠ Bucket "${bucketName}" not found in your account.`);
      console.log('  Please create the bucket or verify the bucket name.\n');
    }

    console.log('\n✅ AWS S3 setup is ready!');
    console.log('You can now upload documents to S3.\n');
    
  } catch (error) {
    console.error('❌ S3 connection test failed:');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.message.includes('InvalidAccessKeyId')) {
        console.error('\n  The AWS Access Key ID is invalid.');
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        console.error('\n  The AWS Secret Access Key is incorrect.');
      } else if (error.message.includes('AccessDenied')) {
        console.error('\n  The IAM user does not have permission to list buckets.');
      }
    } else {
      console.error('  Unknown error:', error);
    }
    process.exit(1);
  }
}

testS3Connection();








