
// [Lab 1] Import custom module
const StudentLogger = require('./logger');

const logger = new StudentLogger();

// [Lab 3] Event Listener: Lắng nghe sự kiện khi có hành động
logger.on('actionLogged', (arg) => {
    console.log(`NEW EVENT: Sinh viên ${arg.studentName} vừa thực hiện: ${arg.action}`);
});

console.log('--- HỆ THỐNG BẮT ĐẦU CHẠY ---\n');

// --- THỰC HIỆN CÁC TÁC VỤ (TASKS) ---

// 1. Giả lập các hành động (Ghi file + Bắn event)
logger.logActivity('Nguyen Quynh Gia', 'Đăng nhập hệ thống');

setTimeout(() => {
    logger.logActivity('Tran Van B', 'Nộp bài Lab 1');
}, 1000);

setTimeout(() => {
    logger.logActivity('Nguyen Quynh Gia', 'Debug lỗi Node.js');
}, 2000);

setTimeout(() => {
    logger.logActivity('Le Thi C', 'Đăng xuất');
}, 3000);


// 2. Đọc lại file log sau khi các tác vụ trên hoàn tất (Lab 2 requirement)
setTimeout(() => {
    logger.showHistory();
}, 4000);