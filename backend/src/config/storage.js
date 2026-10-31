import {S3Client,CreateBucketCommand,HeadBucketCommand,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
export const bucket=process.env.S3_BUCKET||'secure-drive-files';
export const s3=new S3Client({region:process.env.S3_REGION||'us-east-1',endpoint:process.env.S3_ENDPOINT||'http://localhost:8333',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY||'localaccesskey',secretAccessKey:process.env.S3_SECRET_KEY||'localsecretkey123456'}});
export async function ensureBucket(){try{await s3.send(new HeadBucketCommand({Bucket:bucket}));}catch{await s3.send(new CreateBucketCommand({Bucket:bucket}));}}
export {PutObjectCommand,GetObjectCommand};
