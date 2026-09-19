# 📦 Smart Inventory Management System

A full-stack **Smart Inventory Management System** that combines inventory management, role-based access control, stock monitoring, alerts, reporting, and machine-learning-based inventory analysis into a centralized platform.

The system is designed to help organizations manage products efficiently, monitor stock levels, identify low-stock and maintain transaction history, and support inventory decisions using data-driven insights.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based access control
* Admin and Employee roles
* Protected API endpoints
* Secure user access management

### 📦 Product & Inventory Management

* Add, update, view, and manage products
* Unique SKU-based product identification
* Track current stock levels
* Minimum stock threshold management
* Stock In / Stock Out operations
* Inventory transaction history

### ⚠️ Smart Alerts

* Low-stock alerts
* Product expiry monitoring
* Identification of critical and expired products
* Automated inventory notifications


### 🤖 Machine Learning & Analytics

The ML component provides intelligent inventory analysis, including:

* Demand forecasting
* Moving-average-based demand analysis
* Forecasting for future inventory requirements
* Anomaly detection
* Smart inventory recommendations
* Reorder analysis

The system supports demand prediction for future planning and inventory optimization.

### 📊 Reports

* Inventory reports
* Stock movement reports
* Low-stock reports
* Expiry-related reports
* PDF report generation
* CSV report generation

---

## 🏗️ System Architecture
<img width="5052" height="6333" alt="diagram (1)" src="https://github.com/user-attachments/assets/73d55fd5-d898-469c-be74-4a04c95a3cb4" />


```text
                    ┌───────────────────────┐
                    │       Frontend        │
                    │   React + Vite        │
                    └───────────┬───────────┘
                                │
                                │ REST APIs
                                ▼
                    ┌───────────────────────┐
                    │       Backend         │
                    │ Java + Spring Boot    │
                    │ JWT Authentication    │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌─────────────┐       ┌──────────────┐
             │   MongoDB   │       │  ML Service  │
             │   Database  │       │    Python    │
             └─────────────┘       └──────────────┘
```

---

## 🛠️ Technologies Used

### Backend

* Java
* Spring Boot
* Spring Data
* Spring Security
* JWT
* REST APIs
* Maven
* MongoDB

### Frontend

* React
* Vite
* JavaScript
* HTML
* CSS
* Axios

### Machine Learning

* Python
* Data analysis
* Demand forecasting
* Moving Average
* Anomaly detection
* Inventory analytics

### Development Tools

* Git
* GitHub
* Postman
* IntelliJ IDEA / VS Code
* Maven
* npm

---

## 📂 Project Structure

```text
Smart-Inventory-Management/
│
├── SIM-backend/
│   ├── src/
│   ├── pom.xml
│   └── ...
│
├── SIM-frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── ...
│
├── SIM-ML/
│   ├── ...
│   └── requirements.txt
│
├── docs/
│   └── Project Documentation
│
├── Internship_Completion_Report.pdf
├── LICENSE
├── .gitignore
└── README.md
```

---

## 🔑 User Roles

### 👨‍💼 Admin

The Admin can:

* Manage users
* Manage products
* Monitor inventory
* Manage stock
* View alerts
* View reports
* Monitor inventory analytics

### 👨‍💻 Employee

The Employee can:

* View products
* Perform stock operations
* Monitor inventory
* View stock information
* View relevant alerts
* Access permitted inventory features

---

## 📦 Inventory Workflow

```text
Add Product
     ↓
Set Minimum Stock
     ↓
Stock In
     ↓
Inventory Updated
     ↓
Monitor Stock
     ↓
Low Stock 
     ↓
Alert Generated
     ↓
ML-Based Analysis
     ↓
Demand / Reorder Insight
```

---

## 🤖 Machine Learning Module

The `SIM-ML` component is responsible for intelligent inventory analysis.

### Demand Forecasting

Historical inventory or sales information can be analyzed to estimate future demand.

The system can use moving-average-based forecasting to identify expected demand trends.

### Anomaly Detection

The system can identify unusual inventory patterns that may require additional attention.

### Smart Reordering

Inventory information can be used to support reorder decisions by considering factors such as:

* Current stock
* Minimum stock level
* Historical demand
* Forecasted demand
* Reorder requirements

---

## 🔌 Backend

The backend is implemented using **Java and Spring Boot** and exposes REST APIs consumed by the frontend.

Major responsibilities include:

* Authentication
* Authorization
* Product management
* Inventory management
* Stock transactions
* Alerts
* Reports
* Database operations
* ML integration

---

## 💻 Frontend

The frontend is built using **React and Vite**.

It provides interfaces for:

* Login
* Dashboard
* Product management
* Inventory management
* Stock operations
* Alerts
* Reports
* Analytics

---

## 🗄️ Database

The application uses **MongoDB** for storing application data.

The database stores information related to:

* Users
* Products
* Inventory
* Stock transactions
* Alerts
* Other application records

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure the following are installed:

* Java JDK
* Maven
* Node.js and npm
* Python
* MongoDB
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/SoundaryanA46/Smart-Inventory-Management.git
```

Navigate into the project:

```bash
cd Smart-Inventory-Management
```

---

# 2. Backend Setup

Navigate to the backend:

```bash
cd SIM-backend
```

Configure your MongoDB connection and other environment-specific settings.

Then run:

```bash
mvn spring-boot:run
```

The backend will start on the configured Spring Boot port.

---

# 3. Frontend Setup

Open another terminal and navigate to:

```bash
cd SIM-frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the URL displayed by Vite.

---

# 4. ML Setup

Navigate to the ML directory:

```bash
cd SIM-ML
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Run the ML application using the entry point configured in the `SIM-ML` directory.

---

## 🔒 Environment Variables

Do not commit passwords, API keys, database credentials, JWT secrets, or other sensitive information to GitHub.

Use an environment file locally where appropriate.

Example:

```env
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
```

For public repositories, use an `.env.example` file containing placeholders rather than real credentials.

---

## 📸 Screenshots

* Login page
<img width="1875" height="900" alt="Screenshot 2026-04-15 142253" src="https://github.com/user-attachments/assets/869f4d91-e352-46bc-8072-7c20ae691151" />
<img width="1454" height="815" alt="image" src="https://github.com/user-attachments/assets/524d41dc-4d53-4780-8ff3-f88d4867d902" />
* Admin dashboard
  <img width="1437" height="793" alt="image" src="https://github.com/user-attachments/assets/b1f245a3-0795-4a8d-9f08-81d5cc114c44" />

* Employee dashboard
  <img width="1437" height="841" alt="image" src="https://github.com/user-attachments/assets/737370a8-b13a-47e1-9ff8-e7f10e4d85cb" />
* Product management
  <img width="1454" height="794" alt="image" src="https://github.com/user-attachments/assets/790c7c32-4e99-466f-90ba-5e4b60926118" />

* Transactions management
  <img width="1454" height="794" alt="image" src="https://github.com/user-attachments/assets/0641818c-adfa-4318-8543-650c42e9c6e2" />
* Low-stock alerts
  <img width="1437" height="772" alt="image" src="https://github.com/user-attachments/assets/750accdc-52dc-4aa8-85ac-6ea9cc0dbd34" />

* ML analytics
   <img width="1423" height="794" alt="image" src="https://github.com/user-attachments/assets/90a88929-934c-4e12-b2e1-28f37c44febf" />

* Reports
   <img width="1437" height="801" alt="image" src="https://github.com/user-attachments/assets/badd45f4-a752-43fc-a7d9-994b0557140c" />


Example:

```markdown
![Dashboard](docs/screenshots/dashboard.png)
```

---

## 📄 Documentation

Additional project documentation is available in the [`docs`](./docs) directory.

The project also includes the internship completion report:

[`Internship Completion Report`](./Internship_Completion_Report.pdf)

---

## 👥 Project

This project was developed as a collaborative team project.

### Contributors

* Soundaryan Anbalagan
* Vishaal Saravanakumar
* Utkarsh

---

## 📜 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](./LICENSE) file for details.

---

## ⭐ Project Highlights

```text
✔ Full-stack inventory management
✔ Java + Spring Boot backend
✔ React + Vite frontend
✔ MongoDB database
✔ JWT authentication
✔ Role-based access control
✔ Stock management
✔ Low-stock alerts
✔ PDF / CSV reporting
✔ Machine learning integration
✔ Demand forecasting
✔ Anomaly detection
```

---

## 🔗 Repository

GitHub :

https://github.com/SoundaryanA46/Smart-Inventory-Management

🚀 Live Demo :

[https://Smart-Inventory-System-url.com](https://smart-inventory-management-frontend.vercel.app/)

