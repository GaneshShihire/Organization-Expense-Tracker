

# Corporate Expense Ledger & Team Auditing Suite

A multi-tenant, full-stack corporate expense tracking and audit platform designed for seamless financial bookkeeping and organizational management. Engineered using React, Vite, Tailwind CSS, Express, and jsPDF.

## 🌟 Key Features

*   **Multi-Role Hierarchy**:
    *   👑 **Owner**: Absolute oversight of the system. Can register accountants, manage company metadata, and audit accountant/organization credentials (including IDs and raw security passwords).
    *   💼 **Accountant**: Manage operational categories/projects, register employees, approve/reject transactions, and look up team profiles (email, password, and transaction history).
    *   🧑‍💼 **Employee**: Dynamic submission forms with image receipt attachments, status logs, and immediate data persistence.
*   **Decentralized Downloads**: Every single transaction report is downloadable individually in both production-ready PDF format and CSV spreadsheet format directly from the main submission table.
*   **Brand Customization**: Fully integrated FileReader engine that allows owners and accountants to upload base64 corporate brand images as circular logo headers on all documents.
*   **Security Blocking Protocol**: Custom error banners and request rejections on login:
    *   Employees blocked by Accountants see: `"you are blocked please contact to your accountants"`
    *   Accountants blocked by Owners see: `"you are blocked please contact to 9021474371 or shihireganesh0@gmail.com to unblock"`

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/31b1e01f-db7a-45db-a9da-510f5a5ebafb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
