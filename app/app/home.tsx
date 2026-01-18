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
    Alert,
} from "react-bootstrap";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
    Calendar,
    MapPin,
    Search,
    Tag as TagIcon,
    Clock,
    Users,
    ChevronRight,
    CheckCircle2,
    RotateCcw,
    Share,
    Download,
    Copy,
    Check,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>("UBC");
    const [schoolImageLink, setSchoolImageLink] = useState<string>("");
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: string;
        text: string;
    } | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Headline rotation: show original, then replace twice, then stop
    const headlineSequence = [
        "Discover Amazing Events",
        "At your ease!",
        "Try out UniEvents!",
    ];
    const [headlineIndex, setHeadlineIndex] = useState(0);

    useEffect(() => {
        const isLastItem = headlineIndex === headlineSequence.length - 1;
        const delay = isLastItem ? 3000 : 2000;

        const interval = setInterval(() => {
            setHeadlineIndex((prev) => (prev + 1) % headlineSequence.length);
        }, delay);

        return () => clearInterval(interval);
    }, [headlineIndex]);

    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                setProfile(data);
            }
            fetchSchools();
            fetchSchoolImageLink("UBC");
            fetchEvents();
        };
        init();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("events")
            .select(
                `
                *,
                signups (
                    user_id,
                    status
                )
            `
            )
            .eq("is_archived", false)
            .order("start_datetime", { ascending: true });

        if (error) {
            console.error(error);
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    };

    const handleSignup = async (event: any) => {
        if (!user) {
            const currentPath =
                window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(
                currentPath
            )}`;
            return;
        }

        setSignupLoading(true);
        setMessage(null);

        // Check for required profile fields
        if (
            event.required_profile_fields &&
            event.required_profile_fields.length > 0
        ) {
            const missingFields = event.required_profile_fields.filter(
                (field: string) =>
                    !profile || !profile[field] || profile[field] === ""
            );

            if (missingFields.length > 0) {
                setMessage({
                    type: "danger",
                    text: `Missing required profile info: ${missingFields
                        .join(", ")
                        .replace(
                            /_/g,
                            " "
                        )}. Please update your profile first.`,
                });
                setSignupLoading(false);
                return;
            }
        }

        const confirmedCount = event.signups.filter(
            (s: any) => s.status === "confirmed"
        ).length;
        const status =
            confirmedCount < event.capacity ? "confirmed" : "waitlisted";

        const { error } = await supabase.from("signups").insert({
            event_id: event.id,
            user_id: user.id,
            status: status,
        });

        if (error) {
            if (error.code === "23505") {
                setMessage({
                    type: "warning",
                    text: "You are already registered for this event!",
                });
            } else {
                setMessage({ type: "danger", text: error.message });
            }
        } else {
            setMessage({
                type: status === "confirmed" ? "success" : "warning",
                text:
                    status === "confirmed"
                        ? "Registration successful!"
                        : "Event is full. You've been added to the waitlist.",
            });
            fetchEvents();
            // Also update selectedEvent signups locally
            if (selectedEvent && selectedEvent.id === event.id) {
                setSelectedEvent({
                    ...selectedEvent,
                    signups: [
                        ...selectedEvent.signups,
                        { user_id: user.id, status: status },
                    ],
                });
            }
        }
        setSignupLoading(false);
    };

    const handleCancelSignup = async (event: any) => {
        if (!user) return;

        setSignupLoading(true);
        setMessage(null);

        const { error } = await supabase
            .from("signups")
            .delete()
            .eq("event_id", event.id)
            .eq("user_id", user.id);

        if (error) {
            setMessage({ type: "danger", text: error.message });
        } else {
            setMessage({
                type: "success",
                text: "Your registration has been cancelled.",
            });
            fetchEvents();
            // Also update selectedEvent signups locally
            if (selectedEvent && selectedEvent.id === event.id) {
                setSelectedEvent({
                    ...selectedEvent,
                    signups: selectedEvent.signups.filter(
                        (s: any) => s.user_id !== user.id
                    ),
                });
            }
        }
        setSignupLoading(false);
    };

    const fetchSchools = async () => {
        const { data, error } = await supabase.from("schools").select("*");
        if (error) {
            console.error(error);
        } else {
            setSchools(data);
        }
    };

    const fetchSchoolImageLink = async (schoolName: any) => {
        const { data, error } = await supabase
            .from("schools")
            .select("background_image_url")
            .eq("name", schoolName)
            .single();
        if (error) {
            console.error(error);
        } else {
            setSchoolImageLink(data.background_image_url);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedCategories([]);
        setSelectedTags([]);
    };

    // Interest Selection Modal Logic
    const [showInterestsModal, setShowInterestsModal] = useState(false);
    const [interestTags, setInterestTags] = useState<string[]>([]);
    const [interestSaving, setInterestSaving] = useState(false);

    useEffect(() => {
        // Check for welcome param
        const params = new URLSearchParams(window.location.search);
        if (params.get("welcome") === "true") {
            setShowInterestsModal(true);
            // Clean URL
            window.history.replaceState({}, "", "/");
        }
    }, []);

    const handleSaveInterests = async () => {
        if (!user) return;
        setInterestSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ interests: interestTags })
                .eq("id", user.id);

            if (error) throw error;

            // Optional: update local profile if we were tracking it closely,
            // but for home page filtering we might want to reload or just close modal.
            setShowInterestsModal(false);
            setMessage({
                type: "success",
                text: "Interests saved successfully!",
            });
        } catch (error: any) {
            console.error("Error saving interests:", error);
            setMessage({
                type: "danger",
                text: `Failed to save interests: ${
                    error?.message || "Unknown error"
                }`,
            });
        } finally {
            setInterestSaving(false);
        }
    };

    // Handle shared event link
    useEffect(() => {
        if (events.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const eventId = params.get("event");
            if (eventId) {
                const event = events.find((e) => e.id === eventId);
                if (event) {
                    setSelectedEvent(event);
                    setShowModal(true);
                }
            }
        }
    }, [events]);

    const schoolEvents = events.filter((e) => e.school === selectedSchool);
    const categories = Array.from(new Set(schoolEvents.map((e) => e.category)));
    const allTags = Array.from(
        new Set(schoolEvents.flatMap((e) => e.tags || []))
    );

    const filteredEvents = events
        .filter((event) => {
            const now = new Date();
            const isExpired = new Date(event.end_datetime) < now;

            const matchesSchool = event.school === selectedSchool;
            const matchesSearch =
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
            const matchesCategory =
                selectedCategories.length === 0 ||
                selectedCategories.includes(event.category);
            const matchesTags =
                selectedTags.length === 0 ||
                selectedTags.every((tag) => event.tags?.includes(tag));
            return (
                !isExpired &&
                matchesSchool &&
                matchesSearch &&
                matchesCategory &&
                matchesTags
            );
        })
        .sort(
            (a, b) =>
                new Date(a.start_datetime).getTime() -
                new Date(b.start_datetime).getTime()
        );

    const hasInterests = profile?.interests && profile.interests.length > 0;

    const suggestedEvents = hasInterests
        ? filteredEvents.filter((event) =>
              event.tags?.some((tag: string) => profile.interests.includes(tag))
          )
        : [];

    const otherEvents = hasInterests
        ? filteredEvents.filter(
              (event) =>
                  !event.tags?.some((tag: string) =>
                      profile.interests.includes(tag)
                  )
          )
        : filteredEvents;

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const renderEventCard = (event: any) => {
        const now = new Date();
        const isHappening =
            new Date(event.start_datetime) <= now &&
            new Date(event.end_datetime) > now;

        const isUserSignedUp = event.signups.some(
            (s: any) => s.user_id === user?.id
        );
        const confirmedCount = event.signups.filter(
            (s: any) => s.status === "confirmed"
        ).length;
        const waitlistCount = event.signups.filter(
            (s: any) => s.status === "waitlisted"
        ).length;
        const userStatus = event.signups.find(
            (s: any) => s.user_id === user?.id
        )?.status;

        return (
            <Col key={event.id} md={6} lg={3} className="mb-4">
                <Card
                    className="event-card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition"
                    onClick={() => {
                        setSelectedEvent(event);
                        setShowModal(true);
                        setMessage(null);
                    }}
                >
                    <div
                        style={{
                            height: "160px",
                            overflow: "hidden",
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
                            <div className="h-100 w-100 bg-info-subtle d-flex align-items-center justify-content-center text-info">
                                <Calendar size={48} />
                            </div>
                        )}
                        <div className="position-absolute top-0 end-0 p-3">
                            <Badge
                                bg="white"
                                className="text-dark bg-opacity-75 backdrop-blur shadow-sm rounded-pill py-2 px-3 fw-bold"
                            >
                                {event.category}
                            </Badge>
                        </div>
                    </div>
                    <Card.Body className="p-2">
                        <h6 className="fw-bold mb-1 text-truncate">
                            {event.name}
                        </h6>
                        <div className="small text-muted mb-2 text-truncate">
                            Organiser:{" "}
                            {event.organiser_name ||
                                event.organizer ||
                                "Unknown"}
                        </div>
                        <div
                            className="text-muted small mb-2"
                            style={{
                                fontSize: "0.8rem",
                            }}
                        >
                            <div className="d-flex align-items-center mb-1 text-truncate">
                                <Clock
                                    size={14}
                                    className="me-2 text-info flex-shrink-0"
                                />
                                {formatDateTime(event.start_datetime)}
                            </div>
                            <div className="d-flex align-items-center text-truncate">
                                <MapPin
                                    size={14}
                                    className="me-2 text-info flex-shrink-0"
                                />
                                {event.location}
                            </div>
                        </div>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                            {event.tags?.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="text-info bg-info-subtle px-2 py-0.5 rounded fw-medium"
                                    style={{
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center">
                                {isUserSignedUp ? (
                                    <Badge
                                        bg={
                                            userStatus === "confirmed"
                                                ? "success"
                                                : "warning"
                                        }
                                        className="py-2 px-3 rounded-pill d-flex align-items-center"
                                    >
                                        <CheckCircle2
                                            size={14}
                                            className="me-1"
                                        />
                                        {userStatus === "confirmed"
                                            ? "Registered"
                                            : "Waitlisted"}
                                    </Badge>
                                ) : (
                                    <span className="text-muted small d-flex align-items-center">
                                        <Users size={14} className="me-1" />
                                        {confirmedCount}/{event.capacity}
                                        {waitlistCount > 0 ? (
                                            <span className="ms-2 text-warning fw-medium">
                                                (Wait: {waitlistCount})
                                            </span>
                                        ) : confirmedCount >= event.capacity ? (
                                            <span className="ms-2 text-warning fw-medium">
                                                Waitlist Open
                                            </span>
                                        ) : null}
                                    </span>
                                )}
                                <span
                                    className="text-muted small d-flex align-items-center ms-auto"
                                    style={{
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    Details
                                    <ChevronRight size={12} className="ms-1" />
                                </span>
                            </div>
                            {isHappening && (
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
        );
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
            {/* Navbar */}
            <Navbar
                bg="dark"
                variant="dark"
                expand="lg"
                className="shadow-sm py-3 sticky-top"
                style={{ zIndex: 1030 }}
            >
                <Container>
                    <div className="navbar-brand fw-bold fs-3 d-flex align-items-center">
                        <Link
                            href="/"
                            className="text-decoration-none text-white"
                        >
                            <span style={{ color: "#0dcaf0" }}>Uni</span>Events
                        </Link>
                        <div className="ms-3 ps-3 border-start border-secondary border-opacity-25">
                            <Dropdown
                                onSelect={(s: any) => {
                                    setSelectedSchool(s);
                                    fetchSchoolImageLink(s);
                                    handleClearFilters();
                                }}
                            >
                                <Dropdown.Toggle
                                    variant="dark"
                                    id="dropdown-school"
                                    className="border-0 p-0 fs-6 fw-bold opacity-75 d-flex align-items-center"
                                >
                                    <MapPin
                                        size={16}
                                        className="me-2 text-info"
                                    />
                                    {selectedSchool}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-lg rounded-4 mt-2">
                                    {schools.map((school: any) => {
                                        return (
                                            <Dropdown.Item
                                                key={school.name}
                                                eventKey={school.name}
                                            >
                                                {school.name}
                                            </Dropdown.Item>
                                        );
                                    })}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse
                        id="basic-navbar-nav"
                        className="justify-content-end"
                    >
                        <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                            {user ? (
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
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                        <span className="small">
                                            {user.email?.split("@")[0]}
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="border-0 shadow-sm rounded-4 mt-2">
                                        <Dropdown.Item
                                            as={Link}
                                            href="/profile"
                                        >
                                            Profile
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            as={Link}
                                            href="/signups"
                                        >
                                            My Sign-ups
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
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="btn btn-outline-info rounded-pill px-4 btn-sm fw-bold"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="btn btn-info text-white rounded-pill px-4 btn-sm fw-bold shadow-sm"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <div
                className="bg-dark text-white py-5 mb-5"
                style={{
                    background:
                        "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))",
                    backgroundImage: schoolImageLink
                        ? "url(" + schoolImageLink + ")"
                        : "none",
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    backdropFilter: "brightness(0.5)",
                }}
            >
                <div
                    style={{
                        top: "0",
                        left: "0",
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        zIndex: -1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                ></div>
                <Container className="py-5 text-center">
                    <h1
                        key={headlineIndex}
                        className={`display-4 fw-bold mb-3 hero-animate hero-move headline-fade`}
                    >
                        {headlineSequence[headlineIndex]}
                    </h1>
                    <p className="lead mb-4 opacity-100 fw-semibold hero-animate hero-animate-delay">
                        Find tech talks, music festivals, and community
                        workshops on campus!
                    </p>
                    <div className="max-w-600 mx-auto hero-animate hero-animate-slower">
                        <Form.Group className="position-relative">
                            <Form.Control
                                type="text"
                                placeholder="Search events, organizers, or topics..."
                                className="py-3 px-5 rounded-pill border-0 shadow-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search
                                className="position-absolute translate-middle-y top-50 start-0 ms-4 text-muted"
                                size={20}
                            />
                        </Form.Group>
                    </div>
                </Container>
            </div>

            <Container className="mb-5">
                <Row>
                    {/* Filters */}
                    <Col lg={2} className="mb-4">
                        <Card
                            className="border-0 shadow-sm rounded-4 p-3 sticky-top"
                            style={{
                                top: "100px",
                                zIndex: 10,
                                maxHeight: "calc(100vh - 120px)",
                                overflowY: "auto",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">Filters</h5>
                                {(searchTerm ||
                                    selectedCategories.length > 0 ||
                                    selectedTags.length > 0) && (
                                    <Button
                                        variant="link"
                                        className="p-0 text-muted small text-decoration-none d-flex align-items-center"
                                        onClick={handleClearFilters}
                                    >
                                        <RotateCcw size={14} className="me-1" />{" "}
                                        Clear All
                                    </Button>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="small fw-bold text-muted mb-2 d-block">
                                    CATEGORIES
                                </label>
                                {/* Desktop: keep checkbox list */}
                                <div className="d-none d-lg-block">
                                    {categories.map((cat) => (
                                        <Form.Check
                                            key={cat}
                                            type="checkbox"
                                            id={`cat-${cat}`}
                                            label={cat}
                                            className="mb-2 small fw-medium"
                                            checked={selectedCategories.includes(
                                                cat
                                            )}
                                            onChange={() =>
                                                setSelectedCategories((prev) =>
                                                    prev.includes(cat)
                                                        ? prev.filter(
                                                              (c) => c !== cat
                                                          )
                                                        : [...prev, cat]
                                                )
                                            }
                                        />
                                    ))}
                                </div>

                                {/* Mobile: compact inline checkboxes (keeps checkbox behavior, but more compact than full list) */}
                                <div className="d-lg-none d-flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <Form.Check
                                            key={cat}
                                            inline
                                            type="checkbox"
                                            id={`cat-mobile-${cat}`}
                                            label={cat}
                                            className="small mb-2"
                                            checked={selectedCategories.includes(
                                                cat
                                            )}
                                            onChange={() =>
                                                setSelectedCategories((prev) =>
                                                    prev.includes(cat)
                                                        ? prev.filter(
                                                              (c) => c !== cat
                                                          )
                                                        : [...prev, cat]
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="small fw-bold text-muted mb-2 d-block">
                                    TAGS
                                </label>
                                <div className="d-flex flex-wrap gap-1">
                                    {allTags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            bg={
                                                selectedTags.includes(tag)
                                                    ? "info"
                                                    : "light"
                                            }
                                            className={`py-1.5 px-2.5 rounded-pill cursor-pointer border ${
                                                selectedTags.includes(tag)
                                                    ? "text-white"
                                                    : "text-muted"
                                            }`}
                                            style={{
                                                cursor: "pointer",
                                                fontSize: "0.75rem",
                                            }}
                                            onClick={() =>
                                                setSelectedTags((prev) =>
                                                    prev.includes(tag)
                                                        ? prev.filter(
                                                              (t) => t !== tag
                                                          )
                                                        : [...prev, tag]
                                                )
                                            }
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Event Grid */}
                    <Col lg={10}>
                        {suggestedEvents.length > 0 && (
                            <div className="mb-5">
                                <h4 className="fw-bold mb-3">
                                    Suggested for you
                                </h4>
                                <Row>
                                    {suggestedEvents.map((event) =>
                                        renderEventCard(event)
                                    )}
                                </Row>
                            </div>
                        )}

                        <div className="mb-4">
                            {suggestedEvents.length > 0 && (
                                <h4 className="fw-bold mb-3">More Events</h4>
                            )}
                            <Row>
                                {otherEvents.map((event) =>
                                    renderEventCard(event)
                                )}

                                {filteredEvents.length === 0 && (
                                    <Col className="text-center py-5">
                                        <h3 className="fw-bold text-muted">
                                            No events found
                                        </h3>
                                        <p className="text-muted">
                                            There are currently no events listed
                                            for {selectedSchool}. Try checking
                                            another university or adjusting your
                                            filters!
                                        </p>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Event Modal */}
            <Modal
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    // Clear event param from URL if it exists
                    const params = new URLSearchParams(window.location.search);
                    if (params.has("event")) {
                        params.delete("event");
                        const newUrl =
                            window.location.pathname +
                            (params.toString() ? `?${params.toString()}` : "");
                        window.history.replaceState({}, "", newUrl);
                    }
                }}
                size="lg"
                centered
                contentClassName="rounded-4"
            >
                {selectedEvent && (
                    <>
                        <Modal.Body className="p-0 overflow-hidden">
                            <Row className="g-0">
                                <Col
                                    md={5}
                                    className="bg-info-subtle d-flex align-items-center justify-content-center"
                                    style={{ minHeight: "300px" }}
                                >
                                    {selectedEvent.image_url ? (
                                        <img
                                            src={selectedEvent.image_url}
                                            alt={selectedEvent.name}
                                            className="w-100 h-100 object-fit-cover"
                                        />
                                    ) : (
                                        <Calendar
                                            size={100}
                                            className="text-info opacity-25"
                                        />
                                    )}
                                </Col>
                                <Col md={7} className="p-5">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Badge
                                            bg="info-subtle"
                                            className="text-info px-3 py-2 rounded-pill mb-3"
                                        >
                                            {selectedEvent.category}
                                        </Badge>
                                        <button
                                            className="btn-close"
                                            onClick={() => setShowModal(false)}
                                        ></button>
                                    </div>
                                    <h2 className="fw-bold mb-4">
                                        {selectedEvent.name}
                                    </h2>
                                    <div className="small text-muted mb-3">
                                        Organiser:{" "}
                                        {selectedEvent.organiser_name ||
                                            selectedEvent.organizer ||
                                            "Unknown"}
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

                                    {message && (
                                        <Alert
                                            variant={message.type}
                                            className="small py-2 mb-4 d-flex align-items-center justify-content-between"
                                        >
                                            <div className="me-2">
                                                {message.text}
                                            </div>
                                            {message.text.includes(
                                                "required profile info"
                                            ) && (
                                                <Link
                                                    href="/profile"
                                                    className="btn btn-sm btn-danger fw-bold rounded-pill px-3 text-nowrap"
                                                >
                                                    Update Profile
                                                </Link>
                                            )}
                                        </Alert>
                                    )}

                                    <div className="d-flex gap-2">
                                        <div className="flex-grow-1 d-grid">
                                            {selectedEvent.signups.some(
                                                (s: any) =>
                                                    s.user_id === user?.id
                                            ) ? (
                                                <Button
                                                    variant="outline-danger"
                                                    className="py-3 fw-bold rounded-4 shadow-sm"
                                                    onClick={() =>
                                                        handleCancelSignup(
                                                            selectedEvent
                                                        )
                                                    }
                                                    disabled={signupLoading}
                                                >
                                                    {signupLoading ? (
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                        />
                                                    ) : (
                                                        "Cancel Signup"
                                                    )}
                                                </Button>
                                            ) : selectedEvent.is_locked ? (
                                                <Button
                                                    variant="secondary"
                                                    className="py-3 fw-bold rounded-4 shadow-sm"
                                                    disabled
                                                >
                                                    Registration Locked
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="info"
                                                    className="py-3 text-white fw-bold rounded-4 shadow-sm"
                                                    onClick={() =>
                                                        handleSignup(
                                                            selectedEvent
                                                        )
                                                    }
                                                    disabled={signupLoading}
                                                >
                                                    {signupLoading ? (
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                        />
                                                    ) : selectedEvent.signups.filter(
                                                          (s: any) =>
                                                              s.status ===
                                                              "confirmed"
                                                      ).length <
                                                      selectedEvent.capacity ? (
                                                        "Signup Now"
                                                    ) : (
                                                        "Join Waitlist"
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline-info"
                                            className="p-3 rounded-4 d-flex align-items-center justify-content-center border-2"
                                            onClick={() =>
                                                setShowShareModal(true)
                                            }
                                            style={{
                                                width: "60px",
                                                height: "100%",
                                            }}
                                        >
                                            <Share size={24} />
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Modal.Body>
                    </>
                )}
            </Modal>
            {/* Interest Selection Modal */}
            <Modal
                show={showInterestsModal}
                onHide={() => setShowInterestsModal(false)}
                size="lg"
                centered
                contentClassName="rounded-4"
                backdrop="static"
                keyboard={false}
            >
                <Modal.Body className="p-5 text-center">
                    <h2 className="fw-bold mb-3">
                        Welcome to <span className="text-info">Uni</span>Events!
                    </h2>
                    <p className="text-muted mb-4 lead">
                        Let's personalize your experience. Pick some topics
                        you're interested in, and we'll help you find the best
                        events.
                    </p>

                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
                        {allTags.map((tag) => (
                            <Badge
                                key={tag}
                                bg={
                                    interestTags.includes(tag)
                                        ? "info"
                                        : "light"
                                }
                                className={`py-3 px-4 rounded-pill cursor-pointer border user-select-none transition ${
                                    interestTags.includes(tag)
                                        ? "text-white"
                                        : "text-muted"
                                }`}
                                style={{ cursor: "pointer", fontSize: "1rem" }}
                                onClick={() =>
                                    setInterestTags((prev) =>
                                        prev.includes(tag)
                                            ? prev.filter((t) => t !== tag)
                                            : [...prev, tag]
                                    )
                                }
                            >
                                {interestTags.includes(tag) && (
                                    <CheckCircle2 size={16} className="me-2" />
                                )}
                                #{tag}
                            </Badge>
                        ))}
                    </div>

                    <div className="d-grid gap-2 col-lg-6 mx-auto">
                        <Button
                            variant="info"
                            size="lg"
                            className="text-white fw-bold rounded-pill shadow-sm py-3"
                            onClick={handleSaveInterests}
                            disabled={interestSaving}
                        >
                            {interestSaving ? (
                                <>
                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Saving...
                                </>
                            ) : (
                                "Start Exploring"
                            )}
                        </Button>
                        <Button
                            variant="link"
                            className="text-muted text-decoration-none"
                            onClick={() => setShowInterestsModal(false)}
                            disabled={interestSaving}
                        >
                            Skip for now
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Share Modal */}
            <Modal
                show={showShareModal}
                onHide={() => {
                    setShowShareModal(false);
                    setCopySuccess(false);
                }}
                centered
                size="sm"
                contentClassName="rounded-4"
                style={{ zIndex: 1060 }}
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-5">
                        Share Event
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center pt-3 p-4">
                    {selectedEvent && (
                        <>
                            <div className="bg-white p-3 rounded-4 shadow-sm mb-4 d-inline-block border">
                                <QRCodeCanvas
                                    id="event-page-qr"
                                    value={`${
                                        typeof window !== "undefined"
                                            ? window.location.origin
                                            : ""
                                    }/?event=${selectedEvent.id}`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="d-grid gap-2 mb-4">
                                <Button
                                    variant="outline-info"
                                    className="rounded-pill d-flex align-items-center justify-content-center py-2 fw-medium"
                                    onClick={() => {
                                        const canvas = document.getElementById(
                                            "event-page-qr"
                                        ) as HTMLCanvasElement;
                                        if (canvas) {
                                            const url =
                                                canvas.toDataURL("image/png");
                                            const link =
                                                document.createElement("a");
                                            link.download = `${selectedEvent.name
                                                .replace(/\s+/g, "-")
                                                .toLowerCase()}-qr.png`;
                                            link.href = url;
                                            link.click();
                                        }
                                    }}
                                >
                                    <Download size={18} className="me-2" />{" "}
                                    Download QR
                                </Button>
                            </div>

                            <div className="bg-light p-2 rounded-4 d-flex align-items-center border">
                                <div className="text-truncate small flex-grow-1 px-2 text-muted">
                                    {`${
                                        typeof window !== "undefined"
                                            ? window.location.origin
                                            : ""
                                    }/?event=${selectedEvent.id}`}
                                </div>
                                <Button
                                    variant={copySuccess ? "success" : "info"}
                                    size="sm"
                                    className="text-white rounded-pill px-3 shadow-sm"
                                    onClick={() => {
                                        const url = `${window.location.origin}/?event=${selectedEvent.id}`;
                                        navigator.clipboard.writeText(url);
                                        setCopySuccess(true);
                                        setTimeout(
                                            () => setCopySuccess(false),
                                            2000
                                        );
                                    }}
                                >
                                    {copySuccess ? (
                                        <Check size={16} />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}
