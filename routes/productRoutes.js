const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../middleware/upload'); // Middleware Multer

// --- READ & SEARCH ---
// Trang chủ (hiển thị danh sách + kết quả tìm kiếm)
router.get('/', productController.getAllProducts);

// --- CREATE ---
// Hiển thị form thêm
router.get('/add', productController.getAddProductPage);
// Xử lý thêm (có upload ảnh)
router.post('/add', upload.single('image'), productController.createProduct);

// --- UPDATE ---
// Hiển thị form sửa (cần ID trên URL để biết sửa ai)
router.get('/edit/:id', productController.getEditProductPage);
// Xử lý sửa (Form gửi POST về /edit, có upload ảnh)
// Lưu ý: Route này khớp với action="/edit" trong file edit.ejs
router.post('/edit', upload.single('image'), productController.updateProduct);

// --- DELETE ---
// Xử lý xóa
router.post('/delete/:id', productController.deleteProduct);

module.exports = router;