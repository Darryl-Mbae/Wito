import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAuth,
  onAuthStateChanged,
  getRedirectResult,
  type User,
} from "firebase/auth";
import app from "../config/firebase";
import { ensureUserProfile } from "../lib/auth/ensureUserProfile";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  redirectHandled: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  redirectHandled: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectHandled, setRedirectHandled] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    let unsub: (() => void) | undefined;

    const init = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await ensureUserProfile(result.user);
        }
      } catch (err) {
        console.error("Google redirect result error:", err);
      } finally {
        setRedirectHandled(true);
      }

      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            await ensureUserProfile(firebaseUser);
          } catch (err) {
            console.error("Profile sync failed:", err);
          }
        }
        setUser(firebaseUser);
        setLoading(false);
      });
    };

    init();

    return () => unsub?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, redirectHandled }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
