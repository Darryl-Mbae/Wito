import { useState } from "react";
import { Link } from "react-router-dom";
import { ImSpinner2 } from "react-icons/im";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { CheckCircle, X } from "lucide-react";
import app from "../config/firebase";
import appConfig from "../config/app";

type Status = "idle" | "loading" | "success" | "error";

const ResetPassword = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [successVisible, setSuccessVisible] = useState(true);

    const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!validateEmail(email)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }

        setStatus("loading");
        try {
            const auth = getAuth(app);
            await sendPasswordResetEmail(auth, email);
            setStatus("success");
            setSuccessVisible(true);
        } catch (err: any) {
            setStatus("error");
            if (err.code === "auth/user-not-found") {
                setErrorMsg("No account found with this email.");
            } else if (err.code === "auth/invalid-email") {
                setErrorMsg("The email address is invalid.");
            } else if (err.code === "auth/too-many-requests") {
                setErrorMsg("Too many attempts. Please wait a moment and try again.");
            } else {
                setErrorMsg("Something went wrong. Please try again.");
            }
        }
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
            <div className="w-full min-h-screen flex flex-col relative py-10 lg:py-12">

                {/* Background gradient — matches auth page */}
                <div className="absolute inset-0 z-[-1] bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

                {/* Back to login */}
                <div className="p-5">
                    <Link
                        to="/auth"
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                    >
                        ← Back to login
                    </Link>
                </div>

                {/* Card */}
                <div className="w-[80%] mx-auto flex flex-1 items-center justify-center px-4 py-12">
                    <div className="w-full max-w-sm">

                        {/* Header */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="mb-3 h-10 w-auto aspect-square">
                                <img src={appConfig.logoUrl} alt={appConfig.name} className="w-full" />
                            </div>
                            <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Enter your email and we'll send you a reset link.
                            </p>
                        </div>

                        {/* Success banner */}
                        {status === "success" && successVisible && (
                            <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-emerald-100 bg-emerald-50 p-3">
                                <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                                <p className="flex-1 text-xs font-medium text-emerald-700">
                                    Reset link sent — check your inbox for <span className="font-semibold">{email}</span>.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSuccessVisible(false)}
                                    className="text-emerald-400 hover:text-emerald-600 cursor-pointer shrink-0"
                                    aria-label="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Error banner */}
                        {status === "error" && errorMsg && (
                            <div className="mb-5 p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-[8px]">
                                {errorMsg}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (status === "error") { setStatus("idle"); setErrorMsg(""); }
                                    }}
                                    disabled={status === "loading"}
                                    placeholder="name@example.com"
                                    className={`mt-1 w-full rounded-[8px] border bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 transition disabled:opacity-70
                                    ${status === "error"
                                            ? "border-red-300 focus:ring-red-500/20"
                                            : "border-gray-200 focus:ring-[#7877C6]/20"
                                        }
                                `}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-70 shadow-xs"
                            >
                                {status === "loading"
                                    ? <ImSpinner2 className="animate-spin text-lg" />
                                    : "Send reset link"
                                }
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="mt-8 text-center text-xs text-gray-400">
                            Remembered it?{" "}
                            <Link to="/auth" className="font-semibold text-gray-900 hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="pb-6 text-center text-xs text-gray-400 px-4">
                    By continuing, you agree to {appConfig.name}'s{" "}
                    <a href={appConfig.termsUrl} className="font-semibold text-gray-600 hover:underline">
                        Terms of service
                    </a>
                </p>
            </div>
        </div>

    );
};

export default ResetPassword;
