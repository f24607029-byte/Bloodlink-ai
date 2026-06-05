import { Router } from "express";
import {
  getDonors,
  addDonor,
  updateDonorAvailability,
  addDonorReview
} from "../services/dbService";

const router = Router();

// Compatibility logic helper
export function getEligibleDonorsForPatient(patientGroup: string): string[] {
  const eligibleDonors: { [key: string]: string[] } = {
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
  };
  return eligibleDonors[patientGroup] || [];
}

router.get("/", async (req, res) => {
  try {
    const { bloodGroup, city, urgency, availableOnly } = req.query;
    let list = await getDonors();

    if (bloodGroup) {
      if (urgency === "patient_match") {
        const eligibleGroups = getEligibleDonorsForPatient(bloodGroup as string);
        list = list.filter(d => eligibleGroups.includes(d.bloodGroup));
      } else {
        list = list.filter(d => d.bloodGroup === bloodGroup);
      }
    }

    if (city) {
      list = list.filter(d => d.city.toLowerCase() === (city as string).toLowerCase());
    }

    if (availableOnly === "true") {
      list = list.filter(d => d.isAvailable);
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to query donor list: " + err.message });
  }
});

router.post("/toggle-availability", async (req, res) => {
  try {
    const { email, isAvailable } = req.body;
    // Toggle Dr. Safeer's availability in demo mode as standard
    const updated = await updateDonorAvailability("+92 333 1234567", isAvailable);
    if (updated) {
      return res.json({ success: true, donor: updated });
    }
    res.status(404).json({ error: "Donor profile not found" });
  } catch (err: any) {
    res.status(500).json({ error: "Error updating availability: " + err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, bloodGroup, phone, city, location } = req.body;
    
    if (!name || !bloodGroup || !phone) {
      return res.status(400).json({ error: "Please input a valid name, blood type, and phone contact" });
    }

    const newDonor = {
      id: "dnr-" + Date.now(),
      name,
      bloodGroup,
      phone,
      city: city === "Rawalpindi" ? ("Rawalpindi" as const) : ("Islamabad" as const),
      location: location || "Twin Cities Central",
      latitude: city === 'Islamabad' ? 33.6844 + (Math.random() - 0.5) * 0.05 : 33.5651 + (Math.random() - 0.5) * 0.05,
      longitude: city === 'Islamabad' ? 73.0479 + (Math.random() - 0.5) * 0.05 : 73.0169 + (Math.random() - 0.5) * 0.05,
      isAvailable: true,
      stats: { donationsCount: 1, streakCount: 1, livesSaved: 1 },
      badges: ["First-Time Savior"]
    };

    await addDonor(newDonor);
    res.json({ success: true, donor: newDonor });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to register donor: " + err.message });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { patientName, rating, comment } = req.body;

    if (!patientName || !rating || !comment) {
      return res.status(400).json({ error: "Missing required review fields" });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
    }

    const newReview = {
      id: "rev-" + Date.now(),
      patientName,
      rating: numericRating,
      comment,
      date: new Date().toISOString().split("T")[0]
    };

    const updatedDonor = await addDonorReview(id, newReview);
    if (!updatedDonor) {
      return res.status(404).json({ error: "Donor not found" });
    }

    res.json({ success: true, donor: updatedDonor });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to ingest review structure: " + err.message });
  }
});

export default router;
