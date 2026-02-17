## Tech Stack

# Frontend

React (Vite)
Tailwind CSS
ESLint + Prettier

# Backend

Node.js
Express
MongoDB (Mongoose)
dotenv

# Tooling

Concurrently (run client + server together)
GitHub PR workflow
Branch protection on main

## Project Structure

StudentPowerup/
│
├── client/ # React + Vite + Tailwind
├── server/ # Express API + MongoDB
├── package.json # Root scripts (concurrently)
└── README.md

## Installation

# Clone Repo

git clone [<repo-url>](https://github.com/g-gales/application-project)
cd StudentPowerup

# Install Root Dependencies

npm install

# Install Frontend and Backend Dependencies

npm --prefix client install
npm --prefix server install

## Running the Project

npm run dev

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
