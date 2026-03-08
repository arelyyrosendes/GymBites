import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

const googleProvider = new GoogleAuthProvider();

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOutUser: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async signInWithEmail(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
      },
      async signUpWithEmail(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
          setUser({ ...cred.user, displayName });
        } else {
          setUser(cred.user);
        }
        return cred.user;
      },
      async signInWithGoogle() {
        const cred = await signInWithPopup(auth, googleProvider);
        setUser(cred.user);
        return cred.user;
      },
      async signOutUser() {
        await signOut(auth);
        setUser(null);
      },
      async updateDisplayName(name) {
        if (!auth.currentUser) throw new Error("No authenticated user");
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser });
      },
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
