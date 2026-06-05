import { Router } from "express";
import {
  getEmergencies,
  addEmergency,
  updateEmergencyStatus,
  getHospitals,
  getDonors,
  addNotification
} from "../services/dbService";
import { getEligibleDonorsForPatient } from "./donorRoutes";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const list = await getEmergencies();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load emergency SOS listing: " + err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { patientName, bloodGroup, unitsNeeded, hospitalId, contactPhone, requiredBy, reason, urgency, city } = req.body;

    if (!patientName || !bloodGroup || !unitsNeeded || !hospitalId || !contactPhone) {
      return res.status(400).json({ error: "Please fill out all mandatory fields for requesting emergency blood" });
    }

    const hospitals = await getHospitals();
    const selectedHospital = hospitals.find(h => h.id === hospitalId) || hospitals[0];

    // Calculate potential matching donors in our database
    const donors = await getDonors();
    const eligibleDonorTypes = getEligibleDonorsForPatient(bloodGroup);
    const potentialMatches = donors.filter(d => 
      eligibleDonorTypes.includes(d.bloodGroup) && 
      d.isAvailable && 
      d.city.toLowerCase() === (city || "Islamabad").toLowerCase()
    );

    const newSOS = {
      id: "sos-" + Date.now(),
      patientName,
      bloodGroup,
      unitsNeeded: Number(unitsNeeded),
      hospitalId,
      hospitalName: selectedHospital.name,
      contactPhone,
      requiredBy: requiredBy || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      reason: reason || "Surgical critical emergency",
      urgency: urgency || "Immediate (SOS)",
      status: "Pending" as const,
      city: city === "Rawalpindi" ? ("Rawalpindi" as const) : ("Islamabad" as const),
      createdAt: new Date().toISOString(),
      matchingDonorsCount: potentialMatches.length
    };

    await addEmergency(newSOS);

    // Broadcast Broadcast Notification
    await addNotification({
      id: "notif-" + Date.now(),
      title: `🚨 SOS BROADCAST: ${bloodGroup} Urgent Request`,
      message: `${unitsNeeded} units of ${bloodGroup} required urgently for ${patientName} at ${selectedHospital.name}. Please contact ${contactPhone}!`,
      type: "emergency",
      timestamp: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, request: newSOS });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to raise SOS emergency: " + err.message });
  }
});

router.post("/fulfill", async (req, res) => {
  try {
    const { sosId } = req.body;
    if (!sosId) {
      return res.status(400).json({ error: "Missing emergency specification" });
    }

    const updated = await updateEmergencyStatus(sosId, "Fulfilled");
    if (updated) {
      return res.json({ success: true, request: updated });
    }
    res.status(404).json({ error: "SOS emergency request not found" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to mark SOS as fulfilled: " + err.message });
  }
});

export default router;
