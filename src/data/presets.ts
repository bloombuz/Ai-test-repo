// Helper to create sharp SVG data URLs for sample ad creatives
function createSvgDataUrl(width: number, height: number, svgContent: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgContent}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fullSvg)}`;
}

export interface DemoCreativeItem {
  id: string;
  name: string;
  brand: string;
  mediaType: 'image' | 'video';
  durationSec?: number;
  targetAspect: string;
  wordCount: number;
  contrastProfile: 'Low Contrast' | 'High Contrast' | 'Micro-Text & QR' | 'Dynamic Strobe Hazard' | 'Subtle Washout';
  dataUrl: string;
  badge: string;
  expectedResultHeadline: string;
}

export const DEMO_CREATIVES: DemoCreativeItem[] = [
  {
    id: 'luxury-low-contrast',
    name: 'Aura Luxury Real Estate (Example Case)',
    brand: 'Aura Living',
    mediaType: 'image',
    targetAspect: '4.5:1 (576x128)',
    wordCount: 14,
    contrastProfile: 'Low Contrast',
    badge: 'Flagged Example',
    expectedResultHeadline: 'Low contrast detected (14 words, sunlight washout risk)',
    dataUrl: createSvgDataUrl(
      576,
      128,
      `
      <defs>
        <linearGradient id="bgLowContrast" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E8E4DD" />
          <stop offset="50%" stop-color="#DDD8CD" />
          <stop offset="100%" stop-color="#CFC9BD" />
        </linearGradient>
      </defs>
      <rect width="576" height="128" fill="url(#bgLowContrast)"/>
      <!-- Subtle muted decorative rings -->
      <circle cx="500" cy="64" r="80" stroke="#C2BCB0" stroke-width="2" fill="none" opacity="0.4"/>
      <!-- Brand Logo / Monogram -->
      <rect x="24" y="24" width="32" height="32" rx="4" fill="#B5AEA0"/>
      <text x="40" y="45" font-family="Georgia, serif" font-size="18" fill="#F4F1EA" text-anchor="middle">A</text>
      <!-- Brand Name -->
      <text x="68" y="44" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#8C8475" letter-spacing="2">AURA LIVING</text>
      <!-- Low Contrast Headline - 14 words total -->
      <text x="68" y="74" font-family="Georgia, serif" font-size="18" fill="#9E9687">
        Discover Unmatched Luxury Living in the Heart of the City.
      </text>
      <text x="68" y="100" font-family="Georgia, serif" font-size="14" fill="#8A8272">
        Reserve Today at 5th Ave.
      </text>
      <!-- Small phone number (illegible on moving taxi) -->
      <text x="440" y="98" font-family="Arial, sans-serif" font-size="11" fill="#999182">
        Tel: +1 (212) 555-0199
      </text>
      `
    ),
  },
  {
    id: 'video-cyberbolt',
    name: 'CyberBolt Energy (6s Video Loop)',
    brand: 'CYBERBOLT',
    mediaType: 'video',
    durationSec: 6.0,
    targetAspect: '4.5:1 (576x128)',
    wordCount: 4,
    contrastProfile: 'High Contrast',
    badge: 'Optimal Video',
    expectedResultHeadline: '6.0s DOOH loop compliant, high contrast & safe motion pacing',
    dataUrl: createSvgDataUrl(
      576,
      128,
      `
      <rect width="576" height="128" fill="#0A0F1A"/>
      <path d="M 44 24 L 28 66 L 40 66 L 24 104 L 52 54 L 38 54 Z" fill="#FFE600"/>
      <text x="66" y="50" font-family="'Impact', 'Arial Black', sans-serif" font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="2">CYBERBOLT</text>
      <text x="66" y="92" font-family="'Impact', 'Arial Black', sans-serif" font-size="34" font-weight="900" fill="#FFE600">100% RAW ENERGY</text>
      <rect x="446" y="44" width="110" height="40" rx="8" fill="#00FFEA"/>
      <text x="501" y="69" font-family="'Arial Black', sans-serif" font-size="13" font-weight="bold" fill="#000000" text-anchor="middle">GRAB NOW</text>
      `
    ),
  },
  {
    id: 'video-strobe-warning',
    name: 'FlashSale Promo (12s Video - Strobe Hazard)',
    brand: 'SuperDeals',
    mediaType: 'video',
    durationSec: 12.0,
    targetAspect: '4.5:1 (576x128)',
    wordCount: 16,
    contrastProfile: 'Dynamic Strobe Hazard',
    badge: 'Strobe Hazard',
    expectedResultHeadline: 'Flashing hazard >3Hz, excessive 12s duration & 16 words',
    dataUrl: createSvgDataUrl(
      576,
      128,
      `
      <rect width="576" height="128" fill="#000000"/>
      <rect x="0" y="0" width="576" height="128" fill="#FF0055" opacity="0.8"/>
      <text x="24" y="48" font-family="'Arial Black', sans-serif" font-size="24" font-weight="900" fill="#FFFF00">FLASH SALE! 70% OFF!</text>
      <text x="24" y="80" font-family="Arial, sans-serif" font-size="15" fill="#FFFFFF">Don't wait - visit store now or scan code to claim coupon before midnight.</text>
      <text x="24" y="104" font-family="Arial, sans-serif" font-size="12" fill="#E2E8F0">Limited stock at participating locations. Terms apply.</text>
      `
    ),
  },
  {
    id: 'bold-energy-drink',
    name: 'Apex Energy Drink (High Impact OOH)',
    brand: 'APEX ENERGY',
    mediaType: 'image',
    targetAspect: '4.5:1 (576x128)',
    wordCount: 4,
    contrastProfile: 'High Contrast',
    badge: 'Optimal Image',
    expectedResultHeadline: 'Optimal contrast & concise copy (4 words, 4500 nits high-visibility)',
    dataUrl: createSvgDataUrl(
      576,
      128,
      `
      <defs>
        <linearGradient id="bgApex" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0A0B0E" />
          <stop offset="60%" stop-color="#141720" />
          <stop offset="100%" stop-color="#002244" />
        </linearGradient>
      </defs>
      <rect width="576" height="128" fill="url(#bgApex)"/>
      <!-- Electric Accent Bar -->
      <rect x="0" y="0" width="8" height="128" fill="#FFDD00"/>
      <!-- High contrast lightning bolt -->
      <path d="M 40 28 L 26 66 L 36 66 L 24 100 L 48 54 L 36 54 Z" fill="#FFDD00"/>
      <!-- Brand Name -->
      <text x="62" y="52" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="3">
        APEX
      </text>
      <!-- Punchy 4-word Copy in High Contrast Yellow & White -->
      <text x="62" y="92" font-family="'Impact', 'Arial Black', sans-serif" font-size="34" font-weight="900" fill="#FFDD00" letter-spacing="1">
        BOLD TASTE. PURE ENERGY.
      </text>
      <!-- CTA Pill -->
      <rect x="440" y="44" width="112" height="40" rx="8" fill="#FFDD00"/>
      <text x="496" y="69" font-family="'Arial Black', sans-serif" font-size="14" font-weight="bold" fill="#000000" text-anchor="middle">
        GRAB ONE
      </text>
      `
    ),
  },
  {
    id: 'fintech-crowded',
    name: 'NeoBank Mobile App (Crowded Copy & Small QR)',
    brand: 'NovaPay',
    mediaType: 'image',
    targetAspect: '4.5:1 (576x128)',
    wordCount: 18,
    contrastProfile: 'Micro-Text & QR',
    badge: 'Multiple Violations',
    expectedResultHeadline: 'Unscannable QR code & 18 words on moving taxi matrix',
    dataUrl: createSvgDataUrl(
      576,
      128,
      `
      <rect width="576" height="128" fill="#182030"/>
      <circle cx="288" cy="64" r="140" fill="#243248" opacity="0.4"/>
      <!-- Brand -->
      <text x="24" y="36" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#38BDF8">NOVAPAY MOBILE</text>
      <!-- 18 words total headline & subtext -->
      <text x="24" y="62" font-family="Arial, sans-serif" font-size="15" fill="#FFFFFF">
        Send money instantly anywhere in the world with zero hidden transaction fees.
      </text>
      <text x="24" y="86" font-family="Arial, sans-serif" font-size="12" fill="#94A3B8">
        Download on iOS and Android today to receive your welcome bonus of twenty dollars.
      </text>
      <text x="24" y="108" font-family="Arial, sans-serif" font-size="10" fill="#64748B">
        Terms &amp; conditions apply. Regulated financial partner.
      </text>
      <!-- QR code mockup - too small for moving vehicle -->
      <rect x="500" y="24" width="56" height="56" fill="#FFFFFF" rx="4"/>
      <rect x="508" y="32" width="16" height="16" fill="#000000"/>
      <rect x="532" y="32" width="16" height="16" fill="#000000"/>
      <rect x="508" y="56" width="16" height="16" fill="#000000"/>
      <rect x="528" y="56" width="8" height="8" fill="#000000"/>
      <text x="528" y="96" font-family="Arial, sans-serif" font-size="9" fill="#94A3B8" text-anchor="middle">Scan QR</text>
      `
    ),
  },
  {
    id: 'cyberpunk-ride-hail',
    name: 'Velocity Cabs (Vibrant Night DOOH)',
    brand: 'Velocity',
    mediaType: 'image',
    targetAspect: '3:1 (384x128)',
    wordCount: 5,
    contrastProfile: 'High Contrast',
    badge: '3:1 Format',
    expectedResultHeadline: 'High luminance 4500 nits punchy branding (5 words)',
    dataUrl: createSvgDataUrl(
      384,
      128,
      `
      <rect width="384" height="128" fill="#090A10"/>
      <line x1="0" y1="126" x2="384" y2="126" stroke="#06B6D4" stroke-width="3"/>
      <!-- Brand text -->
      <text x="24" y="44" font-family="'Arial Black', sans-serif" font-size="20" font-weight="900" fill="#06B6D4" letter-spacing="2">
        VELOCITY
      </text>
      <!-- 5-word bold headline -->
      <text x="24" y="84" font-family="'Arial Black', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF">
        YOUR CITY. YOUR RIDE.
      </text>
      <!-- Sub-line -->
      <text x="24" y="108" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#F43F5E">
        ARRIVING IN 2 MINUTES
      </text>
      `
    ),
  },
];

