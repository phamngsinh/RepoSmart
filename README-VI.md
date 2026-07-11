<div align="center">
  <img src="https://raw.githubusercontent.com/tauri-apps/tauri/HEAD/app-icon.png" width="128" alt="PNS Repo Smart Logo" />
  <h1>PNS Repo Smart</h1>
  <p><strong>Một ứng dụng quản lý Git Repository trên Desktop siêu tốc, được xây dựng với Rust & Tauri.</strong></p>

  [![License: Apache 2.0 with Commons Clause](https://img.shields.io/badge/License-Apache%202.0%20(Commons%20Clause)-blue.svg)](LICENSE)
  [![Built with Tauri](https://img.shields.io/badge/Built_with-Tauri-FFC131.svg?logo=tauri)](https://tauri.app/)
  [![Built with React](https://img.shields.io/badge/Frontend-React%20%2B%20TailwindCSS-61DAFB.svg?logo=react)](https://react.dev/)

  [English](README.md) | **Tiếng Việt**
</div>

---

## 💡 PNS Repo Smart là gì?

**PNS Repo Smart** là một giao diện đồ họa (GUI) quản lý nhiều Git Repository hiện đại, gọn nhẹ và cực kỳ nhanh. Được thiết kế dành cho các lập trình viên thường xuyên phải làm việc với hàng tá dự án cùng lúc, ứng dụng sẽ tự động quét thư mục của bạn, tự động gom nhóm các dự án và trực quan hóa lịch sử commit phức tạp bằng một đồ thị vô cùng bắt mắt.

Thay vì sử dụng các phần mềm nặng nề nền tảng Electron, PNS Repo Smart sử dụng **Tauri** và **Rust** để mang lại hiệu năng Native cho máy tính của bạn, tối ưu hóa tối đa dung lượng RAM và CPU.

---

## ✨ Tính năng nổi bật

- 🚀 **Tốc độ siêu tốc**: Được trợ lực bởi Rust và thư viện `git2-rs`, đảm bảo việc quét thư mục và các thao tác Git diễn ra ngay lập tức.
- 📁 **Tự động quét thông minh**: Chỉ cần chọn thư mục cha, ứng dụng sẽ tự động tìm kiếm mọi dự án chứa thư mục `.git` nằm trong đó (hỗ trợ quét sâu tới 3 cấp).
- 🗂️ **Nhóm Repository (Sắp ra mắt)**: Sắp xếp và phân loại không gian làm việc của bạn thành các nhóm logic.
- 🌳 **Đồ thị Git tương tác**: Trực quan hóa các branch, commit và merge một cách tuyệt đẹp và có thể tương tác trực tiếp bằng thư viện (`@xyflow/react`).
- 🎨 **Giao diện hiện đại**: Giao diện Dark-mode Native thanh lịch, được xây dựng bởi Tailwind CSS v4.
- 🔒 **Quyền riêng tư tuyệt đối**: 100% mọi dữ liệu đều chạy và lưu ở máy tính cá nhân của bạn (Offline-first). Ứng dụng không bao giờ gửi bất kỳ dữ liệu nào lên Cloud.

---

## 🛠️ Công nghệ sử dụng

- **Core/Backend**: [Rust 🦀](https://www.rust-lang.org/) + [Tauri 2.0](https://tauri.app/) + [`git2`](https://crates.io/crates/git2)
- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Đồ thị Git**: [React Flow (`@xyflow/react`)](https://reactflow.dev/)

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

Hãy đảm bảo bạn đã cài đặt các thành phần sau trước khi bắt đầu:
- [Node.js](https://nodejs.org/) (phiên bản v18 trở lên)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (cargo)
- C++ Build Tools (Nếu bạn dùng hệ điều hành Windows)

### Cài đặt và khởi chạy

1. **Tải mã nguồn (Clone)**
   ```bash
   git clone https://github.com/your-username/pns-repo-smart.git
   cd pns-repo-smart
   ```

2. **Cài đặt thư viện Frontend**
   ```bash
   pnpm install
   ```

3. **Chạy ứng dụng trong môi trường dev**
   ```bash
   pnpm tauri dev
   ```

4. **Build đóng gói ứng dụng (Production)**
   ```bash
   pnpm tauri build
   ```
   *Ứng dụng bản chuẩn sau khi build xong sẽ nằm ở thư mục `src-tauri/target/release/bundle/`.*

---

## 📜 Giấy phép bản quyền

**PNS Repo Smart** được phát hành dưới bản quyền giấy phép **Apache License 2.0 với điều khoản Commons Clause**. 

Điều này có nghĩa là:
- ✅ Bạn **ĐƯỢC PHÉP** sử dụng, xem mã nguồn, tùy chỉnh và chia sẻ phần mềm này hoàn toàn miễn phí.
- ❌ Bạn **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** bán phần mềm này hay thương mại hóa nó dưới bất kỳ hình thức nào (VD: cung cấp như một phần mềm trả phí để kiếm lợi nhuận).

Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 💖 Ủng hộ (Donate)

Nếu bạn thấy dự án này hữu ích và giúp bạn tiết kiệm thời gian, hãy cân nhắc "mời" tôi một ly cà phê để lấy động lực phát triển nhé!

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/phamngsinh)
[![Open Collective](https://img.shields.io/badge/Open_Collective-reposmart-7FADF2?style=for-the-badge&logo=open-collective&logoColor=white)](https://opencollective.com/reposmart)

Mọi sự ủng hộ của bạn đều vô cùng đáng quý và giúp dự án mã nguồn mở này tiếp tục phát triển mạnh mẽ hơn!

### Qua PayPal
Bạn có thể ủng hộ trực tiếp thông qua tài khoản PayPal dưới đây:  
📧 **`phamngsinh39@gmail.com`**

### Quyên góp qua Crypto
Nếu bạn muốn dùng tiền mã hóa (crypto), bạn có thể gửi **USDT (TRC20)** vào địa chỉ dưới đây:

**Địa chỉ ví:** `TPzdDfJ6n1ea3ix17dPhMigusfsk6KNL6C`  
*(Mạng lưới: Tron / TRC20)*

<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TPzdDfJ6n1ea3ix17dPhMigusfsk6KNL6C" width="150" alt="USDT TRC20 QR Code" />
