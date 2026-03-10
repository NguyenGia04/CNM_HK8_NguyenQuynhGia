const { dynamoDB, tableName } = require('../config/aws');


// Hàm hỗ trợ: Loại bỏ dấu tiếng Việt để tìm kiếm "gần đúng" hơn
const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

const ProductModel = {
    // 1. Lấy toàn bộ danh sách (Scan)
    getAllProducts: async() => {
        try {
            const params = { TableName: tableName };
            const data = await dynamoDB.scan(params).promise();
            return data.Items;
        } catch (error) { throw error; }
    },

    // 2. Tìm kiếm sản phẩm theo tên (Scan + Filter) [cite: 65, 66]
    searchProducts: async (keyword) => {
        try {
            // Bước 1: Lấy toàn bộ dữ liệu
            const params = { TableName: tableName };
            const data = await dynamoDB.scan(params).promise();
            const allProducts = data.Items;

            // Bước 2: Chuẩn hóa từ khóa (Chữ thường + Bỏ dấu + Xóa khoảng trắng 2 đầu)
            const normalizedKeyword = removeVietnameseTones(keyword).toLowerCase().trim();

            // Bước 3: Lọc dữ liệu bằng JavaScript
            const filteredProducts = allProducts.filter(product => {
                // Chuẩn hóa tên sản phẩm trong DB
                const normalizedProductName = removeVietnameseTones(product.name).toLowerCase();
                
                // Kiểm tra xem tên sản phẩm có chứa từ khóa không (includes)
                return normalizedProductName.includes(normalizedKeyword);
            });

            return filteredProducts;
        } catch (error) { throw error; }
    },

    // 3. Lấy chi tiết 1 sản phẩm (Get)
    getProductById: async(id) => {
        const params = {
            TableName: tableName,
            Key: { 'id': id }
        };
        try {
            const data = await dynamoDB.get(params).promise();
            return data.Item;
        } catch (error) { throw error; }
    },

    // 4. Thêm/Cập nhật sản phẩm (Put) - DynamoDB dùng Put để đè (Update) luôn
    saveProduct: async(product) => {
        const params = {
            TableName: tableName,
            Item: product
        };
        try {
            await dynamoDB.put(params).promise();
            return product;
        } catch (error) { throw error; }
    },

    // 5. Xóa sản phẩm (Delete)
    deleteProduct: async(id) => {
        const params = {
            TableName: tableName,
            Key: { 'id': id }
        };
        try {
            await dynamoDB.delete(params).promise();
        } catch (error) { throw error; }
    }
};

module.exports = ProductModel;