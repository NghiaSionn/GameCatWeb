# Danh sách hình ảnh cho Meow Brawlers Tactical Mutants

Tài liệu bàn giao hình ảnh cho frontend web và Telegram Mini App. Căn cứ: GDD v2.0 và định hướng của chủ dự án: gameplay tham khảo Mewgenics, hình ảnh riêng theo phong cách mèo cute và hài hước. Các số lượng và kích thước dưới đây là đề xuất sản xuất, chưa phải thông số bắt buộc của GDD.

Mục tiêu trước mắt là đủ hình để hoàn thiện trại mèo, gacha, lai tạo, chọn đội, chiến đấu 3v3 và nhận thưởng. Những mục dành cho tính năng chưa có trong core được ghi riêng ở cuối.

## 1. Quy chuẩn chung

- Phong cách: hoạt hình 2D, mèo tròn, biểu cảm lố, đường nét rõ, màu tươi, vũ khí đời thường mang tính meme. Thiết kế nhân vật và giao diện riêng, không lấy sprite, nhân vật hoặc logo từ Mewgenics.
- Góc nhìn chiến đấu đề xuất: nhìn từ trên chéo nhẹ trên lưới vuông, cùng một góc cho toàn bộ mèo, vật cản và nền. Chốt góc này trước khi làm số lượng lớn.
- Nhân vật, vật thể, icon và hiệu ứng: nền trong suốt, không dính bóng nền hoặc chữ vào ảnh. Bóng dưới chân là asset riêng hoặc vẽ bằng code.
- Bàn giao bản gốc có lớp (PSD/Krita hoặc định dạng tương đương nếu có), PNG RGBA để tích hợp; frontend có thể chuyển WebP khi đóng gói.
- Icon hình học có thể dùng SVG. Không cần vẽ chữ, con số, thanh máu, bảng chỉ số, ô sáng hoặc nút trạng thái vào ảnh.
- Kích thước ghi trong bảng là kích thước bản xuất. Hiển thị trong game thường nhỏ hơn; phải kiểm tra độ rõ ở kích thước thực tế.
- Đặt tên bằng tiếng Anh, chữ thường, snake_case; ví dụ `body_chubby_01.png`, `weapon_slipper_01.png`.
- Không để lề trong suốt quá lớn. Tất cả lớp cùng loại dùng chung canvas và điểm neo.
- GDD đặt mục tiêu dưới 512 KB cho mỗi bộ sprite sheet và dưới 2,5 MB cho lần tải đầu. Dùng atlas theo màn hình, tải thêm khi cần; kiểm tra dung lượng sau tối ưu, không ép toàn bộ ảnh vào lần tải đầu.

## 2. Nhân vật mèo và hệ lớp gen

Mỗi mèo được ghép từ bốn nhóm: thân, mặt, vũ khí, phụ kiện. Không cần xuất mọi tổ hợp thành ảnh riêng. Với bản đầu, dùng sprite tĩnh tách lớp và chuyển động bằng code; chỉ làm hoạt ảnh từng frame khi các lớp đã ghép khớp.

### Bộ mèo cho bản đầu

| Nhóm | Danh sách đề xuất | Số lượng | Canvas mỗi ảnh | Ghi chú |
|---|---|---:|---|---|
| Thân | Mèo tròn, mèo mập, mèo gầy dài, mèo lùn chân ngắn, mèo lông xù, mèo thể thao | 6 | 512 × 512 | Thân gồm đầu không có biểu cảm, tai, chân và đuôi; dành vùng trống cho mặt |
| Mặt | Ngơ ngác, cười rơi lệ, giận phồng má, buồn ngủ, mắt long lanh, cười gian, hoảng hốt, mặt God | 8 | 512 × 512 | Mắt và miệng nằm đúng vùng mặt chung; mặt God phải nhận ra khi thu nhỏ |
| Vũ khí | Dép tổ ong, cá khô, chảo, gậy đồ chơi, súng nước, ná cá, đũa phép cá, vũ khí God | 8 | 512 × 512 | Căn đúng điểm cầm; hình phải phân biệt rõ cận chiến và tầm xa |
| Phụ kiện | Khăn cá, nơ, nồi đội đầu, kính meme, ba lô carton, giày lò xo | 6 | 512 × 512 | Là hình ngoại trang; tác dụng chiến đấu theo dữ liệu core thực tế |

Tổng bộ cơ bản: **28 ảnh lớp gen**. Đây là số biến thể hình ảnh đề xuất, cần ánh xạ với ID gen thực tế trước khi đặt tên cuối cùng. Không suy luận khả năng chiến đấu chỉ từ hình vẽ.

### Quy tắc ghép lớp bắt buộc

- Tất cả ảnh gen dùng canvas 512 × 512, điểm chân tại cùng tọa độ đề xuất `(256, 440)`.
- Thống nhất vùng đặt mặt, điểm cầm vũ khí, điểm đội mũ và vùng đeo phụ kiện bằng một file hướng dẫn có đánh dấu tọa độ.
- Thứ tự mặc định: phụ kiện phía sau → thân → mặt → vũ khí → phụ kiện phía trước → hiệu ứng. Phụ kiện cần nằm cả trước và sau phải xuất hai phần, ví dụ `_back` và `_front`; số file sẽ tăng tương ứng.
- Bộ đầu dùng một tư thế hướng phải và lật ngang bằng code khi cần. Tránh chữ trên vũ khí hoặc phụ kiện vì sẽ bị lật. Tư thế nhìn trước dùng cho thẻ là hạng mục bổ sung nếu ảnh chiến đấu thu nhỏ không đạt yêu cầu.
- Không làm thay đổi vị trí đầu, tay và chân quá mạnh giữa các thân. Nếu muốn silhouette khác hẳn, cần điểm neo riêng và frontend hỗ trợ.
- Màu lông ban đầu có thể đổi bằng tint. Chưa cần vẽ lại toàn bộ 28 ảnh theo từng màu hoặc phẩm chất.
- Phẩm chất thể hiện bằng viền và hiệu ứng UI; không cần nhân bốn toàn bộ ảnh theo Common/Rare/Epic/God.

### Hoạt ảnh

| Trạng thái | Bản đầu | Nếu làm sprite animation về sau |
|---|---|---|
| Đứng yên | Nhún thân và chớp mắt bằng code | 4 frame |
| Đi | Trượt tới ô và nhún bằng code | 6 frame |
| Tấn công | Lao nhẹ, xoay vũ khí, phát hiệu ứng | 6 frame |
| Trúng đòn | Chớp màu và giật lùi | 3 frame |
| Hạ gục | Nằm/nghiêng hoặc thu nhỏ bằng code | 4 frame |
| Chiến thắng | Nhảy và tung biểu tượng | 4 frame |

Không cần giao sprite sheet hoạt ảnh cho đợt đầu. Khi làm hoạt ảnh theo frame, mọi lớp gen phải dùng cùng timeline, kích thước frame và điểm neo; không ghép sheet chuyển động độc lập tùy ý.

## 3. Bàn cờ và môi trường chiến đấu

| Asset | Số lượng | Kích thước | Yêu cầu |
|---|---:|---|---|
| Ô đất/sàn thường | 3 biến thể | 128 × 128 | Cạnh ghép kín, không có đường lưới cố định |
| Ô nước | 1 | 128 × 128 | Có thể lặp; gợn nước làm bằng code hoặc thêm animation sau |
| Ô hố | 1 | 128 × 128 | Dễ phân biệt với nước và sàn |
| Bụi cỏ mèo | 2 | 128 × 192 | Nền trong suốt, gốc neo tại tâm ô; không che toàn bộ mèo |
| Thùng carton/xốp | 1 | 128 × 192 | Vật cản đặc, đọc rõ silhouette |
| Đá | 1 | 128 × 192 | Cùng tỷ lệ với thùng |
| Nền ngoài bàn đấu | 1 | 1920 × 1080 | Sân sau cute; vùng giữa yên, không vẽ sẵn bàn cờ |

Tổng: **11 ảnh môi trường**. Nước và hố ở bản đầu có thể dùng tile độc lập trong từng ô; chưa cần bộ autotile nối bờ. Nếu chọn hình thức bờ liền mạch, phải bổ sung bộ cạnh và góc theo hệ autotile frontend chọn.

Lưới, đường đi, vùng MOV xanh, RNG đỏ, AoE cam, ô đang chọn và tâm ngắm được vẽ bằng code theo GDD. Không cần ảnh bàn 8×8 và 10×10 riêng.

## 4. Nền các màn hình

| Asset | Số lượng | Kích thước | Yêu cầu |
|---|---:|---|---|
| Trại mèo | 1 | 1920 × 1080 | Sân nhà hoặc phòng nuôi mèo; để vùng đặt thẻ và điều khiển |
| Phòng lai tạo | 1 | 1920 × 1080 | Phòng thí nghiệm vui nhộn, hai vị trí bố mẹ và một vị trí kết quả |
| Khu mở hộp | 1 | 1920 × 1080 | Sân khấu nhỏ hoặc góc kho carton; tâm ảnh thoáng |

Tổng: **3 ảnh nền**, có thể dùng biến thể cùng một bối cảnh để tiết kiệm. Nền cần chịu được crop trên desktop và điện thoại; vật thể quan trọng đặt trong vùng trung tâm. Nếu không thể crop đẹp, bổ sung bản dọc 1080 × 1920 cho từng nền. Không nhúng nút, chữ hoặc thẻ mèo vào nền.

## 5. Vật thể gacha và lai tạo

| Asset | Số lượng | Kích thước | Yêu cầu |
|---|---:|---|---|
| Hộp mèo đóng | 1 | 512 × 512 | Carton có dấu chân mèo, dễ nhận ra |
| Hộp mèo mở | 1 | 512 × 512 | Cùng vị trí và tỷ lệ với hộp đóng |
| Máy lai hoặc nồi nấu phôi meme | 1 | 768 × 768 | Một thiết kế chung; rung, sáng và khói bằng code |
| Viên phôi/quả trứng mèo | 1 | 256 × 256 | Minh họa trạng thái đang lai, không khẳng định đây là vật phẩm đã có trong core |

Tổng: **4 ảnh**. Ánh sáng phẩm chất và hiệu ứng lộ mèo tạo bằng code, không cần bốn bộ hộp riêng.

## 6. Icon giao diện

Mỗi icon xuất SVG hoặc PNG trong suốt 128 × 128, nét đồng nhất, rõ ở 24–32 px. Màu không phải dấu hiệu phân biệt duy nhất.

| Nhóm | Icon | Số lượng |
|---|---|---:|
| Chỉ số | HP/tim, ATK, SPD, MOV/giày, RNG/hồng tâm, phòng thủ | 6 |
| Tài nguyên | Catnip | 1 |
| Điều hướng | Trại mèo, lai tạo, đội hình, chiến đấu, lịch sử, cài đặt | 6 |
| Hành động chiến đấu | Di chuyển, tấn công, chờ, kết thúc lượt | 4 |
| Điều khiển | Quay lại, đóng, xác nhận, âm thanh, nhạc, trợ giúp | 6 |

Tổng: **23 icon**. Có thể dùng một bộ icon vector đồng nhất thay vì vẽ mới; cần kiểm tra quyền sử dụng của bộ được chọn. Avatar timeline lấy từ mèo đã ghép, không cần ảnh riêng cho từng tổ hợp. Trạng thái bật/tắt âm thanh có thể dùng gạch chéo bằng code.

## 7. Hiệu ứng hình ảnh

| Asset | Số lượng | Kích thước | Cách dùng |
|---|---:|---|---|
| Vệt chém | 1 | 256 × 256 | Xoay và scale theo hướng đánh |
| Tia/đốm va chạm | 1 | 256 × 256 | Dùng chung cho đòn cơ bản |
| Đạn súng nước | 1 | 128 × 128 | Bay theo đường đạn |
| Đạn cá | 1 | 128 × 128 | Có thể dùng cho vũ khí meme tầm xa |
| Đạn phép | 1 | 128 × 128 | Đổi màu theo kỹ năng nếu cần |
| Khói bụp | 1 | 256 × 256 | Hạ gục, mở hộp hoặc biến đổi |
| Ngôi sao lấp lánh | 1 | 128 × 128 | Mutation, nhận mèo và thưởng |
| Tim nhỏ | 1 | 128 × 128 | Lai tạo và phản ứng cute |

Tổng: **8 ảnh hiệu ứng tĩnh**. Frontend tạo chuyển động, hạt, ánh sáng và fade. Chỉ chuyển sang sprite sheet khi hiệu ứng tĩnh không đủ. Số sát thương, chữ meme, thông báo thắng/thua và Catnip nhận được là text động.

## 8. Nhận diện và màn hình kết quả

| Asset | Số lượng | Kích thước | Yêu cầu |
|---|---:|---|---|
| Logo game | 1 | Rộng 1600 px hoặc SVG | Nền trong suốt; giữ bản chỉnh sửa được vì tên game có thể thay đổi |
| Icon ứng dụng | 1 | 1024 × 1024 | Mặt mèo có silhouette rõ, không chữ nhỏ |
| Minh họa thắng | 1 | 768 × 768 | Mèo vui, cá hoặc Catnip bay; nền trong suốt |
| Minh họa thua | 1 | 768 × 768 | Mèo xẹp tai hoặc nằm bẹp hài hước; nền trong suốt |

Tổng: **4 ảnh**. Có thể dựng hai minh họa kết quả từ bộ mèo hiện có trong bản đầu để giảm khối lượng vẽ.

## 9. Những thành phần không cần cung cấp ảnh

- Nút bấm, tab, panel, khung thẻ tỷ lệ 3:4, khung phẩm chất và viền phát sáng: CSS hoặc Phaser Graphics.
- Thanh HP, thanh timeline, thanh tiến trình, tooltip và bảng chỉ số: frontend dựng từ dữ liệu.
- Chữ tiếng Việt, chỉ số, tên mèo, giá Catnip, phần trăm lai và thông báo: text động.
- Lưới, vùng di chuyển, vùng tấn công, đường đi, tâm ngắm và dấu chọn đội: vẽ bằng code.
- Mỗi tổ hợp mèo và mỗi ảnh chân dung: ghép từ lớp gen, có thể cache thành texture.
- Hiệu ứng nhún, xoay, rung màn hình, tint trúng đòn, confetti và bóng tròn dưới chân: làm bằng code.
- Không cần ảnh chụp màn hình mẫu để thay cho giao diện có tương tác.

## 10. Asset mở rộng sau bản đầu

Các mục dưới đây chỉ sản xuất khi tính năng tương ứng đã được chốt và triển khai. Chưa tính vào tổng bản đầu.

| Tính năng | Hình ảnh bổ sung |
|---|---|
| Chuyến phiêu lưu roguelike | Bản đồ hành trình, icon nút trận thường/tinh anh/boss/sự kiện/nghỉ/cửa hàng, nền sự kiện |
| Kẻ địch ngoài mèo mirror | Mỗi loài cần sprite đứng, đánh, trúng đòn, hạ gục; số loài theo danh sách encounter được duyệt |
| Boss | Sprite riêng, các trạng thái và hiệu ứng kỹ năng; kích thước theo số ô chiếm trên bàn |
| Lớp nghề | Vòng cổ/trang bị nhận diện nghề, icon nghề và icon kỹ năng tương ứng |
| Kỹ năng phụ kiện | Hồi máu, đẩy lùi, xuyên giáp, nhảy vật cản và icon nội tại theo danh sách thực tế |
| Trạng thái chiến đấu | Độc, cháy, choáng, chậm, khiên, ẩn thân và hiệu ứng áp dụng/gỡ bỏ |
| Crit, phản kích, AoE | Hiệu ứng riêng khi các cơ chế được bổ sung |
| Vật cản phá hủy | Trạng thái nguyên, nứt, vỡ và mảnh vụn |
| Nâng cấp trại | Nội thất và các cấp nâng cấp, NPC nếu thiết kế có sử dụng |
| Thêm biome | Bộ tile, vật cản và nền tương ứng từng khu |
| Trang quảng bá | Key art, banner mạng xã hội, ảnh chia sẻ; không cần cho gameplay bản đầu |

## 11. Tổng số và thứ tự bàn giao

### Bộ đầy đủ đề xuất cho frontend bản đầu

| Nhóm | Số asset |
|---|---:|
| Lớp gen mèo | 28 |
| Bàn cờ và môi trường | 11 |
| Nền các màn hình | 3 |
| Gacha và lai tạo | 4 |
| Icon | 23 |
| Hiệu ứng | 8 |
| Nhận diện và kết quả | 4 |
| **Tổng** | **81** |

81 là số thiết kế/ảnh xuất cơ bản, không tính file nguồn, atlas, bản dọc, frame hoạt ảnh hoặc các phụ kiện phải tách trước/sau. Một số icon và minh họa có thể tái sử dụng hoặc dựng bằng code nên khối lượng vẽ mới có thể thấp hơn.

### Đợt 1 — chốt phong cách và làm một trận mẫu

- 1 thân, 3 mặt, 3 vũ khí (cận chiến, tầm xa, phép), 1 phụ kiện: 8 ảnh lớp gen.
- 1 sàn, 1 nước, 1 hố, 1 bụi, 1 thùng: 5 ảnh môi trường.
- 6 icon chỉ số và 1 icon Catnip: 7 icon.
- 1 vệt chém, 1 va chạm: 2 ảnh hiệu ứng.

**Tổng đợt 1: 22 asset**, nằm trong bộ 81. Dùng nền màu và UI bằng code để kiểm tra ghép gen, độ rõ ở ô nhỏ và thao tác chiến đấu trước.

### Đợt 2 — hoàn thiện vòng chơi

Bổ sung các lớp mèo còn lại, ba nền màn hình, gacha/lai tạo, icon điều hướng và hành động, hiệu ứng, màn kết quả. Hoàn thiện logo sau khi tên và phong cách được duyệt.

### Đợt 3 — nội dung và chuyển động mở rộng

Thêm hoạt ảnh từng frame, mèo/địch mới, boss, biome và asset roguelike theo phạm vi sản phẩm được chốt.

## 12. Cấu trúc thư mục bàn giao đề xuất

```text
assets/
  branding/
  cats/
    body/
    face/
    weapon/
    accessory/
  terrain/
    tiles/
    obstacles/
  backgrounds/
  props/
  icons/
    stats/
    navigation/
    actions/
  effects/
  results/
  source/
  asset_manifest.csv
```

Manifest cần các cột: `asset_id`, `file`, `category`, `width`, `height`, `anchor_x`, `anchor_y`, `gene_id`, `license`, `notes`. `gene_id` để trống với ảnh không phải gen. Ghi tác giả/nguồn và quyền sử dụng cho asset bên ngoài. Điểm neo dùng tọa độ pixel trong canvas gốc; frontend có thể chuẩn hóa khi import.

## 13. Checklist nghiệm thu hình ảnh

- [ ] Chốt một mẫu mèo ghép đủ bốn lớp trước khi vẽ hàng loạt.
- [ ] Thân, mặt, vũ khí, phụ kiện khớp đúng điểm neo, không bị cắt mất chi tiết.
- [ ] Thử cả hướng gốc và hướng lật ngang.
- [ ] Nhận ra biểu cảm, vũ khí và hai phe khi mèo hiển thị khoảng 64–96 px.
- [ ] Phe được phân biệt bằng vòng chân/marker của frontend; không phải vẽ lại toàn bộ mèo.
- [ ] Nền trong suốt không có viền trắng hoặc ô caro bị dính vào ảnh.
- [ ] Tile ghép cạnh không lộ đường nối; vật cản không che ô và mục tiêu quá mức.
- [ ] Nền crop được trên điện thoại và desktop.
- [ ] Icon vẫn rõ ở 24–32 px; hình chính không phụ thuộc chữ trong ảnh.
- [ ] Tên file, manifest và ID gen khớp mã nguồn đã tích hợp.
- [ ] Atlas, dung lượng tải đầu và tốc độ tải được kiểm tra trên bản web thực tế.

File này là danh sách yêu cầu asset; chưa tạo hình ảnh và chưa thay đổi GDD hoặc mã nguồn game.
