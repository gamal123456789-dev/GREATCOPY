import type { NextApiRequest, NextApiResponse } from 'next';
import * as nodemailer from 'nodemailer';

/**
 * API endpoint for sending support tickets to Tawk.to via email
 * This endpoint sends tickets directly to the Tawk.to ticketing system
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, priority, description } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !description) {
      return res.status(400).json({ 
        error: 'All fields are required: name, email, subject, description' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create email transporter using existing configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.EMAIL_USER, // support@gear-score.com
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Create email body with ticket information
    const emailBody = `
Support Ticket Submission
========================

Customer Information:
- Name: ${name}
- Email: ${email}

Ticket Details:
- Subject: ${subject}
- Priority: ${priority || 'Medium'}

Description:
${description}

========================
This ticket was submitted from the website contact form.
Please respond to the customer at: ${email}
`;

    // Email options for sending tickets
    // Note: Sending to Gmail directly since Tawk.to forwarding is not configured
    const mailOptions = {
      from: `Gearscore Support <${process.env.EMAIL_USER}>`,
      to: 'support@gear-score.com', // Direct to support email
      cc: 'tickets@gear-score.p.tawk.email', // Also send to Tawk.to email as CC
      replyTo: email, // Customer's email for replies
      subject: `[${priority || 'Medium'}] ${subject}`,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Support Ticket Submission</h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Ticket Details</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Priority:</strong> <span style="background-color: ${priority === 'High' ? '#dc3545' : priority === 'Low' ? '#28a745' : '#ffc107'}; color: white; padding: 2px 8px; border-radius: 3px;">${priority || 'Medium'}</span></p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Description</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${description}</p>
          </div>
          
          <div style="background-color: #e9ecef; padding: 10px; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This ticket was submitted from the website contact form.</p>
            <p style="margin: 5px 0 0 0;">Please respond to the customer at: <a href="mailto:${email}">${email}</a></p>
          </div>
        </div>
      `
    };

    // Send email (direct to Gmail + CC to Tawk.to)
    console.log('📨 Sending ticket:', {
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
      customerEmail: email
    });

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Ticket sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      customerEmail: email,
      subject: subject,
      sentTo: mailOptions.to,
      ccTo: mailOptions.cc
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Ticket sent successfully to support team',
      ticketId: info.messageId
    });

  } catch (error) {
    console.error('❌ Failed to send ticket to Tawk.to:', error);
    
    // Return error response
    return res.status(500).json({
      error: 'Failed to send ticket',
      message: 'There was an error sending your ticket. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
}