import crypto from 'crypto';

interface CoupangProduct {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  keyword: string;
  rank: number;
  isRocket: boolean;
  isFreeShipping: boolean;
}

interface CoupangSearchResponse {
  rCode: string;
  rMessage: string;
  data: {
    landingUrl: string;
    productData: CoupangProduct[];
  };
}

export interface CoupangSearchResult {
  landingUrl: string;
  products: CoupangProduct[];
}

const BASE_URL = 'https://api-gateway.coupang.com';

// 기업용/업소용 상품 필터링 키워드
const B2B_KEYWORDS = [
  '업소용', '산업용', '공업용', '영업용',
  '박스단위', '묶음배송', '100개입', '50개입', '30개입',
  '케이스단위', '카톤', '벌크', 'bulk',
  '사무용', '관공서', '학교용', '병원용', '호텔용',
  '식당용', '매장용', '공장용', '현장용',
  '도매', '대량구매', '납품용',
  '3상', '380v', '동력',
];

// 개인 소비자 타겟이 아닌 상품인지 판별
function isB2BProduct(product: CoupangProduct): boolean {
  const name = product.productName.toLowerCase();
  return B2B_KEYWORDS.some((kw) => name.includes(kw.toLowerCase()));
}

function getAuthHeader(method: string, path: string, query: string): string {
  const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY;
  const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error('Missing COUPANG_PARTNERS_ACCESS_KEY or COUPANG_PARTNERS_SECRET_KEY');
  }

  const now = new Date();
  const datetime =
    now.getUTCFullYear().toString().slice(2) +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z';

  const message = datetime + method.toUpperCase() + path + query;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

export async function searchProducts(keyword: string, limit = 10): Promise<CoupangSearchResult> {
  // 넉넉하게 요청해서 B2B 필터링 후에도 원하는 개수 확보
  const fetchLimit = Math.min(limit * 3, 30);
  const path = '/v2/providers/affiliate_open_api/apis/openapi/products/search';
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${fetchLimit}`;
  const authorization = getAuthHeader('GET', path, query);

  const res = await fetch(`${BASE_URL}${path}?${query}`, {
    method: 'GET',
    headers: {
      Authorization: authorization,
    },
  });

  if (!res.ok) {
    throw new Error(`Coupang API error: ${res.status} ${res.statusText}`);
  }

  const json: CoupangSearchResponse = await res.json();
  if (json.rCode !== '0') {
    throw new Error(`Coupang API error: ${json.rMessage}`);
  }

  const allProducts = json.data.productData ?? [];
  const filtered = allProducts.filter((p) => !isB2BProduct(p)).slice(0, limit);

  return {
    landingUrl: json.data.landingUrl,
    products: filtered,
  };
}
