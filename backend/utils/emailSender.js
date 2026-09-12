const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT),
    secure: false, // Brevo uses STARTTLS on port 587, not SSL
    family: 4, // force IPv4 - avoids ECONNREFUSED ::1:587 on some Windows setups
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
}

/**
 * Sends an escalation email to the government contact when a
 * disaster-level request is flagged as too big for volunteers to handle.
 */
const sendEscalationEmail = async (request, escalatedByUser) => {
  const mapLink = `https://www.google.com/maps?q=${request.location.coordinates[1]},${request.location.coordinates[0]}`;

  const mailOptions = {
    from: '"Disaster Relief Platform" <disasterrelief.alerts@gmail.com>',
    to: process.env.GOV_CONTACT_EMAIL,
    subject: `ESCALATION: ${request.category.toUpperCase()} emergency needs authority response`,
    html: `
      <h2>Disaster Escalation Alert</h2>
      <p>A request has been escalated by a volunteer as too large-scale for individual/volunteer response.</p>
      <ul>
        <li><strong>Category:</strong> ${request.category}</li>
        <li><strong>Description:</strong> ${request.description}</li>
        <li><strong>People affected (estimated):</strong> ${request.aiExtracted?.peopleAffected ?? 'Unknown'}</li>
        <li><strong>Urgency score:</strong> ${request.aiExtracted?.urgencyScore ?? 'N/A'}</li>
        <li><strong>Location:</strong> <a href="${mapLink}">${mapLink}</a></li>
        <li><strong>Escalated by (volunteer):</strong> ${escalatedByUser?.name || escalatedByUser?.email || 'Unknown'}</li>
        <li><strong>Request ID:</strong> ${request._id}</li>
      </ul>
      <p>This is an automated alert from the Disaster Relief Platform.</p>
    `,
  };

  const transporter = getTransporter();
  await transporter.sendMail(mailOptions);
};

module.exports = { sendEscalationEmail };