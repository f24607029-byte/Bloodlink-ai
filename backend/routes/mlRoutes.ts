import { Router } from "express";
import {
  TextClassifier,
  LogisticRegressionModel,
  KMeansClustering,
  TimeSeriesForecaster,
  MLDatasetGenerator,
  rankAndRecommendDonors
} from "../../frontend/lib/mlEngine";
import { getDonors } from "../services/dbService";

const router = Router();

// Initialize ML Models on boot
const urgencyClassifier = new TextClassifier();
const urgencyData = MLDatasetGenerator.generateNLPDataset();
urgencyClassifier.train(urgencyData.docs, urgencyData.labels);

export const chatbotClassifier = new TextClassifier();
const intentDocs = [
  "hello bot", "hi there", "assalam o alaikum", "hey", "good morning", "good evening", "how are you", "bhai", "hello",
  "need O- blood group", "find donors near saddar", "looking for B+ blood group and donor contacts", "show available donors", "is there any A- donor available", "khoon chahiye", "donor ka batayein",
  "can O+ donate to AB-?", "blood compatibility table", "who can receive A- blood?", "compatibility explanation", "blood group matching list",
  "how to register as volunteer donor", "i want to donate blood", "sign up as donor", "apna naam register krna hai", "register as volunteer",
  "emergency help blood needed", "sos critical situation", "accident trauma patient bleeding", "patient dying needs transfusion", "pims emergency blood requirment",
  "upcoming blood donation camps", "camp in centaurus mall", "where is nearest camp?", "camps schedule rawalpindi",
  "hospital contact list", "pims number", "holy family address", "shifa international contact", "nearest hospital with blood stock"
];
const intentLabels = [
  "greetings", "greetings", "greetings", "greetings", "greetings", "greetings", "greetings", "greetings", "greetings",
  "find_donor", "find_donor", "find_donor", "find_donor", "find_donor", "find_donor", "find_donor",
  "blood_compatibility", "blood_compatibility", "blood_compatibility", "blood_compatibility", "blood_compatibility",
  "register_donor", "register_donor", "register_donor", "register_donor", "register_donor",
  "emergency_sos", "emergency_sos", "emergency_sos", "emergency_sos", "emergency_sos",
  "find_camp", "find_camp", "find_camp", "find_camp",
  "hospital_info", "hospital_info", "hospital_info", "hospital_info", "hospital_info"
];
chatbotClassifier.train(intentDocs, intentLabels);

const modelFeatures = ["distance", "donationsCount", "streakCount", "isUrgent", "hourOfDay", "recencyWeeks"];
const responseModel = new LogisticRegressionModel(modelFeatures);
const regressionData = MLDatasetGenerator.generateLogisticDataset(600);
const trainingResults = responseModel.train(regressionData.dataset, regressionData.labels, 0.05, 100);

const timeSeriesForecaster = new TimeSeriesForecaster();

// GET model training metrics and diagnostics parameters
router.get("/metrics", async (req, res) => {
  try {
    const testSplit = MLDatasetGenerator.generateNLPDataset();
    const valResult = urgencyClassifier.evaluate(testSplit.docs, testSplit.labels);

    res.json({
      classifier: {
        accuracy: valResult.accuracy,
        confusionMatrix: valResult.confusionMatrix,
        classes: ["low", "medium", "urgent", "critical"]
      },
      logisticRegression: {
        epochsCompleted: trainingResults.epochsCompleted,
        lossHistory: trainingResults.lossHistory.slice(0, 50),
        accuracy: trainingResults.metrics.accuracy,
        precision: trainingResults.metrics.precision,
        recall: trainingResults.metrics.recall,
        f1Score: trainingResults.metrics.f1Score,
        rocAuc: trainingResults.metrics.rocAuc,
        confusionMatrix: trainingResults.metrics.confusionMatrix,
        featureImportances: trainingResults.metrics.featureImportances,
        rocCurvePoints: trainingResults.metrics.rocCurvePoints
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to gather model metrics: " + err.message });
  }
});

// POST clinical text to classify triage urgency
router.post("/predict-urgency", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing clinical text for prediction" });
    }

    const prediction = urgencyClassifier.predict(text);
    res.json({
      text,
      predictedClass: prediction.label,
      confidence: prediction.confidence,
      scores: prediction.scores
    });
  } catch (err: any) {
    res.status(500).json({ error: "Urgency classifier prediction failed: " + err.message });
  }
});

// POST predict donor matching scores & response probabilities
router.post("/predict-donor", async (req, res) => {
  try {
    const { latitude, longitude, bloodGroup, urgency = "Routine" } = req.body;

    if (latitude === undefined || longitude === undefined || !bloodGroup) {
      return res.status(400).json({ error: "Missing coordinates (latitude, longitude) or blood group" });
    }

    const patientCoords = { latitude: Number(latitude), longitude: Number(longitude) };
    const donors = await getDonors();
    const ranked = rankAndRecommendDonors(patientCoords, bloodGroup, donors, urgency, responseModel);

    res.json({
      patientCoordinates: patientCoords,
      patientBloodGroup: bloodGroup,
      urgency,
      rankedDonors: ranked
    });
  } catch (err: any) {
    res.status(500).json({ error: "Donor recommendation pipeline failed: " + err.message });
  }
});

// GET donor coordinates clustered using K-Means centroids
router.get("/camp-clustering", async (req, res) => {
  try {
    const kParam = parseInt(req.query.k as string) || 3;
    const k = Math.min(5, Math.max(2, kParam));

    const donors = await getDonors();
    const donorCoords = [
      ...donors.map(d => ({ latitude: d.latitude, longitude: d.longitude })),
      ...MLDatasetGenerator.generateClusteringPoints(280)
    ];

    const kmeans = new KMeansClustering(k, 30);
    const result = kmeans.fit(donorCoords);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Camp clustering simulation failed: " + err.message });
  }
});

// POST forecast future daily blood demand quantities
router.post("/forecast-demand", async (req, res) => {
  try {
    const { bloodGroup = "O-", steps = 14 } = req.body;
    
    const key = (bloodGroup as string).toUpperCase();
    const seedLength = 45;
    const series = MLDatasetGenerator.generateDemandTimeSeries(seedLength);
    
    const rarityMultiplier = ["O-", "AB-", "B-", "A-"].includes(key) ? 0.35 : 1.25;
    const finalSeries = series.map(v => Math.max(1, Math.round(v * rarityMultiplier)));

    const result = timeSeriesForecaster.forecast(finalSeries, Number(steps));
    res.json({
      bloodGroup: key,
      historyLength: seedLength,
      stepsForecasted: Number(steps),
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: "Forecasting mathematical operations failed: " + err.message });
  }
});

// POST trigger text intent classification
router.post("/classify-chat", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text query" });
    }
    const prediction = chatbotClassifier.predict(text);
    res.json(prediction);
  } catch (err: any) {
    res.status(500).json({ error: "Chat taxonomy classification failed: " + err.message });
  }
});

export default router;
