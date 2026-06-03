import { useState, useRef, useEffect } from "react";
import { ImSpinner2 } from "react-icons/im";
import { Eye, EyeOff } from "lucide-react";
import { useLogin } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import app from "../config/firebase";

const LoginForm = ({ step, setStep, isGooglePending }: {
    step: number;
    setStep: (s: number) => void;
    isGooglePending: boolean;
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const { login, error: loginError, isPending, setError: setLoginError } = useLogin();
    const [localValidationError, setLocalValidationError] = useState("");

    const activeError = localValidationError || loginError;
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const isFormLoading = isCheckingEmail || isPending || isGooglePending;

    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 1) emailInputRef.current?.focus();
    }, [step]);

    const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const clearAllErrors = () => {
        if (localValidationError) setLocalValidationError("");
        if (loginError) setLoginError(null);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAllErrors();

        if (!validateEmail(email)) {
            setLocalValidationError("Please enter a valid email address.");
            emailInputRef.current?.focus();
            return;
        }

        setIsCheckingEmail(true);
        try {
            const db = getFirestore(app);
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setLocalValidationError("No account found. Please sign up.");
            } else {
                setStep(2);
                setTimeout(() => passwordInputRef.current?.focus(), 50);
            }
        } catch (err) {
            console.error("Error checking email:", err);
            setLocalValidationError("Something went wrong. Please try again.");
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAllErrors();

        if (password.length < 6) {
            setLocalValidationError("Password must be at least 6 characters.");
            passwordInputRef.current?.focus();
            return;
        }

        const user = await login(email, password);
        if (user) {
            navigate("/dashboard");
        }
    };

    return (
        <div className="w-full">
            {activeError && (
                <div className="mb-4 p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-[8px]">
                    {activeError}
                </div>
            )}

            {step === 1 && (
                <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            ref={emailInputRef}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); clearAllErrors(); }}
                            disabled={isFormLoading}
                            className={`mt-1 w-full rounded-[8px] border bg-white/70 px-4 py-2 outline-none focus:ring-1 transition disabled:opacity-70 ${
                                activeError ? "border-red-300 focus:ring-red-500/20" : "border-gray-200 focus:ring-[#7877C6]/20"
                            }`}
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isFormLoading}
                        className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-70 shadow-xs"
                    >
                        {isCheckingEmail ? <ImSpinner2 className="animate-spin text-lg" /> : "Log in with Email"}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <div className="mb-2 flex justify-between items-center">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                            <button
                                type="button"
                                onClick={() => navigate("/reset-password")}
                                className="text-xs text-[#7877C6] font-medium hover:underline cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                ref={passwordInputRef}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearAllErrors(); }}
                                disabled={isFormLoading}
                                className={`mt-1 w-full rounded-[8px] border bg-white/70 px-4 py-2 pr-10 outline-none focus:ring-1 transition disabled:opacity-70 ${
                                    activeError ? "border-red-300 focus:ring-red-500/20" : "border-gray-200 focus:ring-[#7877C6]/20"
                                }`}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isFormLoading}
                        className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-70 shadow-xs"
                    >
                        {isPending ? <ImSpinner2 className="animate-spin text-lg" /> : "Log in"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default LoginForm;
