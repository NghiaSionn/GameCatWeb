# Báo cáo hoàn thành GameCatWeb — core và diagnostic local

Ngày báo cáo: 01/11/2026. Worker thực hiện: gamecatweb-4, điều phối bởi gamecatweb-1.

## 1. Kết quả và phạm vi

Đã hoàn thành phần dữ liệu, di truyền, GameStore và tactical combat bằng TypeScript, cùng trang diagnostic để kiểm tra core thật trong browser. Đã đọc GDD và task-list DOCX; ưu tiên MVP trong task-list, ghi các quyết định chưa rõ trong README core. API và quyền sở hữu module đã được leader duyệt và gửi cho Gemini.

Đây là game-core chạy trong trình duyệt, lưu bằng LocalStorage; **không phải backend server**. Không có HTTP API, database server, xác thực hoặc PvP có máy chủ phân xử. Phaser/UI sản phẩm do Gemini phụ trách; diagnostic chỉ là giao diện kiểm thử chức năng.

Tất cả thay đổi giữ local. Không commit, push, tạo PR hoặc publish. Không sửa workspace Gemini. Chưa xác nhận frontend Gemini đã tích hợp hoặc build ứng dụng sản phẩm hoàn chỉnh.

## 2. Vị trí mã nguồn và tệp chính

Workspace tuyệt đối:

`C:/Users/nghia/.ao/data/worktrees/gamecatweb/gamecatweb-4`

Mọi đường dẫn tương đối bên dưới đều tính từ workspace này.

| Tệp | Nội dung |
|---|---|
| `src/core/types.ts` | Contract TypeScript: Cat, genes/stats, player state, combat state/events/result, storage và options |
| `src/core/cats.ts` | CatFactory, breedCats, deriveStats, kiểm tra dữ liệu mèo, RNG có seed |
| `src/core/store.ts` | GameStore, MemoryStorage, save/version validation, economy, roster/history/rewards |
| `src/core/combat.ts` | TacticalEngine, đường đi trọng số, LoS, scheduler, hành động và kết quả trận |
| `src/core/index.ts` | Public exports dùng chung cho UI |
| `src/core/README.md` | API, cách tích hợp và toàn bộ assumptions MVP |
| `tests/core.test.ts` | 14 nhóm kiểm thử xác định cho core |
| `diagnostics/index.html` | Trang diagnostic tách khỏi entry/frontend Gemini |
| `diagnostics/main.ts` | Wiring các control tới API core, fixture, driver kiểm thử và browser smoke |
| `diagnostics/README.md` | Cách build/mở, kiểm thử thủ công, persistence và bằng chứng native input |
| `tsconfig.diagnostics.json` | Biên dịch core/diagnostic thành browser ES modules `.js` |
| `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore` | Scaffold và lệnh kiểm tra/build local |

Đường dẫn contract tuyệt đối: `C:/Users/nghia/.ao/data/worktrees/gamecatweb/gamecatweb-4/src/core/types.ts`.

Output static hiện có: `diagnostics/runtime/diagnostics/main.js` và `diagnostics/runtime/src/core/*.js`. Đây là output sinh tự động, bị git ignore; cần build lại sau khi đổi TypeScript. HTML import `./runtime/diagnostics/main.js`, module này import `../src/core/index.js`; các exports core dùng đuôi `.js`.

## 3. Chức năng đã triển khai

### Dữ liệu và di truyền

- F0 có đúng 100 điểm nguyên phân bổ HP/ATK/SPD, bốn tầng gen body/face/weapon/accessory và stats HP, ATK, SPD, MOV, RNG, defense.
- Mỗi tầng gen F1 bốc độc lập: 45% từ bố, 45% từ mẹ, 10% mutation; giữ nguyên dữ liệu bố mẹ và tăng generation.
- Mutation mặt lên God và tăng MOV tối đa 5; mutation vũ khí lên God và tăng RNG tối đa 4. RNG, thời gian và ID có thể tiêm vào để kiểm thử lặp lại.

### GameStore và LocalStorage

- Save có version, kiểm tra cấu trúc và tính hợp lệ trước khi dùng. Save lỗi/không tương thích khởi tạo game local mới kèm cảnh báo.
- Game mới có ba mèo, roster ba mèo và 300 Catnip. Có gacha, breeding, đổi roster, lịch sử trận và nhận thưởng.
- Snapshot là bản sao; thao tác không hợp lệ không trừ tiền. Battle ID chỉ được thưởng một lần, kể cả sau reload. Phần thưởng được chuẩn hóa từ kết quả thắng/thua.
- Khi storage không đọc/ghi được, phiên vẫn chơi được trong memory và có cảnh báo.

### Tactical combat

- Map 8×8 hoặc 10×10, tọa độ `terrain[y][x]`, Manhattan, di chuyển bốn hướng.
- Tính toàn bộ ô tới được và đường đi tối ưu có chi phí địa hình/ZoC; units, tường, hố chặn đi theo rule đã ghi.
- Bresenham LoS, direct/lobbed, minRange/blind spot; nước, bụi và vật cản có xử lý riêng.
- Lượt cá nhân theo SPD, Move/Attack/Wait/EndTurn, passive skirmisher cho phép attack rồi move.
- Sát thương có variance, HP/death, bỏ unit chết khỏi board/timeline/LoS, xác định phe thắng và tạo BattleResult để lưu thưởng.

## 4. Contract/API để frontend tích hợp

Public import: `src/core/index.ts`. Tên trường Cat dùng camelCase; state/events/results là dữ liệu có thể serialize. UI phải lấy legal actions từ engine, không tự tính lại rule.

- `new CatFactory(options?).createF0(name?): Cat`
- `breedCats(father, mother, options?): Cat`
- `new GameStore(options?)`: `getState()`, `subscribe(listener)`, `gacha(name?)`, `breed(fatherId,motherId)`, `setRoster(ids)`, `recordBattle(result)`; có `persistenceWarning`.
- `new TacticalEngine({size,terrain?,units,rng?,id?})`: `getState()`, `getReachable(unitId?)`, `getAttackable(unitId?)`, `hasLineOfSight(attackerId,targetId)`, `move(position)`, `attack(targetId)`, `wait()`, `endTurn()`.
- Helpers: `seededRandom(seed)`, `createTerrain(size)`, `manhattan`, `bresenham`, `MemoryStorage`, `ECONOMY`.

`getReachable` trả ô hợp lệ kèm cost/path; `getAttackable` trả target IDs. Action sai ném Error; action hợp lệ trả CombatState mới. Snapshot có `activeUnitId`, `timeline`, `moved`, `acted`, `events`, `winner`, `result`. Events mô tả lệnh gần nhất. Unit HP=0 còn trong snapshot cho animation nhưng không có hiện diện chiến thuật. Attack thông thường tự kết thúc lượt; skirmisher có thể còn quyền move/endTurn. Subscribe báo các thay đổi sau khi đăng ký, không tự phát state đầu tiên.

## 5. Assumptions MVP quan trọng

- 100 điểm là ngân sách F0 cho HP/ATK/SPD, mỗi loại tối thiểu 10. MOV/RNG lấy từ gen; accessory không dùng ngân sách này. F1 kế thừa từng gen nên tổng điểm có thể khác 100.
- Base 10..80 điểm đổi tuyến tính thành HP 300..800, ATK 30..120, SPD 20..90 rồi nhân rarity 1/1.2/1.45/1.8. Rarity gacha giả định: common75%, rare20%, epic5%; không phải tỷ lệ được tài liệu quy định.
- Mutation không mặc định tăng cả MOV lẫn RNG: chỉ tầng tương ứng tăng và chịu cap. Body/accessory mutation reroll variant không-God.
- Dijkstra được dùng để lấy tất cả reachable cells trên map nhỏ, thay vì chạy A* riêng từng đích. Nước cost2; rời ô trong ZoC nhân đôi chi phí vào ô tiếp theo. Nước cộng ZoC có thể cost4.
- SPD scheduler dùng delay `100/effectiveSPD`; nước giảm SPD15% tại lúc lập lịch. Wait chỉ dành cho lượt chưa dùng action, delay còn80%. Mỗi lượt có một lệnh move, dù còn MOV.
- Damage làm tròn `ATK*(0.9+rng()*0.2)-defense`, tối thiểu1 khi trúng; bụi có20% evasion. Chưa có crit/counterattack/AoE/heal/stealth/vật cản phá hủy/jump/PvP authority/Telegram.
- Economy tuning: start300, gacha100, breed150, win100, lose25; giữ bố mẹ, chưa cooldown. Rewards tin vào kết quả local, không là cơ chế chống gian lận server.

Chi tiết đầy đủ ở `src/core/README.md`.

## 6. Kiểm chứng đã thực hiện

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd test` | **14/14 nhóm pass** |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run build:diagnostics` | Pass; gồm typecheck và emit static ES modules bằng TypeScript |
| `git diff --check` | Pass |
| Browser programmatic smoke trên static origin | **14/14 checks pass**, không có runtime errors được capture |

Core tests bao phủ F0/seed, biên45/90%, mutation cap qua nhiều thế hệ, save lỗi, snapshot, economy/reward idempotence, weighted paths/ZoC, direct/lobbed LoS, Manhattan/blind spot, SPD/wait/nước, hành động/death/win/lose và các trận 3v3 hoàn chỉnh xác định trên cả8×8/10×10.

**Native input đã kiểm riêng, không suy ra từ programmatic smoke:** trusted pointer/click và handler trace khớp, đồng thời state/events đổi đúng ở F0, gacha/breeding, lỗi thiếu Catnip, Wait, click ô move P1 với path `(1,1)`, Attack fixture E1→P1 gây51HP, hoàn tất trận và nhận thưởng. Thử thưởng hai lần cho kết quả **50→75→75**. Reload bằng native click giữ **75 Catnip, 5 mèo, 1 bản ghi trận**.

Đã phát hiện và sửa hai lỗi UI diagnostic: trace tăng chiều cao giữa pointerdown/up làm lệch nút (đổi sang chiều cao cố định), status sticky che nút reload (bỏ sticky). Đã chọn đúng static tab và đóng tab dev cũ; không còn dựa vào giả thuyết panel chưa vẽ. Với control ngoài màn hình, focus và chờ scroll ổn định trước click; luôn đối chiếu handler/state thay vì chỉ tin thông báo input dispatched. Lỗi AO `act --expect-text` đã được tránh bằng đọc state/selector cụ thể. Không khẳng định đã kiểm mọi thao tác thủ công hay UI sản phẩm Gemini.

## 7. Static preview, khởi động lại và cách dùng

URL static đã được xác minh:

<http://ao-preview.m5qw2zldmf2hozlcfu2a.localhost:3001/diagnostics/index.html>

Preview thuộc [AO session gamecatweb-4](ao://sessions/gamecatweb/gamecatweb-4), tab `t1` tại lần kiểm tra. Link session chỉ điều hướng trong AO, không tự áp một preview. URL cần AO đang chạy; không phải website công khai. Dev server5174 đã dừng và URL cũ không còn dùng. `ao preview status --json` trả `stopped` vì không có managed dev server; static page vẫn hoạt động qua confined loopback preview của AO. Không tạo `.ao/launch.json`.

Chạy lại trong PowerShell, từ session/workspace trên:

```powershell
Set-Location 'C:/Users/nghia/.ao/data/worktrees/gamecatweb/gamecatweb-4'
npm.cmd run build:diagnostics
& 'C:/Users/nghia/AppData/Local/Programs/agent-orchestrator/resources/daemon/ao.exe' preview diagnostics/index.html
```

Lệnh build hiện tại là `tsc --noEmit && tsc -p tsconfig.diagnostics.json`. Dependencies/compiler đã có trong workspace tại lúc bàn giao; không cần cài thêm để mở bản static đã build. Nếu `ao` đã có trong PATH, có thể dùng `ao preview diagnostics/index.html`. Nếu automation còn chọn sai tab, xem `ao browser tabs --json` rồi chọn tab có đúng static URL, không giả định ID tab sẽ luôn giữ nguyên sau khi session thay đổi.

Để chạy lại kiểm tra code:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build:diagnostics
git diff --check
```

Không dùng `npm run build` làm bằng chứng build sản phẩm: script đó còn cần `index.html` và entry do frontend sở hữu, chưa được xác nhận trong workspace này.

Cách thử tay: tạo F0 mẫu; gacha; chọn hai bố mẹ khác nhau và breed; reload save; tạo trận từ roster, click ô xanh/target hợp lệ và thử Wait/end turn. Nút **Trận kiểm tra Attack** đặt roster cùng đối thủ mirror ở minRange để thử Attack ngay. Step/Finish chỉ là driver diagnostic chọn trong legal actions, không phải AI sản phẩm. Sau kết quả, nhận thưởng hai lần rồi reload để kiểm tra không cộng trùng. Thêm `?smoke=1` vào URL để chạy14 checks programmatic riêng; đây là DOM `.click()`/assertions trong trang, phân biệt với kiểm chứng native input bên trên.

## 8. Persistence, tắt máy và việc còn lại

Save thường dùng key `meow-brawlers:diagnostics:v1`; smoke dùng key `meow-brawlers:diagnostics:v1:smoke` và reset key test mỗi lần mở smoke. Save mặc định của game là `meow-brawlers:v1`. Các key được tách riêng. LocalStorage phụ thuộc **origin và browser profile**: đã xác nhận qua reload trên cùng static origin/profile, không tự chuyển save từ localhost5174. AO sở hữu profile phiên và có thể hủy profile; không cam kết giữ save sau khi profile bị bỏ. Trận đang đấu là transient, không được lưu để resume; cats/roster/Catnip/history được lưu.

Tắt máy không xóa các tệp source, report và output build đã ghi trên đĩa nếu workspace còn được giữ. Mở preview cần khởi động AO lại; khi đổi source phải build lại runtime. Không cần bật lại dev server5174. Báo cáo này được lưu một bản duy nhất theo yêu cầu orchestrator, không thay preview diagnostic đang dùng chỉ để mở báo cáo.

Việc tiếp theo: tích hợp module core vào frontend/Phaser của Gemini, kiểm tra contract tại điểm wiring, build và thử ứng dụng sản phẩm end-to-end, rồi tinh chỉnh cân bằng/asset/UX. **Frontend Gemini và tích hợp cuối chưa được xác nhận hoàn thành**; diagnostic không thay thế các phần đó. Backend server không thuộc MVP hiện tại, chỉ bổ sung nếu yêu cầu sản phẩm thay đổi.