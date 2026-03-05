-- ============================================
-- Coupang Affiliate Site - Seed Data
-- WITH 구문으로 ID를 참조하여 관계 데이터 연결
-- ============================================

-- 1) Categories (3개)
WITH cat_electronics AS (
  INSERT INTO categories (slug, name, description, sort_order)
  VALUES ('electronics', '가전/IT', '가전제품, IT 기기, 디지털 액세서리 추천 및 비교 리뷰', 1)
  RETURNING id
),
cat_car AS (
  INSERT INTO categories (slug, name, description, sort_order)
  VALUES ('car-accessories', '자동차/용품', '자동차 용품, 차량 관리, 드라이브 필수템 추천 및 비교 리뷰', 2)
  RETURNING id
),
cat_camping AS (
  INSERT INTO categories (slug, name, description, sort_order)
  VALUES ('camping-outdoor', '캠핑/아웃도어', '캠핑 장비, 아웃도어 용품, 등산 장비 추천 및 비교 리뷰', 3)
  RETURNING id
),

-- 2) Products (6개, 카테고리당 2개)
-- 가전/IT
prod_lg_puricare AS (
  INSERT INTO products (name, brand, category_id, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons)
  SELECT 'LG 퓨리케어 미니 공기청정기', 'LG', id, 189000, 4.7,
    'https://link.coupang.com/a/EXAMPLE_001', 'search', 'LG 퓨리케어 미니',
    '프리미엄',
    ARRAY['초미세먼지 99.9% 제거', '22dB 저소음 설계', 'LG 브랜드 AS 지원'],
    ARRAY['18만원대 높은 가격', '적용 면적 5평 한정']
  FROM cat_electronics
  RETURNING id
),
prod_samsung_monitor AS (
  INSERT INTO products (name, brand, category_id, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons)
  SELECT '삼성 오디세이 G5 27인치 게이밍 모니터', '삼성', id, 289000, 4.6,
    'https://link.coupang.com/a/EXAMPLE_002', 'search', '삼성 오디세이 G5 27인치',
    '에디터 추천',
    ARRAY['165Hz 고주사율', '1000R 커브드 패널', 'HDR10 지원'],
    ARRAY['스피커 미내장', 'USB-C 미지원']
  FROM cat_electronics
  RETURNING id
),
-- 자동차/용품
prod_xiaomi_purifier AS (
  INSERT INTO products (name, brand, category_id, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons)
  SELECT '샤오미 스마트 차량용 공기청정기 S1', '샤오미', id, 59000, 4.3,
    'https://link.coupang.com/a/EXAMPLE_003', 'search', '샤오미 차량용 공기청정기',
    '가성비 최고',
    ARRAY['컴팩트 사이즈', 'USB-C 전원', 'HEPA H13 필터'],
    ARRAY['최대 풍량에서 소음 있음', '앱 연동 불안정']
  FROM cat_car
  RETURNING id
),
prod_philips_purifier AS (
  INSERT INTO products (name, brand, category_id, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons)
  SELECT '필립스 고퓨어 GP5611 차량용 공기청정기', '필립스', id, 159000, 4.5,
    'https://link.coupang.com/a/EXAMPLE_004', 'product', '필립스 고퓨어 차량용',
    NULL,
    ARRAY['HEPA + 활성탄 듀얼필터', '공기질 LED 인디케이터', '저소음 35dB'],
    ARRAY['15만원대 높은 가격', '필터 교체 비용 2만원대']
  FROM cat_car
  RETURNING id
),
-- 캠핑/아웃도어
prod_helinox AS (
  INSERT INTO products (name, brand, category_id, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons)
  SELECT '헬리녹스 체어원', '헬리녹스', id, 139000, 4.8,
    'https://link.coupang.com/a/EXAMPLE_005', 'search', '헬리녹스 체어원',
    '에디터 추천',
    ARRAY['초경량 960g', 'DAC 알루미늄 프레임 145kg 하중', '30초 간편 조립'],
    ARRAY['13만원대 높은 가격대']
  FROM cat_camping
  RETURNING id
),
prod_coleman AS (
  INSERT INTO products (name, brand, category_id, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons)
  SELECT '콜맨 리조트 체어', '콜맨', id, 35000, 4.5,
    'https://link.coupang.com/a/EXAMPLE_006', 'search', '콜맨 리조트 체어',
    '가성비 최고',
    ARRAY['3만원대 뛰어난 가성비', '넓은 좌석과 팔걸이', '컵홀더 포함'],
    ARRAY['무게 3.5kg으로 무거운 편', '백패킹에는 부적합']
  FROM cat_camping
  RETURNING id
),

-- 3) Hubs (2개)
hub_camping AS (
  INSERT INTO hubs (slug, title, meta_description, description, category_id, status)
  SELECT 'camping-gear-guide', '캠핑 장비 완벽 가이드',
    '캠핑 초보부터 베테랑까지, 텐트·의자·침낭 등 필수 캠핑 장비 총정리 가이드',
    '캠핑을 시작하려는 분들을 위한 종합 가이드입니다. 텐트, 의자, 침낭, 버너 등 카테고리별 추천 제품과 선택 기준을 제공합니다. 초보 캠퍼도 이 가이드만 읽으면 장비 선택에 어려움이 없을 것입니다.',
    id, 'published'
  FROM cat_camping
  RETURNING id
),
hub_car AS (
  INSERT INTO hubs (slug, title, meta_description, description, category_id, status)
  SELECT 'car-accessories-guide', '차량 용품 가이드',
    '쾌적한 드라이브를 위한 필수 차량 용품 추천 가이드. 공기청정기, 블랙박스, 충전기 총정리',
    '차량을 더 쾌적하고 편리하게 만들어주는 필수 용품들을 정리했습니다. 공기청정기, 블랙박스, 무선충전기 등 카테고리별 추천 제품과 선택 기준을 안내합니다.',
    id, 'published'
  FROM cat_car
  RETURNING id
),

-- 4) Collections (2개)
col_camping_chair AS (
  INSERT INTO collections (slug, title, meta_description, description, category_id, status, published_at, faq_json)
  SELECT 'best-camping-chair-2025', '2025 캠핑의자 TOP 5',
    '2025년 캠핑의자 추천 순위. 경량 백패킹 체어부터 릴렉스 체어까지 스펙 비교 분석.',
    '직접 스펙을 비교하고 1,000건 이상의 사용자 리뷰를 분석하여 선정한 2025년 캠핑의자 추천 리스트입니다. 무게, 내구성, 편안함, 가성비 4가지 기준으로 평가했습니다.',
    id, 'published', now(),
    '[{"question":"캠핑의자 추천 기준이 뭔가요?","answer":"무게, 하중 지지력, 수납 크기, 가격 대비 성능을 종합 평가합니다."},{"question":"백패킹용 의자와 오토캠핑용 의자 차이는?","answer":"백패킹용은 1kg 이하 경량이 핵심이고, 오토캠핑용은 편안함과 넓은 좌석이 중요합니다."},{"question":"캠핑의자 하중은 어느 정도가 적당한가요?","answer":"본인 체중의 1.5배 이상을 권장합니다. 앉을 때 충격 하중이 추가되기 때문입니다."}]'::jsonb
  FROM cat_camping
  RETURNING id
),
col_car_purifier AS (
  INSERT INTO collections (slug, title, meta_description, description, category_id, status, published_at, faq_json)
  SELECT 'best-car-air-purifier', '차량용 공기청정기 추천',
    '2025년 차량용 공기청정기 추천 순위. 샤오미, 필립스 등 인기 제품 성능 비교.',
    '미세먼지 시즌 필수템, 차량용 공기청정기를 필터 성능, 소음, 크기, 가격 4가지 기준으로 비교 분석했습니다. 실제 사용자 리뷰 500건 이상을 분석하여 선정했습니다.',
    id, 'published', now(),
    '[{"question":"차량용 공기청정기 필터 교체 주기는?","answer":"보통 3~6개월마다 교체를 권장합니다. 미세먼지가 심한 봄철에는 더 자주 교체하세요."},{"question":"시거잭과 USB 중 어떤 전원이 좋나요?","answer":"USB 타입이 범용성이 높습니다. 보조배터리로도 사용 가능해 편리합니다."},{"question":"HEPA 필터와 일반 필터 차이는?","answer":"HEPA H13 등급은 0.3마이크로미터 입자를 99.97% 걸러냅니다. 미세먼지 제거에는 HEPA 필터가 필수입니다."}]'::jsonb
  FROM cat_car
  RETURNING id
),

-- 5) Posts (3개) — claude.md Content Template Structure 준수
post_camping_chair AS (
  INSERT INTO posts (slug, title, meta_description, category_id, hub_id, primary_collection_id, content, excerpt, status, published_at, updated_at, word_count, reading_time_min, primary_keyword, secondary_keywords, author_name, author_bio, faq_json)
  SELECT
    'best-lightweight-camping-chair-2025',
    '경량 캠핑의자 추천 — 2025년 백패킹 필수 아이템 비교',
    '2025년 경량 캠핑의자 추천 순위. 1kg 이하 초경량 체어부터 가성비 제품까지 스펙 기반 비교 분석합니다.',
    cat_camping.id,
    hub_camping.id,
    col_camping_chair.id,
    '## 경량 캠핑의자 추천 — 2025년 백패킹 필수 아이템 비교

백패킹이나 미니멀 캠핑을 즐기는 분들에게 의자 무게는 생각보다 중요합니다. 전체 배낭 무게에서 1kg 차이가 체감으로는 훨씬 크게 느껴지기 때문입니다. 이 글에서는 직접 스펙을 비교 분석하고 1,000건 이상의 사용자 리뷰를 종합하여 선정한 2025년 경량 캠핑의자 추천 제품을 소개합니다.

## 선정 기준

경량 캠핑의자를 선정할 때 다음 5가지 기준을 중점적으로 평가했습니다. 단순히 가벼운 것만이 아니라, 실사용에서 중요한 요소들을 종합적으로 고려했습니다.

1. **무게**: 1.5kg 이하를 기본 기준으로 선정. 백패킹용은 1kg 이하 우선
2. **내구성**: 최소 120kg 이상 하중 지지. 프레임 소재와 이음새 품질 확인
3. **수납 크기**: 40L 배낭 사이드에 수납 가능한 컴팩트 사이즈
4. **조립 편의성**: 30초 이내 조립 가능 여부. 폴 끼우는 방식 vs 펼치는 방식 비교
5. **가성비**: 동급 스펙 대비 합리적 가격. 3만원대~15만원대까지 가격대별 추천

## 추천 제품 비교

### 1. 헬리녹스 체어원 — 에디터 추천

캠핑의자의 대명사라 할 수 있는 헬리녹스 체어원입니다. 960g의 초경량 무게에 145kg 하중을 지지하는 놀라운 내구성을 자랑합니다. DAC 사의 고강도 알루미늄 합금 폴로 제작되어 가볍지만 매우 튼튼합니다. 수납 시 35cm x 10cm로 배낭 사이드 포켓에 쏙 들어갑니다.

**장점**: 초경량 960g, DAC 알루미늄 145kg 하중, 다양한 컬러/한정판
**주의할 점**: 가격이 13만원대로 캠핑의자 중 최상위 가격대

백패킹이나 등산 캠핑을 자주 하면서 장비 무게에 민감한 분에게 강력 추천합니다.

### 2. 콜맨 리조트 체어 — 가성비 최고

3만원대의 합리적인 가격에 넓은 좌석과 컵홀더까지 갖춘 가성비 캠핑의자입니다. 무게가 3.5kg으로 경량은 아니지만, 차박이나 오토캠핑에서는 무게가 큰 문제가 되지 않습니다. 팔걸이가 있어 장시간 앉아 있어도 편안합니다.

**장점**: 3만원대 가성비, 넓은 좌석과 팔걸이, 컵홀더 기본 포함
**주의할 점**: 무게 3.5kg으로 백패킹에는 부적합. 수납 크기도 큰 편

가성비를 중시하는 오토캠핑 유저, 또는 캠핑 입문자에게 적합합니다.

## 최종 추천

- **최고 추천**: 헬리녹스 체어원 — 경량과 내구성의 완벽한 조합. 투자 가치 충분
- **가성비 추천**: 콜맨 리조트 체어 — 3만원대에 이 정도 품질이면 실속 있는 선택
- **입문용 추천**: 콜맨 리조트 체어 — 캠핑을 시작하는 분에게 부담 없는 가격

## 자주 묻는 질문

**Q: 캠핑의자 하중이 왜 중요한가요?**
A: 체중뿐 아니라 앉을 때 가해지는 충격 하중을 고려해야 합니다. 본인 체중의 1.5배 이상 하중을 지지하는 제품을 권장합니다.

**Q: 경량 캠핑의자도 튼튼한가요?**
A: 알루미늄 합금(특히 DAC, 유럽 항공 소재) 프레임 제품은 가벼우면서도 120kg 이상을 지지합니다. 소재가 핵심입니다.

**Q: 캠핑의자 세탁은 어떻게 하나요?**
A: 대부분 시트 분리가 가능합니다. 중성세제로 손세탁 후 그늘에서 완전 건조하면 됩니다. 세탁기 사용은 권장하지 않습니다.',
    '2025년 경량 캠핑의자 추천. 헬리녹스 체어원, 콜맨 리조트 체어 등 스펙 기반 비교 분석.',
    'published', now(), now(), 1400, 5,
    '경량 캠핑의자 추천',
    ARRAY['백패킹 의자 추천', '초경량 캠핑의자', '캠핑의자 비교'],
    '김캠핑',
    '캠핑 장비 전문 리뷰어. 10년 이상의 백패킹·오토캠핑 경험을 바탕으로 실용적인 제품 추천을 합니다.',
    '[{"question":"캠핑의자 하중이 왜 중요한가요?","answer":"체중뿐 아니라 앉을 때 가해지는 충격 하중을 고려해야 합니다. 본인 체중의 1.5배 이상 하중을 지지하는 제품을 권장합니다."},{"question":"경량 캠핑의자도 튼튼한가요?","answer":"알루미늄 합금(특히 DAC, 유럽 항공 소재) 프레임 제품은 가벼우면서도 120kg 이상을 지지합니다. 소재가 핵심입니다."},{"question":"캠핑의자 세탁은 어떻게 하나요?","answer":"대부분 시트 분리가 가능합니다. 중성세제로 손세탁 후 그늘에서 완전 건조하면 됩니다. 세탁기 사용은 권장하지 않습니다."}]'::jsonb
  FROM cat_camping, hub_camping, col_camping_chair
  RETURNING id
),
post_car_purifier AS (
  INSERT INTO posts (slug, title, meta_description, category_id, hub_id, primary_collection_id, content, excerpt, status, published_at, updated_at, word_count, reading_time_min, primary_keyword, secondary_keywords, author_name, author_bio, faq_json)
  SELECT
    'best-car-air-purifier-2025',
    '차량용 공기청정기 추천 — 2025년 미세먼지 시즌 완벽 대비',
    '2025년 차량용 공기청정기 추천. 샤오미, 필립스 등 인기 제품 필터 성능·소음·가격 비교 분석.',
    cat_car.id,
    hub_car.id,
    col_car_purifier.id,
    '## 차량용 공기청정기 추천 — 2025년 미세먼지 시즌 완벽 대비

봄철 미세먼지 시즌이 되면 차 안 공기질이 급격히 나빠집니다. 특히 출퇴근 시간대에는 외부 공기가 환기구를 통해 차 내부로 유입되면서, 밀폐된 차량 내부의 초미세먼지 농도가 실외보다 2~3배 높아질 수 있습니다. 이 글에서는 차량용 공기청정기 추천 제품을 필터 성능, 소음, 크기, 가격 기준으로 비교 분석합니다.

## 선정 기준

차량용 공기청정기를 선정할 때 다음 5가지 기준을 중점적으로 평가했습니다. 차량이라는 좁은 공간의 특수성을 고려하여 일반 공기청정기와는 다른 기준을 적용했습니다.

1. **필터 성능**: HEPA H13 등급 이상 필터 탑재 여부. PM2.5 미세먼지 제거율 확인
2. **소음**: 40dB 이하 저소음 설계. 운전 중 대화나 음악 감상에 방해되지 않는 수준
3. **크기**: 컵홀더 장착 또는 대시보드 거치 가능한 컴팩트 사이즈
4. **전원**: USB-C 또는 시거잭 호환성. 보조배터리 사용 가능 여부
5. **가격대**: 5만원~20만원 범위에서 가격 대비 성능 평가

## 추천 제품 비교

### 1. 샤오미 스마트 차량용 공기청정기 S1 — 가성비 최고

5만원대의 합리적인 가격에 HEPA H13 필터를 탑재한 가성비 제품입니다. 컴팩트한 원통형 디자인으로 컵홀더에 딱 맞으며, USB-C 전원으로 차량 외에도 사무실 책상에서 사용할 수 있습니다.

**장점**: 5만원대 가성비, HEPA H13 필터, USB-C 범용 전원
**주의할 점**: 최대 풍량에서 소음이 있음. 샤오미 앱 연동이 불안정할 수 있음

가성비를 중시하면서도 기본 성능은 타협하지 않으려는 분에게 추천합니다.

### 2. 필립스 고퓨어 GP5611 — 프리미엄 추천

HEPA와 활성탄 듀얼필터 시스템으로 미세먼지뿐 아니라 유해가스와 냄새까지 제거하는 프리미엄 제품입니다. 전면 LED로 실시간 공기질을 3단계로 표시해주며, 35dB 저소음 설계로 운전 중에도 거의 소리가 들리지 않습니다.

**장점**: HEPA + 활성탄 듀얼필터, 공기질 LED 인디케이터, 35dB 저소음
**주의할 점**: 15만원대 높은 가격. 필터 교체 비용이 2만원대로 유지비 고려 필요

성능과 브랜드 신뢰성을 모두 원하는 분, 차량 내 냄새까지 제거하고 싶은 분에게 적합합니다.

## 최종 추천

- **가성비 추천**: 샤오미 S1 — 5만원대에서 HEPA H13 필터를 갖춘 실속 선택
- **프리미엄 추천**: 필립스 고퓨어 GP5611 — 필터 성능과 저소음을 동시에 잡은 제품
- **입문용 추천**: 샤오미 S1 — 차량용 공기청정기를 처음 사용하는 분에게 적합

## 자주 묻는 질문

**Q: 차량용 공기청정기 필터 교체 주기는?**
A: 보통 3~6개월마다 교체를 권장합니다. 봄철 미세먼지가 심한 시기에는 3개월, 그 외에는 6개월 주기로 교체하세요.

**Q: HEPA 필터와 일반 필터 차이는?**
A: HEPA H13 등급은 0.3마이크로미터 입자를 99.97% 걸러냅니다. 초미세먼지(PM2.5) 제거에는 HEPA 필터 탑재 제품이 필수입니다.

**Q: 시거잭과 USB 중 어떤 전원이 좋나요?**
A: USB 타입이 범용성이 높습니다. 차량 외에도 보조배터리나 노트북으로 전원을 공급할 수 있어 편리합니다.',
    '2025년 차량용 공기청정기 추천. 미세먼지 시즌 필수 아이템 필터 성능·소음·가격 비교 분석.',
    'published', now(), now(), 1350, 5,
    '차량용 공기청정기 추천',
    ARRAY['차량 공기청정기 비교', '미세먼지 차량용', '자동차 공기청정기 순위'],
    '박드라이브',
    '자동차 용품 전문 리뷰어. 10만km 이상 주행 경험을 바탕으로 실제 사용감 중심의 차량 용품 리뷰를 작성합니다.',
    '[{"question":"차량용 공기청정기 필터 교체 주기는?","answer":"보통 3~6개월마다 교체를 권장합니다. 봄철 미세먼지가 심한 시기에는 3개월, 그 외에는 6개월 주기로 교체하세요."},{"question":"HEPA 필터와 일반 필터 차이는?","answer":"HEPA H13 등급은 0.3마이크로미터 입자를 99.97% 걸러냅니다. 초미세먼지(PM2.5) 제거에는 HEPA 필터 탑재 제품이 필수입니다."},{"question":"시거잭과 USB 중 어떤 전원이 좋나요?","answer":"USB 타입이 범용성이 높습니다. 차량 외에도 보조배터리나 노트북으로 전원을 공급할 수 있어 편리합니다."}]'::jsonb
  FROM cat_car, hub_car, col_car_purifier
  RETURNING id
),
post_gaming_monitor AS (
  INSERT INTO posts (slug, title, meta_description, category_id, hub_id, primary_collection_id, content, excerpt, status, published_at, updated_at, word_count, reading_time_min, primary_keyword, secondary_keywords, author_name, author_bio, faq_json)
  SELECT
    'best-gaming-monitor-27-2025',
    '27인치 게이밍 모니터 추천 — 2025년 가성비 모델 비교',
    '2025년 27인치 게이밍 모니터 추천. 삼성 오디세이 등 인기 모델 주사율·패널·가격 비교 분석.',
    cat_electronics.id,
    NULL,
    NULL,
    '## 27인치 게이밍 모니터 추천 — 2025년 가성비 모델 비교

게이밍 모니터를 고를 때 가장 먼저 고민하는 것이 화면 크기입니다. 27인치는 FPS, MOBA, RPG 등 대부분의 장르에서 최적의 몰입감을 제공하면서도 책상 공간을 과도하게 차지하지 않는 황금 사이즈입니다. 이 글에서는 2025년 27인치 게이밍 모니터 추천 제품을 주사율, 패널, 가격 기준으로 비교합니다.

## 선정 기준

게이밍 모니터를 선정할 때 다음 5가지 기준을 중점적으로 평가했습니다. 게임 장르와 용도에 따라 우선순위가 달라질 수 있으므로, 본인의 주력 게임을 기준으로 판단하시기 바랍니다.

1. **주사율**: 144Hz 이상 필수. FPS 게임이면 165Hz~240Hz 권장
2. **패널 종류**: IPS(색재현) vs VA(명암비) vs TN(응답속도). 용도별 최적 패널 비교
3. **해상도**: FHD(1080p) vs QHD(1440p). GPU 성능과의 균형 고려
4. **응답속도**: 1ms~4ms GTG 기준. 잔상 여부 확인
5. **부가 기능**: HDR 지원, 높낮이 조절, 피벗, USB-C 연결 등

## 추천 제품 비교

### 1. 삼성 오디세이 G5 27인치 — 에디터 추천

삼성의 게이밍 모니터 라인업 중 가성비 최강으로 꼽히는 모델입니다. 165Hz 주사율과 1000R 커브드 VA 패널로 몰입감 있는 게이밍 환경을 제공합니다. HDR10을 지원하며, 1ms MPRT 응답속도로 FPS 게임에서도 잔상 없는 플레이가 가능합니다.

**장점**: 165Hz + 1000R 커브드의 몰입감, HDR10 지원, 삼성 AS
**주의할 점**: 스피커 미내장으로 별도 스피커 필요. USB-C 미지원

FPS, 레이싱 등 빠른 장르를 즐기면서 커브드 패널의 몰입감을 원하는 분에게 추천합니다.

## 최종 추천

- **최고 추천**: 삼성 오디세이 G5 27인치 — 165Hz 커브드 패널의 몰입감과 삼성 AS의 안정감
- **가성비 추천**: 삼성 오디세이 G5 27인치 — 20만원대에서 이 스펙이면 경쟁 제품 대비 우위
- **입문용 추천**: 삼성 오디세이 G5 27인치 — 게이밍 모니터 첫 구매자에게도 적합

## 자주 묻는 질문

**Q: 게이밍 모니터 주사율 144Hz와 165Hz 차이를 체감할 수 있나요?**
A: 일반적으로 144Hz와 165Hz의 차이는 체감하기 어렵습니다. 다만 240Hz와 비교하면 확실한 차이가 있습니다. 예산 내에서 높은 주사율을 선택하되, 144Hz 이상이면 충분합니다.

**Q: 커브드 모니터가 게임에 유리한가요?**
A: 27인치 이상에서 커브드 패널은 화면 양 끝까지 시야각이 균일해져 몰입감이 높아집니다. 다만 디자인 작업 등 직선 정확도가 중요한 용도에는 플랫 패널이 유리합니다.

**Q: VA 패널과 IPS 패널 중 게이밍에 뭐가 좋나요?**
A: VA는 명암비가 높아 어두운 장면이 많은 게임(호러, RPG)에 유리하고, IPS는 색재현력이 좋아 밝고 화려한 게임(MMO, 캐주얼)에 적합합니다. FPS는 두 패널 모두 괜찮지만 응답속도를 우선 확인하세요.',
    '2025년 27인치 게이밍 모니터 추천. 삼성 오디세이 등 주사율·패널·가격 비교.',
    'published', now(), now(), 1300, 5,
    '27인치 게이밍 모니터 추천',
    ARRAY['게이밍 모니터 가성비', '삼성 오디세이 G5 리뷰', '144Hz 모니터 추천'],
    '이테크',
    'IT/가전 전문 리뷰어. 모니터, PC 주변기기를 스펙 데이터 기반으로 분석합니다.',
    '[{"question":"게이밍 모니터 주사율 144Hz와 165Hz 차이를 체감할 수 있나요?","answer":"일반적으로 144Hz와 165Hz의 차이는 체감하기 어렵습니다. 다만 240Hz와 비교하면 확실한 차이가 있습니다. 예산 내에서 높은 주사율을 선택하되, 144Hz 이상이면 충분합니다."},{"question":"커브드 모니터가 게임에 유리한가요?","answer":"27인치 이상에서 커브드 패널은 화면 양 끝까지 시야각이 균일해져 몰입감이 높아집니다. 다만 디자인 작업 등 직선 정확도가 중요한 용도에는 플랫 패널이 유리합니다."},{"question":"VA 패널과 IPS 패널 중 게이밍에 뭐가 좋나요?","answer":"VA는 명암비가 높아 어두운 장면이 많은 게임(호러, RPG)에 유리하고, IPS는 색재현력이 좋아 밝고 화려한 게임(MMO, 캐주얼)에 적합합니다. FPS는 두 패널 모두 괜찮지만 응답속도를 우선 확인하세요."}]'::jsonb
  FROM cat_electronics
  RETURNING id
),

-- 6) 관계 데이터

-- post_products: 캠핑의자 포스트 ↔ 캠핑 제품
_pp1 AS (
  INSERT INTO post_products (post_id, product_id, display_order, context_note)
  SELECT post_camping_chair.id, prod_helinox.id, 1, '에디터 추천 초경량 캠핑의자'
  FROM post_camping_chair, prod_helinox
),
_pp2 AS (
  INSERT INTO post_products (post_id, product_id, display_order, context_note)
  SELECT post_camping_chair.id, prod_coleman.id, 2, '가성비 추천 오토캠핑 의자'
  FROM post_camping_chair, prod_coleman
),
-- post_products: 차량 공기청정기 포스트 ↔ 자동차 제품
_pp3 AS (
  INSERT INTO post_products (post_id, product_id, display_order, context_note)
  SELECT post_car_purifier.id, prod_xiaomi_purifier.id, 1, '가성비 추천 차량용 공기청정기'
  FROM post_car_purifier, prod_xiaomi_purifier
),
_pp4 AS (
  INSERT INTO post_products (post_id, product_id, display_order, context_note)
  SELECT post_car_purifier.id, prod_philips_purifier.id, 2, '프리미엄 추천 차량용 공기청정기'
  FROM post_car_purifier, prod_philips_purifier
),
-- post_products: 게이밍 모니터 포스트 ↔ 가전 제품
_pp5 AS (
  INSERT INTO post_products (post_id, product_id, display_order, context_note)
  SELECT post_gaming_monitor.id, prod_samsung_monitor.id, 1, '에디터 추천 가성비 게이밍 모니터'
  FROM post_gaming_monitor, prod_samsung_monitor
),

-- collection_products: 캠핑의자 컬렉션 ↔ 캠핑 제품
_cp1 AS (
  INSERT INTO collection_products (collection_id, product_id, rank, pick_label, mini_review)
  SELECT col_camping_chair.id, prod_helinox.id, 1, '최고 추천',
    '960g 초경량에 145kg 하중 지지. 백패킹부터 오토캠핑까지 만능으로 활약하는 캠핑의자의 정석입니다.'
  FROM col_camping_chair, prod_helinox
),
_cp2 AS (
  INSERT INTO collection_products (collection_id, product_id, rank, pick_label, mini_review)
  SELECT col_camping_chair.id, prod_coleman.id, 2, '가성비 1위',
    '3만원대에 넓은 좌석, 팔걸이, 컵홀더까지. 오토캠핑 입문자에게 최적의 선택입니다.'
  FROM col_camping_chair, prod_coleman
),
-- collection_products: 차량 공기청정기 컬렉션 ↔ 자동차 제품
_cp3 AS (
  INSERT INTO collection_products (collection_id, product_id, rank, pick_label, mini_review)
  SELECT col_car_purifier.id, prod_xiaomi_purifier.id, 1, '가성비 최고',
    '5만원대에 HEPA H13 필터를 갖춘 실속 제품. 컵홀더에 딱 맞는 사이즈로 설치도 간편합니다.'
  FROM col_car_purifier, prod_xiaomi_purifier
),
_cp4 AS (
  INSERT INTO collection_products (collection_id, product_id, rank, pick_label, mini_review)
  SELECT col_car_purifier.id, prod_philips_purifier.id, 2, '프리미엄 추천',
    'HEPA + 활성탄 듀얼필터에 35dB 저소음. 가격은 높지만 성능과 신뢰성에서 확실한 차이를 보여줍니다.'
  FROM col_car_purifier, prod_philips_purifier
),

-- hub_links: 캠핑 허브 → 캠핑의자 컬렉션 + 캠핑의자 포스트
_hl1 AS (
  INSERT INTO hub_links (hub_id, target_type, target_id, display_order, label)
  SELECT hub_camping.id, 'collection', col_camping_chair.id, 1, '2025 캠핑의자 TOP 5'
  FROM hub_camping, col_camping_chair
),
_hl2 AS (
  INSERT INTO hub_links (hub_id, target_type, target_id, display_order, label)
  SELECT hub_camping.id, 'post', post_camping_chair.id, 2, '경량 캠핑의자 추천'
  FROM hub_camping, post_camping_chair
),
-- hub_links: 차량 허브 → 차량 공기청정기 컬렉션 + 차량 공기청정기 포스트
_hl3 AS (
  INSERT INTO hub_links (hub_id, target_type, target_id, display_order, label)
  SELECT hub_car.id, 'collection', col_car_purifier.id, 1, '차량용 공기청정기 추천'
  FROM hub_car, col_car_purifier
),
_hl4 AS (
  INSERT INTO hub_links (hub_id, target_type, target_id, display_order, label)
  SELECT hub_car.id, 'post', post_car_purifier.id, 2, '2025 차량용 공기청정기 비교'
  FROM hub_car, post_car_purifier
)

-- Final SELECT to complete the WITH chain
SELECT 'Seed data inserted successfully' AS result;
