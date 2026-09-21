# Library Survey PWA

Ứng dụng khảo sát offline-first, có đăng nhập Google, chụp ảnh native bằng Capacitor, lưu ảnh vào điện thoại và đồng bộ dữ liệu/ảnh lên Google Sheets + Google Drive.

## Cấu hình Google

1. Tạo OAuth 2.0 Web Client ID trong Google Cloud Console.
2. Thêm domain triển khai (ví dụ Cloudflare Pages) vào **Authorized JavaScript origins**.
3. Dán Client ID vào `config.js` thay cho `YOUR_GOOGLE_OAUTH_CLIENT_ID...`.
4. Deploy lại PWA qua HTTPS. Google Identity Services không hoạt động đầy đủ trên `file://`.

Đăng nhập Google ở đây dùng Google Identity Services. Thông tin tên/email được gắn vào mỗi bản ghi khảo sát và ghi vào các cột `userId`, `userEmail`, `userName` trong Sheet.

## Google Apps Script

Trong Apps Script, cập nhật cả `Code.gs` và deploy lại Web App với:

- **Execute as:** Me
- **Who has access:** Anyone

Script tự tạo hoặc migrate ba cột tài khoản trong sheet hiện có, upload ảnh base64 vào thư mục Drive `Library Survey Photos`, sau đó ghi URL ảnh vào Sheet.

## Capacitor

```bash
npm install
npm run cap:add:ios
npm run cap:sync -- ios
```

Project iOS đã được tạo trong thư mục `ios/`. Mở bằng Xcode trên macOS:

```bash
npm run cap:ios
```

Camera native gọi `@capacitor/camera` với `saveToGallery: true`; trên trình duyệt, ứng dụng tự fallback về `getUserMedia` và nút tải ảnh xuống. Các package network, geolocation và local notifications cũng đã được đăng ký trong `native-plugins.js` để sẵn sàng mở rộng native.

## Đưa lên App Store

Trên máy Mac cần cài Xcode, CocoaPods và đăng nhập Apple Developer:

1. Chạy `npm run cap:sync -- ios`.
2. Mở project bằng `npm run cap:ios`.
3. Chọn Team, Bundle Identifier `vn.edu.librarysurvey.app`, signing certificate và provisioning profile.
4. Test camera, quyền ảnh, GPS, offline sync trên iPhone thật.
5. Chọn **Product > Archive**, validate rồi upload lên App Store Connect.
6. Điền privacy details, screenshots, app icon và submit TestFlight/App Review.

App Store không thể được archive hoặc submit trực tiếp từ Windows; phần đó bắt buộc thực hiện trên macOS/Xcode.
>>>>>>> Stashed changes
