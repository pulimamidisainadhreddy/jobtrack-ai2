export const STATUSES = ['Saved', 'Applied', 'Under Review', 'Online Assessment', 'Interview Scheduled', 'Technical Interview', 'HR Interview', 'Final Interview', 'Offer', 'Offer Received', 'Rejected', 'No Response', 'Withdrawn'] as const;
export const PLATFORMS = ['LinkedIn', 'Indeed', 'StepStone', 'Company Website', 'XING', 'Berlin Startup Jobs', 'Referral', 'Other'];
export const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
export const GERMAN_LEVELS = ['None', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Fluent', 'Not Required'];
export function clean(v: unknown, max = 300) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
export function numberOrNull(v: unknown) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}
export function dateOrNull(v: unknown) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  const date = new Date(`${v.slice(0, 10)}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== v.slice(0, 10) ? null : date;
}
export function urlOrNull(v: unknown) {
  const url = clean(v, 1200);
  if (!url) return null;
  try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null; }
  catch { return null; }
}
export function applicationData(body: Record<string, unknown>) {
  const companyName = clean(body.companyName ?? body.company, 180);
  const jobTitle = clean(body.jobTitle, 180);
  if (!companyName || !jobTitle) throw new Error('Company and job title are required.');
  const status = clean(body.status);
  if (status && !STATUSES.includes(status as typeof STATUSES[number])) throw new Error('Invalid status.');
  const interviewDates = Array.isArray(body.interviewDates)
    ? body.interviewDates.map(dateOrNull).filter((d): d is Date => d !== null).slice(0, 20)
    : [];
  return {
    companyName, jobTitle,
    jobLocation: clean(body.jobLocation ?? body.location, 180) || 'Berlin',
    jobDescription: clean(body.jobDescription, 40000) || null,
    jobUrl: urlOrNull(body.jobUrl),
    status: status || 'Saved',
    platform: clean(body.platform, 100) || 'LinkedIn',
    notes: clean(body.notes, 20000) || null,
    applicationDate: dateOrNull(body.applicationDate ?? body.dateApplied) || new Date(),
    salaryMin: numberOrNull(body.salaryMin),
    salaryMax: numberOrNull(body.salaryMax),
    workArrangement: clean(body.workArrangement, 60) || null,
    germanLevel: clean(body.germanLevel, 60) || null,
    recruiterName: clean(body.recruiterName, 160) || null,
    recruiterContact: clean(body.recruiterContact, 300) || null,
    cvVersion: clean(body.cvVersion, 120) || null,
    followUpDate: dateOrNull(body.followUpDate),
    interviewDates
  };
}
