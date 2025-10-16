import { APP_PASSWORD, APP_USER } from "$env/static/private";
import nodemailer from "nodemailer";

type EmailOptions = {
  recipients: string | string[];
  subject: string;
  text: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: APP_USER,
    pass: APP_PASSWORD,
  },
});

export const sendEmail = async ({
  recipients,
  subject,
  text,
  html,
}: EmailOptions) => {
  const mailOptions = {
    from: {
      name: "Úřední deska KHK",
      address: APP_USER,
    },
    to: recipients,
    subject: subject,
    text: text,
    html: html || setHtmlContent(text),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${recipients}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

const setHtmlContent = (text: string) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <tr>
                <td style="padding: 40px 30px; text-align: center; background-color: #0a2f83;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Nové oznámení</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 30px;">
                    ${text}
                </td>
            </tr>
            <tr>
                <td style="padding: 20px; background-color: #f0f7ff; text-align: center; font-size: 14px; color: #666;">
                    <p style="margin: 0;">Toto je automatická zpráva z úřední desky Královéhradeckého kraje.</p>
                </td>
            </tr>
        </table>
    </div>
  `;
};

export const createNotificationEmailHtml = (messages: any[]) => {
  const messagesList = messages
    .map(
      (msg) => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #0a2f83;">
      <h3 style="margin: 0 0 10px 0; color: #0a2f83; font-size: 18px;">
        <a href="${msg.url}" style="color: #0a2f83; text-decoration: none;">${msg.nazev}</a>
      </h3>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Kategorie:</strong> ${msg.category}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Vyvěšeno:</strong> ${msg.vyveseni}</p>
      ${msg.location ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Lokace:</strong> ${msg.location}</p>` : ''}
      <p style="margin: 10px 0 0 0;">
        <a href="${msg.url}" style="display: inline-block; background-color: #0a2f83; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;">
          Zobrazit detail
        </a>
      </p>
    </div>
  `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <tr>
                <td style="padding: 40px 30px; text-align: center; background-color: #0a2f83;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Nová oznámení</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 30px;">
                    <p style="margin-bottom: 20px;">Vážený uživateli,</p>
                    <p style="margin-bottom: 20px;">na úřední desce se objevila nová oznámení odpovídající vašim preferencím:</p>
                    ${messagesList}
                    <p style="margin-top: 30px;">Děkujeme,<br>Tým Úřední desky KHK</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px; background-color: #f0f7ff; text-align: center; font-size: 14px; color: #666;">
                    <p style="margin: 0;">Toto je automatická zpráva z úřední desky Královéhradeckého kraje.</p>
                    <p style="margin: 5px 0 0 0;">Nastavení oznámení můžete spravovat ve svém účtu.</p>
                </td>
            </tr>
        </table>
    </div>
  `;
};
