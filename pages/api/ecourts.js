export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cnr } = req.body;

  try {
    const response = await fetch("https://apis.akshit.net/eciapi/17/district-court/case", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnr })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "Court server returned invalid response." });
    }

    if (!data || data.error) {
      return res.status(404).json({ error: "No case found for this CNR." });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Court API Error:", err);
    return res.status(500).json({ error: "Could not contact eCourts service." });
  }
}
