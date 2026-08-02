# IMPORTANT

This document is the official frontend specification of SmartLib.

Every AI agent (Codex, GPT, Claude...) MUST read this document before writing or modifying any frontend code.

When this document conflicts with the current implementation, THIS DOCUMENT ALWAYS WINS.

Do not ignore any section.

Do not redesign based on personal preference.

If information is missing, ask the user instead of making assumptions.
# Smartlib UI Blueprint

Đây là bản thiết kế để frontend code CSS và UI cho Smartlib, thư viện số Trường THCS Bình Chuẩn. Nó dùng các route hiện có làm khung màn hình, nhưng trọng tâm là visual system, responsive layout, component state và Tailwind/CSS recipe.

## 1. Design Read

Smartlib là ứng dụng thư viện vận hành hằng ngày cho học sinh và thủ thư. Nó phải sáng, gọn, đáng tin, dễ đọc tiếng Việt và đủ thân thiện cho học sinh THCS, nhưng không hoạt hình hay trẻ con.

Nó nên có cùng chất lượng cảm giác với EDP:

- Nền sáng xanh xám rất nhẹ, panel trắng, border mảnh và shadow dịu.
- Xanh dương là một trục điều hướng duy nhất: hành động chính, active state, focus state.
- Nội dung quyết định việc kế tiếp luôn được ưu tiên hơn trang trí.
- Mobile được thiết kế như một app riêng, không phải desktop bị ép nhỏ.
- Học sinh dùng giao diện thoáng, thao tác lớn. Admin dùng dữ liệu dày hơn, nhưng vẫn dễ quét.

Thiết lập tổng thể: `DESIGN_VARIANCE: 3/10`, `MOTION_INTENSITY: 3/10`, `VISUAL_DENSITY: 5/10`.

Không được tạo dark SaaS, nền tím neon, gradient AI, bokeh/blob trang trí, phong cách thư viện cổ điển beige-nâu, sticker, emoji, cartoon hoặc hero marketing khổng lồ.

## 2. Phạm vi màn hình

Không đổi route, layout, quyền hay API. Dùng các route dưới đây để biết mỗi CSS layout cần phục vụ nội dung gì.

| Nhóm | Route | Mục tiêu UI |
| --- | --- | --- |
| Public | `/` | Landing gọn, giới thiệu thư viện và CTA đăng nhập/đăng ký |
| Public | `/login`, `/register` | Form xác thực rõ ràng, ít phân tâm |
| User | `/user/dashboard` | Tóm tắt sách đang mượn, hạn trả, yêu cầu và thông báo |
| User | `/user/books` | Tra cứu danh mục sách |
| User | `/user/book/:id` | Xem bìa, thông tin, trạng thái khả dụng và gửi yêu cầu mượn |
| User | `/user/my-borrow` | Theo dõi phiếu mượn, hạn trả, gia hạn |
| User | `/user/my-requests` | Theo dõi và hủy yêu cầu mượn |
| User | `/user/notifications` | Xem thông báo |
| User | `/user/profile`, `/user/change-password` | Quản lý thông tin cá nhân |
| Admin | `/admin/dashboard` | Tình hình cần xử lý hôm nay |
| Admin | `/admin/users` | Quản lý người dùng |
| Admin | `/admin/books`, `/admin/books/:id` | Quản lý đầu sách và bìa sách |
| Admin | `/admin/book-copies`, `/admin/book-copies/:id` | Quản lý bản sao vật lý |
| Admin | `/admin/borrow`, `/admin/borrow/new`, `/admin/borrow/:id` | Tạo và xử lý phiếu mượn/trả |
| Admin | `/admin/borrow-requests` | Duyệt, từ chối và checkout yêu cầu |
| Admin | `/admin/incidents`, `/admin/reports`, `/admin/imports` | Vận hành, báo cáo, nhập Excel |
| Admin | `/admin/notifications`, `/admin/settings` | Thông báo và cấu hình |

Ràng buộc nghiệp vụ thể hiện trong UI:

- User gửi `Yêu cầu mượn`, không có CTA `Mượn ngay` tạo phiếu trực tiếp.
- User có thể `Gia hạn` nếu backend cho phép, nhưng không có button `Trả sách`.
- Admin mới có action trả sách, checkout, đánh dấu mất/hỏng, xóa và các thao tác nguy hiểm.
- Chưa có API ebook. Không dựng trang đọc ebook hoặc CTA `Đọc ngay`.

## 3. CSS Foundation

### Color tokens

Giữ một màu xanh thương hiệu để giao diện có định hướng. Màu xanh lá, amber và rose chỉ có nghĩa trạng thái, không dùng làm màu trang trí.

```css
:root {
  --sl-brand: #2e77df;
  --sl-brand-hover: #245fc0;
  --sl-brand-deep: #1f5fc0;
  --sl-brand-soft: #eff6ff;
  --sl-canvas: #f8fafc;
  --sl-surface: #ffffff;
  --sl-surface-muted: #f1f5f9;
  --sl-ink: #0f172a;
  --sl-text: #334155;
  --sl-muted: #64748b;
  --sl-outline: #e2e8f0;
  --sl-success: #047857;
  --sl-success-soft: #ecfdf5;
  --sl-warning: #b45309;
  --sl-warning-soft: #fffbeb;
  --sl-danger: #be123c;
  --sl-danger-soft: #fff1f2;
  --sl-shadow: 0 10px 30px rgb(15 23 42 / 0.06);
  --sl-shadow-raised: 0 18px 42px rgb(15 23 42 / 0.10);
}
```

Canvas có thể dùng nền trắng xanh nhẹ ở dashboard cấp cao, nhưng không tạo gradient lớn:

```css
.sl-app-canvas {
  min-height: 100dvh;
  background:
    radial-gradient(circle at top, #edf5ff 0%, #f8fbff 34%, #f8fafc 72%);
}
```

Các page thông thường dùng `bg-slate-50` hoặc `var(--sl-canvas)`. Chỉ dùng `.sl-app-canvas` cho dashboard, không dùng trong danh mục sách để bìa sách có nền trung tính.

### Typography

```css
@layer base {
  html {
    font-family: "Be Vietnam Pro", "Segoe UI", sans-serif;
    color: var(--sl-ink);
    background: var(--sl-canvas);
  }

  body {
    min-width: 320px;
    min-height: 100dvh;
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
}
```

| Vai trò chữ | Desktop | Mobile | Quy tắc |
| --- | --- | --- | --- |
| Page title | 30-36px, `font-semibold` | 24-28px | Tối đa hai dòng, `tracking-tight` |
| Section title | 20-24px, `font-semibold` | 18-20px | Không dùng uppercase spacing lớn |
| Card title | 15-16px, `font-semibold` | 15-16px | Book title clamp hai dòng |
| Body | 15-16px | 15-16px | `leading-6` hoặc `leading-7` |
| Metadata | 12-13px | 12-13px | Dùng `text-slate-500`, không thấp hơn 12px |
| Numeric metric | 28-36px | 24-30px | `tabular-nums`, chỉ cho số thực có ích |

Không dùng serif vì đây là thư viện. Be Vietnam Pro giúp tiếng Việt sạch, hiện đại và khớp hệ EDP.

### Spacing, radius và elevation

Chỉ dùng scale: `4, 8, 12, 16, 20, 24, 32, 40, 48px`.

| Thành phần | Radius | Padding/gap |
| --- | --- | --- |
| Panel page, modal, hero dashboard | 28-32px | 20px mobile, 24-32px desktop |
| Book card, list card, table toolbar | 20-24px | 12-20px |
| Input, button, select | 16-20px | cao tối thiểu 44px |
| Chip, status badge | `999px` | 6-10px ngang, 4-6px dọc |

Chỉ có hai cấp shadow: `--sl-shadow` cho panel/card và `--sl-shadow-raised` cho modal/dropdown. Không dùng pure black shadow, outer glow hoặc border dày 2px chỉ để trang trí.

## 4. Layout System

### Public và User shell

```text
Desktop >= 1024px
+-------------------------------------------------------------+
| Sticky header: logo | primary nav              notification |
+-------------------------------------------------------------+
| max-w-7xl, px-6/8, py-6                                  |
| Page header                                                |
| Main content                                               |
+-------------------------------------------------------------+

Mobile < 768px
+--------------------------+
| Compact top app bar      |
| Main content, px-4       |
|                          |
| Fixed bottom navigation  |
+--------------------------+
```

- Header desktop cao 64px, `bg-white/95 backdrop-blur border-b border-slate-200/80`.
- User desktop nav: Dashboard, Sách, Đang mượn, Yêu cầu. Notification và profile nằm về bên phải.
- User mobile nav có đúng năm vùng chạm: Dashboard, Sách, Mượn, Yêu cầu, Tài khoản. Mỗi item rộng đều, icon ở trên label, `min-height: 56px`.
- Bottom nav phải có `padding-bottom: env(safe-area-inset-bottom)` và page content phải có khoảng đáy tối thiểu 96px.
- Container user: `mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8`.

### Admin shell

```text
Desktop >= 1024px
+-------------+-----------------------------------------------+
| Logo        | Topbar: breadcrumb             account/notif |
| Sidebar     +-----------------------------------------------+
| 240-264px   | Content: max width 1440px, px-6, py-6        |
| navigation  |                                               |
|             |                                               |
+-------------+-----------------------------------------------+

Mobile < 1024px
+-------------------------------------------------------------+
| Compact topbar, menu button, page title, notification      |
+-------------------------------------------------------------+
| Content, px-4                                               |
+-------------------------------------------------------------+
| Sidebar becomes left drawer, never a dense icon rail        |
+-------------------------------------------------------------+
```

- Sidebar là surface trắng, border-right slate-200, không floating glass card.
- Item sidebar active: `bg-[#eff6ff] text-[#2e77df]`; inactive: `text-slate-600 hover:bg-slate-50`.
- Group label sidebar dùng `text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400`, tối đa một label mỗi group thật.
- Content admin có thể rộng hơn user nhưng không vượt 1440px.

### Breakpoints

| Breakpoint | Hành vi |
| --- | --- |
| `< 640px` | Một cột, padding 16px, card list row ưu tiên hơn grid nhiều cột |
| `640-767px` | Hai cột cho metric nhỏ, book grid 3 cột nếu card còn đọc được |
| `768-1023px` | Book grid 3-4 cột, toolbar có thể chia hai hàng |
| `>= 1024px` | User header full, admin sidebar, grid dashboard và table đầy đủ |
| `>= 1280px` | Book grid 5 cột, dashboard content rộng hơn, không tăng cỡ chữ theo viewport |

## 5. Tailwind Component Recipes

Các class dưới đây là công thức định hướng. Có thể tạo component React hoặc `@layer components`; không copy-paste class dài tùy tiện vào mọi page.

### Page, panel và header

```tsx
const pageShell = "min-h-[100dvh] bg-slate-50 text-slate-900";
const pageCanvas = "min-h-[100dvh] bg-[radial-gradient(circle_at_top,#edf5ff_0%,#f8fbff_34%,#f8fafc_72%)] text-slate-900";
const pageContent = "mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-6 lg:px-8 lg:pb-8";
const panel = "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6";
const panelQuiet = "rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5";
const pageHeader = "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";
```

Page header gồm breadcrumb nếu admin, title, mô tả tối đa hai dòng và **một** primary action. Không dùng eyebrow uppercase ở tất cả mọi section.

### Button, icon button và input

```tsx
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#2e77df] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(46,119,223,0.20)] transition duration-200 hover:bg-[#245fc0] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2e77df] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55";

const dangerButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]";

const iconButton =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2e77df] active:scale-[0.96]";

const input =
  "min-h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2e77df] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
```

- Button primary có nhãn tối đa ba từ và không wrap trên desktop.
- Icon button luôn có `aria-label` và tooltip desktop.
- Label nằm trên input: `mb-1.5 block text-sm font-medium text-slate-700`.
- Helper text nằm dưới input. Error text dùng `text-sm text-rose-700`, không chỉ đổi border đỏ.

### Status badge

```tsx
const statusStyles = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  active: "border-blue-200 bg-blue-50 text-blue-700",
  overdue: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusBadge = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold";
```

Badge phải dùng text đúng từ backend. Không tạo các status giả chỉ để làm UI nhiều màu.

### Empty, loading, error

```tsx
const emptyState = "rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center";
const inlineError = "rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800";
const skeleton = "animate-pulse rounded-2xl bg-slate-200/80";
```

- Skeleton phải giống layout cuối: book list có block bìa 2:3 và hai dòng text; table có row skeleton.
- Empty state có title thật, câu giải thích ngắn và một CTA. Ví dụ: `Chưa có phiếu mượn nào` + `Khám phá sách`.
- Lỗi list có button `Thử lại`, không chỉ toast biến mất.

## 6. Book UI

### Book card

```text
+-------------------------+
|  Cover 2:3              |
|                          |
+-------------------------+
| Status badge             |
| Tên sách (2 lines max)  |
| Tác giả                  |
| Bản có sẵn / metadata    |
+-------------------------+
```

```tsx
const bookCard =
  "group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)] focus-within:ring-2 focus-within:ring-blue-100";

const bookCover =
  "aspect-[2/3] w-full bg-slate-100 object-cover";

const bookTitle =
  "line-clamp-2 text-[15px] font-semibold leading-5 text-slate-900";
```

- Desktop catalog: grid `grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`.
- Không gắn pill/label chồng lên bìa. Status nằm dưới bìa để bìa được nhìn rõ.
- Nếu chưa có ảnh bìa từ data, dùng placeholder surface muted với icon sách đơn giản từ icon library và text `Chưa có bìa`, không vẽ bìa giả bằng gradient.
- Tên sách không làm title quá lớn. Bìa là phần thị giác chính.

### Book row cho mobile hoặc danh sách dày

```tsx
const bookRow =
  "flex min-h-[120px] gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50";
const bookRowCover = "h-24 w-16 shrink-0 rounded-xl bg-slate-100 object-cover";
```

Book row gồm bìa, title, tác giả, metadata một dòng và status. Không để ba hàng metadata dài làm title bị ép xuống.

### Book detail

```text
Desktop >= 1024px
+-------------------+---------------------------------------------+
| Cover, 280-340px  | Breadcrumb + status                         |
| 2:3               | Title, author, metadata                     |
|                   | Availability panel + primary request CTA    |
+-------------------+---------------------------------------------+
| Description and related information below, max-w readable   |
+-------------------------------------------------------------+

Mobile
+-------------------+
| Cover centered    |
| Status, title     |
| Author, metadata  |
| Availability      |
| Full-width CTA    |
+-------------------+
```

- Primary action user là `Gửi yêu cầu mượn` hoặc `Đặt trước`, theo availability API.
- Availability panel có bề mặt `bg-blue-50/70`, border `border-blue-100`, icon + copy ngắn.
- Mobile CTA có thể sticky phía trên bottom nav, nhưng phải chừa safe area và không che nội dung.
- Không dùng tab nếu nội dung chỉ có một section ngắn. Nếu dùng tab, chỉ cho nhóm thông tin thật.

## 7. Route-Specific CSS Brief

### `/`, `/login`, `/register`

- Public landing cao vừa đủ, không phải trang bán hàng. Desktop dùng split layout: copy trái, minh họa thật về sách/thư viện hoặc một catalog preview phải. Mobile stack một cột.
- Hero có tối đa: logo/trường, heading, mô tả ngắn, hai CTA. Không thêm metrics giả, logo wall, carousel hay feature card filler.
- Auth page dùng một panel `max-w-md`, nền canvas nhạt, logo trường trên panel, form rõ label, primary button full-width.
- Không dùng image background tối hoặc gradient chói cho form đăng nhập.

### `/user/dashboard`

```text
1. Welcome panel xanh dương nhẹ: tên user + hạn trả gần nhất.
2. Hai metric thiết thực: Đang mượn và Yêu cầu chờ xử lý.
3. Danh sách Sắp đến hạn hoặc Empty state.
4. Quick link: Tìm sách.
```

- Mobile dùng hero blue cao vừa đủ, radius 28px, chữ trắng, không có gradient cầu vồng.
- Không dùng dashboard admin metrics ở đây. Học sinh cần thấy hạn trả và sách của mình trước.

### `/user/books`

```text
Page header: "Tra cứu sách" + notification/account
Search bar full width
Filter/Sort controls
Result count + clear filter
Book grid or book rows
```

- Search là control nổi bật nhất, cao 52px trên mobile và desktop.
- Filter mobile mở bottom sheet. Desktop dùng toolbar một hàng hoặc panel trái 240px nếu backend có filter thật.
- Khi user search, giữ query trong URL chỉ nếu pattern project đã dùng. Không tự tạo query contract mới với backend.

### `/user/my-borrow` và `/user/my-requests`

- List item có bìa nhỏ, tên, hạn trả/trạng thái, action ở cuối. Hạn trả sắp tới dùng warning panel nhỏ, quá hạn dùng danger nhưng không tạo màu đỏ bao phủ page.
- Mỗi item chỉ có một action prominent: `Gia hạn`, `Xem chi tiết` hoặc `Hủy yêu cầu`.
- Confirm sheet trên mobile trượt từ đáy; desktop dùng modal `max-w-md` có backdrop blur nhẹ.

### `/user/notifications`, `/user/profile`, `/user/change-password`

- Notifications là list row có icon semantic, title, body 2 dòng, time metadata. Unread có nền blue rất nhạt hoặc left border 3px blue, không dùng chấm trang trí cho mọi row.
- Profile và password dùng panel form hẹp `max-w-2xl`, field group có label/help/error rõ, action bar ở cuối.
- Không bọc từng input vào một card riêng.

### `/admin/dashboard`

```text
Page header + primary action
2-4 meaningful metric cards
Main column: requests needing action
Side column: incidents / reminders
Below: recent borrowing activity or a report snapshot
```

- Desktop grid `xl:grid-cols-[minmax(0,1fr)_320px]`. Mobile stack thành một cột.
- Metric card không cần icon lớn. Dùng label 12px, number 28px, trạng thái phụ ngắn.
- Việc cần xử lý là khu vực thị giác mạnh nhất, không phải biểu đồ.

### Admin lists: users, books, copies, borrow, requests, incidents

```text
Page header
Toolbar: search | filters | main action
Data surface
  table header desktop
  rows with stable columns and row actions
pagination / empty / error state
```

- Desktop dùng table/list với header sticky vừa phải. Không đổi cả bảng thành lưới card.
- Table bọc `overflow-x-auto`; mỗi column có `whitespace-nowrap` cho mã, ngày, status; book title cho phép wrap tối đa hai dòng.
- Mobile: row chuyển thành compact list khi thông tin phù hợp. Với bảng nhiều trường, giữ horizontal scroll có sticky first column thay vì card lồng card.
- Toolbar mobile xếp thành search full width và hàng action phía dưới. Admin primary action như `Thêm đầu sách`, `Tạo phiếu mượn` phải rõ nhất.
- Row hover chỉ đổi nền `bg-slate-50`; dropdown action dùng icon button có tooltip, không chèn 4 button chữ trong mỗi row.

### Admin detail, borrow workflow và imports

- Detail page: breadcrumb, title/status/action bar, sau đó layout hai cột ở desktop. Cột chính là nội dung; cột phụ là summary/action. Mobile stack.
- Action nguy hiểm đặt trong vùng riêng có border rose nhạt, không nằm cạnh CTA primary.
- Borrow detail dùng section `Thông tin phiếu`, `Danh sách bản sao`, `Lịch sử/trạng thái` theo dữ liệu thật.
- Import page là wizard theo thứ tự thật: Template -> Chọn file -> Validate -> Kết quả -> Commit. Mỗi bước có trạng thái disabled rõ, không dùng progress bar giả.
- Settings dùng section heading, mô tả ngắn, form grid 1-2 cột. Không biến toàn bộ settings thành danh sách toggle trang trí.

## 8. Responsive and Motion Rules

```css
@media (max-width: 767px) {
  .sl-mobile-bottom-space {
    padding-bottom: calc(6rem + env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Chỉ animate `transform` và `opacity`.
- Standard transition: 180-240ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
- Modal/sheet: fade backdrop + translate 8-16px. Không bounce lớn hoặc animation vô hạn.
- Toast chỉ dùng cho kết quả ngắn. Form/list error phải hiển thị inline để người dùng còn đọc được.
- Không dùng `window.addEventListener('scroll')` để tạo hiệu ứng. Không dùng parallax, marquee hoặc scroll hijack.

## 9. Prompt Cho AI Code CSS

Sao chép prompt này cùng với `IDEA.md` khi giao cho AI code frontend.

```text
Bạn là frontend engineer chịu trách nhiệm thiết kế và code CSS/Tailwind cho Smartlib, thư viện số Trường THCS Bình Chuẩn. Đọc IDEA.md trước; đây là visual source of truth.

Nhiệm vụ: triển khai giao diện thực tế cho các route React đã có. Hãy ưu tiên layout, responsive CSS, hierarchy, component state và accessibility. Không đổi route, backend API, auth flow hoặc database.

Phong cách bắt buộc:
- Giao diện app vận hành trường học, sáng, yên tĩnh, rõ ràng, hiện đại. Không phải landing page SaaS.
- Font Be Vietnam Pro; canvas #F8FAFC; surface trắng; text #0F172A; muted #475569; border #E2E8F0; chỉ một brand blue #2E77DF.
- Panel lớn radius 28-32px; card/input/button 16-24px; badge pill. Shadow nhẹ, trung tính. Không glow, không gradient AI/tím neon, không dark SaaS, không beige vintage, không cartoon/sticker/emoji.
- User UI mobile-first với bottom nav; admin desktop-first với sidebar và mobile drawer. Không ép desktop thu nhỏ thành mobile.
- Book cover tỷ lệ 2:3, title tối đa hai dòng. Không overlay label lên bìa. Dùng image placeholder trung tính khi data không có bìa.
- Primary action mỗi screen phải duy nhất, rõ ràng. Button/control tối thiểu 44px; action học sinh tối thiểu 52px; focus state đạt WCAG AA.
- Có skeleton đúng hình dạng, empty state có CTA, inline error, disabled state và confirm dialog cho delete/return/lost/damaged/cancel.
- Chỉ dùng motion nhẹ 180-240ms cho opacity/transform và tôn trọng prefers-reduced-motion.

Dựa trên route hiện có:
- User: dashboard, books, book detail, my borrow, my requests, notifications, profile.
- Admin: dashboard, users, books, copies, borrow, borrow requests, incidents, reports, imports, notifications, settings.
- User gửi yêu cầu mượn, admin tạo/checkout/trả phiếu. Không dựng ebook reader hay nút Đọc ngay vì chưa có API.

Trước khi code, đọc component/layout hiện có để giữ convention. Sau khi code, kiểm tra ở 1440px, 768px, 390px, không để title, button, badge, card hoặc table tràn/đè nhau. Chạy build/lint script hiện có và báo file đã thay đổi.
```

## 10. Visual QA Checklist

- [ ] Nhìn một user screen, hành động kế tiếp và hạn trả/trạng thái quan trọng hiện ra trước.
- [ ] Nhìn admin dashboard, hàng đợi xử lý nổi bật hơn biểu đồ hoặc metric phụ.
- [ ] Header desktop và bottom nav/sidebar mobile không che content.
- [ ] Không có card lồng card vô nghĩa, shadow nặng, icon tự vẽ, gradient blob hoặc màu trạng thái dùng sai nghĩa.
- [ ] Search, form, dropdown, modal, table và bottom sheet có focus/hover/disabled/loading/error state.
- [ ] Mọi bìa sách giữ đúng tỷ lệ 2:3, không làm layout nhảy khi ảnh tải.
- [ ] Table/list admin vẫn đọc được ở mobile và không có button tràn dòng.
- [ ] Text tiếng Việt rõ dấu, cỡ body tối thiểu 15px và metadata tối thiểu 12px.
- [ ] Empty state không để trang trống, error state không chỉ có toast.
