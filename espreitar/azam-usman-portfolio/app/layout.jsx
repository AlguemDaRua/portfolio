import "./globals.css";

export const metadata = {
  title: "Azam Usman — Software Developer",
  description:
    "Portfolio of Azam Usman, a software developer working across full-stack products, mobile applications and connected systems.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
