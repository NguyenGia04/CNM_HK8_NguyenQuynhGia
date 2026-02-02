const db = require("../config/dynamodb");
const { PutCommand, ScanCommand, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "Products";

// 1. Thêm hoặc Sửa sản phẩm (DynamoDB tự ghi đè nếu ID trùng)
exports.createProduct = async (product) => {
    const params = {
        TableName: TABLE_NAME,
        Item: product
    };
    return await db.send(new PutCommand(params));
};

// 2. Lấy tất cả sản phẩm
exports.getAllProducts = async () => {
    const params = { TableName: TABLE_NAME };
    try {
        const data = await db.send(new ScanCommand(params));
        return data.Items || [];
    } catch (error) {
        return [];
    }
};

// 3. Lấy 1 sản phẩm theo ID (để hiển thị lên form sửa)
exports.getProductById = async (id) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { product_id: id }
    };
    const data = await db.send(new GetCommand(params));
    return data.Item;
};

// 4. Xóa sản phẩm
exports.deleteProduct = async (id) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { product_id: id }
    };
    return await db.send(new DeleteCommand(params));
};