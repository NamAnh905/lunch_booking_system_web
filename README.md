# LunchOrder — Web (Frontend)

Ứng dụng web quản trị & đặt cơm trưa nội bộ của **LunchOrder**, xây dựng bằng **Angular 21** (standalone components, application builder) với **SCSS**, **Bootstrap 4** (khu trú ở khu vực đặt cơm) và **FontAwesome 7**. Một số màn hình (trao đổi phiếu) dùng thêm **Angular Material/CDK**; **SweetAlert2** cho các modal xác nhận/đổi mật khẩu, **lucide-angular** cho icon navbar/sidebar. Đây là tầng giao diện tiêu thụ REST API từ backend `LunchOrder`.

## Tổng quan (Project Overview)

Frontend cung cấp hai nhóm trải nghiệm chính trên cùng một layout:

- **Portal (người dùng):** đặt cơm theo thực đơn tuần, xem lịch bữa ăn, trao đổi phiếu ăn, nhận thông báo realtime.
- **System (quản trị):** quản lý người dùng, phòng ban, vai trò, phân quyền, thực đơn, món ăn, giá, cơm khách, cấu hình hệ thống, nhật ký thao tác; kèm các báo cáo thống kê theo ngày/tháng.

Ứng dụng dùng kiến trúc **standalone components**, xác thực bằng **JWT** (kèm interceptor CSRF & error), điều hướng qua các **route module theo feature** và một tầng **shared** giàu thành phần tái sử dụng (CRUD base, form-modal, toast, confirm...).

API mặc định trỏ tới `http://localhost:8080/api/v1` (cấu hình trong `src/environments`).

## Cấu trúc dự án (Project Structure)

Toàn bộ mã nguồn nằm trong `src/app`, tổ chức theo ba lớp: `core`, `features`, `shared`.

| Thư mục | Vai trò |
| --- | --- |
| `core/auth` | Dịch vụ xác thực (`auth.service`) và lưu trữ token (`token.storage.service`). |
| `core/guards` | Route guards: `auth.guard` (đăng nhập), `permission.guard` (phân quyền), `pending-changes.guard` (chặn rời trang khi có thay đổi chưa lưu). |
| `core/interceptors` | HTTP interceptors: `jwt` (gắn token), `csrf`, `error` (toast lỗi tập trung) và các HTTP context token. |
| `core/layout` | Khung giao diện chung: navbar (admin/user), sidebar admin và layout tổng. |
| `core/services` | Dịch vụ dùng chung toàn app: toast, confirm, profile, tải file, cấu hình nghiệp vụ, xử lý lỗi, `notification`/`realtime` (nhận thông báo qua SSE — Server-Sent Events). |
| `features/login` | Màn hình đăng nhập. |
| `features/error` | Trang lỗi `401`, `403`, `404`. |
| `features/portal` | Nghiệp vụ người dùng cuối: `meal-order` (đặt cơm, có facade + các service tính toán lịch/tổng hợp) và `ticket-exchange` (trao đổi phiếu). |
| `features/statistic` | Báo cáo thống kê đơn hàng theo ngày (`order-daily`) và theo tháng (`order-monthly`). |
| `features/system` | Các trang quản trị hệ thống: `user`, `department`, `role`, `permission`, `dish`, `menu`, `price`, `market`, `config`, `guest-meal` (cơm khách), `audit-log` (nhật ký thao tác). |
| `shared/components` | Thành phần UI tái sử dụng: bộ `crud` (base CRUD), `form-modal`, `toast`, `confirm`, `breadcrumb`, `month-picker`, `account-modals`... |
| `shared/constants` | Hằng số nghiệp vụ, thông báo lỗi, quy tắc validation. |
| `shared/models` · `shared/enums` | Kiểu dữ liệu (interface) và enum dùng chung toàn ứng dụng. |
| `shared/directives` · `shared/pipes` · `shared/utils` | Directive (`autofocus`), pipe (`format-money`) và tiện ích (`date`, `money`, `api`). |
| `shared/services` | Dịch vụ nền tảng như `base-cached-crud.service`. |
| `environments` | Cấu hình theo môi trường (`environment.ts` cho production, `environment.development.ts` cho dev). |
| `styles` | SCSS toàn cục: biến, mixin, bảng, nút, bộ lọc. |

## Yêu cầu môi trường (Prerequisites)

- **Node.js 20.19+ hoặc 22.12+** (theo yêu cầu của Angular 21).
- **npm 10+** (dự án ghim `npm@10.9.3`).
- **Angular CLI 21** — cài toàn cục (tùy chọn):

  ```bash
  npm install -g @angular/cli@21
  ```

- Backend `LunchOrder` đang chạy tại `http://localhost:8080/api/v1` (hoặc cập nhật lại `apiUrl` trong `src/environments`).

## Cài đặt & chạy Local (Local Setup)

### 1. Cài đặt dependencies

Chạy tại thư mục gốc của dự án frontend:

```bash
npm install
```

### 2. Cấu hình môi trường

Kiểm tra `src/environments/environment.development.ts` và trỏ `apiUrl` tới backend đang chạy:

```ts
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api/v1',
    siteName: 'LUNCHORDER - Angular'
};
```

### 3. Chạy development server

```bash
npm start
```

Hoặc dùng trực tiếp Angular CLI:

```bash
ng serve
```

Ứng dụng chạy mặc định tại `http://localhost:4200/` và tự động reload khi thay đổi mã nguồn.

### 4. Chạy test

```bash
npm test
```

Dùng builder `@angular/build:unit-test` (Vitest) khai báo trong `angular.json`.

## Triển khai (Deployment)

### 1. Cấu hình production

`src/environments/environment.ts` dùng **`apiUrl` tương đối** (`/api/v1`), không phải domain tuyệt đối:

```ts
export const environment = {
    production: true,
    apiUrl: '/api/v1',
    siteName: 'LUNCHORDER - Angular'
};
```

Vì `apiUrl` tương đối, web server đứng trước bản build (Nginx) **bắt buộc** vừa serve file tĩnh vừa proxy `/api/` sang backend trên cùng một origin/cổng — nếu không request API sẽ gọi nhầm vào chính domain frontend. Chỉ sửa file này nếu đổi kiến trúc triển khai (tách domain API riêng).

### 2. Build bản production

```bash
ng build --configuration production
```

Kết quả build (đã tối ưu & hashing) được xuất ra thư mục:

```
dist/LunchOrder-Web/browser
```

### 3. Host bằng Nginx (cấu hình có sẵn ở `nginx.conf`)

Đây là ứng dụng SPA nên cần **fallback mọi route về `index.html`**, và cần proxy `/api/` sang backend. Dự án đã có sẵn [`nginx.conf`](nginx.conf) (mặc định lắng nghe cổng `4200`, backend tại `127.0.0.1:8080`):

```nginx
server {
    listen 4200;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 10m;   # cho phép upload ảnh thực đơn

    # SSE (thông báo realtime) — cần tắt buffering & timeout dài, tách riêng khỏi block /api/ bên dưới
    location /api/v1/notifications/stream {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Chỉnh `proxy_pass` nếu backend không chạy cùng máy, rồi nạp lại cấu hình:

```bash
nginx -t && nginx -s reload
```

### 4. Chạy bằng Docker

Dự án có sẵn `Dockerfile` (đóng gói thư mục `dist/LunchOrder-Web/browser` + `nginx.conf` vào image `nginx:alpine`, expose cổng `4200`):

```bash
ng build --configuration production
docker build -t lunchorder-web:latest .
docker run -d --name lunchorder-fe -p 4200:4200 lunchorder-web:latest
```

Xem `docs/deploy-uat.md` và `docs/deploy-public.md` trong repo backend (`LunchOrder`, thư mục kế bên) để có runbook triển khai đầy đủ cả FE lẫn BE (chạy `--network host`, cấu hình reverse proxy biên, checklist bảo mật khi mở ra internet...).

---

*LunchOrder Web — Angular 21 · TypeScript 5.9 · SCSS · Bootstrap 4 · Angular Material/CDK · FontAwesome 7*
