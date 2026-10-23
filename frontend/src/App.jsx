import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import LinkVault from "./components/LinkVault-refactored";
import { BrandLoader } from "./components/Loaders";
import { dbClear, setCacheOwner } from "./components/db-and-api";

// Auth pages are only needed when visited -> separate chunks keep the first
// load small. (axios + these pages' icons now load only with them.)
const loadLogin = () => import("./Context/Login");
const loadSignup = () => import("./Context/Signup");
const Login = lazy(loadLogin);
const Signup = lazy(loadSignup);
const VerifyOtp = lazy(() => import("./Context/VerifyOtp"));
const ForgotPassword = lazy(() => import("./Context/ForgotPassword"));

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

const API_USER_URL = `${API_BASE}/api/user`;

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
};

function safeGetItem(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to read "${key}"`, error);
    return null;
  }
}

function safeSetItem(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to write "${key}"`, error);
    return false;
  }
}

function safeRemoveItem(storage, key) {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove "${key}"`, error);
  }
}

function parseJSON(value, fallback = null) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("[Storage] Invalid JSON:", error);
    return fallback;
  }
}

// --------------------------------------------------
// Auth Storage
// --------------------------------------------------

function getStoredAuth() {
  const localToken = safeGetItem(localStorage, STORAGE_KEYS.TOKEN);
  const sessionToken = safeGetItem(sessionStorage, STORAGE_KEYS.TOKEN);

  const localUser = parseJSON(
    safeGetItem(localStorage, STORAGE_KEYS.USER),
    null,
  );

  const sessionUser = parseJSON(
    safeGetItem(sessionStorage, STORAGE_KEYS.USER),
    null,
  );

  if (localToken) {
    return {
      token: localToken,
      user: localUser,
      persistent: true,
    };
  }

  if (sessionToken) {
    return {
      token: sessionToken,
      user: sessionUser,
      persistent: false,
    };
  }

  return {
    token: null,
    user: null,
    persistent: false,
  };
}

function clearStoredAuth() {
  safeRemoveItem(localStorage, STORAGE_KEYS.USER);
  safeRemoveItem(localStorage, STORAGE_KEYS.TOKEN);

  safeRemoveItem(sessionStorage, STORAGE_KEYS.USER);
  safeRemoveItem(sessionStorage, STORAGE_KEYS.TOKEN);
}

// --------------------------------------------------
// Scroll To Top
// --------------------------------------------------

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
}

// --------------------------------------------------
// Public Only Route
// --------------------------------------------------

function PublicOnlyRoute({ user, token, children }) {
  if (user && token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function HomePage({ user, token, onLogout }) {
  const navigate = useNavigate();

  const handleLoginRedirect = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <LinkVault
      user={user}
      token={token}
      onLogout={onLogout}
      onLogin={handleLoginRedirect}
    />
  );
}


export default function App() {
  // Restore the session synchronously from storage -> UI renders instantly.
  // The token is verified in the background (see bootstrapAuth below).
  const [user, setUser] = useState(() => getStoredAuth().user);
  const [token, setToken] = useState(() => getStoredAuth().token);


  const persistAuth = useCallback((userData, tokenValue, remember = false) => {
    if (!tokenValue) {
      console.error("[Auth] Token is missing.");
      return false;
    }

    const targetStorage = remember ? localStorage : sessionStorage;

    const otherStorage = remember ? sessionStorage : localStorage;

    // Remove old auth from the other storage.
    safeRemoveItem(otherStorage, STORAGE_KEYS.USER);
    safeRemoveItem(otherStorage, STORAGE_KEYS.TOKEN);

    // Save user.
    const userSaved = userData
      ? safeSetItem(targetStorage, STORAGE_KEYS.USER, JSON.stringify(userData))
      : true;

    // Save token.
    const tokenSaved = safeSetItem(
      targetStorage,
      STORAGE_KEYS.TOKEN,
      tokenValue,
    );

    if (!userSaved || !tokenSaved) {
      console.error("[Auth] Failed to persist authentication.");
      return false;
    }

    setUser(userData || null);
    setToken(tokenValue);

    return true;
  }, []);

  // ------------------------------------------------
  // Logout
  // ------------------------------------------------

  const handleLogout = useCallback(() => {
    clearStoredAuth();

    // Don't leave this user's links sitting in the browser cache.
    dbClear().catch(() => {});
    setCacheOwner(null);

    setUser(null);
    setToken(null);
  }, []);

  // ------------------------------------------------
  // Bootstrap Authentication
  // ------------------------------------------------

  useEffect(() => {
    const storedAuth = getStoredAuth();

    // Nothing to verify.
    if (!storedAuth.token || !API_BASE) {
      if (storedAuth.token && !API_BASE) {
        console.warn("[Auth] API base URL is not configured.");
      }
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    (async () => {
      try {
        const response = await fetch(`${API_USER_URL}/me`, {
          headers: { Authorization: `Bearer ${storedAuth.token}` },
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          // Only real authorization failures log the user out.
          clearStoredAuth();
          dbClear().catch(() => {});
          setCacheOwner(null);
          setUser(null);
          setToken(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Profile request failed (${response.status})`);
        }

        const body = await response.json();

        // API replies { success, user } -> unwrap (older shape: the user itself).
        const profile = body?.user || body;

        if (!profile) {
          throw new Error("Invalid user profile received from server.");
        }

        // Refresh user info, keep the existing token + storage preference.
        persistAuth(profile, storedAuth.token, storedAuth.persistent);
      } catch (error) {
        // Network/server errors never log the user out.
        if (error?.name !== "AbortError") {
          console.warn("[Auth] Token validation failed:", error?.message);
        }
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [persistAuth]);

  // Warm up the auth pages while the browser is idle so Login/Signup open instantly.
  useEffect(() => {
    if (token) return undefined;

    const warm = () => {
      loadLogin();
      loadSignup();
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }

    const id = setTimeout(warm, 1500);
    return () => clearTimeout(id);
  }, [token]);

  // ------------------------------------------------
  // Login
  // ------------------------------------------------

  const handleLogin = useCallback(
    (userData, remember, tokenValue) => {
      const success = persistAuth(userData, tokenValue, remember);

      if (!success) {
        console.error("[Login] Authentication persistence failed.");

        return false;
      }

      return true;
    },
    [persistAuth],
  );

  // ------------------------------------------------
  // Signup
  // ------------------------------------------------

  const handleSignup = useCallback(
    (userData, remember, tokenValue) => {
      const success = persistAuth(userData, tokenValue, remember);

      if (!success) {
        console.error("[Signup] Authentication persistence failed.");

        return false;
      }

      return true;
    },
    [persistAuth],
  );

  // ------------------------------------------------
  // Routes
  // ------------------------------------------------

  return (
    <>
      <ScrollToTop />
      <Navbar user={user} onLogout={handleLogout} />
      <main className="pt-16">
        <Suspense fallback={<BrandLoader inline message="Loading…" />}>
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <HomePage user={user} token={token} onLogout={handleLogout} />
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute user={user} token={token}>
                <Login onLogin={handleLogin} />
              </PublicOnlyRoute>
            }
          />

          {/* Signup */}
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute user={user} token={token}>
                <Signup onSignup={handleSignup} />
              </PublicOnlyRoute>
            }
          />

          {/* Register -> Signup */}
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          {/* OTP Verification */}
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Forgot Password */}
          <Route path="/forgotpassword" element={<ForgotPassword />} />

          {/* Case-sensitive/legacy route */}
          <Route
            path="/ForgotPassword"
            element={<Navigate to="/forgotpassword" replace />}
          />

          {/* Unknown Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
    </>
  );
}
