import { useState, useRef } from "react";
import { ImSpinner2 } from "react-icons/im";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { confirmPasswordReset, getAuth } from "firebase/auth";
import app from "../config/firebase";

// optional if you have these
const appConfig = {
    name: "Your App",
    logoUrl: "/logo.png",
    termsUrl: "#",
};

const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const [params] = useSearchParams();

    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmRef = useRef<HTMLInputElement>(null);

    const oobCode = params.get("oobCode");

    const validate = () => {
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            passwordRef.current?.focus();
            return false;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            confirmRef.current?.focus();
            return false;
        }

        return true;
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validate()) return;
        if (!oobCode) {
            setError("Invalid or missing reset token.");
            return;
        }

        setLoading(true);
        try {
            const auth = getAuth(app);
            await confirmPasswordReset(auth, oobCode, password);
            navigate("/auth");
        } catch (err) {
            console.error(err);
            setError("Failed to reset password. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">

            <div className="w-full min-h-screen flex flex-col relative py-10 lg:py-12">

                {/* background */}
                <div className="absolute inset-0 z-[-1] bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

                {/* back */}
                <div className="p-5">
                    <Link
                        to="/auth"
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                    >
                        ← Back to login
                    </Link>
                </div>

                {/* card */}
                <div className="w-[80%] mx-auto flex flex-1 items-center justify-center px-4 py-12">
                    <div className="w-full max-w-sm">

                        {/* header */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <img
                                src='/images/logo.png'
                                alt={appConfig.name}
                                className="h-6 mb-3"
                            />
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Reset your password
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Choose a new secure password for your account.
                            </p>
                        </div>

                        {/* error */}
                        {error && (
                            <div className="mb-4 p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-[8px]">
                                {error}
                            </div>
                        )}

                        {/* form */}
                        <form onSubmit={handleReset} className="space-y-4">

                            {/* password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    New Password
                                </label>

                                <div className="relative">
                                    <input
                                        ref={passwordRef}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 pr-10 outline-none focus:ring-1 focus:ring-[#7877C6]/20"
                                        placeholder="Enter new password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* confirm password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>

                                <div className="relative">
                                    <input
                                        ref={confirmRef}
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 pr-10 outline-none focus:ring-1 focus:ring-[#7877C6]/20"
                                        placeholder="Confirm password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-70"
                            >
                                {loading ? (
                                    <ImSpinner2 className="animate-spin text-lg" />
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </form>

                        {/* footer */}
                        <p className="mt-8 text-center text-xs text-gray-400">
                            Remembered it?{" "}
                            <Link to="/auth" className="font-semibold text-gray-900 hover:underline">
                                Log in
                            </Link>
                        </p>

                    </div>
                </div>

                {/* bottom */}
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

export default ResetPasswordPage;