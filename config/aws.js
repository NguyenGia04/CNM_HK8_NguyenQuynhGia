const AWS = require('aws-sdk');
require('dotenv').config(); // Nạp biến môi trường từ file .env

// 1. Cấu hình chung cho AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// 2. Khởi tạo đối tượng thao tác với DynamoDB
// Sử dụng DocumentClient để không phải convert dữ liệu sang định dạng DynamoDB JSON thủ công
const docClient = new AWS.DynamoDB.DocumentClient();

// 3. Khởi tạo đối tượng thao tác với S3
const s3 = new AWS.S3();

// 4. Xuất các biến này để dùng ở Model và Controller
module.exports = {
    dynamoDB: docClient,
    s3: s3,
    bucketName: process.env.S3_BUCKET_NAME,
    tableName: process.env.DYNAMODB_TABLE_NAME
};