<div align="center">
  <img src="https://raw.githubusercontent.com/tauri-apps/tauri/HEAD/app-icon.png" width="128" alt="PNS Repo Smart Logo" />
  <h1>PNS Repo Smart</h1>
  <p><strong>A blazingly fast, native Desktop Git Repository Manager built with Rust & Tauri.</strong></p>

  [![License: Apache 2.0 with Commons Clause](https://img.shields.io/badge/License-Apache%202.0%20(Commons%20Clause)-blue.svg)](LICENSE)
  [![Built with Tauri](https://img.shields.io/badge/Built_with-Tauri-FFC131.svg?logo=tauri)](https://tauri.app/)
  [![Built with React](https://img.shields.io/badge/Frontend-React%20%2B%20TailwindCSS-61DAFB.svg?logo=react)](https://react.dev/)

  **English** | [Tiếng Việt](README-VI.md)
</div>

---

## 💡 What is PNS Repo Smart?

**PNS Repo Smart** is a modern, lightweight, and incredibly fast graphical user interface (GUI) for managing multiple Git repositories. Designed for developers who juggle dozens of projects, it automatically scans your directories, groups your repositories, and visualizes complex commit histories in an elegant graph.

Instead of running slow Electron-based clients, PNS Repo Smart uses **Tauri** and **Rust** to provide native desktop performance with minimal RAM and CPU footprint.

---

## ✨ Features

- 🚀 **Blazing Fast**: Powered by Rust and `git2-rs`, ensuring instantaneous repository scanning and git operations.
- 📁 **Smart Auto-Discovery**: Select a parent folder and automatically discover all `.git` projects inside it (up to 3 levels deep).
- 🗂️ **Repository Grouping (Coming Soon)**: Organize your active workspaces into logical groups.
- 🌳 **Interactive Git Graph**: Visualize branches, commits, and merges using a beautifully rendered, interactive node-based graph (`@xyflow/react`).
- 🎨 **Modern UI**: A sleek, dark-mode native interface built with Tailwind CSS v4.
- 🔒 **Privacy First**: Everything runs 100% offline on your local machine. No data is sent to the cloud.

---

## 🛠️ Tech Stack

- **Core/Backend**: [Rust 🦀](https://www.rust-lang.org/) + [Tauri 2.0](https://tauri.app/) + [`git2`](https://crates.io/crates/git2)
- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualization**: [React Flow (`@xyflow/react`)](https://reactflow.dev/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (cargo)
- C++ Build Tools (if on Windows)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pns-repo-smart.git
   cd pns-repo-smart
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm tauri dev
   ```

4. **Build for production**
   ```bash
   pnpm tauri build
   ```
   *Your compiled executable will be located in `src-tauri/target/release/bundle/`.*

---

## 📜 License

**PNS Repo Smart** is released under the **Apache License 2.0 with Commons Clause**. 

This means:
- ✅ You **CAN** use, read, modify, and distribute the software for free.
- ❌ You **CANNOT** sell the software or commercialize it (e.g., offering it as a paid service).

See the [LICENSE](LICENSE) file for more details.

---

## 💖 Support & Donate

If you find this project helpful and it saves your time, consider buying me a coffee or supporting the development!

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/phamngsinh)
[![Open Collective](https://img.shields.io/badge/Open_Collective-reposmart-7FADF2?style=for-the-badge&logo=open-collective&logoColor=white)](https://opencollective.com/reposmart)

Your support is greatly appreciated and helps keep the project open-source!

### PayPal
You can support the project via PayPal by sending to this email:  
📧 **`phamngsinh39@gmail.com`**

### Crypto Donation
If you prefer crypto, you can send **USDT (TRC20)** to the address below:

**Address:** `TPzdDfJ6n1ea3ix17dPhMigusfsk6KNL6C`  
*(Network: Tron / TRC20)*

<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TPzdDfJ6n1ea3ix17dPhMigusfsk6KNL6C" width="150" alt="USDT TRC20 QR Code" />

---

## 📞 Contact & Feature Requests

If you would like to submit a new feature request, propose a custom function, or just want to say hi, please feel free to contact me directly:

- **Telegram:** [@phamngsinh](https://t.me/phamngsinh)
