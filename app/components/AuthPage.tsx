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
} from "react-bootstrap";
import { createClient } from "@/utils/supabase/client";
import { Chrome } from "lucide-react";
import Link from "next/link";

export default function AuthPage({
    view = "login",
}: {
    view?: "login" | "signup";
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const supabase = createClient();

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                setMessage("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                window.location.href = "/";
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

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
                                        Event
                                    </span>
                                    Hive
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

                            <div className="text-center my-3 position-relative">
                                <hr className="text-muted opacity-25" />
                                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                                    Or continue with
                                </span>
                            </div>

                            <Button
                                variant="outline-dark"
                                className="w-100 py-2 d-flex align-items-center justify-content-center border-1 fw-bold mb-4"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                            >
                                <Chrome size={20} className="me-2" />
                                Google
                            </Button>

                            <div className="text-center">
                                <p className="small text-muted mb-0">
                                    {view === "login"
                                        ? "Don't have an account?"
                                        : "Already have an account?"}{" "}
                                    <Link
                                        href={
                                            view === "login"
                                                ? "/signup"
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
