"use client";

import React, { useState } from "react";
import {
    Container,
    Card,
    Button,
    Form,
    Row,
    Col,
    Alert,
    Modal,
} from "react-bootstrap";
import supabase from "@/utils/supabase/client";
// removed social login UI
import Link from "next/link";

export default function AuthPage({
    view = "login",
    isAdmin = false,
    redirectPath = "/",
}: {
    view?: "login" | "signup";
    isAdmin?: boolean;
    redirectPath?: string;
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === "signup") {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
                    },
                });
                if (error) throw error;

                if (data.session) {
                    window.location.href = redirectPath;
                } else {
                    setMessage("Check your email for the confirmation link!");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                window.location.href = redirectPath;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // social logins removed

    return (
        <div
            className="auth-gradient d-flex align-items-center justify-content-center"
            style={{ minHeight: "100vh", padding: "20px" }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5} xl={4}>
                        <Card className="border-0 shadow-lg p-4 rounded-4 auth-card">
                            <div className="text-center mb-4">
                                <h1 className="fw-bold fs-2 mb-2">
                                    <span style={{ color: "#0dcaf0" }}>
                                        Uni
                                    </span>
                                    Events
                                </h1>
                                <p className="text-muted">
                                    {view === "login"
                                        ? "Welcome back! Please login to your account."
                                        : "Join us and start discovering amazing events."}
                                </p>
                            </div>

                            {error && (
                                <Alert variant="danger" className="py-2 small">
                                    {error}
                                </Alert>
                            )}
                            {message && (
                                <Alert variant="success" className="py-2 small">
                                    {message}
                                </Alert>
                            )}

                            <Form onSubmit={handleEmailAuth}>
                                <Form.Group
                                    className="mb-3"
                                    controlId="formBasicEmail"
                                >
                                    <Form.Label className="small fw-bold text-muted">
                                        Email address
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        className="py-2 bg-light border-0"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                    />
                                </Form.Group>

                                <Form.Group
                                    className="mb-4"
                                    controlId="formBasicPassword"
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Label className="small fw-bold text-muted">
                                            Password
                                        </Form.Label>
                                        {view === "login" && (
                                            <a
                                                href="#"
                                                className="small text-decoration-none text-info"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowResetModal(true);
                                                    setResetEmail(email);
                                                    setResetMessage(null);
                                                }}
                                            >
                                                Forgot?
                                            </a>
                                        )}
                                    </div>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        className="py-2 bg-light border-0"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    variant="info"
                                    type="submit"
                                    className="w-100 py-2 fw-bold text-white mb-3 shadow-sm"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Processing..."
                                        : view === "login"
                                            ? "Sign In"
                                            : "Create Account"}
                                </Button>
                            </Form>

                            {/* Password reset modal */}
                            <Modal
                                show={showResetModal}
                                onHide={() => setShowResetModal(false)}
                                centered
                            >
                                <Modal.Header closeButton>
                                    <Modal.Title className="small">
                                        Reset your password
                                    </Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    {resetMessage && (
                                        <Alert
                                            variant="success"
                                            className="py-2 small"
                                        >
                                            {resetMessage}
                                        </Alert>
                                    )}
                                    <Form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            setResetLoading(true);
                                            setResetMessage(null);
                                            try {
                                                const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                                                    redirectTo: `${window.location.origin}/reset-password`,
                                                });
                                                if (error) throw error;
                                                setResetMessage(
                                                    "Check your email for password reset instructions."
                                                );
                                            } catch (err: any) {
                                                setResetMessage(err.message || "Failed to send reset email.");
                                            } finally {
                                                setResetLoading(false);
                                            }
                                        }}
                                    >
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold text-muted">
                                                Email address
                                            </Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) =>
                                                    setResetEmail(e.target.value)
                                                }
                                                required
                                            />
                                        </Form.Group>
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                variant="secondary"
                                                className="me-2"
                                                onClick={() => setShowResetModal(false)}
                                                disabled={resetLoading}
                                            >
                                                Close
                                            </Button>
                                            <Button type="submit" variant="info" disabled={resetLoading}>
                                                {resetLoading ? "Sending..." : "Send reset email"}
                                            </Button>
                                        </div>
                                    </Form>
                                </Modal.Body>
                            </Modal>

                            {/* Social sign-in removed */}

                            <div className="text-center">
                                <p className="small text-muted mb-0">
                                    {view === "login"
                                        ? "Don't have an account?"
                                        : "Already have an account?"}{" "}
                                    <Link
                                        href={
                                            view === "login"
                                                ? isAdmin
                                                    ? "/admin/signup"
                                                    : "/signup"
                                                : isAdmin
                                                    ? "/admin/login"
                                                    : "/login"
                                        }
                                        className="text-info fw-bold text-decoration-none"
                                    >
                                        {view === "login" ? "Sign up" : "Login"}
                                    </Link>
                                </p>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <style jsx>{`
                .auth-gradient {
                    background: linear-gradient(
                        135deg,
                        #f8f9fa 0%,
                        #e9ecef 100%
                    );
                }
                .auth-card {
                    transition: transform 0.3s ease;
                }
                .auth-card:hover {
                    transform: translateY(-5px);
                }
            `}</style>
        </div>
    );
}
