# Student PowerUp

A full-stack academic productivity application built with the MERN stack and Vite.

## Live version: https://application-project-1.onrender.com

## Project Structure

This is a **monorepo** setup:
- `/server`: Node.js/Express backend API.
- `/client`: React frontend built with Vite and Tailwind CSS.
- `/`: Root folder containing orchestration scripts to run both frontend and backend with `npm run dev`.

---

## Local Setup Instructions

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

```bash
git clone https://github.com/g-gales/application-project.git
cd application-project
```

### 2. Install Dependencies
You need to install packages in three locations. Open your terminal in the project root and run:

```bash
# Install root tools (concurrently)
npm install

# Install Backend dependencies
cd server
npm install

# Install Frontend dependencies
cd ../client
npm install
```
### 3. Environment variables
Inside /server the .env file must contain:
* PORT=3001
* MONGODB_URI
* GOOGLE_CLIENT_ID
* FRONTEND_ORIGIN=http://localhost:5173

Inside /client the .env file must contain:
* VITE_GOOGLE_CLIENT_ID
* VITE_API_BASE_URL=https://application-project-1.onrender.com

### 4. Run project on localhost

In root folder run `npm run dev` and a Vite will run on port 5173 while the server on port 3001.
