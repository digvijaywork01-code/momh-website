import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [tailwindcssAnimate, typography],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '2rem',
      },
      screens: {
        '2xl': '86rem',
        lg: '64rem',
        md: '48rem',
        sm: '40rem',
        xl: '80rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        background: 'hsl(var(--background))',
        border: 'hsla(var(--border))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        foreground: 'hsl(var(--foreground))',
        input: 'hsl(var(--input))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        ring: 'hsl(var(--ring))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: 'hsl(var(--success))',
        error: 'hsl(var(--error))',
        warning: 'hsl(var(--warning))',
        // brand-red = the PDF's sharp/cool red used on InfoHero buttons,
        // EditorialCta arrows, and the M●MH In *News* logo dot.
        'brand-red': '#F1001C',
        'brand-red-dark': '#982222',

        // MOMH editorial palette — wired from src/styles/tokens.css.
        // Direct hex (no HSL) because brand colors are fixed, never theme.
        // NOTE: do NOT alias `red` — that would collide with Tailwind's
        // default `red-50…red-950` palette used in form error messages.
        // Use `brand-red` / `brand-red-dark` everywhere for the CTA red.
        ivory: '#FFFEFA',
        // PDF-exact warm peach-cream (Founder, Architecture, Blogs+Newsletter).
        // The AI file is Display P3; #EED2B3 is the sRGB equivalent of the
        // designer's P3 fill (0.914, 0.827, 0.718). tokens.css adds a
        // `@media (color-gamut: p3)` upgrade to the true P3 color on
        // wide-gamut displays — sRGB displays use this hex as fallback.
        cream: '#EED2B3',
        emerald: '#1A4A3A',
        maroon: '#A21C28',
        // Deep navy / "blue meenakari" — used on the Thank You page's
        // "Our *Blogs*" EditorialSplit panel (PDF p7, panel 3).
        navy: '#1A2952',
        ink: '#000000',                  // pure black (PDF-exact)
        gold: '#A29667',
        offwhite: '#F5F5F5',             // text on dark sections (PDF-exact)
        'pure-white': '#FFFFFF',         // About MoMH (pure white over black)
        'press-cream': '#EAD3B8',        // Press News colorway
        'warm-gray': '#4F4C49',          // Blogs+Newsletter colorway
        'founder-red': '#A60B1A',        // Founder Quote colorway
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)'],
        sans: ['var(--font-geist-sans)'],
        serif: ['"Times Now"', '"Times New Roman"', 'Times', 'serif'],
        roboto: ['Roboto', 'sans-serif'],
        'helvetica-neue': [
          '"HelveticaNeueCyr"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        'times-now': ['"Times Now"', 'serif'],
        'times-now-italic': ['"Times Now"', 'serif'],

        // MOMH editorial type system — wired via tokens.css.
        // `display` is the headline font (Meno Banner via Adobe Fonts, with
        // Cormorant as the self-hosted fallback). `body` is Gill Sans.
        // `script` is the italic eyebrow style (Cormorant Italic).
        display: ['var(--font-display)'],
        'display-italic': ['var(--font-display-italic)'],
        script: ['var(--font-script)'],
        body: ['var(--font-body)'],
      },
      fontSize: {
        // Fluid editorial type scale — peak values match PDF at 1920px,
        // clamped to a mobile floor. Each token also brings its PDF-exact
        // font-weight so the type system is self-documenting and consumers
        // don't need to remember 300 vs 400.
        //
        //   text-display      → 48px / 300 (GillSans-Light)
        //   text-eyebrow      → 24px / 400 (Cormorant RegularItalic)
        //   text-body         → 24px / 300 (GillSans-Light)
        //   text-hero         → 72px / 400 (Cormorant Regular)
        //   text-hero-body    → 30px / 300 (GillSans-Light)
        //   text-button       → 20px / 400 (GillSans regular)
        //   founder-*         → MenoBanner family, weight per PDF
        hero: ['var(--fs-hero)', { lineHeight: 'var(--lh-display)', fontWeight: '400' }],
        'hero-body': ['var(--fs-hero-body)', { lineHeight: 'var(--lh-body)', fontWeight: '300' }],
        display: ['var(--fs-display)', { lineHeight: 'var(--lh-display)', fontWeight: '300' }],
        'display-l': ['var(--fs-display-large)', { lineHeight: 'var(--lh-display)', fontWeight: '300' }],
        eyebrow: ['var(--fs-eyebrow)', { lineHeight: 'var(--lh-body)', fontWeight: '400' }],
        body: ['var(--fs-body)', { lineHeight: 'var(--lh-body)', fontWeight: '300' }],
        featured: ['var(--fs-featured)', { lineHeight: 'var(--lh-headline)', fontWeight: '300' }],
        cta: ['var(--fs-cta)', { lineHeight: '1.2', fontWeight: '300' }],
        nav: ['var(--fs-nav)', { lineHeight: '1.2', fontWeight: '300' }],
        button: ['var(--fs-button)', { lineHeight: '1.2', letterSpacing: '0.18em', fontWeight: '400' }],
        'founder-eyebrow': ['var(--fs-founder-eyebrow)', { lineHeight: '1.2', letterSpacing: '0.18em', fontWeight: '400' }],
        'founder-title': ['var(--fs-founder-title)', { lineHeight: 'var(--lh-display)', letterSpacing: '0.05em', fontWeight: '400' }],
        'founder-quote': ['var(--fs-founder-quote)', { lineHeight: 'var(--lh-body)', fontWeight: '300' }],
        'founder-attribution': ['var(--fs-founder-attribution)', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '300' }],
        'founder-role': ['var(--fs-founder-role)', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '300' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
