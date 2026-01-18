"use client";

import AuthPage from "@/components/AuthPage";

export default function AdminLoginPage() {
    return <AuthPage view="login" isAdmin={true} redirectPath="/admin" />;
}
