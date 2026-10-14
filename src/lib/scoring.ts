/** Local heuristic: checks technology keywords in a pasted vacancy.
 * This is NOT a model-based, ATS, or recruiter success probability.
 */
const KEYWORDS = ['python', 'sql', 'pyspark', 'spark', 'kafka', 'airflow', 'postgresql', 'docker', 'aws', 'dbt', 'snowflake', 'databricks', 'scala', 'java', 'azure', 'gcp', 'kubernetes', 'terraform', 'etl', 'data modeling', 'data warehouse', 'data lake', 'streaming', 'git', 'power bi', 'tableau'];
export function scoreDescription(description: string, skills: string[]) {
  const found = KEYWORDS.filter(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(description));
  const matched = found.filter(k => skills.some(skill => k === skill.toLowerCase() || k.includes(skill.toLowerCase()) || skill.toLowerCase().includes(k)));
  const missing = found.filter(k => !matched.includes(k));
  return { found, matched, missing, percentage: found.length ? Math.round(100 * matched.length / found.length) : null };
}
