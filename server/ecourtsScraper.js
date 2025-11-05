import puppeteer from "puppeteer";

export async function fetchCaseData(cnr) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://services.ecourts.gov.in/ecourtindia_v6/", {
    waitUntil: "networkidle2"
  });

  // Go to CNR search
  await page.click("#cnrLink");
  await page.waitForSelector("#cnrnumber");
  await page.type("#cnrnumber", cnr);

  // Submit form
  await page.click("#searchbtn");
  await page.waitForSelector(".case_details", { timeout: 10000 });

  const caseData = await page.evaluate(() => {
    const extract = (sel) => document.querySelector(sel)?.innerText.trim() || "N/A";
    return {
      caseType: extract("#lblCaseType"),
      caseStatus: extract("#lblStatus"),
      firstHearing: extract("#lblFirstHearing"),
      nextHearing: extract("#lblNextHearing"),
      courtNumber: extract("#lblCourtNo"),
      judge: extract("#lblJudgeName")
    };
  });

  await browser.close();
  return caseData;
}
