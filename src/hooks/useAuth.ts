import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  loginWithGoogle,
  registerWithEmail,
  loginWithEmailOrUsername,
  logoutUser,
  auth,
} from "../../firebase";

/**
 * Hook para gerenciar autenticação e estado do usuário
 *
 * Responsabilidades:
 * - Listener de autenticação (onAuthStateChanged)
 * - Login com Google, Email, Username
 * - Logout
 * - Estados de erro e loading
 */

export type AuthMode = "hidden" | "login" | "register" | "loading";

interface UseAuthReturn {
  currentUser: User | null;
  authMode: AuthMode;
  authError: string;
  isSyncing: boolean;
  setAuthMode: (mode: AuthMode) => void;
  setAuthError: (error: string) => void;
  handleAuthAction: (
    type: "login" | "register",
    identifier: string,
    email?: string,
    password?: string
  ) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("loading");
  const [authError, setAuthError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    if (!auth) {
      console.warn("⚠️ Auth não inicializado");
      setAuthMode("login");
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          setAuthMode("hidden");
        } else {
          setAuthMode("login");
        }
      } catch (error) {
        console.error("❌ Erro no auth state changed:", error);
        setAuthMode("login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthAction = async (
    type: "login" | "register",
    identifier: string,
    email?: string,
    password?: string
  ) => {
    setAuthError("");
    setIsSyncing(true);

    try {
      if (type === "register") {
        if (!email || !password || !identifier) {
          throw new Error("MISSING_FIELDS");
        }
        await registerWithEmail(email, password, identifier);
      } else {
        if (!identifier || !password) {
          throw new Error("MISSING_FIELDS");
        }
        await loginWithEmailOrUsername(identifier, password);
      }
    } catch (error: any) {
      let msg = "Erro desconhecido";
      const errCode = error.code || "";
      const errMsg = error.message || "";

      if (errCode.includes("permission-denied")) {
        msg = "Erro de Segurança do Banco de Dados";
      } else if (errMsg === "USERNAME_TAKEN") {
        msg = "Este nome de usuário já está em uso";
      } else if (errMsg === "USER_NOT_FOUND") {
        msg = "Usuário não encontrado";
      } else if (errCode === "auth/invalid-email") {
        msg = "Email inválido";
      } else if (errCode === "auth/wrong-password") {
        msg = "Senha incorreta";
      } else if (errCode === "auth/weak-password") {
        msg = "Senha muito fraca (mín 6 caracteres)";
      }

      setAuthError(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setAuthMode("login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return {
    currentUser,
    authMode,
    authError,
    isSyncing,
    setAuthMode,
    setAuthError,
    handleAuthAction,
    handleLogout,
  };
};
