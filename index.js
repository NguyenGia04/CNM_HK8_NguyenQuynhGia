// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 1. IMPORT CÁC THƯ VIỆN AWS SDK CẦN THIẾT
const { 
    DynamoDBClient, 
    CreateTableCommand, 
    ListTablesCommand 
} = require("@aws-sdk/client-dynamodb");

const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    ScanCommand, 
    DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");

// 2. CẤU HÌNH KẾT NỐI LOCALSTACK (Theo code bạn gửi)
const client = new DynamoDBClient({
    region: "us-east-1",
    endpoint: "http://localhost:4566", // Trỏ về LocalStack trên máy
    credentials: {
        accessKeyId: "test",      
        secretAccessKey: "test"   
    }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "shopdb";

// --- CẤU HÌNH SERVER EXPRESS ---
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Phục vụ file giao diện

// --- HÀM TỰ ĐỘNG TẠO BẢNG NẾU CHƯA CÓ (QUAN TRỌNG) ---
async function initDB() {
    try {
        // Kiểm tra xem bảng đã có chưa
        const listTables = await client.send(new ListTablesCommand({}));
        if (!listTables.TableNames.includes(TABLE_NAME)) {
            console.log(`⚠️ Bảng '${TABLE_NAME}' chưa tồn tại trong LocalStack. Đang tạo mới...`);
            
            const createCommand = new CreateTableCommand({
                TableName: TABLE_NAME,
                KeySchema: [
                    { AttributeName: "productId", KeyType: "HASH" },  // Khóa chính
                    { AttributeName: "stt", KeyType: "RANGE" }        // Khóa phụ
                ],
                AttributeDefinitions: [
                    { AttributeName: "productId", AttributeType: "N" }, // Number
                    { AttributeName: "stt", AttributeType: "S" }        // String
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            });
            
            await client.send(createCommand);
            console.log("✅ Đã tạo bảng thành công!");
        } else {
            console.log("✅ Đã tìm thấy bảng 'shopdb' trong LocalStack.");
        }
    } catch (err) {
        console.error("❌ Lỗi khởi tạo DB:", err.message);
    }
}

// --- CÁC API CHO GIAO DIỆN GỌI ---

// 1. API Lấy danh sách (Scan)
app.get('/api/products', async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: TABLE_NAME });
        const response = await docClient.send(command);
        // Sắp xếp theo ID cho đẹp
        const sortedItems = response.Items ? response.Items.sort((a, b) => a.productId - b.productId) : [];
        res.json(sortedItems);
    } catch (error) {
        console.error("Lỗi lấy danh sách:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. API Thêm sản phẩm (Put)
app.post('/api/products', async (req, res) => {
    // Nhận dữ liệu từ giao diện gửi lên
    const { productId, stt, name, price, description } = req.body;
    
    // Validate cơ bản
    if (!productId || !stt) {
        return res.status(400).json({ error: "Thiếu productId hoặc stt" });
    }

    try {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                // Ép kiểu dữ liệu cực kỳ quan trọng với DynamoDB
                productId: Number(productId), // Bắt buộc là Số
                stt: String(stt),             // Bắt buộc là Chuỗi
                name: name || "Không tên",
                price: Number(price) || 0,
                description: description || ""
            }
        });
        
        await docClient.send(command);
        console.log(`➕ Đã thêm: ${name} (ID: ${productId})`);
        res.json({ message: "Thêm thành công!" });
    } catch (error) {
        console.error("Lỗi thêm mới:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. API Xóa sản phẩm (Delete)
app.delete('/api/products/:id/:stt', async (req, res) => {
    try {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                productId: Number(req.params.id), // Phải khớp kiểu Number
                stt: String(req.params.stt)       // Phải khớp kiểu String
            }
        });
        await docClient.send(command);
        console.log(`🗑️ Đã xóa ID: ${req.params.id}`);
        res.json({ message: "Đã xóa!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// KHỞI CHẠY SERVER
app.listen(3000, async () => {
    await initDB(); // Chạy hàm tạo bảng trước khi mở cổng
    console.log('🚀 Server đang chạy tại: http://localhost:3000');
});