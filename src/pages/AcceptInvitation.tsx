import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import app from "../config/firebase";
import appConfig from "../config/app";
import { resolveInviteToken } from "../hooks/useFirestore";

type Status = "loading" | "success" | "invalid" | "already_member" | "not_invited" | "error";

const PENDING_INVITE_KEY = "pendingInviteToken";

export default function AcceptInvitation() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? undefined;
    const navigate = useNavigate();

    const [status, setStatus] = useState<Status>("loading");
    const [orgName, setOrgName] = useState("");
    const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = not yet resolved

    // Step 1: resolve Firebase auth state
    useEffect(() => {
        const auth = getAuth(app);
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    // Step 2: once auth is known, process the token
    useEffect(() => {
        if (user === undefined) return; // still loading auth
        if (!token) { setStatus("invalid"); return; }

        processToken(token, user);
    }, [user, token]);

    const processToken = async (token: string, currentUser: User | null) => {
        const db = getFirestore(app);

        try {
            // Find the org that has an invite entry with this exact token
            const orgsSnap = await getDocs(collection(db, "organizations"));
            let orgDoc = orgsSnap.docs.find((d) => {
                const invited: any[] = d.data().invitedDirectors || [];
                return invited.some((inv) => inv.token === token);
            });

            if (!orgDoc) {
                setStatus("invalid");
                return;
            }

            const orgData = orgDoc.data();
            setOrgName(orgData.name || "this organization");

            const invited: any[] = orgData.invitedDirectors || [];
            const invite = invited.find((inv) => inv.token === token);

            // Token already used (nulled out after accept)
            if (invite?.accepted || invite?.token === null) {
                setStatus("already_member");
                return;
            }

            // Not logged in — save token, redirect to auth
            if (!currentUser) {
                sessionStorage.setItem(PENDING_INVITE_KEY, token);
                navigate("/auth", { state: { inviteToken: token, orgName: orgData.name } });
                return;
            }

            // Logged in — resolve immediately
            const result = await resolveInviteToken(currentUser.uid, token);

            if (result) {
                setStatus("success");
                setTimeout(() => navigate("/dashboard"), 2500);
            } else {
                // Email mismatch — this link wasn't for this account
                if (invite && invite.email !== currentUser.email) {
                    setStatus("not_invited");
                } else {
                    setStatus("error");
                }
            }
        } catch (err) {
            console.error("AcceptInvitation error:", err);
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Background — matches auth page */}
            <div className="absolute inset-0 z-[-1] bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

            <div className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm text-center">

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src={appConfig.logoUrl} alt={appConfig.name} className="w-12 h-12" />
                    </div>

                    {/* Loading */}
                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 size={36} className="text-[#7877C6] animate-spin" />
                            <p className="text-sm text-gray-500">Verifying your invitation...</p>
                        </div>
                    )}

                    {/* Success */}
                    {status === "success" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle size={32} className="text-emerald-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">You're in!</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    You've joined <span className="font-medium text-gray-700">{orgName}</span> as a director.
                                </p>
                            </div>
                            <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
                        </div>
                    )}

                    {/* Already a member */}
                    {status === "already_member" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-[#7877C6]/8 flex items-center justify-center">
                                <CheckCircle size={32} className="text-[#7877C6]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Already joined</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    You're already a member of <span className="font-medium text-gray-700">{orgName}</span>.
                                </p>
                            </div>
                            <Link
                                to="/dashboard"
                                className="rounded-[8px] bg-[#7877C6] px-5 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    )}

                    {/* Invalid token */}
                    {(status === "invalid" || status === "not_invited") && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle size={32} className="text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Invalid invitation</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {status === "not_invited"
                                        ? "This invitation wasn't sent to your account."
                                        : "This invitation link is invalid or has expired."
                                    }
                                </p>
                            </div>
                            <Link
                                to="/"
                                className="text-sm font-medium text-[#7877C6] hover:underline"
                            >
                                Back to home
                            </Link>
                        </div>
                    )}

                    {/* Generic error */}
                    {status === "error" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle size={32} className="text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    We couldn't process your invitation. Please try again or contact support.
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="rounded-[8px] bg-[#7877C6] px-5 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <p className="pb-6 text-center text-xs text-gray-400 px-4">
                {appConfig.name} · Director Invitation
            </p>
        </div>
    );
}
