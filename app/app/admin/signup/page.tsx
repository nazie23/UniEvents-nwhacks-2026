"use client";

import AuthPage from "@/components/AuthPage";

export default function AdminSignupPage() {
    return <AuthPage view="signup" isAdmin={true} redirectPath="/admin" />;
}
