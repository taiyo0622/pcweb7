import React, { useEffect, useState } from "react";
import { Container, Dropdown, Button, Alert, Navbar, Nav, NavbarText } from "react-bootstrap";
import { collection, getDocs, query, where, doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";


export default function HomePage() {
    const [user, loading] = useAuthState(auth);
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedHigher, setSelectedHigher] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState("");
    const [userScore, setUserScore] = useState(null);
    const levels = ["PSLE", "O-Level", "A-Level"];
    const highers = ["H1", "H2", "H3"];
    const psleSubjects = ["Math", "English", "Science"];
    const oLevelSubjects = ["Chemistry", "Physics", "Biology"];
    const aLevelSubjects = ["Chemisty", "Physics", "Biology"];

    useEffect(() => {
    if (user && user.email) {
            setUserEmail(user.email);
        } else {
            setUserEmail(`Not logged in`);
        }
    }, [user])

    useEffect(() => {
        if (userEmail) {
            const scoreDocRef = doc(db, "score", userEmail);
            const unsubscribe = onSnapshot(scoreDocRef, (doc) => {
                if (doc.exists()) {
                    setUserScore(doc.data().score);
                } else {
                    console.log("No such document!");
                }
            });
        return () => unsubscribe();
        }
    }, [userEmail]);

    const handleSearch = async () => {
    setError("");
    if ((!selectedLevel || !selectedSubject) || (selectedLevel === "A-Level" ? !selectedHigher : selectedHigher)) {
        setError("Please select all dropdown options.");
        return;
    }

    const combinedSubject = `${selectedLevel.toLowerCase()}${selectedHigher.toLowerCase()}${selectedSubject.toLowerCase()}`;

    try {
        const subjectCollectionRef = collection(db, "Subjects");
        const q = query(subjectCollectionRef, where("__name__", "==", combinedSubject));
        const querySnapshotSubject = await getDocs(q);

        if (!querySnapshotSubject.empty) {
            const subjectDocRef = doc(subjectCollectionRef, combinedSubject);
            const questionsCollectionRef = collection(subjectDocRef, "questions");
            const querySnapshotQuestion = await getDocs(questionsCollectionRef);
            const questionIDs = querySnapshotQuestion.docs.map(doc => doc.id)
            if (questionIDs.length > 0) {
                const randomIndex = Math.floor(Math.random() * questionIDs.length);
                const questionId = questionIDs[randomIndex];
                navigate(`/question/${combinedSubject}/${questionId}`);
                } else {
                console.log("No documents found in the collection.");
                }
                
        } else {
            setError("Subject not found.");
        }
    } catch (error) {
        setError("Error fetching documents.");
        console.error("Error fetching documents: ", error);
    }
    };

    useEffect(() => {
        if (loading) return;
        if (!user) return navigate("/login");
      }, [navigate, user, loading]);
    

    return (
    <>
        <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand href="/">🤓 Community of Education</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <NavbarText style={{color:"white"}} className="ms-3">{userEmail}</NavbarText>
                            <NavbarText style={{color:"grey"}} className="ms-3">{userScore} points</NavbarText>
                            <Dropdown>
                                <Dropdown.Toggle className="ms-3" variant="secondary" id="dropdown-basic">
                                    Menu
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item href="/add">Add Questions</Dropdown.Item>
                                    <Dropdown.Item onClick={(e) => signOut(auth)}>Logout</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

        <Container className="my-3">
        <h1>What MCQ questions would you like to do?</h1>

        <Dropdown className="mb-3">
                <Dropdown.Toggle variant="info" id="dropdown-level">
                    {selectedLevel || "Select Level"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {levels.map(level => (
                        <Dropdown.Item
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                        >
                            {level}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
        </Dropdown>

        {selectedLevel === "A-Level" && (
            <Dropdown className="mb-3">
                <Dropdown.Toggle variant="info" id="dropdown-higher">
                    {selectedHigher || "Select Higher"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {highers.map(higher => (
                        <Dropdown.Item
                            key={higher}
                            onClick={() => setSelectedHigher(higher)}
                        >
                            {higher}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        )}

            {selectedLevel && (selectedLevel !== "A-Level" || selectedHigher) && (
                <Dropdown className="mb-3">
                <Dropdown.Toggle variant="info" id="dropdown-subject">
                    {selectedSubject || "Select Subject"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {(selectedLevel === "PSLE") && psleSubjects.map(subject => (
                        <Dropdown.Item
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                        >
                            {subject}
                        </Dropdown.Item>
                    ))}
                    {(selectedLevel === "O-Level") && oLevelSubjects.map(subject => (
                        <Dropdown.Item
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                        >
                            {subject}
                        </Dropdown.Item>
                    ))}
                    {(selectedLevel === "A-Level") && aLevelSubjects.map(subject => (
                        <Dropdown.Item
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                        >
                            {subject}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
            )}

        <Button variant="primary" onClick={handleSearch}>
            Search
        </Button>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Container>
    </>
    );
    }
