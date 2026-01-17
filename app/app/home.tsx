"use client";

import React, { useState } from "react";
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
} from "react-bootstrap";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useEffect } from "react";

// Mock data for events
const INITIAL_EVENTS = [
    {
        id: 1,
        name: "FutureSoc Con 2025",
        category: "Tech",
        image: "/tech.png",
        description:
            "Join us for the largest tech conference of the year. Explore the latest in AI, Robotics, and Software Engineering.",
        date: "October 26-28, 2025",
        location: "San Francisco, CA",
    },
    {
        id: 2,
        name: "Sunset Sounds Festival",
        category: "Music",
        image: "/music.png",
        description:
            "An unforgettable weekend of live music, art installations, and coastal vibes.",
        date: "October 26-28, 2024",
        location: "Coastal Amphitheater",
    },
    {
        id: 3,
        name: "Matter & Silence Exhibition",
        category: "Art",
        image: "/art.png",
        description:
            "A deep dive into minimalist oil paintings and conceptual art from world-renowned artists.",
        date: "Oct 26 - Dec 15",
        location: "The CYV Tower Gallery",
    },
    {
        id: 4,
        name: "AI & Ethics Workshop",
        category: "Tech",
        image: "/tech.png",
        description:
            "Hands-on workshop exploring the ethical implications of artificial intelligence in modern society.",
        date: "November 5, 2025",
        location: "Online",
    },
    {
        id: 5,
        name: "Indie Rock Night",
        category: "Music",
        image: "/music.png",
        description:
            "Discover the best upcoming local indie bands in an intimate setting.",
        date: "December 1, 2025",
        location: "The Basement, NY",
    },
];

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
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

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const filteredEvents = INITIAL_EVENTS.filter((event) => {
        const matchesSearch = event.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(event.category);
        return matchesSearch && matchesCategory;
    });

    const handleShowModal = (event: any) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedEvent(null);
    };

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            {/* Title Bar */}
            <Navbar
                bg="dark"
                variant="dark"
                expand="lg"
                className="mb-4 shadow-sm py-3"
            >
                <Container fluid>
                    <Navbar.Brand href="#" className="fw-bold fs-3">
                        <span style={{ color: "#0dcaf0" }}>Event</span>Hive
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse
                        id="basic-navbar-nav"
                        className="justify-content-end"
                    >
                        {user ? (
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="outline-info"
                                    id="dropdown-user"
                                    className="d-flex align-items-center"
                                >
                                    <div
                                        className="me-2 rounded-circle bg-info d-flex align-items-center justify-content-center text-white"
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                    {user.email?.split("@")[0]}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} href="/profile">
                                        Profile
                                    </Dropdown.Item>
                                    <Dropdown.Item href="#/settings">
                                        Settings
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={handleLogout}>
                                        Logout
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="btn btn-outline-info me-2"
                                >
                                    Login
                                </Link>
                                <Link href="/signup" className="btn btn-info">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="px-4">
                <Row>
                    {/* Left 1/4 Filter Bar */}
                    <Col md={3} className="mb-4">
                        <Card
                            className="border-0 shadow-sm p-3 position-sticky"
                            style={{ top: "20px" }}
                        >
                            <h4 className="mb-4 fw-bold">Filters</h4>

                            <Form.Group className="mb-4">
                                <Form.Label className="text-secondary small fw-bold text-uppercase">
                                    Search
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="border-0 bg-light"
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="text-secondary small fw-bold text-uppercase">
                                    Category
                                </Form.Label>
                                {["Tech", "Music", "Art"].map((category) => (
                                    <Form.Check
                                        key={category}
                                        type="checkbox"
                                        id={`check-${category}`}
                                        label={category}
                                        className="mb-2"
                                        checked={selectedCategories.includes(
                                            category
                                        )}
                                        onChange={() =>
                                            handleCategoryChange(category)
                                        }
                                    />
                                ))}
                            </Form.Group>

                            <hr className="my-4 text-muted" />

                            <div className="d-grid">
                                <Button
                                    variant="link"
                                    className="text-muted text-decoration-none p-0"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedCategories([]);
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    {/* Right 3/4 Card View */}
                    <Col md={9}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="fw-bold m-0">Discover Events</h2>
                            <p className="text-muted m-0">
                                {filteredEvents.length} events found
                            </p>
                        </div>

                        <Row xs={1} lg={2} xl={3} className="g-4">
                            {filteredEvents.map((event) => (
                                <Col key={event.id}>
                                    <Card
                                        className="h-100 border-0 shadow-sm overflow-hidden event-card"
                                        style={{
                                            cursor: "pointer",
                                            transition: "transform 0.2s",
                                        }}
                                        onClick={() => handleShowModal(event)}
                                    >
                                        <div
                                            style={{
                                                height: "220px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <Card.Img
                                                variant="top"
                                                src={event.image}
                                                style={{
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <div className="mb-2">
                                                <Badge
                                                    bg="info"
                                                    className="text-dark opacity-75"
                                                >
                                                    {event.category}
                                                </Badge>
                                            </div>
                                            <Card.Title className="fw-bold fs-5">
                                                {event.name}
                                            </Card.Title>
                                            <Card.Text className="text-muted small flex-grow-1">
                                                {event.date} • {event.location}
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {filteredEvents.length === 0 && (
                            <div className="text-center py-5">
                                <h3 className="text-muted">
                                    No events found matching your filters.
                                </h3>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            {/* Event Details Popup */}
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                size="lg"
                centered
            >
                {selectedEvent && (
                    <>
                        <Modal.Header closeButton className="border-0">
                            <Modal.Title className="fw-bold">
                                {selectedEvent.name}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <img
                                src={selectedEvent.image}
                                alt={selectedEvent.name}
                                className="w-100 rounded-3 mb-4 shadow-sm"
                                style={{
                                    maxHeight: "400px",
                                    objectFit: "cover",
                                }}
                            />
                            <div className="d-flex gap-2 mb-3">
                                <Badge
                                    bg="light"
                                    className="text-info border border-info"
                                >
                                    {selectedEvent.category}
                                </Badge>
                                <span className="text-muted">•</span>
                                <span className="fw-bold">
                                    {selectedEvent.date}
                                </span>
                                <span className="text-muted">•</span>
                                <span className="text-secondary">
                                    {selectedEvent.location}
                                </span>
                            </div>
                            <h5 className="fw-bold">About the event</h5>
                            <p className="text-muted lead">
                                {selectedEvent.description}
                            </p>

                            <hr className="my-4" />

                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="m-0 text-muted small">
                                        Standard Ticket
                                    </p>
                                    <h4 className="fw-bold m-0">FREE</h4>
                                </div>
                                <Button
                                    variant="info"
                                    size="lg"
                                    className="px-5 py-2 fw-bold"
                                    onClick={() =>
                                        alert(
                                            `Signed up for ${selectedEvent.name}!`
                                        )
                                    }
                                >
                                    Sign Up Now
                                </Button>
                            </div>
                        </Modal.Body>
                    </>
                )}
            </Modal>
        </div>
    );
}
