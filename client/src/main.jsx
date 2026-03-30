import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// user login imports
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { TimerProvider } from "./context/TimerContext.jsx";
import { CourseProvider } from "./context/CourseContext.jsx";

// routing imports
import { BrowserRouter } from "react-router-dom";

import "./index.css";

// notifications
import { Toaster } from "react-hot-toast";

// Google Client ID from the local env variable - needed for the Google Login
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <TimerProvider>
            <CourseProvider>
              <Toaster
                toastOptions={{
                  style: {
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    border: "1px border var(--border)",
                    borderRadius: "var(--radius)",
                  },
                  success: {
                    iconTheme: {
                      primary: "var(--primary)",
                      secondary: "var(--primary-contrast)",
                    },
                  },
                }}
              />
              <App />
            </CourseProvider>
          </TimerProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
