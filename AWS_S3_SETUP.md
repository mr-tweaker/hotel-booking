# AWS S3 Setup Guide

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME=booking-hours
AWS_REGION=us-east-1
```

## S3 Bucket Configuration

Make sure your S3 bucket has the following settings:

1. **Public Access**: The bucket should allow public read access for uploaded files (or use CloudFront CDN)
2. **CORS Configuration**: Add CORS rules to allow uploads from your domain
3. **Bucket Policy**: Ensure the IAM user has permissions to upload files

### Example CORS Configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Example Bucket Policy (for public read):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::booking-hours/*"
    }
  ]
}
```

## IAM User Permissions

The IAM user needs the following permissions:
- `s3:PutObject` - To upload files
- `s3:GetObject` - To retrieve files (if needed)
- `s3:DeleteObject` - To delete files (if needed)

## File Structure

Uploaded files are stored in the following structure:
```
booking-hours/
  └── id-proofs/
      ├── 1234567890-abc123-filename1.pdf
      ├── 1234567891-def456-filename2.jpg
      └── ...
```

## Testing

To test the S3 upload functionality:
1. Start your development server: `npm run dev`
2. Navigate to the dashboard
3. Try uploading a document when creating/editing a booking
4. Check the S3 bucket to verify files are uploaded

## Troubleshooting

### Error: "Access Denied"
- Check IAM user permissions
- Verify bucket policy allows uploads
- Ensure bucket name is correct

### Error: "Bucket not found"
- Verify bucket name: `booking-hours`
- Check region: `us-east-1`
- Ensure bucket exists in your AWS account

### Files not publicly accessible
- Check bucket public access settings
- Verify bucket policy allows public read
- Check file ACL is set to `public-read`








