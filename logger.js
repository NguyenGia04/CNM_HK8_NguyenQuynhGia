// FILE: logger.js

// [Lab 1] Create custom module
// [Lab 2] Use fs module
// [Lab 3] Use EventEmitter

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { format } = require('date-fns'); 
const { v4: uuidv4 } = require('uuid'); 

class StudentLogger extends EventEmitter {
    
    // Hàm ghi log hoạt động
    logActivity(studentName, action) {
        // Tạo dữ liệu log
        const id = uuidv4();
        const dateTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const logItem = `[${dateTime}] ID:${id} - Student: ${studentName} - Action: ${action}\n`;

        // [Lab 3] Emit event: Bắn sự kiện để thông báo có hành động mới
        this.emit('actionLogged', { id, studentName, action, time: dateTime });

        // [Lab 2] Write file asynchronously: Ghi vào file log
        // Kiểm tra xem thư mục logs có tồn tại không, nếu không thì tạo
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)){
            fs.mkdirSync(logDir);
        }

        const logFile = path.join(logDir, 'activity.txt');

        fs.appendFile(logFile, logItem, (err) => {
            if (err) {
                console.error('Lỗi khi ghi file:', err);
            }
            // Không log gì ở đây để giữ màn hình console sạch, chỉ log qua Event
        });
    }

    // [Lab 2] Read file asynchronously: Đọc lại lịch sử log
    showHistory() {
        const logFile = path.join(__dirname, 'logs', 'activity.txt');
        
        console.log('\n--- LỊCH SỬ HOẠT ĐỘNG (Đọc từ file) ---');
        
        fs.readFile(logFile, 'utf8', (err, data) => {
            if (err) {
                console.error('Chưa có dữ liệu lịch sử hoặc lỗi đọc file.');
                return;
            }
            console.log(data);
            console.log('--- KẾT THÚC ---');
        });
    }
}

module.exports = StudentLogger;