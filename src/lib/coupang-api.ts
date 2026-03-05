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
  const path = '/v2/providers/affiliate_open_api/apis/openapi/products/search';
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
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

  return {
    landingUrl: json.data.landingUrl,
    products: json.data.productData ?? [],
  };
}
