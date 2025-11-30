const nodemailer = require('nodemailer');

// sendResetEmail(to, resetURL) - uses SMTP credentials from env:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
async function sendResetEmail(to, resetURL) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || (user || 'no-reply@example.com');

    if (!host || !port || !user || !pass) {
        throw new Error('SMTP configuration is missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in environment');
    }

    const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465, // true for 465, false for other ports
        auth: {
            user,
            pass,
        },
    });

    const html = `
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu. Liên kết sẽ hết hạn sau một giờ.</p>
        <p><a href="${resetURL}">Đặt lại mật khẩu</a></p>
        <p>Nếu bạn không yêu cầu thay đổi này, bạn có thể bỏ qua email này.</p>
    `;

    const info = await transporter.sendMail({
        from,
        to,
        subject: 'Đặt lại mật khẩu - Pin Swap',
        html,
    });

    return info;
}

async function sendSubscriptionEmail(to, confirmURL) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || (user || 'no-reply@example.com');

    if (!host || !port || !user || !pass) {
        throw new Error('SMTP configuration is missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in environment');
    }

    const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
    });

    const html = `
        <p>Cảm ơn bạn đã đăng ký nhận tin từ Pin Swap.</p>
        <p>Nhấn vào liên kết dưới đây để xác nhận đăng ký:</p>
        <p><a href="${confirmURL}">Xác nhận đăng ký nhận tin</a></p>
        <p>Nếu bạn không muốn nhận email này, bạn có thể bỏ qua nó.</p>
    `;

    const info = await transporter.sendMail({
        from,
        to,
        subject: 'Xác nhận đăng ký nhận tin - Pin Swap',
        html,
    });

    return info;
}

module.exports = { sendResetEmail, sendSubscriptionEmail };

async function sendNewsletterEmail(to, news) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || (user || 'no-reply@example.com');

    if (!host || !port || !user || !pass) {
        throw new Error('SMTP configuration is missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in environment');
    }

    const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
    const url = `${FRONTEND_URL.replace(/\/$/, '')}/news/${news._id}`;

    const summary = (news.content || '').replace(/(<([^>]+)>)/gi, '');
    const excerpt = summary.length > 300 ? summary.slice(0, 300) + '...' : summary;

    const html = `
        <h2>${news.title}</h2>
        <p>${excerpt}</p>
        <p><a href="${url}">Xem chi tiết</a></p>
        <hr/>
        <p>Nếu bạn không muốn nhận các email này, bạn có thể hủy đăng ký trên trang của chúng tôi.</p>
    `;

    const info = await transporter.sendMail({
        from,
        to,
        subject: `Pin Swap - Tin mới: ${news.title}`,
        html,
    });

    return info;
}

// export the newsletter func as well
module.exports.sendNewsletterEmail = sendNewsletterEmail;
