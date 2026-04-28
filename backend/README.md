# Backend

## Chạy nhanh

Từ thư mục `backend`, cài dependency rồi chạy server:

```bash
npm install
npm start
```

## Cấu hình `.env`

File mẫu nằm tại `backend/.env.example`. Hãy copy thành `backend/.env` rồi điền giá trị thật.

Ví dụ:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=123456
DB_NAME=hospital_db

GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_api_key

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

JWT_SECRET=your_secret
```

## Lưu ý

Hãy import `schema12.sql` vào MySQL trước khi chạy lần đầu để tạo database `hospital_db`.
