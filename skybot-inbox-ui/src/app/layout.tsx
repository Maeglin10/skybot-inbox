import "./globals.css";

export const metadata = {
  title: "Skybot Inbox",
  description: "Inbox UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
