"use client";

import React, { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import supabase from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                setSession(data.session ?? null);
            } catch (err) {
                console.error(err);
                setSession(null);
            } finally {
                setLoadingSession(false);
            }
        };
        init();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password !== confirm) {
            setMsg({ type: "danger", text: "Passwords must match." });
            return;
        }
        setSubmitting(true);
        setMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMsg({ type: "success", text: "Password updated. Redirecting to login..." });
            // sign out and redirect to login after a short delay
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push("/login");
            }, 1200);
        } catch (err: any) {
            setMsg({ type: "danger", text: err?.message || "Failed to update password." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingSession)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
                <Spinner animation="border" variant="info" />
            </div>
        );

    if (!session)
        return (
            <Container style={{ maxWidth: 720, padding: "40px 16px" }}>
                <Card className="p-4 shadow-sm">
                    <h4 className="fw-bold mb-3">Password reset</h4>
                    <p className="text-muted">No active recovery session found. Please use the password reset link from your email.</p>
                </Card>
            </Container>
        );

    return (
        <Container style={{ maxWidth: 720, padding: "40px 16px" }}>
            <Card className="p-4 shadow-sm">
                <h4 className="fw-bold mb-3">Set a new password</h4>
                {msg && (
                    <Alert variant={msg.type === "danger" ? "danger" : "success"} className="small py-2">
                        {msg.text}
                    </Alert>
                )}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">New password</Form.Label>
                        <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Confirm password</Form.Label>
                        <Form.Control type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                    </Form.Group>

                    <div className="d-grid">
                        <Button variant="info" type="submit" disabled={submitting}>
                            {submitting ? "Updating..." : "Set new password"}
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
}
