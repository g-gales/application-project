import WellnessEntry from "../models/WellnessEntry.js";

export const saveWellnessEntry = async (req, res) => {
  try {
    const { userId, mood, stress, sleepHours, focus } = req.body;

    if (!userId || !mood || !stress || sleepHours === undefined || !focus) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const today = new Date().toISOString().split("T")[0];

    const updatedEntry = await WellnessEntry.findOneAndUpdate(
      { userId, date: today },
      {
        userId,
        date: today,
        mood,
        stress,
        sleepHours,
        focus,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Error saving wellness entry:", error);
    res
      .status(500)
      .json({ message: "Server error while saving wellness entry." });
  }
};

export const getWellnessEntries = async (req, res) => {
  try {
    const { userId } = req.params;

    const entries = await WellnessEntry.find({ userId })
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
