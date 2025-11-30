const Subscriber = require('../models/subscriberModel');
const { sendNewsletterEmail } = require('../utils/email');

async function sendNewsletterToSubscribers(news) {
    try {
        const subs = await Subscriber.find({ confirmed: true }).lean();
        if (!subs || subs.length === 0) {
            console.log('No confirmed subscribers to send newsletter to');
            return;
        }

        // send emails in parallel but limit concurrency modestly
        const concurrency = 10;
        let i = 0;
        const results = [];

        async function worker() {
            while (true) {
                const idx = i++;
                if (idx >= subs.length) return;
                const s = subs[idx];
                try {
                    const info = await sendNewsletterEmail(s.email, news);
                    results.push({ email: s.email, ok: true, info });
                } catch (err) {
                    console.error('Failed to send newsletter to', s.email, err && err.message);
                    results.push({ email: s.email, ok: false, error: err && err.message });
                }
            }
        }

        const workers = Array.from({ length: Math.min(concurrency, subs.length) }).map(() => worker());
        await Promise.all(workers);
        console.log(`Newsletter sent to ${results.filter(r => r.ok).length}/${subs.length} subscribers`);
        return results;
    } catch (err) {
        console.error('sendNewsletterToSubscribers error', err);
    }
}

module.exports = { sendNewsletterToSubscribers };
