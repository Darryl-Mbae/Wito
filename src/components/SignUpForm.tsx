import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { ImSpinner2 } from "react-icons/im";
import { Eye, EyeOff } from "lucide-react";
import { useSignup } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

// ✅ ONLY ADD TYPES (no UI change)
type Props = {
    step: number;
    setStep: (step: number) => void;
    isGooglePending: boolean;
};

const SignUpForm = ({ step, setStep, isGooglePending }: Props) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const {
        signup,
        error: signupError,
        isPending,
        setError: setSignupError,
    } = useSignup();

    const [localValidationError, setLocalValidationError] = useState("");

    const activeError = localValidationError || signupError;
    const isFormLoading = isPending || isGooglePending;

    // ✅ FIX REF TYPES (this fixes .focus errors)
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    const passwordInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (step === 1) nameInputRef.current?.focus();
    }, [step]);

    // ✅ FIX PARAM TYPE
    const validateEmail = (inputEmail: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail);

    const clearErrors = () => {
        if (localValidationError) setLocalValidationError("");
        if (signupError) setSignupError(null);
    };

    // ✅ FIX EVENT TYPE
    const handleStepOneSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearErrors();

        if (name.trim().length < 2) {
            setLocalValidationError("Please enter your full name.");
            nameInputRef.current?.focus();
            return;
        }

        if (!validateEmail(email)) {
            setLocalValidationError("Please enter a valid email address.");
            return;
        }

        setStep(2);
        setTimeout(() => passwordInputRef.current?.focus(), 50);
    };

    // ✅ FIX EVENT TYPE
    const handleSignUpFinal = async (e: FormEvent) => {
        e.preventDefault();
        clearErrors();

        if (password.length < 6) {
            setLocalValidationError("Password must be at least 6 characters.");
            passwordInputRef.current?.focus();
            return;
        }

        const user = await signup(email, password, name);

        if (user) {
            navigate("/dashboard");
            console.log("Account created successfully for:", email);
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
                <form onSubmit={handleStepOneSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            ref={nameInputRef}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                clearErrors();
                            }}
                            className={`mt-1 w-full rounded-[8px] border bg-white/70 px-4 py-2 outline-none focus:ring-1 transition ${activeError && name.trim().length < 2
                                    ? "border-red-300 focus:ring-red-500/20"
                                    : "border-gray-200 focus:ring-[#7877C6]/20"
                                }`}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                clearErrors();
                            }}
                            className={`mt-1 w-full rounded-[8px] border bg-white/70 px-4 py-2 outline-none focus:ring-1 transition ${activeError && !validateEmail(email)
                                    ? "border-red-300 focus:ring-red-500/20"
                                    : "border-gray-200 focus:ring-[#7877C6]/20"
                                }`}
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition shadow-xs"
                    >
                        Continue
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleSignUpFinal} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Choose Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                ref={passwordInputRef}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    clearErrors();
                                }}
                                disabled={isFormLoading}
                                className={`mt-1 w-full rounded-[8px] border bg-white/70 px-4 py-2 pr-10 outline-none focus:ring-1 transition disabled:opacity-70 ${activeError && password.length < 6
                                        ? "border-red-300 focus:ring-red-500/20"
                                        : "border-gray-200 focus:ring-[#7877C6]/20"
                                    }`}
                                placeholder="Minimum 6 characters"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                tabIndex={-1}
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
                        {isPending ? (
                            <ImSpinner2 className="animate-spin text-lg" />
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SignUpForm;