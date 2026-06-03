import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import LoginForm from "../components/LoginForm";
import SignUpForm from "../components/SignUpForm";
import { useGoogleAuth } from "../hooks/useAuth";
import appConfig from "../config/app";

const Auth = () => {
    const [step, setStep] = useState(1);
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const { 
        loginWithGoogle, 
        handleRedirectResult, 
        googleError, 
        isGooglePending 
    } = useGoogleAuth();

    const handleToggleAuth = () => {
        setStep(1); 
        setIsSignUp((prev) => !prev);
    };

    useEffect(() => {
        const parseGooglePayload = async () => {
            // Handle mobile redirect result
            const user = await handleRedirectResult();
            if (user) {
                navigate("/dashboard");
            }
        };
        parseGooglePayload();
    }, []);

    const handleGoogleLogin = async () => {
        const user = await loginWithGoogle();
        // Desktop popup returns user directly
        if (user) {
            navigate("/dashboard");
        }
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
            <div className="w-full min-h-screen flex flex-col relative py-10 lg:py-12">
                
                {/* Back Button */}
                {step === 2 && (
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="z-50 cursor-pointer m-5 absolute top-0 left-0 text-sm font-medium text-gray-500 hover:text-black transition px-3 py-1.5"
                    >
                        ← Back
                    </button>
                )}

                {/* Blurred Background Grid */}
                <div className="absolute top-0 left-0 z-[-2] h-full w-full bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                
                {/* Content Body Container */}
                <div className="w-[80%] md:w-[55%] m-auto flex flex-col items-center">
                    
                    {/* Core Shared Header */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="mb-3 flex w-12 aspect-square justify-center items-center font-semibold text-lg">
                            <img src={appConfig.logoUrl} alt={appConfig.name} className="w-full aspect-square" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {isSignUp ? "Create an account" : "Welcome back"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {isSignUp ? "Get started for free" : "Sign in to continue"}
                        </p>
                    </div>

                    {/* Shared Google Runtime Error Notification */}
                    {googleError && (
                        <div className="w-full mb-4 p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-[8px]">
                            {googleError}
                        </div>
                    )}

                    {/* DYNAMIC FORMS (Email & Password steps only) */}
                    {isSignUp ? (
                        <SignUpForm 
                            step={step} 
                            setStep={setStep} 
                            isGooglePending={isGooglePending}
                        />
                    ) : (
                        <LoginForm 
                            step={step} 
                            setStep={setStep} 
                            isGooglePending={isGooglePending}
                        />
                    )}

                    {/* SHARED SOCIAL BUTTONS REGION (Lifted up into Auth wrapper) */}
                    <div className="w-full mt-6">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-200"></div>
                            <span className="text-xs text-gray-400 font-medium">OR</span>
                            <div className="h-px flex-1 bg-gray-200"></div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isGooglePending}
                                className="cursor-pointer w-full flex items-center justify-center gap-3 rounded-[8px] border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isGooglePending ? (
                                    <ImSpinner2 className="animate-spin text-base text-gray-400" />
                                ) : (
                                    <FcGoogle className="text-lg" />
                                )}
                                {isSignUp ? "Sign up with Google" : "Continue with Google"}
                            </button>

                            <button 
                                type="button" 
                                disabled={isGooglePending} 
                                className="cursor-pointer w-full flex items-center justify-center gap-3 rounded-[8px] border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <FaGithub className="text-lg" />
                                {isSignUp ? "Sign up with GitHub" : "Continue with GitHub"}
                            </button>
                        </div>
                    </div>

                    {/* View Switcher Footer */}
                    <p className="mt-8 text-center text-xs text-gray-500">
                        {isSignUp ? "Already have an account? " : "Don’t have an account? "}
                        <button 
                            type="button" 
                            onClick={handleToggleAuth} 
                            className="font-semibold text-gray-900 cursor-pointer hover:underline bg-transparent"
                        >
                            {isSignUp ? "Log in" : "Sign up"}
                        </button>
                    </p>

                </div>

                {/* Main Shared Structural Footer Links */}
                <p className="mt-auto pt-6 text-center text-xs w-full px-4 text-gray-400">
                    By continuing, you agree to {appConfig.name}'s{" "}
                    <a href={appConfig.termsUrl} className="font-semibold cursor-pointer text-gray-600 hover:underline">Terms of service</a>
                </p>
            </div>

            {/* Banner Layout Screen */}
            <div className="hidden lg:flex w-full bg-white items-center justify-center border-l border-gray-100">
                IMAGE
            </div>
        </div>
    );
};

export default Auth;