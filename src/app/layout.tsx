import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "가전, 자동차용품, 캠핑용품 추천 및 비교 리뷰",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: { "ko-KR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };

  return (
    <html lang="ko">
      <head>
        <link rel="alternate" hrefLang="ko-KR" href={SITE_URL} />
      </head>
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="mx-auto min-h-screen max-w-[1280px] px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
