# Meow Brawlers Web

Bản frontend game web local dùng Canvas 2D và TypeScript. Ảnh rời trong `assets/` được ghép khi hiển thị; ảnh gốc giữ nguyên. Core được sao chép từ workspace `gamecatweb-4/src/core` để dự án có thể chạy độc lập.

## Chạy trên máy

```powershell
npm.cmd install
npm.cmd run dev
```

Mở địa chỉ Local do Vite in ra. Cổng mặc định là 5173; nếu đã dùng, Vite chọn cổng kế tiếp.

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Build được ghi vào `dist/`. Phục vụ qua HTTP, không mở `index.html` bằng giao thức file.

## Đã nối với core

- Đấu trường PVE 3v3, lưới logic 8×8 hiển thị isometric, ô đi hợp lệ, mục tiêu tấn công, lượt địch tự động.
- Trại mèo, xem chỉ số/gen, chọn mèo thay vào một trong ba vị trí đội hình.
- Gacha 100 Catnip, lai hai mèo 150 Catnip, nhận thưởng cuối trận và nhật ký trận.
- Lưu tiến trình qua GameStore với key `meow-brawlers:web:v1`; trận đang đấu không lưu khi tải lại.
- Layout thích ứng cho desktop và điện thoại; có hướng dẫn và nút toàn màn hình.

## Phạm vi bản đầu

Đây là game chạy local trong browser, chưa triển khai lên hosting. Dùng Canvas 2D thay vì Phaser cho bản ghép ảnh đầu tiên. Chưa có Telegram SDK, PvP server, hành trình roguelike hoặc animation sprite theo frame. Đối thủ dùng mèo mirror và chiến thuật đơn giản. Bộ ảnh tạm chỉ có một thân và một mũ nên nhiều ID gen dùng chung hình; mũ thể hiện cho accessory variant 2, không thay đổi nội tại trong core.

Ảnh PNG gốc có nền trắng: renderer tách vùng gần trắng nối với mép ảnh và cắt lề trong bộ nhớ. Màu trắng khép kín trong mắt/lông được giữ lại. Đây là cách dựng thử; cần xuất asset trong suốt và nén ở bước sản xuất để cải thiện viền và tốc độ tải. Tổng ảnh gốc khoảng 31 MB, chưa đạt ngân sách tải đầu 2,5 MB trong GDD. Font Google có fallback hệ thống nếu offline.

Đã kiểm tra TypeScript/build và thao tác trình duyệt: bắt đầu trận, di chuyển, lượt bot, gacha (300→200 Catnip, 3→4 mèo), breeding (200→50 Catnip, 4→5 mèo), kết thúc trận thua sau khi chủ động bỏ lượt (142 lượt), nhận thưởng (50→75 Catnip), khóa nút nhận lại, ghi nhật ký và bắt đầu trận mới. Tiến trình mèo/Catnip giữ sau tải lại. Kiểm tra bố cục điện thoại 390×844 không tràn ngang; chưa thử trên thiết bị cảm ứng thật. Console không ghi nhận lỗi runtime tại thời điểm kiểm tra. Nhánh chiến thắng và mọi tổ hợp chiến thuật chưa được kiểm hết qua UI.
