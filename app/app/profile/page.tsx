"use client";

import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Navbar,
    Alert,
    Spinner,
} from "react-bootstrap";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft, User, Save } from "lucide-react";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [message, setMessage] = useState<{
        type: "success" | "danger";
        text: string;
    } | null>(null);

    // Form fields
    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        student_number: "",
        age: "",
        dietary_restrictions: "",
    });

    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/login";
                return;
            }
            setUser(user);

            // In a real app, we would fetch the profile from a 'profiles' table here
            // For now, we'll just initialize with defaults or mock data
            setLoading(false);
        };
        checkUser();
    }, []);

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            setMessage({
                type: "success",
                text: "Profile updated successfully!",
            });
        }, 1000);

        /* 
        // Real implementation would look like this:
        const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id,
                ...profile,
                updated_at: new Date()
            });
            
        if (error) {
            setMessage({ type: 'danger', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        }
        setSaving(false);
        */
    };

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "100vh" }}
            >
                <Spinner animation="border" variant="info" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            {/* Simple Navbar */}
            <Navbar bg="dark" variant="dark" className="mb-4 shadow-sm py-3">
                <Container>
                    <Link
                        href="/"
                        className="text-decoration-none d-flex align-items-center text-white"
                    >
                        <ArrowLeft size={20} className="me-2" />
                        <span className="fw-bold">Back to Events</span>
                    </Link>
                    <Navbar.Brand
                        href="#"
                        className="mx-auto fw-bold fs-3 pe-5"
                    >
                        <span style={{ color: "#0dcaf0" }}>Event</span>Hive
                    </Navbar.Brand>
                </Container>
            </Navbar>

            <Container className="py-4">
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="border-0 shadow-sm p-4 rounded-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="bg-light p-3 rounded-circle me-3 text-info">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h2 className="fw-bold mb-0">My Profile</h2>
                                    <p className="text-muted mb-0">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            {message && (
                                <Alert
                                    variant={message.type}
                                    className="mb-4 py-2 small"
                                >
                                    {message.text}
                                </Alert>
                            )}

                            <Form onSubmit={handleSave}>
                                <Row>
                                    <Col sm={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold text-muted">
                                                First Name
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="first_name"
                                                value={profile.first_name}
                                                onChange={handleChange}
                                                placeholder="First Name"
                                                className="py-2 bg-light border-0"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold text-muted">
                                                Last Name
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="last_name"
                                                value={profile.last_name}
                                                onChange={handleChange}
                                                placeholder="Last Name"
                                                className="py-2 bg-light border-0"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Age
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="age"
                                        value={profile.age}
                                        onChange={handleChange}
                                        placeholder="Enter your age"
                                        className="py-2 bg-light border-0"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Student Number (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="student_number"
                                        value={profile.student_number}
                                        onChange={handleChange}
                                        placeholder="Enter student number"
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold text-muted">
                                        Dietary Restrictions (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="dietary_restrictions"
                                        value={profile.dietary_restrictions}
                                        onChange={handleChange}
                                        placeholder="List any dietary needs..."
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>

                                <div className="d-grid mt-4">
                                    <Button
                                        variant="info"
                                        type="submit"
                                        className="py-2 fw-bold text-white d-flex align-items-center justify-content-center"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <Spinner
                                                    animation="border"
                                                    size="sm"
                                                    className="me-2"
                                                />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save
                                                    size={18}
                                                    className="me-2"
                                                />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
