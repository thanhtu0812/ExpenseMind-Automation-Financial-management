# ExpenseMind – Automatic Expense Management System

ExpenseMind is a smart expense management system that allows users to track income and expenses, create automatic reports, and receive personalized spending suggestions. The application supports data entry in text and images, and integrates an AI chatbot that can understand both Vietnamese and English.

---

## Features

- **Smart expense entry:**
  Enter expenses in text (e.g., "Buy coffee 25k", "Pay rent 1 million") or image/file. The system automatically recognizes the amount, date, category, and description. Missing data will be added by default.
- **AI Chatbot:**
  Answer questions about expenses, e.g., "How much money did I spend last week?", and provide instant analysis and statistics.
- **Personalized spending suggestions:**
  Based on spending history, the system analyzes unusual expenses, provides suggested savings levels, and warns of overspending.
- **Automatic & on-demand reporting:**
  Schedule PDF/CSV reports to be sent via email or generate instant reports as requested by the user.
- **Set reminders**
  Users can set reminders on a calendar and receive reminders via email so they don't miss important things.

---

## Technology Stack

- **Frontend:** ReactJS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication & Security:** bcrypt / bcryptjs, JSON Web Token (JWT)
- **File Upload & Processing:** Multer, body-parser
- **Email & PDF Reports:** nodemailer, mailer, pdfkit
- **Task Scheduling:** node-cron
- **AI Integration:** @google/generative-ai
- **Utilities:** dotenv, axios, nodemon

---

## Installation

1. Clone repository:

```bash
git clone https://github.com/thanhtu0812/ExpenseMind-Automation-Financial-management.git
```

2. Install dependencies:

```bash
cd ExpenseMind/backend
npm install
```

4. Run server:

```bash
npm run dev
```
