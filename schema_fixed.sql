SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- Tạo bảng nền tảng trước (không có dependencies)
CREATE TABLE IF NOT EXISTS `taikhoan` (
  `id_taikhoan` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('BACSI','LETAN','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  PRIMARY KEY (`id_taikhoan`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `khoa` (
  `id_khoa` int NOT NULL AUTO_INCREMENT,
  `ten_khoa` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_khoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `benhnhan` (
  `id_benhnhan` int NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gioi_tinh` enum('Nam','Nu','Khac') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_bhyt` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_benhnhan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sau đó tạo các bảng phụ thuộc
CREATE TABLE IF NOT EXISTS `bacsi` (
  `id_bacsi` int NOT NULL AUTO_INCREMENT,
  `id_taikhoan` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hoc_vi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chuyen_mon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_khoa` int DEFAULT NULL,
  `nam_kinh_nghiem` int DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_bacsi`),
  KEY `id_taikhoan` (`id_taikhoan`),
  KEY `id_khoa` (`id_khoa`),
  CONSTRAINT `bacsi_ibfk_1` FOREIGN KEY (`id_taikhoan`) REFERENCES `taikhoan` (`id_taikhoan`) ON DELETE CASCADE,
  CONSTRAINT `bacsi_ibfk_2` FOREIGN KEY (`id_khoa`) REFERENCES `khoa` (`id_khoa`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `letan` (
  `id_letan` int NOT NULL AUTO_INCREMENT,
  `id_taikhoan` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_letan`),
  KEY `id_taikhoan` (`id_taikhoan`),
  CONSTRAINT `letan_ibfk_1` FOREIGN KEY (`id_taikhoan`) REFERENCES `taikhoan` (`id_taikhoan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `datlich` (
  `id_datlich` int NOT NULL AUTO_INCREMENT,
  `id_benhnhan` int NOT NULL,
  `id_khoa` int NOT NULL,
  `id_bacsi` int DEFAULT NULL,
  `ngay_dat` date NOT NULL,
  `gio_dat` time NOT NULL,
  `trang_thai` enum('Cho xac nhan','Da xac nhan','Huy') COLLATE utf8mb4_unicode_ci DEFAULT 'Cho xac nhan',
  PRIMARY KEY (`id_datlich`),
  KEY `id_benhnhan` (`id_benhnhan`),
  KEY `id_khoa` (`id_khoa`),
  KEY `id_bacsi` (`id_bacsi`),
  CONSTRAINT `datlich_ibfk_1` FOREIGN KEY (`id_benhnhan`) REFERENCES `benhnhan` (`id_benhnhan`),
  CONSTRAINT `datlich_ibfk_2` FOREIGN KEY (`id_khoa`) REFERENCES `khoa` (`id_khoa`),
  CONSTRAINT `datlich_ibfk_3` FOREIGN KEY (`id_bacsi`) REFERENCES `bacsi` (`id_bacsi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `news` (
  `id_news` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_news`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
