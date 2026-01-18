
const express = require('express');
const path = require('path');
const fs = require('fs');
const StudentLogger = require('./logger');

const app = express();
const port = 3000;
const logger = new StudentLogger();

app.use(express.json());
app.use(express.static('public'));

// --- API XỬ LÝ ---

app.post('/api/log', (req, res) => {
    const { name, action } = req.body;
    
    if (!name || !action) {
        return res.status(400).json({ error: 'Thiếu tên hoặc hành động' });
    }

    logger.logActivity(name, action);
    
    res.json({ success: true, message: 'Đã ghi nhận thành công' });
});

// API 2: Lấy lịch sử log để hiển thị (GET)
app.get('/api/history', (req, res) => {
    const logFile = path.join(__dirname, 'logs', 'activity.txt');
    
    fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
            return res.json({ logs: [] }); 
        }
        const logLines = data.split('\n').filter(line => line.trim() !== '');
        res.json({ logs: logLines.reverse() }); 
    });
});

logger.on('actionLogged', (arg) => {
    console.log(`[SERVER LOG] New Action: ${arg.studentName} -> ${arg.action}`);
});

app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});