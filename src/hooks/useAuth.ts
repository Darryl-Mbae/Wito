import { useState } from 'react';
import { useCreatUser } from './useFirestore';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    signOut
} from 'firebase/auth';
import app from '../config/firebase';

// Signup hook
export const useSignup = () => {
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const auth = getAuth(app);
    const { createUserProfile } = useCreatUser();

    const signup = async (
        email: string,
        password: string,
        name: string
    ) => {
        setError(null);
        setIsPending(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            if (user) {
                await updateProfile(user, { displayName: name });
            }

            if (!user.email) {
                throw new Error("User email is missing");
            }

            await createUserProfile(user.uid, {
                email: user.email,
                name: name,
            });

            setIsPending(false);
            return user;
        } catch (err: unknown) {
            const error = err as any;

            if (error.code === "auth/email-already-in-use") {
                setError("This email is already registered.");
            } else if (error.code === "auth/invalid-email") {
                setError("Please check your email formatting.");
            } else if (error.code === "auth/weak-password") {
                setError("The chosen password is too weak.");
            } else {
                setError(error?.message || "An authentication error occurred.");
            }

            setIsPending(false);
        }
    };

    return { signup, error, isPending, setError };
};

// Login Hook
export const useLogin = () => {
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const auth = getAuth(app);

    const login = async (email: string, password: string) => {
        setError(null);
        setIsPending(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            setIsPending(false);
            return userCredential.user;
        } catch (err: unknown) {
            const error = err as any;

            switch (error.code) {
                case "auth/invalid-credential":
                    setError("Invalid email or password. Please try again.");
                    break;
                case "auth/user-not-found":
                    setError("No account found with this email.");
                    break;
                case "auth/wrong-password":
                    setError("Incorrect password.");
                    break;
                case "auth/too-many-requests":
                    setError(
                        "Too many failed attempts. Try again later or reset password."
                    );
                    break;
                case "auth/invalid-email":
                    setError("The email address is invalid.");
                    break;
                case "auth/user-disabled":
                    setError("This account has been disabled.");
                    break;
                default:
                    setError("Failed to sign in. Please check your connection.");
            }

            setIsPending(false);
        }
    };

    return { login, error, isPending, setError };
};

// Google Sign in
export const useGoogleAuth = () => {
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [isGooglePending, setIsGooglePending] = useState(false);

    const auth = getAuth(app);
    const { createUserProfile } = useCreatUser(); // ← ADD THIS

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const loginWithGoogle = async () => {
        setGoogleError(null);
        setIsGooglePending(true);

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
            if (isMobile) {
                await signInWithRedirect(auth, provider);
                // execution stops here on mobile (page redirects)
            } else {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                // ← CREATE PROFILE for Google users (safe to call even if exists)
                await createUserProfile(user.uid, {
                    email: user.email!,
                    name: user.displayName ?? "",
                });

                setIsGooglePending(false);
                return user;
            }
        } catch (err: unknown) {
            const error = err as any;
            if (error.code === "auth/popup-closed-by-user") {
                setGoogleError("Sign-in cancelled.");
            } else if (error.code === "auth/account-exists-with-different-credential") {
                setGoogleError("Account exists with different login method.");
            } else {
                setGoogleError("Could not connect to Google.");
            }
            setIsGooglePending(false);
        }
    };

    const handleRedirectResult = async () => {
        // ← Don't set pending true here — only set it if a redirect actually happened
        try {
            const result = await getRedirectResult(auth);

            if (result) {
                setIsGooglePending(true);
                const user = result.user;


                // ← CREATE PROFILE for Google redirect users too
                await createUserProfile(user.uid, {
                    email: user.email!,
                    name: user.displayName ?? "",
                });

                setIsGooglePending(false);
                return user;
            }
        } catch (err: unknown) {
            const error = err as any;
            if (error.code === "auth/account-exists-with-different-credential") {
                setGoogleError("Account exists with different login method.");
            } else {
                setGoogleError("Google login failed.");
            }
            setIsGooglePending(false);
        }

        return null;
    };

    return {
        loginWithGoogle,
        handleRedirectResult,
        googleError,
        isGooglePending,
        setGoogleError,
    };
};

export const getUser = () => {
    const auth = getAuth(app);
    return auth.currentUser;
}
export const useLogout = () => {
    const auth = getAuth(app);
    const logout = () => {
        return signOut(auth);
    };

    return { logout };
};