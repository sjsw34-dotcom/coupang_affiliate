/**
 * Korean keyword → English slug conversion
 */

const KEYWORD_SLUG_MAP: Record<string, string> = {
  '무선 이어폰 추천': 'wireless-earbuds',
  '블루투스 스피커 추천': 'bluetooth-speaker',
  '노트북 거치대': 'laptop-stand',
  '기계식 키보드 추천': 'mechanical-keyboard',
  '무선 마우스 추천': 'wireless-mouse',
  '27인치 모니터 추천': '27inch-monitor',
  '웹캠 추천': 'webcam',
  '외장하드 추천': 'external-hdd',
  'USB 허브 추천': 'usb-hub',
  '멀티탭 추천': 'power-strip',
  '공기청정기 추천': 'air-purifier',
  '로봇청소기 추천': 'robot-vacuum',
  '무선충전기 추천': 'wireless-charger',
  '보조배터리 추천': 'power-bank',
  '태블릿 거치대': 'tablet-stand',
  '게이밍 헤드셋 추천': 'gaming-headset',
  'LED 데스크램프': 'led-desk-lamp',
  '전동 드라이버 추천': 'electric-driver',
  'NAS 추천 가정용': 'home-nas',
  '스마트워치 추천': 'smartwatch',
  '차량용 공기청정기': 'car-air-purifier',
  '블랙박스 추천': 'dashcam',
  '차량용 핸드폰 거치대': 'car-phone-mount',
  '차량용 무선충전기': 'car-wireless-charger',
  '차량용 방향제 추천': 'car-air-freshener',
  '자동차 시트커버': 'car-seat-cover',
  '차량용 청소기 추천': 'car-vacuum',
  '점프스타터 추천': 'jump-starter',
  '타이어 공기압 충전기': 'tire-inflator',
  '차량용 냉온컵홀더': 'car-cup-cooler',
  '자동차 선팅 필름': 'car-tint-film',
  '트렁크 정리함': 'trunk-organizer',
  '차량용 인버터': 'car-inverter',
  '후방카메라 추천': 'rear-camera',
  '자동차 코팅제 추천': 'car-coating',
  '와이퍼 추천': 'wiper-blade',
  '차량용 LED 전구': 'car-led-bulb',
  '자동차 매트 추천': 'car-floor-mat',
  '대시보드 캠 추천': 'dashboard-cam',
  '차량 방충망 추천': 'car-mosquito-net',
  '캠핑의자 추천': 'camping-chair',
  '캠핑 텐트 추천': 'camping-tent',
  '캠핑 침낭 추천': 'sleeping-bag',
  '캠핑 랜턴 추천': 'camping-lantern',
  '캠핑 테이블 추천': 'camping-table',
  '버너 추천 캠핑': 'camping-burner',
  '아이스박스 추천': 'ice-cooler',
  '캠핑 매트 추천': 'camping-mat',
  '등산화 추천': 'hiking-shoes',
  '등산 배낭 추천': 'hiking-backpack',
  '캠핑 코펠 세트': 'camping-cookware',
  '캠핑 타프 추천': 'camping-tarp',
  '화로대 추천': 'fire-pit',
  '감성캠핑 소품': 'camping-decor',
  '캠핑 우드 선반': 'camping-wood-shelf',
  '보온병 추천': 'thermos-bottle',
  '등산 스틱 추천': 'trekking-pole',
  '캠핑 그릴 추천': 'camping-grill',
  '방수 자켓 추천': 'waterproof-jacket',
  '캠핑 전기장판': 'camping-heating-pad',
};

/**
 * Convert Korean keyword to English slug.
 * 1) Check known map
 * 2) If keyword has year suffix, append it
 * 3) Fallback: generate timestamp-based slug
 */
export function koreanToSlug(keyword: string): string {
  // Try exact match first
  if (KEYWORD_SLUG_MAP[keyword]) {
    return KEYWORD_SLUG_MAP[keyword];
  }

  // Try stripping year suffix (e.g., "공기청정기 추천 2026" → "공기청정기 추천")
  const yearMatch = keyword.match(/^(.+?)\s*(\d{4})$/);
  if (yearMatch) {
    const base = yearMatch[1].trim();
    const year = yearMatch[2];
    if (KEYWORD_SLUG_MAP[base]) {
      return `${KEYWORD_SLUG_MAP[base]}-${year}`;
    }
  }

  // Try partial match — find the longest matching key
  const sortedKeys = Object.keys(KEYWORD_SLUG_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (keyword.includes(key)) {
      const suffix = keyword.replace(key, '').trim();
      const baseslug = KEYWORD_SLUG_MAP[key];
      if (suffix) {
        // If suffix is a year or short text, append it
        const cleanSuffix = suffix.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return cleanSuffix ? `${baseslug}-${cleanSuffix}` : baseslug;
      }
      return baseslug;
    }
  }

  // Fallback: use timestamp
  return `review-${Date.now().toString(36)}`;
}
