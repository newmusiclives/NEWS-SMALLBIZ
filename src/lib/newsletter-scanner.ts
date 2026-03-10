export interface NewsletterScanResult {
  hasNewsletter: boolean;
  signals: string[];
}

// Keywords and patterns that indicate a newsletter signup exists
const NEWSLETTER_KEYWORDS = [
  'newsletter',
  'subscribe',
  'mailing list',
  'email list',
  'email updates',
  'sign up for',
  'signup',
  'sign-up',
  'stay informed',
  'stay updated',
  'get updates',
  'join our list',
  'email signup',
  'mailchimp',
  'constantcontact',
  'mailerlite',
  'sendinblue',
  'brevo',
  'convertkit',
  'klaviyo',
  'hubspot',
  'activecampaign',
];

const NEWSLETTER_HTML_PATTERNS = [
  /newsletter/i,
  /subscribe/i,
  /mailing.?list/i,
  /email.?signup/i,
  /email.?list/i,
  /sign.?up.*(?:email|updates|news)/i,
  /(?:email|updates|news).*sign.?up/i,
  /mc-embedded-subscribe/i,
  /mailchimp/i,
  /constantcontact/i,
  /mailerlite/i,
  /sendinblue/i,
  /brevo/i,
  /convertkit/i,
  /klaviyo/i,
  /hubspot/i,
  /activecampaign/i,
  /type=["']email["'][^>]*placeholder=["'][^"']*(?:newsletter|subscribe|email)/i,
  /placeholder=["'][^"']*(?:newsletter|subscribe|your email|enter email)/i,
  /action=["'][^"']*(?:subscribe|newsletter|mailchimp|convertkit)/i,
  /#mc_embed_signup/i,
  /class=["'][^"']*(?:newsletter|subscribe|signup-form|email-signup)/i,
  /id=["'][^"']*(?:newsletter|subscribe|signup|mc_embed)/i,
];

/**
 * Scans a website URL for newsletter signup indicators.
 * Fetches the page HTML and looks for common newsletter patterns.
 */
export async function scanForNewsletter(websiteUrl: string): Promise<NewsletterScanResult> {
  if (!websiteUrl) {
    return { hasNewsletter: false, signals: [] };
  }

  const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmallBizFinder/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { hasNewsletter: false, signals: [] };
    }

    const html = await response.text();
    const signals: string[] = [];

    // Check HTML patterns
    for (const pattern of NEWSLETTER_HTML_PATTERNS) {
      const match = html.match(pattern);
      if (match) {
        signals.push(match[0].substring(0, 60));
      }
    }

    // Deduplicate signals
    const unique = [...new Set(signals)];

    return {
      hasNewsletter: unique.length >= 2, // require at least 2 signals to reduce false positives
      signals: unique.slice(0, 5),
    };
  } catch {
    return { hasNewsletter: false, signals: [] };
  }
}

/**
 * Simulates a newsletter scan for demo/offline mode.
 * ~30% of businesses "have" a newsletter.
 */
export function simulateNewsletterScan(): NewsletterScanResult {
  const has = Math.random() < 0.3;
  if (!has) {
    return { hasNewsletter: false, signals: [] };
  }

  const possibleSignals = [
    'newsletter signup form',
    'Subscribe to our mailing list',
    'mailchimp embed',
    'email signup widget',
    'class="newsletter-form"',
    'Join our email list',
    'constantcontact form',
    'Get weekly updates',
  ];

  const count = 2 + Math.floor(Math.random() * 3);
  const shuffled = possibleSignals.sort(() => Math.random() - 0.5);
  return {
    hasNewsletter: true,
    signals: shuffled.slice(0, count),
  };
}
