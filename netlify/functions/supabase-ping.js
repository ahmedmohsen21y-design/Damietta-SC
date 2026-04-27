// =============================================
// DAMIETTA SC — Netlify Function: supabase-ping.js
// Prevents Supabase free tier from pausing (pauses after 7 days inactivity)
// =============================================
// Setup:
//   Add to Netlify Environment Variables:
//     SUPABASE_URL:      https://xxxx.supabase.co
//     SUPABASE_ANON_KEY: your-anon-key
//
// Schedule: Set in netlify.toml or trigger manually every 3-5 days
// To schedule, add to netlify.toml:
//   [scheduled-functions]
//   [[scheduled-functions.supabase-ping]]
//     cron = "0 9 */4 * *"   (every 4 days at 9am)

exports.handler = async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const ANON_KEY     = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !ANON_KEY) {
    return { statusCode: 500, body: 'Supabase credentials not configured' };
  }

  try {
    // Simple read ping — doesn't expose data, just keeps project active
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });

    const status = res.ok ? 'alive' : 'error';
    console.log(`Supabase ping: ${status} (${res.status})`);

    return {
      statusCode: 200,
      body: JSON.stringify({ ping: status, timestamp: new Date().toISOString() })
    };
  } catch (err) {
    console.error('Supabase ping failed:', err);
    return { statusCode: 500, body: 'Ping failed' };
  }
};
