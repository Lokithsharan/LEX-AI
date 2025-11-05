// services/courtApiService.ts

const BASE_URL = "https://court-api.kleopatra.io/api/core";
const API_KEY = process.env.KLEOPATRA_API_KEY; // stored in .env.local

async function request(endpoint: string, method: "GET" | "POST" = "GET", body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    }
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("API returned non-JSON response (possibly CAPTCHA or temporary block).");
  }

  if (!res.ok || data?.error) {
    throw new Error(data?.error || "Court API returned an error.");
  }

  return data;
}

/* ------------------------ STATIC LOOKUP DATA ------------------------ */

// District Court
export const getDistrictCourtStates = () =>
  request("/static/district-court/states");

export const getDistrictCourtDistricts = (state_code: string) =>
  request("/static/district-court/districts", "POST", { state_code });

export const getDistrictCourtComplexes = (district_code: string) =>
  request("/static/district-court/complexes", "POST", { district_code });

export const getDistrictCourtCourts = (complex_code: string) =>
  request("/static/district-court/courts", "POST", { complex_code });


// High Court
export const getHighCourtStates = () =>
  request("/static/high-court/states");

export const getHighCourtBenches = (state_code?: string) =>
  request("/static/high-court/benches", "POST", state_code ? { state_code } : {});


// Consumer Forum
export const getConsumerForumBenches = () =>
  request("/static/consumer-forum/benches");

export const getConsumerForumDistricts = (bench_code: string) =>
  request("/static/consumer-forum/districts", "POST", { bench_code });


// National Company Law Tribunal
export const getNCLTBenches = () =>
  request("/static/national-company-law-tribunal/benches");

export const getNCLTCaseTypes = () =>
  request("/static/national-company-law-tribunal/case-types");


// Central Administrative Tribunal
export const getCATBenches = () =>
  request("/static/central-administrative-tribunal/benches");

export const getCATCaseTypes = () =>
  request("/static/central-administrative-tribunal/case-types");


/* ------------------------ LIVE CASE LOOKUP ------------------------ */

// District Court (CNR Lookup)
export const lookupDistrictCourtCNR = (cnr: string) =>
  request("/live/district-court/case", "POST", { cnr });

// High Court (CNR Lookup)
export const lookupHighCourtCNR = (cnr: string, bench_code?: string) =>
  request("/live/high-court/case", "POST", bench_code ? { cnr, bench_code } : { cnr });

// CAT Case by Case Number
export const lookupCATCaseNumber = (bench_code: string, case_type: string, case_number: string, case_year: string) =>
  request("/live/central-administrative-tribunal/case-number", "POST", {
    bench_code,
    case_type,
    case_number,
    case_year
  });

// Consumer Forum Case
export const lookupConsumerForumCase = (bench_code: string, case_number: string) =>
  request("/live/consumer-forum/case", "POST", {
    bench_code,
    case_number
  });
