
# Capex Finance Management Website 📊💼

**Capex Finance** is a web-based platform developed to manage and streamline finance operations for Legacy IEDC at UCEK. This platform provides secure access and management of financial data, enabling efficient tracking of expenses and budgeting.

---

## 🌟 Features

- **👤 Superuser Control**: The superuser has full control over the platform, managing all finances, user accounts, and data.
- **🔒 User-Specific Access**: Users can only access the financial details specific to their accounts, with credentials (username and password) generated and managed by the superuser.
- **💸 Expense Management**: The superuser can add, edit, and delete expense records, ensuring up-to-date financial information.
- **👥 User Management**: The superuser can add new users, assign access levels, or remove users as needed.
- **📈 Data Export**: Financial data can be exported in Excel format for external reporting or analysis.

---

## 🚀 Getting Started

Follow these instructions to set up Capex Finance on your local machine.

### ⚙️ Prerequisites

- **Node.js**: Install Node.js v16 or higher.
- **npm**: Included with Node.js.
- **Firebase**: Required for the backend if using Firestore.

---

### 💻 Installation

1. Clone the Repository:
   - git clone https://github.com/username/capex-finance.git
   - cd capex-finance/backend

2. Install Dependencies:
   - npm install

3. Configure Environment:
   - Copy `.env.example` to `.env`
   - Update `SESSION_SECRET`, `PORT`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and Firebase settings as needed.

4. Start the Server:
   - Development mode:
     - npm run dev
   - Production mode:
     - npm start

5. Open the App:
   - Visit `http://localhost:3000`

---

## 🛠️ Usage

- **Superuser Functions**: The superuser can log in to the admin dashboard, manage user accounts, and control all financial records.
- **User Access**: Users can view and interact only with the finance details assigned to them by the superuser.
- **Exporting Data**: Export financial data in Excel format for easy reporting or record-keeping.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature (git checkout -b feature-name).
3. Commit your changes (git commit -m 'Add new feature').
4. Push to the branch (git push origin feature-name).
5. Open a pull request and describe your changes.

---


## 🙏 Acknowledgments

Special thanks to the team at Legacy IEDC UCEK for supporting the development of this project.

---


