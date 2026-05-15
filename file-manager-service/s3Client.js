const { S3Client } = require('@aws-sdk/client-s3');

// DigitalOcean Spaces is S3-compatible
// Environment variables-аас уншина — кодонд хэзээ ч бүү бич!
const s3 = new S3Client({
  endpoint:        `https://${process.env.SPACES_REGION}.digitaloceanspaces.com`,
  region:          process.env.SPACES_REGION || 'sgp1',
  credentials: {
    accessKeyId:     process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY
  },
  forcePathStyle:  false
});

module.exports = s3;
