"use client";

import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Navbar,
    Modal,
    Badge,
    Dropdown,
    Spinner,
    Table,
    Alert,
} from "react-bootstrap";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
    Users,
    Lock,
    Archive,
    Trash2,
    ChevronLeft,
    Calendar,
    MapPin,
    Plus,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowUpCircle,
} from "lucide-react";

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [attendees, setAttendees] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: string;
        text: string;
    } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: "",
        category: "Tech",
        tags: "",
        location: "",
        start_datetime: "",
        end_datetime: "",
        capacity: 50,
        description: "",
        image_url: "",
        school: "UBC",
        required_profile_fields: ["first_name", "last_name"] as string[],
    });

    const supabase = createClient();

    useEffect(() => {
        const checkAuth = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/admin/login";
                return;
            }
            setUser(user);
            fetchEvents(user.id);
        };
        checkAuth();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
    };

    const fetchEvents = async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from("events")
            .select(
                `
                *,
                signups (
                    status
                )
            `
            )
            .eq("organizer_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            // Process counts
            const processedEvents = data.map((event: any) => ({
                ...event,
                confirmedCount: event.signups.filter(
                    (s: any) => s.status === "confirmed"
                ).length,
                waitlistCount: event.signups.filter(
                    (s: any) => s.status === "waitlisted"
                ).length,
            }));
            setEvents(processedEvents);
        }
        setLoading(false);
    };

    const handleToggleArchive = async (event: any) => {
        const { error } = await supabase
            .from("events")
            .update({ is_archived: !event.is_archived })
            .eq("id", event.id);

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            fetchEvents(user.id);
            if (selectedEvent?.id === event.id) {
                setSelectedEvent({
                    ...selectedEvent,
                    is_archived: !event.is_archived,
                });
            }
        }
    };

    const handleToggleLock = async (event: any) => {
        const { error } = await supabase
            .from("events")
            .update({ is_locked: !event.is_locked })
            .eq("id", event.id);

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            fetchEvents(user.id);
            if (selectedEvent?.id === event.id) {
                setSelectedEvent({
                    ...selectedEvent,
                    is_locked: !event.is_locked,
                });
            }
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (
            !confirm(
                "Are you ABSOLUTELY sure? This will delete all signup data too."
            )
        )
            return;
        if (!confirm("Final Confirmation: Delete this event?")) return;

        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", eventId);

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            setShowDetails(false);
            fetchEvents(user.id);
            setMessage({
                type: "success",
                text: "Event deleted successfully.",
            });
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);

        const { error } = await supabase.from("events").insert({
            ...newEvent,
            tags: newEvent.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t),
            organizer_id: user.id,
        });

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            setShowCreateModal(false);
            setNewEvent({
                name: "",
                category: "Tech",
                tags: "",
                location: "",
                start_datetime: "",
                end_datetime: "",
                capacity: 50,
                description: "",
                image_url: "",
                school: "UBC",
                required_profile_fields: ["first_name", "last_name"],
            });
            fetchEvents(user.id);
            setMessage({
                type: "success",
                text: "Event created successfully!",
            });
        }
        setCreateLoading(false);
    };

    const fetchAttendees = async (eventId: string) => {
        setAttendees([]); // Clear previous data immediately
        setDetailsLoading(true);
        const { data, error } = await supabase
            .from("signups")
            .select(
                `
                id,
                status,
                created_at,
                profiles (
                    first_name,
                    last_name,
                    student_number,
                    age,
                    dietary_restrictions
                )
            `
            )
            .eq("event_id", eventId)
            .order("created_at", { ascending: true });

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            setAttendees(data);
        }
        setDetailsLoading(false);
    };

    const handleUpdateSignupStatus = async (
        signupId: string,
        newStatus: string
    ) => {
        const { error } = await supabase
            .from("signups")
            .update({ status: newStatus })
            .eq("id", signupId);

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            fetchAttendees(selectedEvent.id);
            fetchEvents(user.id);
        }
    };

    const handleRemoveSignup = async (signupId: string) => {
        if (!confirm("Remove this user from the list?")) return;

        const { error } = await supabase
            .from("signups")
            .delete()
            .eq("id", signupId);

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            fetchAttendees(selectedEvent.id);
            fetchEvents(user.id);
        }
    };

    const openEventDetails = (event: any) => {
        setSelectedEvent(event);
        setShowDetails(true);
        fetchAttendees(event.id);
    };

    const filteredEvents = events
        .filter((e) => (showArchived ? true : !e.is_archived))
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

    if (loading)
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "100vh" }}
            >
                <Spinner animation="border" variant="info" />
            </div>
        );

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <Navbar
                bg="dark"
                variant="dark"
                expand="lg"
                className="shadow-sm py-3 mb-4 sticky-top"
            >
                <Container fluid className="px-4">
                    <Navbar.Brand href="/" className="fw-bold fs-3">
                        <span style={{ color: "#0dcaf0" }}>Uni</span>Events
                        <Badge bg="info" className="ms-2 fs-6 align-middle">
                            Admin
                        </Badge>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="admin-navbar-nav" />
                    <Navbar.Collapse
                        id="admin-navbar-nav"
                        className="justify-content-end"
                    >
                        <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="outline-info"
                                    id="dropdown-user"
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
                                    <Dropdown.Item as={Link} href="/signups">
                                        My Sign-ups
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} href="/">
                                        Event Homepage
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
                        <h2 className="fw-bold mb-0">Admin Dashboard</h2>
                        <p className="text-muted mb-0">
                            Manage your events and attendees
                        </p>
                    </div>
                    <Button
                        variant="info"
                        className="text-white fw-bold d-flex align-items-center"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={20} className="me-2" /> Create Event
                    </Button>
                </div>

                {message && !showDetails && !showCreateModal && (
                    <Alert
                        variant={message.type}
                        dismissible
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                <Row className="mb-4 align-items-center bg-white p-3 rounded-4 shadow-sm mx-0">
                    <Col md={6}>
                        <Form.Check
                            type="checkbox"
                            id="show-archived"
                            label="Show Archived Events"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="fw-bold text-muted"
                        />
                    </Col>
                </Row>

                <Row>
                    {filteredEvents.map((event) => (
                        <Col key={event.id} lg={3} md={6} className="mb-4">
                            <Card
                                className="h-100 border-0 shadow-sm rounded-4 overflow-hidden"
                                onClick={() => openEventDetails(event)}
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
                                        <div className="bg-secondary w-100 h-100 d-flex align-items-center justify-content-center text-white opacity-25">
                                            No Image
                                        </div>
                                    )}
                                    <div className="position-absolute top-0 end-0 p-3 d-flex flex-column gap-2">
                                        {event.is_archived && (
                                            <Badge bg="secondary">
                                                Archived
                                            </Badge>
                                        )}
                                        {event.is_locked && (
                                            <Badge bg="warning" text="dark">
                                                Locked
                                            </Badge>
                                        )}
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
                                                <span className="ms-2 text-warning">
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
                                        <div className="d-flex align-items-center mb-1">
                                            <Calendar
                                                size={14}
                                                className="me-2"
                                            />
                                            {new Date(
                                                event.start_datetime
                                            ).toLocaleDateString()}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <MapPin
                                                size={14}
                                                className="me-2"
                                            />
                                            {event.location}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    {filteredEvents.length === 0 && (
                        <Col className="text-center py-5">
                            <Archive
                                size={48}
                                className="text-muted opacity-25 mb-3"
                            />
                            <h4 className="text-muted">No events found</h4>
                            <p className="text-muted px-5">
                                Click 'Create Event' to get started!
                            </p>
                        </Col>
                    )}
                </Row>
            </Container>

            {/* Event Details Modal */}
            <Modal
                show={showDetails}
                onHide={() => {
                    setShowDetails(false);
                    // Delay clearing to avoid flicker during closing animation
                    setTimeout(() => {
                        setSelectedEvent(null);
                        setAttendees([]);
                    }, 300);
                }}
                size="lg"
                centered
                scrollable
            >
                {selectedEvent && (
                    <>
                        <Modal.Header closeButton className="border-0 pb-0">
                            <Modal.Title className="fw-bold d-flex align-items-center">
                                {selectedEvent.name}
                                {selectedEvent.is_locked && (
                                    <Badge
                                        bg="warning"
                                        text="dark"
                                        className="ms-2 small"
                                    >
                                        Locked
                                    </Badge>
                                )}
                                {selectedEvent.is_archived && (
                                    <Badge
                                        bg="secondary"
                                        className="ms-2 small"
                                    >
                                        Archived
                                    </Badge>
                                )}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="pt-3">
                            {/* event info */}
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <Badge
                                    bg="info-subtle"
                                    className="text-info px-3 py-2 rounded-pill mb-3"
                                >
                                    {selectedEvent.category}
                                </Badge>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <div className="bg-light p-2 rounded-3 me-3">
                                        <Clock
                                            size={18}
                                            className="text-info"
                                        />
                                    </div>
                                    <div>
                                        <div className="small fw-bold">
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
                                    <div className="bg-light p-2 rounded-3 me-3">
                                        <MapPin
                                            size={18}
                                            className="text-info"
                                        />
                                    </div>
                                    <div className="small fw-bold">
                                        {selectedEvent.location}
                                    </div>
                                </div>
                            </div>

                            <p className="text-muted mb-4">
                                {selectedEvent.description}
                            </p>
                            {/* admin info */}
                            <Row className="mb-4">
                                <Col md={12}>
                                    <div className="bg-light p-3 rounded-4 d-flex justify-content-around text-center mb-4">
                                        <div>
                                            <div className="small text-muted mb-1">
                                                Capacity
                                            </div>
                                            <div className="fw-bold fs-4">
                                                {selectedEvent.capacity}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="small text-muted mb-1">
                                                Signed Up
                                            </div>
                                            <div className="fw-bold fs-4 text-info">
                                                {selectedEvent.confirmedCount}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="small text-muted mb-1">
                                                Waitlist
                                            </div>
                                            <div className="fw-bold fs-4 text-warning">
                                                {selectedEvent.waitlistCount}
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="fw-bold mb-3 d-flex align-items-center">
                                        <Users
                                            size={20}
                                            className="me-2 text-info"
                                        />{" "}
                                        Attendee Management
                                    </h5>

                                    {detailsLoading ? (
                                        <div className="text-center py-4">
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-4">
                                            {/* Confirmed List */}
                                            <div>
                                                <h6 className="fw-bold mb-3 text-success d-flex align-items-center">
                                                    <CheckCircle2
                                                        size={16}
                                                        className="me-2"
                                                    />
                                                    Confirmed Sign-ups (
                                                    {
                                                        attendees.filter(
                                                            (a) =>
                                                                a.status ===
                                                                "confirmed"
                                                        ).length
                                                    }
                                                    )
                                                </h6>
                                                <div className="table-responsive rounded-4 border">
                                                    <Table
                                                        hover
                                                        className="mb-0"
                                                    >
                                                        <thead className="bg-light">
                                                            <tr>
                                                                <th className="small fw-bold">
                                                                    User
                                                                </th>
                                                                <th className="small fw-bold">
                                                                    Dietary
                                                                </th>
                                                                <th className="small fw-bold text-end">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {attendees
                                                                .filter(
                                                                    (a) =>
                                                                        a.status ===
                                                                        "confirmed"
                                                                )
                                                                .map(
                                                                    (
                                                                        signup
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                signup.id
                                                                            }
                                                                            className="align-middle"
                                                                        >
                                                                            <td>
                                                                                <div className="fw-bold">
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.first_name ||
                                                                                        "Unknown"}{" "}
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.last_name ||
                                                                                        "User"}
                                                                                </div>
                                                                                <div className="small text-muted">
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.student_number ||
                                                                                        "No ID"}
                                                                                </div>
                                                                            </td>
                                                                            <td
                                                                                className="small"
                                                                                style={{
                                                                                    maxWidth:
                                                                                        "150px",
                                                                                }}
                                                                            >
                                                                                <span className="text-truncate d-block">
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.dietary_restrictions ||
                                                                                        "None"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <Button
                                                                                    variant="link"
                                                                                    className="p-1 text-danger"
                                                                                    title="remove user"
                                                                                    onClick={() =>
                                                                                        handleRemoveSignup(
                                                                                            signup.id
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <XCircle
                                                                                        size={
                                                                                            18
                                                                                        }
                                                                                    />
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                )}
                                                            {attendees.filter(
                                                                (a) =>
                                                                    a.status ===
                                                                    "confirmed"
                                                            ).length === 0 && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="text-center py-3 text-muted small"
                                                                    >
                                                                        No
                                                                        confirmed
                                                                        attendees
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </div>

                                            {message && (
                                                <Alert
                                                    variant={message.type}
                                                    dismissible
                                                    onClose={() =>
                                                        setMessage(null)
                                                    }
                                                    className="py-3 border-0 shadow-sm"
                                                >
                                                    {message.text}
                                                </Alert>
                                            )}

                                            {/* Waitlist List */}
                                            <div>
                                                <h6 className="fw-bold mb-3 text-warning d-flex align-items-center">
                                                    <Clock
                                                        size={16}
                                                        className="me-2"
                                                    />
                                                    Waitlisted (
                                                    {
                                                        attendees.filter(
                                                            (a) =>
                                                                a.status ===
                                                                "waitlisted"
                                                        ).length
                                                    }
                                                    )
                                                </h6>
                                                <div className="table-responsive rounded-4 border">
                                                    <Table
                                                        hover
                                                        className="mb-0"
                                                    >
                                                        <thead className="bg-light">
                                                            <tr>
                                                                <th className="small fw-bold">
                                                                    Pos
                                                                </th>
                                                                <th className="small fw-bold">
                                                                    User
                                                                </th>
                                                                <th className="small fw-bold">
                                                                    Dietary
                                                                </th>
                                                                <th className="small fw-bold text-end">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {attendees
                                                                .filter(
                                                                    (a) =>
                                                                        a.status ===
                                                                        "waitlisted"
                                                                )
                                                                .map(
                                                                    (
                                                                        signup,
                                                                        index
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                signup.id
                                                                            }
                                                                            className="align-middle"
                                                                        >
                                                                            <td className="fw-bold text-muted small">
                                                                                #
                                                                                {index +
                                                                                    1}
                                                                            </td>
                                                                            <td>
                                                                                <div className="fw-bold">
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.first_name ||
                                                                                        "Unknown"}{" "}
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.last_name ||
                                                                                        "User"}
                                                                                </div>
                                                                                <div className="small text-muted">
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.student_number ||
                                                                                        "No ID"}
                                                                                </div>
                                                                            </td>
                                                                            <td
                                                                                className="small"
                                                                                style={{
                                                                                    maxWidth:
                                                                                        "150px",
                                                                                }}
                                                                            >
                                                                                <span className="text-truncate d-block">
                                                                                    {signup
                                                                                        .profiles
                                                                                        ?.dietary_restrictions ||
                                                                                        "None"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <div className="d-flex justify-content-end gap-1">
                                                                                    <Button
                                                                                        variant="link"
                                                                                        className="p-1 text-success shadow-none"
                                                                                        title="sign-up user"
                                                                                        onClick={() => {
                                                                                            if (
                                                                                                selectedEvent.confirmedCount >=
                                                                                                selectedEvent.capacity
                                                                                            ) {
                                                                                                setMessage(
                                                                                                    {
                                                                                                        type: "warning",
                                                                                                        text: "Cannot promote: Event is at full capacity.",
                                                                                                    }
                                                                                                );
                                                                                                return;
                                                                                            }
                                                                                            handleUpdateSignupStatus(
                                                                                                signup.id,
                                                                                                "confirmed"
                                                                                            );
                                                                                        }}
                                                                                        style={{
                                                                                            opacity:
                                                                                                selectedEvent.confirmedCount >=
                                                                                                selectedEvent.capacity
                                                                                                    ? 0.5
                                                                                                    : 1,
                                                                                        }}
                                                                                    >
                                                                                        <ArrowUpCircle
                                                                                            size={
                                                                                                18
                                                                                            }
                                                                                        />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="link"
                                                                                        className="p-1 text-danger"
                                                                                        title="remove user"
                                                                                        onClick={() =>
                                                                                            handleRemoveSignup(
                                                                                                signup.id
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <XCircle
                                                                                            size={
                                                                                                18
                                                                                            }
                                                                                        />
                                                                                    </Button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                )}
                                                            {attendees.filter(
                                                                (a) =>
                                                                    a.status ===
                                                                    "waitlisted"
                                                            ).length === 0 && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            4
                                                                        }
                                                                        className="text-center py-3 text-muted small"
                                                                    >
                                                                        Waitlist
                                                                        is empty
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer className="bg-light border-0 py-3 d-flex justify-content-between">
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-danger"
                                    className="d-flex align-items-center"
                                    onClick={() =>
                                        handleDeleteEvent(selectedEvent.id)
                                    }
                                >
                                    <Trash2 size={18} className="me-2" /> Delete
                                </Button>
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    variant={
                                        selectedEvent.is_locked
                                            ? "info"
                                            : "outline-info"
                                    }
                                    onClick={() =>
                                        handleToggleLock(selectedEvent)
                                    }
                                >
                                    <Lock size={18} className="me-2" />{" "}
                                    {selectedEvent.is_locked
                                        ? "Unlock"
                                        : "Lock"}
                                </Button>
                                <Button
                                    variant={
                                        selectedEvent.is_archived
                                            ? "secondary"
                                            : "outline-secondary"
                                    }
                                    onClick={() =>
                                        handleToggleArchive(selectedEvent)
                                    }
                                >
                                    <Archive size={18} className="me-2" />{" "}
                                    {selectedEvent.is_archived
                                        ? "Unarchive"
                                        : "Archive"}
                                </Button>
                            </div>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            {/* Create Event Modal */}
            <Modal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        Create New Event
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={handleCreateEvent}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">
                                University / School
                            </Form.Label>
                            <Form.Select
                                value={newEvent.school}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        school: e.target.value,
                                    })
                                }
                                className="py-2 bg-light border-0"
                            >
                                <option>UBC</option>
                                <option>SFU</option>
                                <option>UVic</option>
                                <option>BCIT</option>
                            </Form.Select>
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Event Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        required
                                        value={newEvent.name}
                                        onChange={(e) =>
                                            setNewEvent({
                                                ...newEvent,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Awesome Hackathon"
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Category
                                    </Form.Label>
                                    <Form.Select
                                        value={newEvent.category}
                                        onChange={(e) =>
                                            setNewEvent({
                                                ...newEvent,
                                                category: e.target.value,
                                            })
                                        }
                                        className="py-2 bg-light border-0"
                                    >
                                        <option>Tech</option>
                                        <option>Music</option>
                                        <option>Art</option>
                                        <option>Social</option>
                                        <option>Workshop</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Start Datetime
                                    </Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        required
                                        value={newEvent.start_datetime}
                                        onChange={(e) =>
                                            setNewEvent({
                                                ...newEvent,
                                                start_datetime: e.target.value,
                                            })
                                        }
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        End Datetime
                                    </Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        required
                                        value={newEvent.end_datetime}
                                        onChange={(e) =>
                                            setNewEvent({
                                                ...newEvent,
                                                end_datetime: e.target.value,
                                            })
                                        }
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Location
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        required
                                        value={newEvent.location}
                                        onChange={(e) =>
                                            setNewEvent({
                                                ...newEvent,
                                                location: e.target.value,
                                            })
                                        }
                                        placeholder="Room 101, Student Union"
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">
                                        Capacity
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        required
                                        value={newEvent.capacity}
                                        onChange={(e) =>
                                            setNewEvent({
                                                ...newEvent,
                                                capacity: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="py-2 bg-light border-0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">
                                Image URL
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={newEvent.image_url}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        image_url: e.target.value,
                                    })
                                }
                                placeholder="https://example.com/image.jpg"
                                className="py-2 bg-light border-0"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">
                                Tags (comma separated)
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={newEvent.tags}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        tags: e.target.value,
                                    })
                                }
                                placeholder="coding, free-food, networking"
                                className="py-2 bg-light border-0"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">
                                Required Profile Information
                            </Form.Label>
                            <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded-4">
                                {[
                                    { id: "first_name", label: "First Name" },
                                    { id: "last_name", label: "Last Name" },
                                    {
                                        id: "student_number",
                                        label: "Student ID",
                                    },
                                    { id: "age", label: "Age" },
                                    {
                                        id: "dietary_restrictions",
                                        label: "Dietary Info",
                                    },
                                ].map((field) => (
                                    <Form.Check
                                        key={field.id}
                                        type="checkbox"
                                        id={`req-${field.id}`}
                                        label={field.label}
                                        checked={newEvent.required_profile_fields.includes(
                                            field.id
                                        )}
                                        onChange={(e) => {
                                            const fields = e.target.checked
                                                ? [
                                                      ...newEvent.required_profile_fields,
                                                      field.id,
                                                  ]
                                                : newEvent.required_profile_fields.filter(
                                                      (f) => f !== field.id
                                                  );
                                            setNewEvent({
                                                ...newEvent,
                                                required_profile_fields: fields,
                                            });
                                        }}
                                        className="small fw-bold text-muted"
                                    />
                                ))}
                            </div>
                            <Form.Text className="text-muted small">
                                Users will be prompted to complete these fields
                                in their profile before they can sign up.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">
                                Description
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newEvent.description}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Describe your event..."
                                className="py-2 bg-light border-0"
                            />
                        </Form.Group>
                        <div className="d-grid mt-4">
                            <Button
                                variant="info"
                                type="submit"
                                className="py-3 text-white fw-bold shadow-sm rounded-4"
                                disabled={createLoading}
                            >
                                {createLoading ? (
                                    <Spinner animation="border" size="sm" />
                                ) : (
                                    "Publish Event"
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
