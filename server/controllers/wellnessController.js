import WellnessEntry from "../models/WellnessEntry.js";

export const saveWellnessEntry = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const entryDate = req.body.date || today;

    if (entryDate > today) {
      return res.status(400).json({
        status: "fail",
        message: "Future dates are not allowed.",
      });
    }

    const updatedEntry = await WellnessEntry.findOneAndUpdate(
      {
        userId: req.user._id,
        date: entryDate,
      },
      {
        ...req.body,
        userId: req.user._id,
        date: entryDate,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );
    res.status(201).json(updatedEntry);
  } catch (error) {
    console.error("Error saving wellness entry:", error);
    res
      .status(500)
      .json({ message: "Server error while saving wellness entry." });
  }
};

export const getWellnessEntries = async (req, res) => {
  try {
    const entries = await WellnessEntry.find({
      userId: req.user._id,
    })
      .sort({ date: -1 })
      .limit(14);

    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching wellness entries:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching wellness entries." });
  }
};
