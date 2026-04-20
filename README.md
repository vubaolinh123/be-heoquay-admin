# BE HeoQuay Admin - Order Management API

Backend trung gian giữa Frontend và Calio API, xử lý việc tạo/cập nhật/xóa đơn hàng, đồng bộ dữ liệu từ Calio về database riêng.

## Cài đặt & Chạy

```bash
npm install
npm start      # Production
npm run dev    # Development (nodemon)
```

Server chạy tại `http://localhost:5000`

## Biến môi trường (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/heoquay-admin?appName=App
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
TOKEN=<calio_api_token>
API_KEY_GEMINI=<google_gemini_api_key>
FB_TOKEN=<facebook_page_access_token>
```

> - **TOKEN**: Được gửi trong header `Token` khi gọi Calio API để xác thực.
> - **API_KEY_GEMINI**: API key của Google Gemini AI để tạo caption bài viết.
> - **FB_TOKEN**: Facebook Page Access Token với quyền `pages_manage_posts` và `pages_read_engagement` để đăng bài lên Fanpage.

---

## Kiến trúc

```
Frontend → Backend (localhost:5000) → Calio API (clientapi.phonenet.io)
                    ↓                              ↓
              MongoDB (heoquay-admin)          Calio DB
```

Mỗi request gọi qua Backend sẽ:
1. Gọi Calio API lấy/dữ liệu gốc
2. Đồng bộ (upsert) vào MongoDB riêng
3. Trả response về Frontend

---

## API Endpoints

Base path: `/api/orders`

### 1. Tìm kiếm khách hàng

```
GET /api/orders/customers
```

Tìm kiếm khách hàng trên Calio, đồng thời lưu vào collection `customers` trong DB.

**Query Parameters:**

| Tham số    | Kiểu   | Mặc định | Mô tả                          |
|------------|--------|----------|--------------------------------|
| keyword    | string | `""`     | Tên, SĐT hoặc mã khách hàng   |
| status     | number | `0`      | Trạng thái (0: tất cả)         |
| page       | number | `1`      | Trang hiện tại                 |
| pageSize   | number | `50`     | Số bản ghi mỗi trang           |

**Ví dụ:**

```bash
curl "http://localhost:5000/api/orders/customers?keyword=Thu&page=1&pageSize=10"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "6703d061dbeb55108bec319d",
        "name": "Nguyễn Thị Thu",
        "code": "KH001",
        "phone": "0901234567",
        "address": "123 ABC",
        "province": "Hồ Chí Minh",
        "district": "Quận 1",
        "ward": "Phường Bến Nghé",
        "additionPhones": [],
        "additionEmails": [],
        "tags": ["vip"]
      }
    ],
    "totalDocs": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

> **Lưu ý:** `data` trả về trực tiếp từ Calio (định dạng phân trang KiotViet/Calio). Đồng thời dữ liệu cũng được upsert vào collection `customers` của DB nội bộ.

---

### 2. Tìm kiếm sản phẩm

```
GET /api/orders/products
```

Tìm kiếm sản phẩm trên Calio, đồng thời lưu vào collection `products` trong DB.

**Query Parameters:**

| Tham số        | Kiểu    | Mặc định              | Mô tả                                  |
|----------------|---------|-----------------------|----------------------------------------|
| keyword        | string  | `""`                  | Tên hoặc mã sản phẩm                   |
| warehouse      | string  | `"66c5a66fb6d90a09096dd52b"` | ID kho hàng                     |
| type           | string  | `"store,service"`     | Loại sản phẩm (store, service)         |
| includeParent  | string  | `"true"`              | Bao gồm sản phẩm cha                   |
| status         | number  | `1`                   | Trạng thái (1: active)                 |
| hasChild       | number  | `2`                   | Có biến thể con không (2: tất cả)      |
| page           | number  | `1`                   | Trang hiện tại                          |
| pageSize       | number  | `50`                  | Số bản ghi mỗi trang                    |

**Ví dụ:**

```bash
curl "http://localhost:5000/api/orders/products?keyword=Ba+Chi&page=1&pageSize=10"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "68a3e9cd9c261545b3c926d2",
        "name": "Ba Chỉ",
        "sku": "BC",
        "type": "store",
        "unit": "Lạng",
        "sellPrice": 45000,
        "importPrice": 40000,
        "active": true,
        "totalQuantity": 100,
        "remainQuantity": 80,
        "hasChild": false,
        "categories": [],
        "warehouses": [],
        "inventories": []
      }
    ],
    "totalDocs": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 3. Lấy danh sách trạng thái đơn hàng

```
GET /api/orders/statuses
```

Lấy danh sách trạng thái đơn hàng từ Calio, lưu vào collection `orderstatuses` trong DB.

**Query Parameters:**

| Tham số    | Kiểu   | Mặc định | Mô tả                    |
|------------|--------|----------|--------------------------|
| keyword    | string | `""`     | Tìm theo tên trạng thái  |
| active     | number | `1`      | Trạng thái active        |
| page       | number | `1`      | Trang hiện tại           |
| pageSize   | number | `50`     | Số bản ghi mỗi trang     |

**Ví dụ:**

```bash
curl "http://localhost:5000/api/orders/statuses"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "...",
        "key": "shipped",
        "label": "Đã giao hàng",
        "color": "#28a745",
        "showInList": true,
        "disableAdd": false,
        "active": true,
        "position": 1,
        "type": "order"
      }
    ],
    "totalDocs": 9,
    "page": 1,
    "pageSize": 50
  }
}
```

---

### 4. Tạo đơn hàng

```
POST /api/orders
```

Tạo đơn hàng trên Calio API, sau đó lưu dữ liệu trả về vào DB nội bộ.

**Request Headers:**

```
Content-Type: application/json
```

**Request Body (JSON):**

Các trường bắt buộc và quan trọng:

| Trường              | Kiểu    | Mô tả                                          |
|---------------------|---------|------------------------------------------------|
| status              | string  | Trạng thái đơn hàng (vd: `"shipped"`)          |
| customer            | string  | ID khách hàng Calio (hoặc `null` nếu mới)      |
| customerName        | string  | Tên khách hàng                                 |
| customerPhone       | string  | Số điện thoại khách hàng                       |
| customerAddress     | string  | Địa chỉ khách hàng                             |
| autoCreateCustomer  | boolean | `true` nếu muốn tự tạo khách hàng mới          |
| code                | string  | Mã đơn hàng (phải duy nhất)                    |
| user                | string  | ID nhân viên tạo đơn                           |
| warehouse           | string  | ID kho hàng                                    |
| products            | array   | Danh sách sản phẩm                              |
| products[].product  | string  | ID sản phẩm Calio                               |
| products[].name     | string  | Tên sản phẩm                                    |
| products[].sku      | string  | Mã SKU sản phẩm                                 |
| products[].price    | number  | Đơn giá                                         |
| products[].quantity | number  | Số lượng                                        |
| products[].unit     | string  | Đơn vị tính                                     |
| totalAmount         | number  | Tổng tiền                                       |
| shipFee              | number  | Phí ship                                        |
| shipFeePayer        | string  | Người trả phí ship (`"sender"` / `"receiver"`) |
| shippingEnabled     | boolean | Bật tính năng shipping                          |
| note                | string  | Ghi chú đơn hàng                                |
| desc                | string  | Mô tả đơn hàng                                  |
| tags                | array   | Danh sách tag (vd: `["tu-den-lay"]`)            |
| deliveryTime        | number  | Thời gian giao hàng (timestamp ms)             |
| expireTime          | number  | Thời hạn đơn hàng (timestamp ms)               |
| paymentType         | string  | Loại thanh toán (`"cash"`, `"transfer"`)       |
| discountAmount      | number  | Tiền giảm giá                                   |
| discountPercent     | string  | Phần trăm giảm giá                              |
| taxAmount           | number  | Tiền thuế                                       |
| depositAmount       | number  | Tiền cọc                                        |
| cod                 | boolean | Thu hộ (COD)                                    |
| codAmount           | number  | Số tiền COD                                     |
| createDebt          | boolean | Tạo công nợ                                     |
| createExpense       | boolean | Tạo chi phí                                     |
| createShipping      | boolean | Tạo phiếu giao hàng                             |
| customFields        | array   | Các trường tùy chỉnh                             |

**Ví dụ:**

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "customer": null,
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0901234567",
    "customerAddress": "123 Đường ABC, Quận 1, HCM",
    "autoCreateCustomer": true,
    "code": "DH-001",
    "user": "6703d061dbeb55108bec319d",
    "warehouse": "66c5a66fb6d90a09096dd52b",
    "products": [
      {
        "code": "Y1776653456741",
        "product": "68a3e9cd9c261545b3c926d2",
        "sku": "BC",
        "name": "Ba Chỉ",
        "price": 45000,
        "quantity": 1,
        "discount": 0,
        "unit": "Lạng",
        "autoPriceEnabled": true,
        "desc": "",
        "attributes": [],
        "modifiers": [],
        "parent": null,
        "index": 1
      }
    ],
    "totalAmount": 45000,
    "shipFee": 0,
    "shipFeePayer": "sender",
    "shippingEnabled": false,
    "shippingName": "Nguyễn Văn A",
    "shippingPhone": "0901234567",
    "shippingAddress": "123 Đường ABC, Quận 1, HCM",
    "note": "Giao hàng buổi sáng",
    "desc": "Đơn hàng test",
    "tags": ["tu-den-lay"],
    "deliveryTime": 1776654060000,
    "expireTime": 1779245379002,
    "paymentType": "cash",
    "discountAmount": 0,
    "discountPercent": "0",
    "taxAmount": 0,
    "depositAmount": 0,
    "cod": false,
    "codAmount": 0,
    "createDebt": false,
    "createExpense": false,
    "createShipping": false,
    "isCustomVatAmount": false,
    "isPaymentPoint": false,
    "customFields": []
  }'
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "calioOrder": {
      "_id": "69e59d013434c85496d3c89e",
      "code": "DH-001",
      "customerName": "Nguyễn Văn A",
      "customerPhone": "0901234567",
      "status": "shipped",
      "totalAmount": 45000,
      "products": [...],
      "...": "..."
    },
    "localOrder": {
      "_id": "681abc...",
      "calioId": "69e59d013434c85496d3c89e",
      "code": "DH-001",
      "customerName": "Nguyễn Văn A",
      "customerPhone": "0901234567",
      "status": "shipped",
      "totalAmount": 45000,
      "...": "..."
    }
  }
}
```

> **Lưu ý quan trọng:**
> - Trường `code` phải duy nhất trên Calio. Nếu trùng sẽ báo lỗi.
> - Nếu `customer` là `null` và `autoCreateCustomer: true`, Calio sẽ tự tạo khách hàng mới.
> - Nếu có `customer` ID thì phải là ID hợp lệ trên Calio.
> - Trường `warehouse` phải là ID kho hợp lệ trên Calio.
> - Trường `user` phải là ID nhân viên hợp lệ trên Calio.

---

### 5. Lấy chi tiết đơn hàng

```
GET /api/orders/:orderId/detail
```

Lấy chi tiết đơn hàng từ Calio API, đồng thời cập nhật (upsert) vào DB nội bộ.

**URL Parameters:**

| Tham số   | Kiểu   | Mô tả                       |
|-----------|--------|------------------------------|
| orderId   | string | ID đơn hàng Calio (hoặc ID nội bộ) |

**Ví dụ:**

```bash
curl "http://localhost:5000/api/orders/69e59d013434c85496d3c89e/detail"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "calioOrder": {
      "_id": "69e59d013434c85496d3c89e",
      "code": "DH-001",
      "customerName": "Nguyễn Văn A",
      "customerPhone": "0901234567",
      "customerAddress": "123 ABC",
      "status": "shipped",
      "totalAmount": 45000,
      "products": [
        {
          "product": "68a3e9cd9c261545b3c926d2",
          "name": "Ba Chỉ",
          "sku": "BC",
          "price": 45000,
          "quantity": 1,
          "unit": "Lạng",
          "discount": 0,
          "total": 45000
        }
      ],
      "shipFee": 0,
      "discountAmount": 0,
      "taxAmount": 0,
      "depositAmount": 0,
      "note": "Giao hàng buổi sáng",
      "desc": "Đơn hàng test",
      "tags": ["tu-den-lay"],
      "warehouse": "66c5a66fb6d90a09096dd52b",
      "user": {
        "_id": "6703d061dbeb55108bec319d",
        "name": "Tran Ngoc Kim My"
      },
      "createdAt": "...",
      "updatedAt": "..."
    },
    "localOrder": {
      "_id": "681abc...",
      "calioId": "69e59d013434c85496d3c89e",
      "code": "DH-001",
      "customerName": "Nguyễn Văn A",
      "status": "shipped",
      "totalAmount": 45000,
      "syncedAt": "2026-04-20T..."
    }
  }
}
```

> **Lưu ý:** `orderId` có thể là Calio ID hoặc MongoDB _id nội bộ. Backend sẽ tự resolve.

---

### 6. Cập nhật đơn hàng

```
PUT /api/orders/:orderId
```

Cập nhật đơn hàng trên Calio API, sau đó đồng bộ dữ liệu cập nhật vào DB nội bộ.

**URL Parameters:**

| Tham số   | Kiểu   | Mô tả                       |
|-----------|--------|------------------------------|
| orderId   | string | ID đơn hàng Calio (hoặc ID nội bộ) |

**Request Body (JSON):**

Body request phải chứa toàn bộ thông tin đơn hàng (các trường giữ nguyên + các trường cần thay đổi). Format giống hệt response của GET detail. Đây là yêu cầu của Calio API - cần gửi lại toàn bộ object đơn hàng.

Các trường thường cần cập nhật:

| Trường              | Kiểu    | Mô tả                          |
|---------------------|---------|--------------------------------|
| _id                 | string  | ID đơn hàng trên Calio          |
| code                | string  | Mã đơn hàng                    |
| customer            | string  | ID khách hàng Calio             |
| customerName        | string  | Tên khách hàng mới             |
| customerPhone       | string  | SĐT khách hàng mới             |
| customerAddress     | string  | Địa chỉ khách hàng mới         |
| status              | string  | Trạng thái mới                 |
| note                | string  | Ghi chú mới                    |
| desc                | string  | Mô tả mới                      |
| products            | array   | Danh sách sản phẩm mới/cập nhật |
| totalAmount         | number  | Tổng tiền mới                  |
| discountAmount      | number  | Tiền giảm giá mới               |
| shipFee              | number  | Phí ship mới                    |
| shippingName        | string  | Tên người nhận mới             |
| shippingPhone       | string  | SĐT người nhận mới             |
| shippingAddress     | string  | Địa chỉ giao hàng mới          |
| tags                | array   | Danh sách tag mới               |

**Ví dụ:**

```bash
curl -X PUT http://localhost:5000/api/orders/69e59d013434c85496d3c89e \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "69e59d013434c85496d3c89e",
    "code": "DH-001",
    "customer": "6703d061dbeb55108bec319d",
    "customerName": "Nguyễn Văn A UPDATED",
    "customerPhone": "0901234567",
    "status": "shipped",
    "note": "Giao hàng buổi chiều",
    "products": [...],
    "...": "toàn bộ các trường khác giữ nguyên"
  }'
```

**Cách tốt nhất để cập nhật:**

1. Gọi `GET /api/orders/:orderId/detail` để lấy toàn bộ data hiện tại
2. Thay đổi các trường cần update
3. Gửi lại toàn bộ object qua `PUT /api/orders/:orderId`

**Response:**

```json
{
  "success": true,
  "data": {
    "calioOrder": {
      "_id": "69e59d013434c85496d3c89e",
      "customerName": "Nguyễn Văn A UPDATED",
      "note": "Giao hàng buổi chiều",
      "...": "các trường khác"
    },
    "localOrder": {
      "_id": "681abc...",
      "calioId": "69e59d013434c85496d3c89e",
      "customerName": "Nguyễn Văn A UPDATED",
      "note": "Giao hàng buổi chiều",
      "...": "các trường khác",
      "syncedAt": "2026-04-20T..."
    }
  }
}
```

> **Lưu ý quan trọng:** Phải gửi gần như toàn bộ object đơn hàng khi update. Nếu thiếu trường, Calio có thể set trường đó về null/0. Luôn lấy detail trước rồi mới update.

---

### 7. Lấy danh sách đơn hàng (từ DB nội bộ)

```
GET /api/orders
```

Lấy danh sách đơn hàng từ DB nội bộ (không gọi Calio API).

**Query Parameters:**

| Tham số         | Kiểu   | Mặc định | Mô tả                              |
|-----------------|--------|----------|--------------------------------------|
| page            | number | `1`      | Trang hiện tại                       |
| pageSize        | number | `50`     | Số bản ghi mỗi trang                 |
| status          | string | -        | Lọc theo trạng thái                  |
| customerPhone   | string | -        | Lọc theo số điện thoại khách hàng    |

**Ví dụ:**

```bash
curl "http://localhost:5000/api/orders?page=1&pageSize=10"
curl "http://localhost:5000/api/orders?page=1&pageSize=10&status=shipped"
curl "http://localhost:5000/api/orders?customerPhone=0901234567"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "681abc...",
        "calioId": "69e59d013434c85496d3c89e",
        "code": "DH-001",
        "status": "shipped",
        "customerName": "Nguyễn Văn A",
        "customerPhone": "0901234567",
        "totalAmount": 45000,
        "products": [...],
        "note": "Giao hàng buổi sáng",
        "createdAt": "...",
        "updatedAt": "...",
        "syncedAt": "..."
      }
    ],
    "totalDocs": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### 8. Lấy thông tin 1 đơn hàng (từ DB nội bộ)

```
GET /api/orders/:orderId
```

Lấy thông tin đơn hàng từ DB nội bộ (không gọi Calio API). Hỗ trợ tìm theo cả `calioId` và MongoDB `_id`.

**URL Parameters:**

| Tham số   | Kiểu   | Mô tả                                     |
|-----------|--------|--------------------------------------------|
| orderId   | string | MongoDB `_id` hoặc Calio ID của đơn hàng    |

**Ví dụ:**

```bash
curl "http://localhost:5000/api/orders/69e59d013434c85496d3c89e"
curl "http://localhost:5000/api/orders/681abc123def456"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "681abc...",
    "calioId": "69e59d013434c85496d3c89e",
    "code": "DH-001",
    "status": "shipped",
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0901234567",
    "...": "các trường khác"
  }
}
```

> **Khác biệt với `GET /:orderId/detail`:**
> - `GET /:orderId` chỉ lấy từ DB nội bộ, nhanh hơn, không gọi Calio.
> - `GET /:orderId/detail` gọi Calio API lấy data mới nhất, sau đó upsert vào DB.

---

### 9. Xóa đơn hàng

```
DELETE /api/orders/:orderId
```

Xóa đơn hàng trên cả Calio API và DB nội bộ.

**URL Parameters:**

| Tham số   | Kiểu   | Mô tả                                     |
|-----------|--------|--------------------------------------------|
| orderId   | string | MongoDB `_id` hoặc Calio ID của đơn hàng    |

**Ví dụ:**

```bash
curl -X DELETE "http://localhost:5000/api/orders/69e59d013434c85496d3c89e"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "calioResult": { "...": "Calio delete response" },
    "dbResult": { "_id": "681abc...", "calioId": "69e59d013434c85496d3c89e", "...": "deleted order data" },
    "calioId": "69e59d013434c85496d3c89e"
  }
}
```

> **Lưu ý:** Nếu xóa trên Calio thất bại (VD: đơn hàng không tồn tại trên Calio), Backend vẫn tiếp tục xóa trong DB nội bộ và trả về kết quả. Lỗi Calio không block việc xóa DB.

---

## So sánh nhanh: GET /:orderId vs GET /:orderId/detail

| Đặc điểm             | `GET /:orderId`              | `GET /:orderId/detail`              |
|----------------------|------------------------------|--------------------------------------|
| Nguồn dữ liệu        | DB nội bộ (MongoDB)          | Calio API → đồng bộ vào DB           |
| Tốc độ               | Nhanh                       | Chậm hơn (gọi API bên ngoài)         |
| Dữ liệu              | Có thể không mới nhất        | Luôn mới nhất từ Calio                |
| Side effect          | Không                        | Upsert dữ liệu vào DB                 |
| Use case             | Xem nhanh, danh sách         | Cần data mới nhất, trước khi update   |

---

## Cấu trúc DB nội bộ (MongoDB)

### Collection: `customers`

| Trường        | Kiểu     | Mô tả                          |
|---------------|----------|--------------------------------|
| calioId       | string   | ID khách hàng trên Calio (unique) |
| name          | string   | Tên khách hàng                  |
| phone         | string   | Số điện thoại                   |
| email         | string   | Email                           |
| address       | string   | Địa chỉ                         |
| province      | string   | Tỉnh/Thành                      |
| district      | string   | Quận/Huyện                     |
| ward          | string   | Phường/Xã                       |
| code          | string   | Mã khách hàng                   |
| facebookId    | string   | Facebook ID                     |
| facebookName  | string   | Tên Facebook                    |
| zaloId        | string   | Zalo ID                         |
| gender        | string   | Giới tính                       |
| avatar        | string   | URL avatar                      |
| source        | string   | Nguồn khách hàng                 |
| anonymous     | boolean  | Khách hàng ẩn danh               |
| tags          | [string] | Danh sách tag                    |
| rawData       | Mixed    | Dữ liệu gốc từ Calio             |
| createdAt     | date     |                                  |
| updatedAt     | date     |                                  |

### Collection: `products`

| Trường           | Kiểu     | Mô tả                          |
|------------------|----------|--------------------------------|
| calioId          | string   | ID sản phẩm trên Calio (unique) |
| name             | string   | Tên sản phẩm                    |
| sku              | string   | Mã SKU                          |
| type             | string   | Loại sản phẩm                   |
| unit             | string   | Đơn vị tính                     |
| importPrice      | number   | Giá nhập                        |
| sellPrice        | number   | Giá bán                          |
| desc             | string   | Mô tả                           |
| active           | boolean  | Trạng thái active                |
| categories       | [string] | Danh mục                        |
| warehouses       | [Mixed]  | Thông tin kho                    |
| inventories      | [Mixed]  | Thông tin tồn kho                |
| totalQuantity    | number   | Tổng số lượng                   |
| remainQuantity   | number   | Số lượng còn lại                 |
| hasChild         | boolean  | Có biến thể con                  |
| source           | string   | Nguồn sản phẩm                   |
| rawData          | Mixed    | Dữ liệu gốc từ Calio             |
| createdAt        | date     |                                  |
| updatedAt        | date     |                                  |

### Collection: `orderstatuses`

| Trường       | Kiểu     | Mô tả                     |
|--------------|----------|---------------------------|
| calioId      | string   | ID trạng thái trên Calio (unique) |
| key          | string   | Key trạng thái             |
| label        | string   | Nhãn hiển thị              |
| color        | string   | Màu sắc (#hex)             |
| showInList   | boolean  | Hiển thị trong danh sách   |
| disableAdd   | boolean  | Vô hiệu hóa thêm mới       |
| active       | boolean  | Trạng thái active          |
| position     | number   | Vị trí sắp xếp             |
| type         | string   | Loại trạng thái             |
| rawData      | Mixed    | Dữ liệu gốc từ Calio       |
| createdAt    | date     |                             |
| updatedAt    | date     |                             |

### Collection: `orders`

| Trường              | Kiểu     | Mô tả                              |
|---------------------|----------|--------------------------------------|
| calioId             | string   | ID đơn hàng trên Calio (unique)      |
| code                | string   | Mã đơn hàng                           |
| status              | string   | Trạng thái đơn hàng                   |
| customer            | string   | ID khách hàng Calio                   |
| customerName        | string   | Tên khách hàng                        |
| customerPhone       | string   | SĐT khách hàng                        |
| customerEmail       | string   | Email khách hàng                      |
| customerAddress     | string   | Địa chỉ khách hàng                    |
| customerCity         | string   | Tỉnh/Thành khách hàng                 |
| customerDistrict     | string   | Quận/Huyện khách hàng                 |
| customerWard         | string   | Phường/Xã khách hàng                  |
| warehouse           | string   | ID kho hàng                            |
| user                | string   | ID nhân viên tạo đơn                  |
| users               | [string] | Danh sách nhân viên                   |
| products            | [Object] | Danh sách sản phẩm (xem chi tiết bên dưới) |
| totalAmount         | number   | Tổng tiền                              |
| discountAmount      | number   | Tiền giảm giá                          |
| discountPercent     | Mixed    | Phần trăm giảm giá                     |
| taxAmount           | number   | Tiền thuế                               |
| taxCode             | string   | Mã thuế                                |
| taxPercent          | Mixed    | Phần trăm thuế                         |
| depositAmount       | number   | Tiền cọc                                |
| transferAmount      | number   | Tiền chuyển khoản                      |
| receivedAmount      | number   | Tiền đã nhận                           |
| pointAmount         | number   | Điểm tích lũy                          |
| paymentPoints       | number   | Điểm thanh toán                        |
| paymentType         | string   | Loại thanh toán                        |
| isPayment           | boolean  | Đã thanh toán                          |
| isPaymentPoint      | boolean  | Thanh toán bằng điểm                   |
| shipFee              | number   | Phí ship                                |
| customerShipFee     | number   | Phí ship khách trả                    |
| returnFee           | Mixed    | Phí hoàn trả                           |
| shippingEnabled     | boolean  | Bật shipping                            |
| shippingName        | string   | Tên người nhận                          |
| shippingPhone       | string   | SĐT người nhận                          |
| shippingAddress     | string   | Địa chỉ giao hàng                       |
| shippingProvince    | string   | Tỉnh/Thành giao hàng                    |
| shippingDistrict    | string   | Quận/Huyện giao hàng                    |
| shippingWard        | string   | Phường/Xã giao hàng                     |
| source              | string   | Nguồn đơn hàng                          |
| tags                | [string] | Danh sách tag                           |
| desc                | string   | Mô tả đơn hàng                          |
| note                | string   | Ghi chú đơn hàng                         |
| deliveryTime        | number   | Thời gian giao hàng (timestamp ms)      |
| expireTime          | number   | Thời hạn đơn hàng (timestamp ms)       |
| codAmount           | number   | Số tiền COD                             |
| cod                  | boolean  | Thu hộ COD                              |
| createShipping      | boolean  | Tạo phiếu giao hàng                    |
| autoCreateCustomer  | boolean  | Tự tạo khách hàng                      |
| createDebt          | boolean  | Tạo công nợ                             |
| createExpense       | boolean  | Tạo chi phí                             |
| rawData             | Mixed    | Dữ liệu gốc từ Calio                    |
| syncedAt            | date     | Thời gian đồng bộ cuối                  |
| createdAt           | date     |                                          |
| updatedAt           | date     |                                          |

**Sub-document: `products[]`**

| Trường              | Kiểu     | Mô tả                  |
|---------------------|----------|------------------------|
| code                | string   | Mã dòng sản phẩm        |
| product             | string   | ID sản phẩm Calio       |
| sku                 | string   | Mã SKU                  |
| name                | string   | Tên sản phẩm             |
| price               | number   | Đơn giá                  |
| quantity            | number   | Số lượng                 |
| discount            | number   | Giảm giá                 |
| unit                | string   | Đơn vị tính              |
| desc                | string   | Mô tả                   |
| parent              | string   | ID sản phẩm cha           |
| autoPriceEnabled    | boolean  | Tự động giá              |
| attributes          | [Mixed]  | Thuộc tính               |
| modifiers           | [Mixed]  | Tuỳ chọn thêm             |
| index               | number   | Thứ tự                   |
| missingQuantity     | number   | Số lượng thiếu            |
| pointsEarned        | number   | Điểm tích lũy            |
| taxCode             | string   | Mã thuế                  |
| isPriceIncludesVAT  | boolean  | Giá đã bao gồm VAT       |
| commissionUser      | string   | NV hoa hồng              |
| commissionRate      | number   | Tỷ lệ hoa hồng           |
| commissionAmount    | number   | Tiền hoa hồng            |
| kitchenStatus       | string   | Trạng thái bếp            |

---

## Flow tạo đơn hàng (cho Frontend)

### Bước 1: Lấy dữ liệu tham chiếu

```bash
# Lấy danh sách khách hàng
GET /api/orders/customers?keyword=Nguyen&page=1&pageSize=10

# Lấy danh sách sản phẩm
GET /api/orders/products?keyword=Ba+Chi&page=1&pageSize=10

# Lấy danh sách trạng thái
GET /api/orders/statuses

# Lấy danh sách kho (warehouse ID cần lấy từ config hoặc Calio)
# Warehouse ID hiện tại: 66c5a66fb6d90a09096dd52b
# User ID hiện tại: 6703d061dbeb55108bec319d
```

### Bước 2: Tạo đơn hàng

```bash
POST /api/orders
Content-Type: application/json

{
  "status": "shipped",
  "customer": null,           // hoặc ID khách hàng từ bước 1
  "customerName": "Tên KH",
  "customerPhone": "0901234567",
  "autoCreateCustomer": true, // true nếu customer = null
  "code": "DH-001",
  "user": "6703d061dbeb55108bec319d",
  "warehouse": "66c5a66fb6d90a09096dd52b",
  "products": [
    {
      "code": "...",          // mã dòng sản phẩm từ Calio
      "product": "...",       // ID sản phẩm từ bước 1
      "sku": "...",
      "name": "...",
      "price": 45000,
      "quantity": 1,
      "discount": 0,
      "unit": "Lạng",
      "autoPriceEnabled": true,
      "attributes": [],
      "modifiers": [],
      "parent": null,
      "index": 1
    }
  ],
  "totalAmount": 45000,
  "shipFee": 0,
  "shippingEnabled": false,
  "paymentType": "cash",
  "tags": ["tu-den-lay"],
  "note": "Ghi chú",
  "desc": "Mô tả",
  "...": "các trường khác"
}
```

### Bước 3: Xem/Cập nhật đơn hàng

```bash
# Lấy chi tiết mới nhất từ Calio
GET /api/orders/:orderId/detail

# Cập nhật (gửi lại toàn bộ object + thay đổi)
PUT /api/orders/:orderId

# Lấy danh sách đơn từ DB nội bộ
GET /api/orders?page=1&pageSize=10
```

### Bước 4: Xóa đơn hàng (nếu cần)

```bash
DELETE /api/orders/:orderId
```

---

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân                     | Cách khắc phục                            |
|--------|----------------------------------|--------------------------------------------|
| 400    | Thiếu trường bắt buộc             | Kiểm tra lại request body                  |
| 400    | `code` đơn hàng bị trùng           | Dùng mã đơn hàng khác                      |
| 400    | `customer` ID không tồn tại        | Để `null` + `autoCreateCustomer: true`     |
| 400    | `warehouse` ID không hợp lệ        | Kiểm tra warehouse ID từ Calio              |
| 404    | Đơn hàng không tồn tại             | Kiểm tra lại orderId                        |
| 500    | Lỗi Calio API                     | Kiểm tra TOKEN trong .env                   |
| 500    | Lỗi kết nối MongoDB               | Kiểm tra MONGODB_URI trong .env            |

---

## API khác

### Upload file

```
POST /api/files/upload
```

Upload file PDF, DOC, DOCX (tối đa 10MB).

### Health check

```
GET /api/health
```

Kiểm tra server đang chạy.

```json
{ "success": true, "message": "Server is running" }
```

---

---

## Facebook Post Generation API

Base path: `/api/posts`

Hệ thống tự động tạo caption bài viết Facebook bằng Gemini AI dựa trên từ khóa, hỗ trợ upload ảnh và đăng lên Facebook Page. Các bài viết **không lưu vào database** - chỉ tạo tạm thời trong memory, nếu hủy thì bài viết sẽ bị xóa.

### Kiến trúc Facebook Post

```
Frontend → Backend (localhost:5000) → Gemini AI (tạo caption)
                    ↓
              Facebook Graph API (đăng bài)
```

**Flow hoạt động:**
1. Frontend gửi **từ khóa** (VD: "bánh hỏi") → Backend gọi Gemini AI tạo caption
2. Frontend có thể **tạo lại** caption nếu không ưng (cùng từ khóa hoặc khác)
3. Frontend **upload ảnh** (0-5 ảnh) gắn vào bài viết
4. Frontend bấm **Đăng Facebook** → Backend đăng bài + ảnh lên Facebook Page
5. Hoặc Frontend bấm **Hủy** → Backend xóa caption + ảnh tạm

---

### 1. Tạo caption từ từ khóa

```
POST /api/posts/generate
```

Gửi từ khóa, Gemini AI sẽ tạo caption theo phong cách Heo Quay Ngọc Hải (dựa trên rule.md).

**Request Body:**

| Trường  | Kiểu   | Mô tả                          |
|---------|--------|--------------------------------|
| keyword | string | Từ khóa cho caption (VD: "bánh hỏi", "heo quay") |

**Ví dụ:**

```bash
curl -X POST http://localhost:5000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{"keyword": "bánh hỏi"}'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "caption_1776658862169_eiv2hbjl6",
    "keyword": "bánh hỏi",
    "title": "🐷🔥 Bánh hỏi heo quay Ngọc Hải: Ăn là ghiền! 😋",
    "content": "Bánh hỏi dai dai, thơm thơm, ăn kèm heo quay da giòn rụm...\n\n🏪 Chi nhành:\n📍 43/6 Vân Đồn\n..."
  }
}
```

> **Lưu ý:** `id` được trả về để Frontend reference cho các API tiếp theo (upload ảnh, đăng bài, hủy). Caption chỉ lưu tạm trong memory server, sẽ mất khi restart.

---

### 2. Tạo lại caption (Regenerate)

```
POST /api/posts/regenerate
```

Tạo caption mới, có thể dùng cùng từ khóa cũ hoặc từ khóa mới.

**Request Body:**

| Trường  | Kiểu   | Mô tả                                              |
|---------|--------|----------------------------------------------------|
| id      | string | (Tùy chọn) ID caption cũ để lấy lại từ khóa        |
| keyword | string | (Tùy chọn) Từ khóa mới, ghi đè từ khóa cũ          |

> Phải cung cấp ít nhất 1 trong 2: `id` hoặc `keyword`. Nếu cung cấp cả 2, `keyword` sẽ được ưu tiên.

**Ví dụ - Tạo lại với cùng từ khóa:**

```bash
curl -X POST http://localhost:5000/api/posts/regenerate \
  -H "Content-Type: application/json" \
  -d '{"id": "caption_1776658862169_eiv2hbjl6"}'
```

**Ví dụ - Tạo lại với từ khóa mới:**

```bash
curl -X POST http://localhost:5000/api/posts/regenerate \
  -H "Content-Type: application/json" \
  -d '{"keyword": "heo quay da giòn"}'
```

**Response:** Giống API generate, trả về caption mới với `id` mới. Caption cũ sẽ bị xóa khỏi memory.

---

### 3. Lấy caption đang lưu

```
GET /api/posts/caption/:id
```

Lấy lại caption đã tạo trước đó (trường hợp Frontend cần refetch).

**URL Parameters:**

| Tham số | Kiểu   | Mô tả          |
|---------|--------|----------------|
| id      | string | ID caption      |

**Ví dụ:**

```bash
curl http://localhost:5000/api/posts/caption/caption_1776658862169_eiv2hbjl6
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "caption_1776658862169_eiv2hbjl6",
    "keyword": "bánh hỏi",
    "title": "🐷🔥 Bánh hỏi heo quay Ngọc Hải: Ăn là ghiền! 😋",
    "content": "...",
    "images": [],
    "imageUrls": [],
    "createdAt": "2026-04-20T..."
  }
}
```

**Error (caption không tồn tại):**

```json
{
  "success": false,
  "message": "Caption không tồn tại hoặc đã hết hạn"
}
```

---

### 4. Upload ảnh cho bài viết

```
POST /api/posts/upload-images
```

Upload 1-5 ảnh để gắn vào bài viết. Ảnh được lưu tạm thời trên server, sẽ bị xóa khi đăng bài hoặc hủy.

**Request:** `multipart/form-data`

| Trường    | Kiểu   | Mô tả                                    |
|-----------|--------|------------------------------------------|
| images    | File[] | 1-5 file ảnh (JPEG, PNG, GIF, WebP), tối đa 10MB mỗi file |
| captionId | string | (Tùy chọn) ID caption đã tạo để gắn ảnh vào |

**Ví dụ:**

```bash
curl -X POST http://localhost:5000/api/posts/upload-images \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "captionId=caption_1776658862169_eiv2hbjl6"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "captionId": "caption_1776658862169_eiv2hbjl6",
    "images": [
      "/uploads/facebook/fb_photo1-1776659078774-603340399.jpg",
      "/uploads/facebook/fb_photo2-1776659078775-603340400.jpg"
    ],
    "count": 2
  }
}
```

> **Lưu ý:**
> - Có thể upload ảnh nhiều lần (mỗi lần thêm ảnh vào caption).
> - Nếu không có `captionId`, ảnh vẫn được upload nhưng không gắn caption nào.
> - Ảnh chỉ chấp nhận định dạng: JPEG, PNG, GIF, WebP.
> - Tối đa 5 ảnh mỗi bài viết trên Facebook.

---

### 5. Đăng bài lên Facebook

```
POST /api/posts/publish
```

Đăng bài viết (có hoặc không có ảnh) lên Facebook Page. Sau khi đăng thành công, caption và ảnh tạm thời sẽ bị xóa khỏi server.

**Request Body:**

| Trường    | Kiểu   | Mô tả                                                        |
|-----------|--------|--------------------------------------------------------------|
| captionId | string | (Tùy chọn) ID caption đã tạo + upload ảnh                   |
| title     | string | (Tùy chọn) Tiêu đề bài viết, dùng nếu không có captionId     |
| content   | string | (Tùy chọn) Nội dung bài viết, dùng nếu không có captionId    |

> Nếu cung cấp `captionId`, hệ thống sẽ lấy title, content và ảnh từ caption đó. Nếu không có `captionId`, phải cung cấp `title` và/hoặc `content`.

**Ví dụ - Đăng bài từ caption đã tạo:**

```bash
curl -X POST http://localhost:5000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{"captionId": "caption_1776658862169_eiv2hbjl6"}'
```

**Ví dụ - Đăng bài với nội dung tùy chỉnh (không qua Gemini):**

```bash
curl -X POST http://localhost:5000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🔥 Khuyến mãi hôm nay!",
    "content": "Heo quay giá sốc chỉ 35k/phần 🐷\nGọi ngay 0766 666 656!"
  }'
```

**Response thành công:**

```json
{
  "success": true,
  "data": {
    "postId": "880418671830392_122125565757213617",
    "message": "Đăng bài lên Facebook thành công!"
  }
}
```

**Response lỗi (Facebook API lỗi):**

```json
{
  "success": false,
  "message": "Lỗi khi đăng bài lên Facebook",
  "error": {
    "error": {
      "message": "...",
      "type": "OAuthException",
      "code": 1
    }
  }
}
```

> **Lưu ý quan trọng:**
> - Sau khi đăng thành công, caption và ảnh tạm thời trên server sẽ bị xóa.
> - `postId` trả về là ID bài viết trên Facebook, có thể dùng để truy xuất bài viết.
> - Nếu không có ảnh, bài viết sẽ đăng dưới dạng text-only.

---

### 6. Hủy bài viết (Discard)

```
DELETE /api/posts/cancel/:id
```

Hủy caption, xóa ảnh tạm thời đã upload. Bài viết sẽ không được đăng lên Facebook.

**URL Parameters:**

| Tham số | Kiểu   | Mô tả      |
|---------|--------|------------|
| id      | string | ID caption  |

**Ví dụ:**

```bash
curl -X DELETE http://localhost:5000/api/posts/cancel/caption_1776658862169_eiv2hbjl6
```

**Response:**

```json
{
  "success": true,
  "message": "Caption đã được hủy và xóa"
}
```

> **Lưu ý:** Hành động này không thể hoàn tác. Tất cả ảnh đã upload cho caption này sẽ bị xóa khỏi server.

---

### 7. Kiểm tra thông tin Facebook Page

```
GET /api/posts/page-info
```

Lấy thông tin Facebook Page đang kết nối (dùng để verify token).

**Ví dụ:**

```bash
curl http://localhost:5000/api/posts/page-info
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "880418671830392",
    "name": "Tin tức 24h",
    "link": "https://www.facebook.com/880418671830392",
    "picture": { "data": { "url": "..." } }
  }
}
```

---

## Flow tạo bài viết Facebook (cho Frontend)

### Flow chính:

```
1. Tạo caption:  POST /api/posts/generate { keyword: "bánh hỏi" }
                    ↓ trả về { id, title, content }
                    
2a. Nếu ưng:     Upload ảnh (optional): POST /api/posts/upload-images
                    ↓
                 Đăng bài:   POST /api/posts/publish { captionId }
                    ↓ trả về { postId }
                    
2b. Nếu không ưng: Tạo lại: POST /api/posts/regenerate { id }
                    ↓ trả về caption mới
                    
2c. Nếu không muốn đăng: Hủy: DELETE /api/posts/cancel/:id
```

### Code example (Frontend):

```javascript
// 1. Tạo caption
const generateRes = await fetch('/api/posts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ keyword: 'bánh hỏi' })
});
const { data: caption } = await generateRes.json();

// 2a. Nếu không ưng → tạo lại
const regenRes = await fetch('/api/posts/regenerate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: caption.id })  // dùng lại từ khóa cũ
});
const { data: newCaption } = await regenRes.json();

// 3. Upload ảnh (nếu có)
const formData = new FormData();
formData.append('captionId', caption.id);
photos.forEach(photo => formData.append('images', photo));
const uploadRes = await fetch('/api/posts/upload-images', {
  method: 'POST',
  body: formData
});

// 4. Đăng Facebook
const publishRes = await fetch('/api/posts/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ captionId: caption.id })
});

// HOẶC hủy bài
// await fetch(`/api/posts/cancel/${caption.id}`, { method: 'DELETE' });
```

---

## Lỗi thường gặp (Facebook Post API)

| Mã lỗi | Nguyên nhân                            | Cách khắc phục                              |
|--------|-----------------------------------------|----------------------------------------------|
| 400    | Từ khóa trống                           | Nhập từ khóa cho caption                      |
| 400    | Upload file không phải ảnh              | Chỉ chấp nhận JPEG, PNG, GIF, WebP            |
| 400    | Quá 5 ảnh                               | Giới hạn tối đa 5 ảnh mỗi bài                |
| 404    | Caption ID không tồn tại                | Caption đã hủy hoặc server đã restart         |
| 500    | Gemini API lỗi                          | Kiểm tra API_KEY_GEMINI trong .env            |
| 500    | Facebook API lỗi (OAuthException)       | Kiểm tra FB_TOKEN trong .env, token có thể hết hạn |
| 500    | Facebook API lỗi (unknown)              | Thử lại, kiểm tra quyền Page access token     |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **External APIs:**
  - Calio (clientapi.phonenet.io) - Quản lý đơn hàng
  - Google Gemini AI - Tạo caption bài viết
  - Facebook Graph API - Đăng bài lên Fanpage
- **Auth:** Header `Token` gửi tới Calio API | `API_KEY_GEMINI` | `FB_TOKEN`