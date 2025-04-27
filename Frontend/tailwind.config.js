/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      fontFamily: {
        'do-hyeon': ['"Do Hyeon"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#7D4FFF',
          hover: '#6a43d9',
        },
        secondary: {
          pink: '#FF4F5B',
          teal: '#78E9D2',
        },
        base: {
          black: '#000000',
          white: '#FFFFFF',
          navgray: '#F3F3F5',
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out'
      },
      zIndex: {
        '100000': '100000',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '80%',
            color: '#333',
            pre: {
              backgroundColor: '#1e1e1e', // Dark background like ChatGPT
              color: '#e4e4e4', // Light text color
              padding: '1.5rem',
              borderRadius: '0.75rem',
              margin: '1.5rem 0',
              border: '1px solid #2d2d2d',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflowX: 'auto',
            },
            code: {
              color: '#e4e4e4',
              backgroundColor: '#1e1e1e',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '500',
              fontFamily: 'ui-monospace, monospace',
            },
            // Math blocks styling
            '.math-block': {
              backgroundColor: '#1e1e1e',
              color: '#e4e4e4',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              margin: '1.5rem 0',
              border: '1px solid #2d2d2d',
              overflowX: 'auto',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.95em',
            },
            // Inline math styling
            '.math-inline': {
              backgroundColor: '#1e1e1e',
              color: '#e4e4e4',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.95em',
            },
            // Table styling
            table: {
              width: '100%',
              marginTop: '2em',
              marginBottom: '2em',
              borderCollapse: 'collapse',
              thead: {
                backgroundColor: '#1e1e1e',
                color: '#e4e4e4',
                th: {
                  padding: '1rem',
                  borderBottom: '2px solid #2d2d2d',
                  textAlign: 'left',
                  fontWeight: '600',
                },
              },
              tbody: {
                tr: {
                  borderBottom: '1px solid #2d2d2d',
                  '&:nth-child(odd)': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                  },
                },
                td: {
                  padding: '1rem',
                  verticalAlign: 'top',
                },
              },
            },
            h1: {
              color: '#333',
              fontWeight: '600'
            },
            h2: {
              color: '#333',
              fontWeight: '600'
            },
            h3: {
              color: '#333',
              fontWeight: '600'
            },
            strong: {
              color: '#333',
              fontWeight: '600'
            },
            blockquote: {
              borderLeftColor: '#7D4FFF',
              backgroundColor: '#f8f9fa',
              borderRadius: '0 1rem 1rem 0',
              padding: '1rem 1.5rem',
              margin: '1.5rem 0',
              color: '#666'
            }
          }
        }
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    },
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/typography'),
  ]
}