# DHTS Hospital – Hệ thống quản lý khám bệnh 

## Giới thiệu

DHTS Hospital là hệ thống quản lý khám bệnh trực tuyến được xây dựng theo mô hình Client – Server, hỗ trợ bệnh nhân tra cứu hồ sơ khám chữa bệnh và hỗ trợ nhân viên y tế quản lý thông tin hồ sơ, lịch làm việc và tài khoản.

Dự án được phát triển phục vụ học phần Phát triển Dự án Công nghệ Phần mềm theo phương pháp Agile/Scrum, đảm bảo đầy đủ quy trình từ phân tích, thiết kế, phát triển, kiểm thử đến triển khai.

## Tính năng chính

- Dành cho bệnh nhân
  + Xem các thông tin dịch vụ, bài viết, các bác sĩ,...
  + Đặt lịch khám online.
  + Tra cứu hồ sơ bệnh án bằng số điện thoại.
  + Xem các lần khám, lịch khám, hồ sơ.
  + Nhận hỗ trợ qua chatbot.
- Dành cho nhân viên (bác sĩ/lễ tân)
  + Cung cấp giao diện cho Bác sĩ xem lịch khám theo ngày và danh sách các bệnh nhân đang chờ.
  + Cho phép Lễ tân check-in, tạo mới hồ sơ bệnh nhân trên hệ thống.
  + Cho phép Bác sĩ xem hồ sơ bệnh án và lịch sử khám của bệnh nhân.
  + Cho phép Bác sĩ cập nhật hồ sơ bệnh án sau khi khám, bao gồm ghi chú chẩn đoán và kê đơn thuốc.
  + Cho phép Bác sĩ xác nhận hoàn thành một lượt khám.
- Dành cho quản lý
  + Xem danh sách nhân viên
  + Cập nhật và quản lý thông tin nhân viên
  + Khóa / mở khóa tài khoản nhân viên
  + Phân công lịch làm việc
  + Theo dõi trạng thái tài khoản và hoạt động
- Phía hệ thống
  + API theo chuẩn RESTful
  + Quản lý DB bằng MySQL
  + Phân quyền người dùng theo role
  + Bảo mật cơ bản + xác thực
  
 ## Công nghệ sử dụng

- Back-end
  + Node.js
  + Express.js
  + MySQL
  + Sequelize / MySQL2
  + JWT Authentication 
  + RESTful API
- Front-end
  + HTML / CSS / JavaScript
  + Bootstrap
  + AJAX / Fetch API

 ## Cấu trúc thư mục
``` 
├── DHST Hospital (Thư mục gốc của Dự án)
│
├── backend/

│   ├── config/
│   ├── node_modules/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── .env
│   ├── server.js
│   ├── vietnam-font.ttf
│   ├── temp_uploads/
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── frontend/
│   ├── pages/
│      ├── giaodienbenhnhan/
│      └── nhanvien/
│          ├── Bacsi/
│          ├── letan/
│          ├──  quanly/
│          ├── change-password.html
│          └── login.html
├── node_modules/
├── package.json
├── package-lock.json
├── README.md
├── schema12.sql
├── package.json 
└── package-lock.json 
```
## Nhóm phát triển - thành viên

Nhóm 9:  
- Chu Bá Tâm
- Cao Thu Huệ
- Đỗ Thị Hồng Duyên
- Nguyễn Quang Sáng
- Nguyễn Văn Dương

