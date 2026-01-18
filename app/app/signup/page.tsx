"use client";

import AuthPage from "@/components/AuthPage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignupContent() {
    const searchParams = useSearchParams();
    // If a specific redirect is provided (e.g. from a deep link), use it.
    // Otherwise, default to home with the welcome modal.
    const redirect = searchParams.get("redirect") || "/?welcome=true";

    return <AuthPage view="signup" redirectPath={redirect} />;
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupContent />
        </Suspense>
    );
}
