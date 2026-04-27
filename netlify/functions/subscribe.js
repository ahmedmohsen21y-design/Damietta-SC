// =============================================
// DAMIETTA SC — Netlify Function: subscribe.js
// Brevo Newsletter Subscription (secure proxy)
// =============================================
// Setup:
//   1. Sign up at brevo.com
//   2. Get API key from Account > SMTP & API
//   3. Add to Netlify: Site Settings > Environment Variables
//      Key: BREVO_API_KEY  Value: your-key-here
//      Key: BREVO_LIST_ID  Value: your-list-id (number)

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email address' }) };
  }

  const API_KEY  = process.env.BREVO_API_KEY;
  const LIST_ID  = parseInt(process.env.BREVO_LIST_ID || '2');

  if (!API_KEY) {
    console.error('BREVO_API_KEY not set in environment variables');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        listIds: [LIST_ID],
        updateEnabled: true,
        attributes: {
          SOURCE: 'website',
          SUBSCRIBED_AT: new Date().toISOString()
        }
      })
    });

    if (response.ok || response.status === 204) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Subscribed successfully' })
      };
    }

    // Already subscribed = still OK
    if (response.status === 400) {
      const data = await response.json();
      if (data.code === 'duplicate_parameter') {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Already subscribed' })
        };
      }
    }

    throw new Error(`Brevo API error: ${response.status}`);

  } catch (err) {
    console.error('Subscribe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Subscription failed, please try again' })
    };
  }
};
