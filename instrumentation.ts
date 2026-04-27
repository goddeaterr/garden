// Next.js instrumentation — runs once when the server starts
export async function register() {
  // Only run on server, not in edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { scheduleStartupScrape } = await import('./lib/startup-scrape');
    scheduleStartupScrape();
  }
}
