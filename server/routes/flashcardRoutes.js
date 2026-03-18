import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import FlashcardDeck from "../models/FlashcardDeck.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const newDeck = await FlashcardDeck.create({
      ...req.body,
      userId: req.user._id,
    });

    res.status(201).json(newDeck);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const decks = await FlashcardDeck.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(decks);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deck) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard deck not found" });
    }

    res.status(200).json(deck);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

router.patch("/:id", protect, async (req, res) => {
  try {
    const updatedDeck = await FlashcardDeck.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedDeck) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard deck not found" });
    }

    res.status(200).json(updatedDeck);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const deletedDeck = await FlashcardDeck.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deletedDeck) {
      return res.status(404).json({
        status: "fail",
        message: "Flashcard deck not found",
      });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

router.post("/:id/cards", protect, async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deck) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard deck not found" });
    }

    deck.cards.push({
      front: req.body.front,
      back: req.body.back,
    });

    await deck.save();
    res.status(201).json(deck);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

router.patch("/:deckId/cards/:cardId", protect, async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.deckId,
      userId: req.user._id,
    });

    if (!deck) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard deck not found" });
    }

    const card = deck.cards.id(req.params.cardId);

    if (!card) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard not found" });
    }

    card.front = req.body.front?.trim() || card.front;
    card.back = req.body.back?.trim() || card.back;

    await deck.save();
    res.status(200).json(deck);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

router.delete("/:deckId/cards/:cardId", protect, async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.deckId,
      userId: req.user._id,
    });

    if (!deck) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard deck not found" });
    }

    const card = deck.cards.id(req.params.cardId);

    if (!card) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard not found" });
    }

    card.deleteOne();
    await deck.save();

    res.status(200).json(deck);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

router.patch("/:deckId/cards/:cardId/review", protect, async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.deckId,
      userId: req.user._id,
    });

    if (!deck) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard deck not found" });
    }

    const card = deck.cards.id(req.params.cardId);

    if (!card) {
      return res
        .status(404)
        .json({ status: "fail", message: "Flashcard not found" });
    }

    const result = req.body.result;

    card.timesReviewed += 1;

    if (result === "got-it") {
      card.timesCorrect += 1;
    }

    if (result === "dont-got-it") {
      card.timesIncorrect += 1;
    }

    await deck.save();
    res.status(200).json(deck);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

export default router;
