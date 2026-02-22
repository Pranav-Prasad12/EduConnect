# 🎓 EduConnect

EduConnect is a full-stack web application designed to help students easily upload, discover, and share study notes. 

## 🚀 Features
* **User Profiles:** Secure profile creation and login state management.
* **File Handling:** Upload and view PDF and Image study notes seamlessly.
* **Smart Search:** Live search bar to filter notes dynamically by title or subject.
* **Data Management:** A secure, permanent delete function that safely removes data from both the SQLite database and local server storage.

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3 (Custom responsive styling), Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **Database:** SQLite3
* **Middleware/Storage:** Multer (for secure file uploads), CORS

## 📋 Project Context
*This application was originally conceived as a college group project. However, I served as the **Sole Technical Developer** for this application, independently architecting and writing 100% of the codebase across the frontend, backend, and database systems.*

## ⚙️ How to Run Locally
1. Clone the repository to your local machine.
2. Ensure [Node.js](https://nodejs.org/) is installed.
3. Navigate to the project directory in your terminal.
4. Run `npm install express cors sqlite3 multer` to install the required dependencies.
5. Run `node server.js` to start the backend.
6. Open `index.html` via Live Server or your preferred local web server.