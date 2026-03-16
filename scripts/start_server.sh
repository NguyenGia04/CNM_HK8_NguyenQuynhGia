#!/bin/bash
cd /home/ubuntu/CNM_HK8_NguyenQuynhGia
# Khởi động lại ứng dụng bằng PM2
pm2 restart showroom || pm2 start app.js --name "showroom"