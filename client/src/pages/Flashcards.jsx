import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import api from "../api/axiosConfig";
import Modal from "../components/ui/Modal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const emptyDeckForm = {
  title: "",
  description: "",
  courseId: "",
  courseName: "",
  courseCode: "",
  term: "",
  semester: "",
};

const emptyCardForm = {
  front: "",
  back: "",
};

export default function Flashcards() {
  const [courses, setCourses] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedDeckId, setSelectedDeckId] = useState(null);

  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [studyModalOpen, setStudyModalOpen] = useState(false);

  const [deckForm, setDeckForm] = useState(emptyDeckForm);
  const [cardForm, setCardForm] = useState(emptyCardForm);

  const [creatingDeck, setCreatingDeck] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState(null);

  const [editingCardId, setEditingCardId] = useState(null);

  const [studyDeck, setStudyDeck] = useState(null);
  const [studyQueue, setStudyQueue] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyStats, setStudyStats] = useState({
    completed: 0,
    gotIt: 0,
    dontGotIt: 0,
  });

  useEffect(() => {
    fetchCourses();
    fetchDecks();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setCourses([]);
    }
  };

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/flashcards");
      setDecks(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch flashcard decks", err);
      setDecks([]);
      setError("Could not load flashcards right now.");
    } finally {
      setLoading(false);
    }
  };

  const semesters = useMemo(() => {
    const values = decks
      .map((deck) => deck.semester || deck.term)
      .filter(Boolean);

    return [...new Set(values)];
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesCourse =
        selectedCourse === "all" || deck.courseId === selectedCourse;
      const matchesSemester =
        selectedSemester === "all" ||
        deck.semester === selectedSemester ||
        deck.term === selectedSemester;

      return matchesCourse && matchesSemester;
    });
  }, [decks, selectedCourse, selectedSemester]);

  const selectedDeck = useMemo(() => {
    return decks.find((deck) => deck._id === selectedDeckId) || null;
  }, [decks, selectedDeckId]);

  const currentStudyCard = studyQueue[0] || null;
  const totalAnswered = studyStats.gotIt + studyStats.dontGotIt;
  const progressPercent = studyDeck?.cards?.length
    ? Math.min(
        100,
        Math.round((studyStats.completed / studyDeck.cards.length) * 100),
      )
    : 0;

  const handleDeckInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "courseId") {
      const chosenCourse = courses.find((course) => course._id === value);

      setDeckForm((prev) => ({
        ...prev,
        courseId: value,
        courseName: chosenCourse?.name || "",
        courseCode: chosenCourse?.code || "",
        term: chosenCourse?.term || "",
        semester: chosenCourse?.term || "",
      }));
      return;
    }

    setDeckForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetCardForm = () => {
    setCardForm(emptyCardForm);
    setEditingCardId(null);
  };

  const openViewModal = (deckId) => {
    setSelectedDeckId(deckId);
    resetCardForm();
    setViewModalOpen(true);
  };

  const openAddCardModal = (deckId, closeViewFirst = false) => {
    setSelectedDeckId(deckId);
    resetCardForm();

    if (closeViewFirst) {
      setViewModalOpen(false);
      setTimeout(() => setCardModalOpen(true), 0);
      return;
    }

    setCardModalOpen(true);
  };

  const startEditCard = (card) => {
    setEditingCardId(card._id);
    setCardForm({
      front: card.front,
      back: card.back,
    });
  };

  const cancelEditCard = () => {
    resetCardForm();
  };

  const handleCreateDeck = async (e) => {
    e.preventDefault();

    if (!deckForm.title.trim() || !deckForm.courseId) return;

    try {
      setCreatingDeck(true);
      await api.post("/flashcards", {
        ...deckForm,
        title: deckForm.title.trim(),
        description: deckForm.description.trim(),
      });

      setDeckModalOpen(false);
      setDeckForm(emptyDeckForm);
      await fetchDecks();
    } catch (err) {
      console.error("Failed to create deck", err);
    } finally {
      setCreatingDeck(false);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();

    if (!selectedDeckId || !cardForm.front.trim() || !cardForm.back.trim()) {
      return;
    }

    try {
      setCreatingCard(true);
      const res = await api.post(`/flashcards/${selectedDeckId}/cards`, {
        front: cardForm.front.trim(),
        back: cardForm.back.trim(),
      });

      setDecks((prev) =>
        prev.map((deck) => (deck._id === selectedDeckId ? res.data : deck)),
      );

      resetCardForm();
      setCardModalOpen(false);
    } catch (err) {
      console.error("Failed to add flashcard", err);
    } finally {
      setCreatingCard(false);
    }
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();

    if (
      !selectedDeckId ||
      !editingCardId ||
      !cardForm.front.trim() ||
      !cardForm.back.trim()
    ) {
      return;
    }

    try {
      setSavingCard(true);
      const res = await api.patch(
        `/flashcards/${selectedDeckId}/cards/${editingCardId}`,
        {
          front: cardForm.front.trim(),
          back: cardForm.back.trim(),
        },
      );

      setDecks((prev) =>
        prev.map((deck) => (deck._id === selectedDeckId ? res.data : deck)),
      );

      resetCardForm();
    } catch (err) {
      console.error("Failed to update flashcard", err);
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!selectedDeckId) return;

    try {
      setDeletingCardId(cardId);
      const res = await api.delete(`/flashcards/${selectedDeckId}/cards/${cardId}`);

      setDecks((prev) =>
        prev.map((deck) => (deck._id === selectedDeckId ? res.data : deck)),
      );

      if (editingCardId === cardId) {
        resetCardForm();
      }
    } catch (err) {
      console.error("Failed to delete flashcard", err);
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    try {
      await api.delete(`/flashcards/${deckId}`);
      setDecks((prev) => prev.filter((deck) => deck._id !== deckId));

      if (selectedDeckId === deckId) {
        setSelectedDeckId(null);
        setViewModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to delete deck", err);
    }
  };

  const launchCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const startStudyMode = (deck) => {
    if (!deck?.cards?.length) return;

    const queue = [...deck.cards].sort(() => Math.random() - 0.5);

    setStudyDeck(deck);
    setStudyQueue(queue);
    setShowAnswer(false);
    setStudyStats({
      completed: 0,
      gotIt: 0,
      dontGotIt: 0,
    });
    setStudyModalOpen(true);
  };

  const closeStudyMode = async () => {
    setStudyModalOpen(false);
    setStudyDeck(null);
    setStudyQueue([]);
    setShowAnswer(false);
    await fetchDecks();
  };

  const handleStudyResponse = async (result) => {
    if (!currentStudyCard || !studyDeck) return;

    const wasCorrect = result === "got-it";
    const currentCard = currentStudyCard;
    const remainingQueue = studyQueue.slice(1);

    try {
      await api.patch(
        `/flashcards/${studyDeck._id}/cards/${currentCard._id}/review`,
        { result },
      );
    } catch (err) {
      console.error("Failed to update flashcard stats", err);
    }

    if (wasCorrect) {
      setStudyStats((prev) => ({
        ...prev,
        completed: prev.completed + 1,
        gotIt: prev.gotIt + 1,
      }));

      if (remainingQueue.length === 0) {
        launchCelebration();
        setStudyModalOpen(false);
        setStudyDeck(null);
        setStudyQueue([]);
        setShowAnswer(false);
        await fetchDecks();
        return;
      }

      setStudyQueue(remainingQueue);
      setShowAnswer(false);
      return;
    }

    const insertAt = Math.min(2, remainingQueue.length);
    const nextQueue = [...remainingQueue];
    nextQueue.splice(insertAt, 0, currentCard);

    setStudyStats((prev) => ({
      ...prev,
      dontGotIt: prev.dontGotIt + 1,
    }));

    setStudyQueue(nextQueue);
    setShowAnswer(false);
  };

  const deckCountText =
    filteredDecks.length === 1 ? "1 deck" : `${filteredDecks.length} decks`;

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text)] md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-black">Flashcards</h1>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              Build decks by course, filter by semester or course, and study them
              in learn mode.
            </p>
          </div>

          <Button onClick={() => setDeckModalOpen(true)}>+ New Deck</Button>
        </div>

        <Card
          title="Filters"
          footer={
            <p className="text-xs text-[var(--muted-text)]">
              Showing {deckCountText}
            </p>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
                Course
              </span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
                Semester
              </span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
              >
                <option value="all">All Semesters</option>
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        {error ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-text)] shadow-[var(--shadow)]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted-text)] shadow-[var(--shadow)]">
            Loading flashcard decks...
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow)]">
            <p className="text-lg font-bold">No flashcard decks yet.</p>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setDeckModalOpen(true)}>
                Create First Deck
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDecks.map((deck) => (
              <Card
                key={deck._id}
                title={deck.title}
                footer={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      className="min-w-[120px] flex-1"
                      onClick={() => startStudyMode(deck)}
                      disabled={!deck.cards?.length}
                    >
                      Learn Mode
                    </Button>
                    <Button
                      variant="secondary"
                      className="min-w-[120px] flex-1"
                      onClick={() => openAddCardModal(deck._id)}
                    >
                      Add Card
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-w-[120px] flex-1"
                      onClick={() => openViewModal(deck._id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="danger"
                      className="min-w-[120px] flex-1"
                      onClick={() => handleDeleteDeck(deck._id)}
                    >
                      Delete
                    </Button>
                  </div>
                }
              >
                <div className="space-y-3 text-sm">
                  <p className="text-[var(--muted-text)]">
                    {deck.description || "No description yet."}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[var(--text)]">
                      {deck.courseCode || deck.courseName || "Course"}
                    </span>
                    <span className="rounded-full bg-[var(--tertiary)] px-3 py-1 text-[var(--tertiary-contrast)]">
                      {deck.semester || deck.term || "Semester"}
                    </span>
                    <span className="rounded-full bg-[var(--green-bg)] px-3 py-1 text-[var(--green-text)]">
                      {deck.cards?.length || 0} cards
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={deckModalOpen}
        onClose={() => setDeckModalOpen(false)}
        title="Create Flashcard Deck"
      >
        <form onSubmit={handleCreateDeck} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
              Deck Title
            </span>
            <input
              name="title"
              value={deckForm.title}
              onChange={handleDeckInputChange}
              placeholder="Midterm Review"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
              Course
            </span>
            <select
              name="courseId"
              value={deckForm.courseId}
              onChange={handleDeckInputChange}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
              Description
            </span>
            <textarea
              name="description"
              value={deckForm.description}
              onChange={handleDeckInputChange}
              rows={3}
              placeholder="Optional notes for this deck"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
            />
          </label>

          <Button type="submit" fullWidth disabled={creatingDeck}>
            {creatingDeck ? "Creating..." : "Create Deck"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={cardModalOpen}
        onClose={() => {
          setCardModalOpen(false);
          resetCardForm();
        }}
        title="Add Flashcard"
      >
        <form onSubmit={handleCreateCard} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
              Front
            </span>
            <textarea
              name="front"
              value={cardForm.front}
              onChange={handleCardInputChange}
              rows={3}
              placeholder="What is the question or prompt?"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
              Back
            </span>
            <textarea
              name="back"
              value={cardForm.back}
              onChange={handleCardInputChange}
              rows={4}
              placeholder="Put the answer here"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
              required
            />
          </label>

          <Button type="submit" fullWidth disabled={creatingCard}>
            {creatingCard ? "Saving..." : "Save Card"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          resetCardForm();
        }}
        title={selectedDeck ? `Deck Details · ${selectedDeck.title}` : "Deck Details"}
      >
        {selectedDeck ? (
          <div className="min-w-[300px] space-y-5 sm:min-w-[720px]">
            <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[var(--text)]">
                    {selectedDeck.courseCode || selectedDeck.courseName}
                  </span>
                  <span className="rounded-full bg-[var(--tertiary)] px-3 py-1 text-[var(--tertiary-contrast)]">
                    {selectedDeck.semester || selectedDeck.term}
                  </span>
                  <span className="rounded-full bg-[var(--green-bg)] px-3 py-1 text-[var(--green-text)]">
                    {selectedDeck.cards?.length || 0} cards
                  </span>
                </div>

                <p className="text-sm text-[var(--muted-text)]">
                  {selectedDeck.description || "No description yet."}
                </p>
              </div>

              <div className="sm:shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => openAddCardModal(selectedDeck._id, true)}
                >
                  + Add Card
                </Button>
              </div>
            </div>

            {!selectedDeck.cards?.length ? (
              <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted-text)]">
                This deck has no cards yet.
              </div>
            ) : (
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                {selectedDeck.cards.map((card, index) => {
                  const isEditing = editingCardId === card._id;

                  return (
                    <div
                      key={card._id || `${card.front}-${index}`}
                      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-text)]">
                            Front
                          </p>
                          <p className="mt-2 text-base font-semibold text-[var(--text)]">
                            {card.front}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-text)]">
                            Back
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted-text)]">
                            {card.back}
                          </p>
                        </div>

                        <p className="text-xs text-[var(--muted-text)]">
                          Got It: {card.timesCorrect || 0}
                          <span className="mx-2">•</span>
                          Don’t Got It: {card.timesIncorrect || 0}
                          <span className="mx-2">•</span>
                          Reviews: {card.timesReviewed || 0}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {!isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                className="min-w-[110px]"
                                onClick={() => startEditCard(card)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                className="min-w-[110px]"
                                disabled={deletingCardId === card._id}
                                onClick={() => handleDeleteCard(card._id)}
                              >
                                {deletingCardId === card._id ? "Deleting..." : "Delete"}
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              className="min-w-[110px]"
                              onClick={cancelEditCard}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <form
                            onSubmit={handleUpdateCard}
                            className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-sm font-black text-[var(--text)]">
                                Edit Card
                              </h3>
                              <span className="text-xs text-[var(--muted-text)]">
                                Update and save
                              </span>
                            </div>

                            <label className="block space-y-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
                                Front
                              </span>
                              <textarea
                                name="front"
                                value={cardForm.front}
                                onChange={handleCardInputChange}
                                rows={3}
                                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
                                required
                              />
                            </label>

                            <label className="block space-y-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
                                Back
                              </span>
                              <textarea
                                name="back"
                                value={cardForm.back}
                                onChange={handleCardInputChange}
                                rows={5}
                                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text)]"
                                required
                              />
                            </label>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="submit"
                                variant="primary"
                                className="min-w-[140px]"
                                disabled={savingCard}
                              >
                                {savingCard ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="min-w-[110px]"
                                onClick={cancelEditCard}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-text)]">No deck selected.</p>
        )}
      </Modal>

      <Modal
        isOpen={studyModalOpen}
        onClose={closeStudyMode}
        title={studyDeck ? `Learn Mode · ${studyDeck.title}` : "Learn Mode"}
      >
        {currentStudyCard ? (
          <div className="min-w-[280px] space-y-5 sm:min-w-[520px]">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--muted-text)]">
                <span>
                  Mastered: {studyStats.completed} / {studyDeck?.cards?.length || 0}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div
              className={`mx-auto flex min-h-[320px] w-full max-w-[500px] cursor-pointer flex-col justify-center rounded-[var(--radius)] border border-[var(--border)] p-8 text-center shadow-[var(--shadow)] transition-all duration-300 ${
                showAnswer
                  ? "scale-[1.01] bg-[var(--surface)]"
                  : "bg-[var(--surface-2)] hover:scale-[1.02]"
              }`}
              onClick={() => {
                if (!showAnswer) setShowAnswer(true);
              }}
            >
              {!showAnswer ? (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--muted-text)]">
                    Prompt
                  </p>
                  <p className="mt-6 text-2xl font-black leading-relaxed text-[var(--text)]">
                    {currentStudyCard.front}
                  </p>
                  <p className="mt-8 text-sm text-[var(--muted-text)]">
                    Tap or click to reveal answer
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--muted-text)]">
                    Answer
                  </p>
                  <p className="mt-6 text-lg leading-8 text-[var(--text)]">
                    {currentStudyCard.back}
                  </p>
                </>
              )}
            </div>

            {showAnswer && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => handleStudyResponse("dont-got-it")}
                >
                  Don’t Got It
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleStudyResponse("got-it")}
                >
                  Got It
                </Button>
              </div>
            )}

            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--muted-text)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Queue left: {studyQueue.length}</span>
                <span>Got It: {studyStats.gotIt}</span>
                <span>Don’t Got It: {studyStats.dontGotIt}</span>
                <span>Total answered: {totalAnswered}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-text)]">No study cards available.</p>
        )}
      </Modal>
    </div>
  );
}