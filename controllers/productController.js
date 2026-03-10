const ProductModel = require('../models/productModel');
const { uploadToS3 } = require('../middleware/upload');

// 1. Hiển thị danh sách (Kèm Tìm kiếm + Phân trang)
exports.getAllProducts = async(req, res) => {
    try {
        const searchQuery = req.query.search;

        // 1. Lấy trang hiện tại từ URL (ví dụ: ?page=2), mặc định là 1
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Giới hạn 6 sản phẩm/trang

        let allProducts;

        // 2. Lấy dữ liệu nguồn (Tìm kiếm hoặc All)
        if (searchQuery) {
            allProducts = await ProductModel.searchProducts(searchQuery);
        } else {
            allProducts = await ProductModel.getAllProducts();
        }

        // 3. Tính toán phân trang
        const totalProducts = allProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Cắt mảng sản phẩm cho trang hiện tại
        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        // 4. Render và truyền thêm các biến phân trang
        res.render('index', {
            products: paginatedProducts,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery // Truyền lại để giữ từ khóa khi chuyển trang
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách:", error);
        res.status(500).send("Lỗi Server: " + error.message);
    }
};
// 2. Hiển thị trang Form Thêm mới
exports.getAddProductPage = (req, res) => {
    res.render('add'); // Render view add.ejs
};

// 3. Xử lý Thêm sản phẩm (POST)
exports.createProduct = async (req, res) => {
    try {
        const { id, name, price, quantity } = req.body;
        const file = req.file;

        // KIỂM TRA ĐIỀU KIỆN 
        if (!id || id.trim() === '') {
            req.flash('error', 'Không được để trống ID!'); // [cite: 87]
            return res.redirect('/add');
        }
        if (!name || name.trim() === '') {
            req.flash('error', 'Không được để trống tên sản phẩm!'); // [cite: 88]
            return res.redirect('/add');
        }
        if (Number(price) <= 0) {
            req.flash('error', 'Giá sản phẩm phải lớn hơn 0 (Price > 0)!'); // 
            return res.redirect('/add');
        }
        if (Number(quantity) < 0) {
            req.flash('error', 'Số lượng phải lớn hơn hoặc bằng 0 (Quantity >= 0)!'); // 
            return res.redirect('/add');
        }
        if (!file) {
            req.flash('error', 'Vui lòng chọn file ảnh hợp lệ để upload!'); // 
            return res.redirect('/add');
        }

        const imageUrl = await uploadToS3(file);

        const newProduct = {
            id: id,
            name: name,
            price: Number(price),
            quantity: Number(quantity),
            image: imageUrl
        };

        await ProductModel.saveProduct(newProduct);
        
        // THÔNG BÁO THÀNH CÔNG VÀ CHUYỂN VỀ TRANG CHỦ
        req.flash('success', 'Đã thêm sản phẩm mới thành công!');
        res.redirect('/');
    } catch (error) {
        console.error("Lỗi thêm:", error);
        req.flash('error', 'Lỗi hệ thống khi thêm sản phẩm: ' + error.message);
        res.redirect('/add');
    }
};

// 4. Hiển thị trang Form Sửa (GET)
exports.getEditProductPage = async(req, res) => {
    try {
        const id = req.params.id;
        const product = await ProductModel.getProductById(id);

        if (!product) {
            return res.status(404).send("Không tìm thấy sản phẩm!");
        }

        res.render('edit', { product: product }); // Truyền data cũ vào form
    } catch (error) {
        res.status(500).send("Lỗi: " + error.message);
    }
};

// 5. Xử lý Cập nhật sản phẩm (POST)
exports.updateProduct = async (req, res) => {
    try {
        const { id, name, price, quantity } = req.body;
        const file = req.file;

        // KIỂM TRA ĐIỀU KIỆN KHI SỬA
        if (!name || name.trim() === '') {
            req.flash('error', 'Không được để trống tên sản phẩm!');
            return res.redirect('/edit/' + id);
        }
        if (Number(price) <= 0) {
            req.flash('error', 'Giá sản phẩm phải lớn hơn 0!');
            return res.redirect('/edit/' + id);
        }
        if (Number(quantity) < 0) {
            req.flash('error', 'Số lượng không được âm!');
            return res.redirect('/edit/' + id);
        }

        const oldProduct = await ProductModel.getProductById(id);
        if (!oldProduct) {
            req.flash('error', 'Sản phẩm không tồn tại!');
            return res.redirect('/');
        }

        let imageUrl = oldProduct.image;
        if (file) {
            imageUrl = await uploadToS3(file); // File ảnh đã được validate ở frontend (accept="image/*") và backend multer
        }

        const updatedProduct = {
            id: id,
            name: name,
            price: Number(price),
            quantity: Number(quantity),
            image: imageUrl
        };

        await ProductModel.saveProduct(updatedProduct);
        
        // THÔNG BÁO THÀNH CÔNG
        req.flash('success', 'Đã cập nhật thông tin sản phẩm thành công!');
        res.redirect('/');

    } catch (error) {
        req.flash('error', 'Lỗi hệ thống khi cập nhật: ' + error.message);
        res.redirect('/edit/' + req.body.id);
    }
};
// 6. Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        await ProductModel.deleteProduct(id);
        
        req.flash('success', 'Đã xóa sản phẩm thành công!');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Không thể xóa sản phẩm: ' + error.message);
        res.redirect('/');
    }
};