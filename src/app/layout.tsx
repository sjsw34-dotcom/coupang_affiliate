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
  description: "가전, 자동차용품, 캠핑장비 추천 비교 사이트 | 스펙 비교, 실사용 리뷰, 최저가 정보까지 한눈에",
  metadataBase: new URL(SITE_URL),
  keywords: ['가전 추천', '자동차용품 추천', '캠핑용품 추천', '제품 비교', '최저가', '리뷰'],
  alternates: {
    canonical: "/",
    languages: { "ko-KR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 가전·자동차·캠핑 추천 비교`,
    description: "스펙 비교부터 실사용 후기까지, 구매 전 꼭 확인하세요",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 가전·자동차·캠핑 추천 비교`,
    description: "스펙 비교부터 실사용 후기까지, 구매 전 꼭 확인하세요",
  },
  verification: {},
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
    description: "가전, 자동차용품, 캠핑장비 추천 비교 사이트",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ko">
      <head>
        <link rel="alternate" hrefLang="ko-KR" href={SITE_URL} />
        <link rel="alternate" type="application/rss+xml" title={SITE_NAME} href={`${SITE_URL}/feed.xml`} />
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
