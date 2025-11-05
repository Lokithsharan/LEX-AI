export interface KanoonResult {
  caseName: string;
  court: string;
  date: string;
  issue: string;
  summary: string;
}

export interface EcourtsResult {
  caseType: string;
  caseStatus: string;
  firstHearing: string;
  nextHearing: string;
  courtNumber: string;
  judge: string;
  source?: "cache" | "live";
}

const ecourtsLocalCache: Record<string, EcourtsResult> = {};

// Temporary demo database for Indian Kanoon search
const kanoonDatabase = [
  {
    caseName: "Kesavananda Bharati vs State Of Kerala And Anr",
    court: "Supreme Court of India",
    date: "24/04/1973",
    issue: "Basic Structure Doctrine",
    summary:
      "Parliament cannot alter the basic structure of the Constitution."
  },
  {
    caseName: "Maneka Gandhi vs Union Of India",
    court: "Supreme Court of India",
    date: "25/01/1978",
    issue: "Article 21 - Right to Life & Liberty",
    summary:
      "Any law impacting life and liberty must be fair, just, and reasonable."
  }
];

export const searchIndianKanoon = async (query: string): Promise<KanoonResult[]> => {
  const terms = query.toLowerCase().split(/\s+/);
  return kanoonDatabase.filter((c) =>
    terms.every((t) =>
      `${c.caseName} ${c.summary} ${c.issue}`.toLowerCase().includes(t)
    )
  );
};

export const searchECourts = async (cnr: string): Promise<EcourtsResult> => {
  cnr = cnr.trim().toUpperCase();

  if (cnr.length !== 16) {
    throw new Error("CNR must be exactly 16 characters (e.g., MHMC070004752022).");
  }

  if (ecourtsLocalCache[cnr]) {
    return { ...ecourtsLocalCache[cnr], source: "cache" };
  }

  const response = await fetch(`http://localhost:8010/proxy?cnr=${cnr}`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer free"
    }
  });

  const text = await response.text();
  console.log("RAW API RESPONSE:", text);

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The court API returned HTML (likely CAPTCHA). Try again.");
  }

  if (!response.ok || !data.case_type) {
    throw new Error("No case details found or court returned unexpected data.");
  }

  const result: EcourtsResult = {
    caseType: data.case_type ?? "N/A",
    caseStatus: data.case_status ?? "N/A",
    firstHearing: data.first_hearing_date ?? "N/A",
    nextHearing: data.next_hearing_date ?? "N/A",
    courtNumber: data.court_no ?? "N/A",
    judge: data.judge_name ?? "N/A",
    source: "live"
  };

  ecourtsLocalCache[cnr] = result;
  return result;
};
