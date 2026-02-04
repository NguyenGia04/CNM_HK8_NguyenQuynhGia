const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // Thư viện xử lý file upload

// Import SDK AWS
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Cấu hình multer (Lưu file vào bộ nhớ tạm trước khi đẩy lên S3)
const upload = multer({ storage: multer.memoryStorage() });

// --- CẤU HÌNH AWS (S3 + DynamoDB dùng chung Credentials) ---
const REGION = "us-east-1";
// 👇👇👇 THAY TÊN BUCKET CỦA BẠN VÀO ĐÂY
const BUCKET_NAME = "shop-products-image-quynhgia"; 

// Tự động lấy credentials từ CLI (vì bạn đã cài AWS CLI)
const dbClient = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

const docClient = DynamoDBDocumentClient.from(dbClient);
const TABLE_NAME = "Products";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 1. API Lấy danh sách (Theo Schema Mới)
app.get('/api/products', async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: TABLE_NAME });
        const response = await docClient.send(command);
        res.json(response.Items || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. API Thêm sản phẩm CÓ ẢNH (Dùng upload.single('image'))
app.post('/api/products', upload.single('imageFile'), async (req, res) => {
    const { id, name, price, quantity } = req.body;
    const file = req.file; // File ảnh gửi lên

    if (!id || !name) return res.status(400).json({ error: "Thiếu ID hoặc Tên" });

    let imageUrl = "https://via.placeholder.com/150"; // Ảnh mặc định nếu không upload

    try {
        // A. NẾU CÓ FILE ẢNH -> UPLOAD LÊN S3
        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`; // Đặt tên file duy nhất
            
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            // Tạo đường link truy cập ảnh
            imageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}`;
        }

        // B. LƯU THÔNG TIN VÀO DYNAMODB (Theo Schema mới của bạn)
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                id: String(id),           // Partition Key (String)
                name: String(name),
                price: Number(price) || 0,
                quantity: Number(quantity) || 0,
                url_image: String(imageUrl) // Lưu cái Link vừa có
            }
        }));

        res.json({ message: "Thêm thành công!", imageUrl: imageUrl });

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. API Xóa (Chỉ cần ID vì Schema mới chỉ có Partition Key là id)
app.delete('/api/products/:id/:price', async (req, res) => {
    try {
        const id = String(req.params.id);
        const price = Number(req.params.price); // 👉 Quan trọng: Ép kiểu Number cho giống Schema

        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { 
                id: id,       // Khóa chính
                price: price  // 👉 Khóa phụ (BẮT BUỘC PHẢI CÓ)
            }
        }));
        
        console.log(`Đã xóa sản phẩm ID: ${id}, Giá: ${price}`);
        res.json({ message: "Đã xóa!" });
    } catch (error) {
        console.error("Lỗi xóa:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('🚀 Server chạy tại: http://localhost:3000');
});

app.put('/api/products', upload.single('imageFile'), async (req, res) => {
    // Nhận dữ liệu từ form sửa
    const { id, name, price, quantity, old_price, old_image } = req.body;
    const file = req.file;

    // Validate
    if (!id || !old_price || !price) {
        return res.status(400).json({ error: "Thiếu thông tin ID hoặc Giá để xử lý" });
    }

    try {
        // BƯỚC 1: Xóa sản phẩm cũ (Dùng giá cũ để tìm)
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { 
                id: String(id), 
                price: Number(old_price) 
            }
        }));

        // BƯỚC 2: Xử lý ảnh (Nếu có up ảnh mới thì dùng, không thì giữ ảnh cũ)
        let finalImageUrl = old_image;
        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            finalImageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}`;
        }

        // BƯỚC 3: Tạo sản phẩm mới (Với giá mới và thông tin mới)
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                id: String(id),
                name: String(name),
                price: Number(price), // Giá mới (có thể giống hoặc khác giá cũ)
                quantity: Number(quantity) || 0,
                url_image: String(finalImageUrl)
            }
        }));

        res.json({ message: "Cập nhật thành công!" });

    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        res.status(500).json({ error: error.message });
    }
});