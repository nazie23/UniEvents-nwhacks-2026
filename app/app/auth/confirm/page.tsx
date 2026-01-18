"use client";

import React, { useEffect, useState } from "react";
import { Container, Button, Navbar, Card } from "react-bootstrap";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ConfirmEmailPage() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    return (
        <div
            style={{
                backgroundColor: "#f8f9fa",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Simple Header */}
            <Navbar bg="dark" variant="dark" className="shadow-sm py-3 mb-auto">
                <Container justify-content-center>
                    <Navbar.Brand href="/" className="fw-bold fs-3 mx-auto">
                        <span style={{ color: "#0dcaf0" }}>Uni</span>Events
                    </Navbar.Brand>
                </Container>
            </Navbar>

            {/* Main Content */}
            <Container
                className="d-flex align-items-center justify-content-center"
                style={{ flex: 1 }}
            >
                <Card
                    className="border-0 shadow-lg rounded-4 p-5 text-center"
                    style={{ maxWidth: "500px", width: "100%" }}
                >
                    <div className="mb-4">
                        <div
                            className="bg-success-subtle d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                            style={{ width: "100px", height: "100px" }}
                        >
                            <CheckCircle2 size={60} className="text-success" />
                        </div>
                        <h2 className="fw-bold mb-3">Email Confirmed!</h2>
                        <p className="text-muted lead">
                            Your email address has been successfully verified.
                            You can now access all features of UniEvents.
                        </p>
                    </div>

                    <div className="d-grid gap-2">
                        <Link href={`/${Link}`} className="text-decoration-none">
                            <Button
                                variant="info"
                                size="lg"
                                className="text-white fw-bold rounded-pill py-3 d-flex align-items-center justify-content-center"
                            >
                                Go to Dashboard{" "}
                                <ChevronRight size={20} className="ms-2" />
                            </Button>
                        </Link>
                    </div>
                </Card>
            </Container>

            {/* Simple Footer */}
            <footer className="bg-white py-4 mt-auto border-top">
                <Container className="text-center">
                    <p className="text-muted mb-0 small">
                        &copy; {new Date().getFullYear()} UniEvents. All rights
                        reserved.
                    </p>
                    <div className="mt-2">
                        <Link
                            href="/"
                            className="text-decoration-none text-muted small mx-2"
                        >
                            Home
                        </Link>
                        <Link
                            href="/profile"
                            className="text-decoration-none text-muted small mx-2"
                        >
                            Profile
                        </Link>
                        <Link
                            href="/admin"
                            className="text-decoration-none text-muted small mx-2"
                        >
                            Admin
                        </Link>
                    </div>
                </Container>
            </footer>
        </div>
    );
}
