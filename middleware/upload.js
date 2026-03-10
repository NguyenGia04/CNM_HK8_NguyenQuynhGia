const multer = require('multer');
const { s3, bucketName } = require('../config/aws');
const path = require('path');

// 1. Cấu hình Multer: Lưu file vào bộ nhớ đệm (MemoryStorage)
const storage = multer.memoryStorage();

// 2. Kiểm tra file upload có phải là ảnh không
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif)!'));
};

// Khởi tạo multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Giới hạn 2MB
});

// 3. Hàm upload lên S3
const uploadToS3 = (file) => {
    return new Promise((resolve, reject) => {
        // Tạo tên file unique để tránh trùng lặp
        const fileName = `${Date.now()}_${file.originalname}`;

        const params = {
            Bucket: bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read' // Bỏ comment nếu bucket cấu hình public
        };

        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location); // Trả về URL ảnh
            }
        });
    });
};

module.exports = { upload, uploadToS3 };