// Cloudflare Worker Backend for Sovereign System

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Enable CORS preflight
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders });
    }

    try {
      // 1. POST /api/analytics/track
      if (path === '/api/analytics/track' && request.method === 'POST') {
        const body = await request.json();
        const { sessionId, eventType, pagePath, referrer, campaignSource } = body;
        
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO analytics_events (id, session_id, event_type, page_path, referrer, campaign_source) 
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, sessionId, eventType, pagePath, referrer || '', campaignSource || 'direct').run();

        return new Response(JSON.stringify({ success: true, eventId: id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. GET /api/admin/analytics
      if (path === '/api/admin/analytics' && request.method === 'GET') {
        // Auth check
        const token = url.searchParams.get('token') || request.headers.get('Authorization')?.replace('Bearer ', '');
        if (token !== env.ADMIN_TOKEN) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Aggregate stats
        const viewsCount = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'pageview'"
        ).first('count');

        const clicksCount = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'click'"
        ).first('count');

        const campaignStats = await env.DB.prepare(
          `SELECT campaign_source, COUNT(*) as count 
           FROM analytics_events 
           GROUP BY campaign_source`
        ).all();

        return new Response(JSON.stringify({
          success: true,
          metrics: {
            totalPageViews: viewsCount,
            totalAffiliateClicks: clicksCount,
            campaignAcquisitions: campaignStats.results
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 3. POST /api/support/ticket
      if (path === '/api/support/ticket' && request.method === 'POST') {
        const body = await request.json();
        const { clientId, clientEmail, subject, message } = body;

        if (!clientEmail || !subject || !message) {
          return new Response(JSON.stringify({ error: 'Missing parameters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const ticketId = crypto.randomUUID();
        
        // Write to DB
        await env.DB.prepare(
          `INSERT INTO support_tickets (id, client_id, client_email, subject, message) 
           VALUES (?, ?, ?, ?, ?)`
        ).bind(ticketId, clientId || 'anonymous', clientEmail, subject, message).run();

        // Send Email Alert via Resend API
        if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 'REPLACE_WITH_YOUR_RESEND_API_KEY') {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: "Sovereign System Alerts <onboarding@resend.dev>",
                to: env.ADMIN_EMAIL,
                subject: `[Sovereign Ticket] ${subject}`,
                html: `<p><strong>New Support Ticket Submitted</strong></p>
                       <p><strong>Ticket ID:</strong> ${ticketId}</p>
                       <p><strong>Email:</strong> ${clientEmail}</p>
                       <p><strong>Subject:</strong> ${subject}</p>
                       <p><strong>Message:</strong><br>${message}</p>`
              })
            });
          } catch (emailErr) {
            console.error("Email send failed:", emailErr);
          }
        }

        return new Response(JSON.stringify({ success: true, ticketId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 4. POST /api/admin/support/reply
      if (path === '/api/admin/support/reply' && request.method === 'POST') {
        // Auth check
        const token = url.searchParams.get('token') || request.headers.get('Authorization')?.replace('Bearer ', '');
        if (token !== env.ADMIN_TOKEN) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const body = await request.json();
        const { ticketId, message } = body;

        if (!ticketId || !message) {
          return new Response(JSON.stringify({ error: 'Missing parameters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch client details
        const ticket = await env.DB.prepare(
          "SELECT client_email, subject FROM support_tickets WHERE id = ?"
        ).bind(ticketId).first();

        if (!ticket) {
          return new Response(JSON.stringify({ error: 'Ticket not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const replyId = crypto.randomUUID();
        // Write reply row
        await env.DB.prepare(
          `INSERT INTO ticket_replies (id, ticket_id, sender, message) 
           VALUES (?, ?, 'admin', ?)`
        ).bind(replyId, ticketId, message).run();

        // Update ticket status
        await env.DB.prepare(
          "UPDATE support_tickets SET status = 'replied', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(ticketId).run();

        // Email Client via Resend
        if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 'REPLACE_WITH_YOUR_RESEND_API_KEY') {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: "Sovereign Systems Support <onboarding@resend.dev>",
                to: ticket.client_email,
                subject: `Re: [Sovereign Ticket] ${ticket.subject}`,
                html: `<p>Hi there,</p>
                       <p>We have updated your systems audit support ticket with the following response:</p>
                       <p style="background:#f3f4f6; padding:10px; border-left:3px solid #6366f1;">${message}</p>
                       <p>Best regards,<br>Sovereign System Support Team</p>`
              })
            });
          } catch (emailErr) {
            console.error("Email reply failed:", emailErr);
          }
        }

        return new Response(JSON.stringify({ success: true, replyId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
