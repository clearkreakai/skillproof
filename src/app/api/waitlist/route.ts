import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const notificationEmail = process.env.NOTIFICATION_EMAIL || 'harrison@clearkreakai.com';

// Send notification email via Resend
async function sendNotificationEmail(newEmail: string) {
  if (!resendApiKey) {
    console.log('Resend API key not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SkillProof <onboarding@resend.dev>',
        to: notificationEmail,
        subject: '🎉 New SkillProof Waitlist Signup!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Waitlist Signup!</h2>
            <p>Someone just joined the SkillProof waitlist:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>Email:</strong> ${newEmail}<br>
              <strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })} MST
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              View all signups at <a href="https://supabase.com/dashboard">Supabase Dashboard</a>
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send notification email:', await response.text());
    } else {
      console.log('Notification email sent successfully');
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert email into waitlist table
    const { error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email.toLowerCase().trim(),
          source: 'landing_page',
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist!' },
          { status: 400 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      );
    }

    // Send notification email (async, don't wait)
    sendNotificationEmail(email.toLowerCase().trim());

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
