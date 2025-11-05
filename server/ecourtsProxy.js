import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/ecourts", async (req, res) => {
  try {
    const { cnr } = req.body;
    if (!cnr) return res.status(400).json({ error: "CNR number required" });

    const response = await fetch(`https://services.ecourts.gov.in/ecourtindia_v6/cases/case_no.php?cnr_no=${cnr}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      }
    });

    const html = await response.text();

    // TODO: scrape the needed fields using cheerio
    // For now, return raw HTML
    res.json({ success: true, html });

  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch data from eCourts",
      message: err.message
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
