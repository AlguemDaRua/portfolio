import "./globals.css";

export const metadata = {
  title: "Dark / Light Paint Toggle",
  description: "Standalone preview of the portfolio's randomized paint theme transition.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
