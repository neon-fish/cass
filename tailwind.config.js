const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,css,html}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Cass suggests: Roboto, Open Sans, Lato, Nunito
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // (Moderate Blue) - This friendly and approachable color can be used for buttons, links, and other interactive elements.
        primary: {
          // DEFAULT: "#4A90E2",
          DEFAULT: colors.sky[600],
          contrast: "#fff",
        },
        // (Vivid Yellow) - This warm and inviting color can be used for highlights and accents, such as notifications or important messages.
        secondary: {
          DEFAULT: "#FFC107",
          contrast: "#333",
        },
        // (Vibrant Purple) - This bold color can be used sparingly for extra emphasis on specific elements or actions.
        accent: {
          DEFAULT: "#9C27B0",
          contrast: "#fff",
        },
        // (Light Gray) - This neutral color provides a clean and minimalistic background that is easy on the eyes.
        light: {
          DEFAULT: "#F5F5F5",
          contrast: "#333",
        },
        // (Very Dark Gray) - This color provides a high contrast against the background, ensuring readability.
        dark: {
          DEFAULT: "#333333",
          contrast: "#fff",
        },
      },
    },
  },
  plugins: [],
}

// Cass its own colour scheme:
// 
// "
// When choosing theme colors for a UI that interacts with a virtual assistant like me, it's essential to consider the following factors:
// 
// 1. Readability: Ensure that the text is easy to read against the background colors. High contrast between text and background is crucial for readability. 
// 
// 2. Branding: If you have a brand or logo associated with the virtual assistant, you may want to incorporate those colors into the theme to maintain consistency.
// 
// 3. Mood and tone: The colors should evoke a sense of friendliness, approachability, and professionalism. Soft, calming colors can help create a comfortable user experience.
// 
// 4. Accessibility: Consider colorblind users and ensure that the color palette is accessible to all users.
// 
// With these factors in mind, I suggest the following color palette:
// 
// 1. Background: #F5F5F5 (Light Gray) - This neutral color provides a clean and minimalistic background that is easy on the eyes.
// 2. Primary color: #4A90E2 (Moderate Blue) - This friendly and approachable color can be used for buttons, links, and other interactive elements.
// 3. Secondary color: #FFC107 (Vivid Yellow) - This warm and inviting color can be used for highlights and accents, such as notifications or important messages.
// 4. Text color: #333333 (Very Dark Gray) - This color provides a high contrast against the background, ensuring readability.
// 5. Accent color: #9C27B0 (Vibrant Purple) - This bold color can be used sparingly for extra emphasis on specific elements or actions.
// 
// Remember to adjust these colors as needed to match your specific branding and design preferences.
// "
