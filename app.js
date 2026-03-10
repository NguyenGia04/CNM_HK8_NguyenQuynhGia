const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
// 1. IMPORT THƯ VIỆN MỚI
const session = require('express-session');
const flash = require('connect-flash');

const productRoutes = require('./routes/productRoutes');

// Cấu hình View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CẤU HÌNH SESSION VÀ FLASH (Bắt buộc phải để trước phần Routes)
app.use(session({
    secret: 'lab5-secret-key', // Chuỗi bảo mật tùy ý
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // Thời gian sống của thông báo (1 phút)
}));
app.use(flash());

// 3. MIDDLEWARE TRUYỀN THÔNG BÁO RA GIAO DIỆN
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});

// Sử dụng Routes
app.use('/', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));