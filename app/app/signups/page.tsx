"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Container,
    Row,
    Col,
    Card,
    Badge,
    Button,
    Spinner,
    Navbar,
    Dropdown,
    Form,
    Modal,
} from "react-bootstrap";
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    ArrowLeft,
    CheckCircle2,
    History,
} from "lucide-react";
import Link from "next/link";

export default function SignupsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [showExpired, setShowExpired] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/login?redirect=/signups";
                return;
            }
            setUser(user);
            fetchMySignups(user.id);
        };
        checkUser();
    }, []);

    const fetchMySignups = async (userId: string) => {
        setLoading(true);
        // Fetch events where the user is signed up
        const { data, error } = await supabase
            .from("signups")
            .select(
                `
                status,
                created_at,
                event:events (
                    *,
                    signups (status)
                )
            `
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching signups:", error);
        } else {
            // Flatten the structure
            const processed = data.map((s: any) => ({
                ...s.event,
                myStatus: s.status,
                mySignupDate: s.created_at,
                confirmedCount: s.event.signups.filter(
                    (sig: any) => sig.status === "confirmed"
                ).length,
                waitlistCount: s.event.signups.filter(
                    (sig: any) => sig.status === "waitlisted"
                ).length,
            }));
            setEvents(processed);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const now = new Date();
    const filteredEvents = events
        .filter((e) => {
            const isExpired = new Date(e.end_datetime) < now;
            return showExpired ? isExpired : !isExpired;
        })
        .sort(
            (a, b) =>
                new Date(a.start_datetime).getTime() -
                new Date(b.start_datetime).getTime()
        );

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
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
            <Navbar
                bg="dark"
                variant="dark"
                expand="lg"
                className="shadow-sm py-4 mb-4 sticky-top"
            >
                <Container fluid className="px-4">
                    <Navbar.Brand href="/" className="fw-bold fs-3">
                        <span style={{ color: "#0dcaf0" }}>Uni</span>Events
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="nav" />
                    <Navbar.Collapse id="nav" className="justify-content-end">
                        <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="outline-info"
                                    className="d-flex align-items-center rounded-pill px-3"
                                >
                                    <div
                                        className="me-2 rounded-circle bg-info d-flex align-items-center justify-content-center text-white"
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            fontSize: "10px",
                                        }}
                                    >
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <span className="small">
                                        {user?.email?.split("@")[0]}
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-sm rounded-4 mt-2">
                                    <Dropdown.Item as={Link} href="/profile">
                                        Profile
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} href="/">
                                        Event Homepage
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} href="/admin">
                                        Admin Dashboard
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        onClick={handleLogout}
                                        className="text-danger"
                                    >
                                        Logout
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="px-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">My Sign-ups</h2>
                        <p className="text-muted mb-0">
                            Events you're registered for or waitlisted
                        </p>
                    </div>
                </div>

                <Row className="mb-4 align-items-center bg-white p-3 rounded-4 shadow-sm mx-0">
                    <Col md={6}>
                        <Form.Check
                            type="checkbox"
                            id="show-expired"
                            label="Show Expired Events"
                            checked={showExpired}
                            onChange={(e) => setShowExpired(e.target.checked)}
                            className="fw-bold text-muted fw-medium"
                        />
                    </Col>
                </Row>

                <Row>
                    {filteredEvents.map((event) => (
                        <Col key={event.id} lg={3} md={6} className="mb-4">
                            <Card
                                className="h-100 border-0 shadow-sm rounded-4 overflow-hidden"
                                onClick={() => {
                                    setSelectedEvent(event);
                                    setShowDetails(true);
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <div
                                    style={{
                                        height: "160px",
                                        position: "relative",
                                    }}
                                >
                                    {event.image_url ? (
                                        <Card.Img
                                            variant="top"
                                            src={event.image_url}
                                            className="h-100 w-100 object-fit-cover"
                                        />
                                    ) : (
                                        <div className="bg-info-subtle w-100 h-100 d-flex align-items-center justify-content-center text-info opacity-50">
                                            <Calendar size={48} />
                                        </div>
                                    )}
                                    <div className="position-absolute top-0 end-0 p-3 d-flex flex-column gap-2">
                                        <Badge
                                            bg={
                                                event.myStatus === "confirmed"
                                                    ? "success"
                                                    : "warning"
                                            }
                                        >
                                            {event.myStatus === "confirmed"
                                                ? "Registered"
                                                : "Waitlisted"}
                                        </Badge>
                                    </div>
                                </div>
                                <Card.Body className="p-2">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Badge bg="info" className="mb-2">
                                            {event.category}
                                        </Badge>
                                        <div className="d-flex align-items-center text-muted small">
                                            <Users size={14} className="me-1" />
                                            {event.confirmedCount}/
                                            {event.capacity}
                                            {event.waitlistCount > 0 && (
                                                <span className="ms-2 text-warning fw-medium">
                                                    (Wait: {event.waitlistCount}
                                                    )
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h6 className="fw-bold mb-1 text-truncate">
                                        {event.name}
                                    </h6>
                                    <div
                                        className="text-muted small mb-2"
                                        style={{ fontSize: "0.8rem" }}
                                    >
                                        <div className="d-flex align-items-center mb-1 text-truncate">
                                            <Clock
                                                size={14}
                                                className="me-2 text-info flex-shrink-0"
                                            />
                                            {formatDateTime(
                                                event.start_datetime
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <MapPin
                                                size={14}
                                                className="me-2 text-info"
                                            />
                                            {event.location}
                                        </div>
                                        {/* if event is happening */}
                                        {new Date(event.start_datetime) <= new Date() &&
                                            new Date(event.end_datetime) >= new Date() && (
                                                <div className="mt-1">
                                                    <span
                                                        className="text-muted fw-medium"
                                                        style={{
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        Happening
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    {filteredEvents.length === 0 && (
                        <Col className="text-center py-5">
                            <h4 className="text-muted">No sign-ups found</h4>
                            <p className="text-muted px-5">
                                {showExpired
                                    ? "You don't have any past events."
                                    : "You haven't signed up for any upcoming events yet."}
                            </p>
                            {!showExpired && (
                                <Link
                                    href="/"
                                    className="btn btn-info text-white mt-2 rounded-pill px-4 fw-bold shadow-sm"
                                >
                                    Explore Events
                                </Link>
                            )}
                        </Col>
                    )}
                </Row>
            </Container>

            {/* Basic Info Modal (Attendee View) */}
            <Modal
                show={showDetails}
                onHide={() => setShowDetails(false)}
                centered
                contentClassName="rounded-4 border-0"
            >
                {selectedEvent && (
                    <>
                        <Modal.Header closeButton className="border-0 pb-0">
                            <Modal.Title className="fw-bold">
                                {selectedEvent.name}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="pt-3">
                            <div className="mb-4">
                                <Badge
                                    bg={
                                        selectedEvent.myStatus === "confirmed"
                                            ? "success"
                                            : "warning"
                                    }
                                    className="px-3 py-2 rounded-pill mb-3"
                                >
                                    Status:{" "}
                                    {selectedEvent.myStatus === "confirmed"
                                        ? "Confirmed Registration"
                                        : "On Waitlist"}
                                </Badge>
                                <p className="text-muted mb-4">
                                    {selectedEvent.description}
                                </p>

                                <div className="bg-light p-3 rounded-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <Calendar
                                            size={18}
                                            className="me-3 text-info"
                                        />
                                        <div>
                                            <div className="small text-muted">
                                                When
                                            </div>
                                            <div className="fw-bold">
                                                {formatDateTime(
                                                    selectedEvent.start_datetime
                                                )}
                                            </div>
                                            <div className="small text-muted">
                                                to{" "}
                                                {formatDateTime(
                                                    selectedEvent.end_datetime
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <MapPin
                                            size={18}
                                            className="me-3 text-info"
                                        />
                                        <div>
                                            <div className="small text-muted">
                                                Where
                                            </div>
                                            <div className="fw-bold">
                                                {selectedEvent.location}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Users
                                            size={18}
                                            className="me-3 text-info"
                                        />
                                        <div>
                                            <div className="small text-muted">
                                                Attendance
                                            </div>
                                            <div className="fw-bold">
                                                {selectedEvent.confirmedCount}{" "}
                                                Attending
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="d-grid">
                                <Button
                                    variant="outline-danger"
                                    onClick={() => {
                                        // Normally handle cancellation here, but let's keep it simple as requested
                                        alert(
                                            "To cancel, please go to the event page on the home screen."
                                        );
                                    }}
                                    className="rounded-pill"
                                >
                                    Manage Registration
                                </Button>
                            </div>
                        </Modal.Body>
                    </>
                )}
            </Modal>
        </div>
    );
}
