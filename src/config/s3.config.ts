import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  const bucketName = process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  const key = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  const bucketName = process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  const key = fileUrl.split('/').slice(-3).join('/');
  await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
};

export const getSignedUrl = async (fileUrl: string, expiry: number = 3600): Promise<string> => {
  const bucketName = process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  const key = fileUrl.split('/').slice(-3).join('/');
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiry,
  };

  return s3.getSignedUrlPromise('getObject', params);
};
