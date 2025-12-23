DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- =========================================================
-- 1️⃣ BẢNG KHOA
-- =========================================================
CREATE TABLE khoa (
    id_khoa VARCHAR(10) PRIMARY KEY,
    ten_khoa VARCHAR(100) NOT NULL,
    mo_ta TEXT
);

-- =========================================================
-- 2️⃣ BẢNG TÀI KHOẢN
-- =========================================================
CREATE TABLE taikhoan (
    id_taikhoan VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('BACSI','LETAN','ADMIN') NOT NULL,
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
);

-- =========================================================
-- 3️⃣ BẢNG BÁC SĨ
-- =========================================================
CREATE TABLE bacsi (
    id_bacsi VARCHAR(10) PRIMARY KEY,
    id_taikhoan VARCHAR(10),
    ho_ten VARCHAR(100),
    hinh_anh LONGBLOB,
    hoc_vi VARCHAR(50),
    chuc_vu VARCHAR(100),
    chuyen_mon VARCHAR(100),
    qua_trinh_dao_tao TEXT,
    qua_trinh_cong_tac TEXT,
    the_manh_kinh_nghiem TEXT,
    id_khoa VARCHAR(10),
    nam_kinh_nghiem INT,
    phone VARCHAR(20),
    email VARCHAR(100),
    diachi VARCHAR(100),
    so_luot_kham INT DEFAULT 0,
    FOREIGN KEY (id_taikhoan) REFERENCES taikhoan(id_taikhoan),
    FOREIGN KEY (id_khoa) REFERENCES khoa(id_khoa)
);

-- =========================================================
-- 4️⃣ BẢNG LỄ TÂN
-- =========================================================
CREATE TABLE letan (
    id_letan VARCHAR(10) PRIMARY KEY,
    id_taikhoan VARCHAR(10),
    ho_ten VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    diachi VARCHAR(100),
    FOREIGN KEY (id_taikhoan) REFERENCES taikhoan(id_taikhoan)
);

-- =========================================================
-- 5️⃣ BẢNG BỆNH NHÂN
-- =========================================================
CREATE TABLE benhnhan (
    id_benhnhan VARCHAR(10) PRIMARY KEY,
    ho_ten VARCHAR(100),
    phone VARCHAR(15),
    email VARCHAR(100),
    gioi_tinh ENUM('Nam','Nu','Khac'),
    ngay_sinh DATE,
    dia_chi VARCHAR(255),
    so_bhyt VARCHAR(50)
);

-- =========================================================
-- 6️⃣ BẢNG LỊCH LÀM VIỆC
-- =========================================================
CREATE TABLE lichlamviec (
    id_lichlamviec INT AUTO_INCREMENT PRIMARY KEY,
    id_khoa VARCHAR(10),
    ngay DATE,
    ca ENUM('Sang','Chieu'),
    so_benhnhan_toi_da INT DEFAULT 10,
    last_assigned_bacsi_id VARCHAR(10) NULL, -- Đã thêm cột này vào đây luôn
    FOREIGN KEY (id_khoa) REFERENCES khoa(id_khoa),
    FOREIGN KEY (last_assigned_bacsi_id) REFERENCES bacsi(id_bacsi)
);

-- =========================================================
-- 7️⃣ LIÊN KẾT LỊCH LÀM VIỆC - BÁC SĨ
-- =========================================================
CREATE TABLE lichlamviec_bacsi (
    id_lichlamviec INT,
    id_bacsi VARCHAR(10),
    PRIMARY KEY (id_lichlamviec, id_bacsi),
    FOREIGN KEY (id_lichlamviec) REFERENCES lichlamviec(id_lichlamviec),
    FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi)
);

-- =========================================================
-- 8️⃣ BẢNG ĐẶT LỊCH ONLINE (Đã gộp id_benhnhan vào)
-- =========================================================
CREATE TABLE dat_lich (
    id_datlich INT AUTO_INCREMENT PRIMARY KEY,
    ten_benhnhan VARCHAR(255),
    sdt VARCHAR(20),
    email VARCHAR(255),
    id_benhnhan VARCHAR(10) NULL, -- Đã thêm vào đây
    ngay DATE,
    khung_gio VARCHAR(50),
    id_khoa VARCHAR(10),
    ly_do TEXT,
    id_bacsi VARCHAR(10),
    trang_thai ENUM('CHO_XAC_NHAN','DA_TAO_HOSO','HOAN_THANH') DEFAULT 'CHO_XAC_NHAN',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_khoa) REFERENCES khoa(id_khoa),
    FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi),
    FOREIGN KEY (id_benhnhan) REFERENCES benhnhan(id_benhnhan)
);

-- =========================================================
-- 9️⃣ BẢNG ĐẶT LỊCH TẠI LỄ TÂN (Đã cập nhật ENUM chuẩn)
-- =========================================================
CREATE TABLE dat_lich_letan (
    id_datlich INT AUTO_INCREMENT PRIMARY KEY,
    id_letan VARCHAR(10),
    id_benhnhan VARCHAR(10),
    id_khoa VARCHAR(10),
    ngay DATE,
    gio_hen VARCHAR(20),
    ca_kham ENUM('Sang','Chieu'),
    id_bacsi VARCHAR(10),
    id_hoso INT,
    nguon_dat VARCHAR(50) DEFAULT 'LeTan',
    ly_do TEXT,
    -- Đã cập nhật list trạng thái đầy đủ nhất tại đây
    trang_thai ENUM('CHO_XAC_NHAN', 'DA_CHECKIN', 'DANG_KHAM', 'HOAN_THANH', 'DA_HUY', 'DA_TAO_HOSO') DEFAULT 'CHO_XAC_NHAN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_letan) REFERENCES letan(id_letan),
    FOREIGN KEY (id_benhnhan) REFERENCES benhnhan(id_benhnhan),
    FOREIGN KEY (id_khoa) REFERENCES khoa(id_khoa),
    FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi)
);

-- =========================================================
-- 🔟 BẢNG HỒ SƠ KHÁM
-- =========================================================
CREATE TABLE ho_so_kham (
    id_hoso INT AUTO_INCREMENT PRIMARY KEY,
    id_datlich INT,
    id_benhnhan VARCHAR(10),
    id_bacsi VARCHAR(10),
    trieu_chung TEXT,
    chuan_doan TEXT,
    ghi_chu TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('CHO_KHAM', 'DANG_KHAM', 'DA_KHAM') DEFAULT 'CHO_KHAM',
    FOREIGN KEY (id_datlich) REFERENCES dat_lich_letan(id_datlich), 
    FOREIGN KEY (id_benhnhan) REFERENCES benhnhan(id_benhnhan),
    FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi)
);

-- =========================================================
-- 1️⃣1️⃣ BẢNG TOA THUỐC
-- =========================================================
CREATE TABLE toa_thuoc (
  id_toa INT AUTO_INCREMENT PRIMARY KEY,
  id_hoso INT,
  id_benhnhan VARCHAR(10),
  id_bacsi VARCHAR(10),
  ngay_ke DATE DEFAULT (CURRENT_DATE),
  ghi_chu TEXT,
  FOREIGN KEY (id_hoso) REFERENCES ho_so_kham(id_hoso),
  FOREIGN KEY (id_benhnhan) REFERENCES benhnhan(id_benhnhan),
  FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi)
);

-- =========================================================
-- 1️⃣2️⃣ BẢNG CHI TIẾT THUỐC
-- =========================================================
CREATE TABLE chi_tiet_thuoc (
    id_ct INT AUTO_INCREMENT PRIMARY KEY,
    id_toa INT,
    ten_thuoc VARCHAR(100),
    lieu_luong VARCHAR(100),
    so_ngay INT,
    cach_dung VARCHAR(255),
    FOREIGN KEY (id_toa) REFERENCES toa_thuoc(id_toa)
);

-- =========================================================
-- 1️⃣3️⃣ BẢNG THỐNG KÊ
-- =========================================================
CREATE TABLE thong_ke (
    id_thongke INT AUTO_INCREMENT PRIMARY KEY,
    id_bacsi VARCHAR(10),
    thang INT,
    nam INT,
    so_benhnhan INT,
    so_donthuoc INT,
    ty_le_taikham DECIMAL(5,2),
    FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi)
);

-- =========================================================
-- 1️⃣4️⃣ BẢNG TIN TỨC (Đã sửa image thành LONGBLOB)
-- =========================================================
CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    slug VARCHAR(255),
    summary TEXT,
    content LONGTEXT,
    image LONGBLOB, -- Đã sửa ngay tại đây
    author VARCHAR(100),
    category VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('draft','published') DEFAULT 'draft'
);

-- =========================================================
-- 1️⃣5️⃣ BẢNG LỊCH SỬ CHAT
-- =========================================================
CREATE TABLE chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_message TEXT,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 1️⃣6️⃣ BẢNG OTP PHONE
-- =========================================================
CREATE TABLE otp_phone (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expired_at DATETIME,
    is_used TINYINT(1) DEFAULT 0
);

-- =========================================================
-- 1️⃣7️⃣ PHÂN LỊCH BÁC SĨ
-- =========================================================
CREATE TABLE doctor_assignment_log (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_bacsi VARCHAR(10),
    id_khoa VARCHAR(10),
    ngay DATE,
    ca_kham ENUM('Sang','Chieu'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_bacsi) REFERENCES bacsi(id_bacsi),
    FOREIGN KEY (id_khoa) REFERENCES khoa(id_khoa)
);

-- =========================================================
-- 1️⃣8️⃣ VÒNG LUÂN PHIÊN
-- =========================================================
CREATE TABLE round_robin_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_khoa VARCHAR(10),
    last_assigned_doctor VARCHAR(10),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_khoa) REFERENCES khoa(id_khoa)
);

-- =========================================================
-- 1️⃣9️⃣ PHIÊN GIAO DỊCH LỄ TÂN
-- =========================================================
CREATE TABLE reception_sessions (
    id_session INT AUTO_INCREMENT PRIMARY KEY,
    id_letan VARCHAR(10),
    id_datlich INT,
    loai_giao_dich ENUM('TAO_HOSO','CHECKIN','CAPNHAT_HOSO','DATLICH_MOI'),
    ngay_thuc_hien DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_letan) REFERENCES letan(id_letan),
    FOREIGN KEY (id_datlich) REFERENCES dat_lich_letan(id_datlich)
);

-- =========================================================
-- 2️⃣0️⃣ VIEW TỔNG HỢP LỄ TÂN
-- =========================================================
CREATE OR REPLACE VIEW v_reception_overview AS
SELECT 
    dl.id_datlich AS ma_dat_lich,
    bn.ho_ten AS ten_benhnhan,
    bn.phone AS so_dien_thoai,
    kh.ten_khoa,
    bs.ho_ten AS bac_si,
    dl.ngay,
    dl.ca_kham,
    dl.ly_do,
    dl.trang_thai,
    rs.loai_giao_dich,
    rs.ngay_thuc_hien
FROM dat_lich_letan dl
LEFT JOIN benhnhan bn ON dl.id_benhnhan = bn.id_benhnhan
LEFT JOIN bacsi bs ON dl.id_bacsi = bs.id_bacsi
LEFT JOIN khoa kh ON dl.id_khoa = kh.id_khoa
LEFT JOIN reception_sessions rs ON dl.id_datlich = rs.id_datlich;

-- =========================================================
-- 2️⃣1️⃣ DỮ LIỆU MẪU (KHOA & ADMIN)
-- =========================================================
INSERT INTO khoa VALUES
('K01','Khoa Nội Tổng Hợp','Khám và điều trị nội tổng quát'),
('K02','Khoa Ngoại Tổng Hợp','Phẫu thuật tổng quát'),
('K03','Khoa Tai Mũi Họng','Điều trị tai mũi họng'),
('K04','Khoa Răng Hàm Mặt','Khám răng miệng'),
('K05','Khoa Mắt','Điều trị mắt'),
('K06','Khoa Da Liễu','Da liễu & thẩm mỹ da'),
('K07','Khoa Tim Mạch','Điều trị tim mạch'),
('K08','Khoa Thần Kinh','Điều trị thần kinh'),
('K09','Khoa Xét Nghiệm','Xét nghiệm sinh hóa'),
('K10','Khoa CĐ Hình Ảnh','Chẩn đoán hình ảnh');

INSERT INTO taikhoan (id_taikhoan, username, password, role, status)
VALUES
('AD', 'administrator', '$2b$10$inptPnYVKVBrIr76ikFAk.TqvikV6MrhPXxf2lDHDKgC1fqHEhVh6', 'ADMIN', 'ACTIVE');