# Cambodia Production-Grade Marketplace Seed Data Specification

## 1. Overview & Seed Philosophy

This document defines the authoritative, production-like synthetic dataset for the **E-Commerce Multi-Vendor Marketplace** tailored to the **Kingdom of Cambodia (ព្រះរាជាណាចក្រកម្ពុជា)**.

### Core Objectives
1. **Realistic Context**: Replace arbitrary placeholder values (`user-1`, `test@test.com`, `Item 1`) with authentic Khmer and English names, real administrative divisions (Khan, Sangkat, Krong), authentic merchant profiles, local payment rails (Bakong KHQR, ABA, ACLEDA, Wing), and genuine local domestic logistics.
2. **Synthetic Safety**: All phone numbers, emails, addresses, and payment tokens are synthetically generated to strictly avoid personally identifiable information (PII) leaks.
3. **Cross-Service Relational Consistency**: The dataset defines cohesive relational chains:
   $$\text{User} \longrightarrow \text{Seller} \longrightarrow \text{Catalog Product} \longrightarrow \text{Seller Listing} \longrightarrow \text{Pricing} \longrightarrow \text{Inventory} \longrightarrow \text{Order} \longrightarrow \text{Payment} \longrightarrow \text{Shipment} \longrightarrow \text{Review}$$
4. **Dual-Currency Standard**:
   - Primary Settlement: **USD ($)**
   - Display & Local Settlement: **KHR (៛ - Khmer Riel)**
   - Official Fixed Benchmark: $1\text{ USD} = 4,100\text{ KHR}$

---

## 2. Cambodia Administrative Divisions & Geographic Seeds

### Primary Hubs & Zones

| Zone Code | Province / Municipality | Key Districts (Khan / Krong) | Postal Code | Shipping Classification |
| :--- | :--- | :--- | :--- | :--- |
| **KH-PP** | **Phnom Penh (រាជធានីភ្នំពេញ)** | Sen Sok, Chamkarmon, Tuol Kouk, Daun Penh, Boeng Keng Kang, Chbar Ampov, Russei Keo, Chroy Changvar | `12000` | Intra-City Express (Same-Day / 1–2 Days) |
| **KH-KD** | **Kandal (ខេត្តកណ្តាល)** | Ta Khmau, Kien Svay, Angk Snuol | `14000` | Greater Metro (1–2 Days) |
| **KH-SR** | **Siem Reap (ខេត្តសៀមរាប)** | Krong Siem Reap, Svay Dangkum, Sala Kamreuk, Kouk Chak | `17000` | Provincial Priority (2–3 Days) |
| **KH-BB** | **Battambang (ខេត្តបាត់ដំបង)** | Krong Battambang, Svay Pao, Ratanak | `02000` | Provincial Priority (2–3 Days) |
| **KH-SH** | **Preah Sihanouk (ខេត្តព្រះសីហនុ)**| Krong Preah Sihanouk, Mittapheap | `18000` | Coastal Priority (2–3 Days) |
| **KH-KP** | **Kampot (ខេត្តកំពត)** | Krong Kampot, Kampong Bay, Tuek Chhou | `07000` | Provincial Standard (2–4 Days) |
| **KH-KC** | **Kampong Cham (ខេត្តកំពង់ចាម)** | Krong Kampong Cham, Veal Vong | `03000` | Provincial Standard (2–4 Days) |

---

## 3. Actor Personas & Synthetic Identity Seeds

### 3.1 Customer Personas

| User ID | Full Name (EN / KH) | Email | Phone Number | City / Sangkat | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `usr-c001` | **Sok Dara (សុខ ដារ៉ា)** | `sok.dara@synth-mail.kh` | `+855 12 884 102` | Phnom Penh (Sen Sok) | `CUSTOMER` |
| `usr-c002` | **Chea Bopha (ជា បុប្ផា)** | `chea.bopha@synth-mail.kh` | `+855 10 392 781` | Phnom Penh (BKK1) | `CUSTOMER` |
| `usr-c003` | **Chan Vanna (ចាន់ វណ្ណា)** | `chan.vanna@synth-mail.kh` | `+855 77 651 902` | Siem Reap (Svay Dangkum) | `CUSTOMER` |
| `usr-c004` | **Keo Pich (កែវ ពេជ្រ)** | `keo.pich@synth-mail.kh` | `+855 16 710 439` | Battambang (Ratanak) | `CUSTOMER` |
| `usr-c005` | **Heng Sovann (ហេង សុវណ្ណ)**| `heng.sovann@synth-mail.kh`| `+855 98 420 563` | Sihanoukville (Mittapheap)| `CUSTOMER` |

### 3.2 Merchant (Seller) Personas

| User ID | Store ID | Store Name | Owner Name | Phone Number | Business Category | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `usr-s101` | `str-101` | **Phnom Penh Computer Hub** | Bunly Rithy (ប៊ុនលី រិទ្ធី) | `+855 12 901 234` | Electronics & Computers | `VERIFIED` |
| `usr-s102` | `str-102` | **Angkor Silk & Handicrafts** | Meng Sreymom (ម៉េង ស្រីមុំ) | `+855 10 782 119` | Traditional Apparel & Crafts | `VERIFIED` |
| `usr-s103` | `str-103` | **Battambang Agrico Organics**| Ly Rathana (លី រតនា) | `+855 77 443 892` | Food, Rice & Local Spices | `VERIFIED` |
| `usr-s104` | `str-104` | **Mondulkiri Coffee Roasters**| Ouk Chanthy (អ៊ុក ចាន់ធី) | `+855 15 621 804` | Specialty Coffee & Beverages | `VERIFIED` |
| `usr-s105` | `str-105` | **Sovann Mobile Tech** | Tep Samnang (ទេព សំណាង) | `+855 93 519 320` | Mobile Phones & Gadgets | `VERIFIED` |

### 3.3 Platform Administrator Personas

| User ID | Admin ID | Name | Email | Administrative Role | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `usr-a001` | `adm-001` | **Chhay Boran (ឆាយ បុរាណ)** | `admin.boran@marketplace.kh` | `SUPER_ADMIN` | `ACTIVE` |
| `usr-a002` | `adm-002` | **Kim Socheat (គឹម សុជាតិ)** | `catalog.socheat@marketplace.kh` | `CATALOG_ADMIN` | `ACTIVE` |
| `usr-a003` | `adm-003` | **Nhean Malis (ញាន ម៉ាលីស)** | `finance.malis@marketplace.kh` | `FINANCE_ADMIN` | `ACTIVE` |
| `usr-a004` | `adm-004` | **Pov Sarath (ពៅ សារ៉ាត់)** | `ops.sarath@marketplace.kh` | `ORDER_ADMIN` | `ACTIVE` |

---

## 4. Customer Addresses Dataset

```json
[
  {
    "addressId": "addr-pp-01",
    "userId": "usr-c001",
    "recipientName": "Sok Dara",
    "phoneNumber": "+855 12 884 102",
    "street": "#42, Street 1986",
    "sangkat": "Phnom Penh Thmey",
    "khan": "Sen Sok",
    "city": "Phnom Penh",
    "postalCode": "120801",
    "isDefault": true,
    "label": "Home"
  },
  {
    "addressId": "addr-pp-02",
    "userId": "usr-c002",
    "recipientName": "Chea Bopha",
    "phoneNumber": "+855 10 392 781",
    "street": "Villa 15, Street 288",
    "sangkat": "Boeng Keng Kang I",
    "khan": "Boeng Keng Kang",
    "city": "Phnom Penh",
    "postalCode": "120102",
    "isDefault": true,
    "label": "Office"
  },
  {
    "addressId": "addr-sr-01",
    "userId": "usr-c003",
    "recipientName": "Chan Vanna",
    "phoneNumber": "+855 77 651 902",
    "street": "#108, Charles de Gaulle Blvd",
    "sangkat": "Svay Dangkum",
    "khan": "Krong Siem Reap",
    "city": "Siem Reap",
    "postalCode": "17252",
    "isDefault": true,
    "label": "Storefront"
  }
]
```

---

## 5. Catalog Taxonomy & Product Definitions

### 5.1 Category Hierarchy

```text
CATEGORIES
├── Electronics & Computers (cat-elec)
│   ├── Laptops & Notebooks (cat-elec-laptop)
│   ├── Smartphones & Tablets (cat-elec-phone)
│   └── Computer Accessories (cat-elec-acc)
│
├── Khmer Heritage & Apparel (cat-apparel)
│   ├── Golden Silk Garments (cat-apparel-silk)
│   ├── Traditional Krama Scarves (cat-apparel-krama)
│   └── Modern Cambodian Fashion (cat-apparel-casual)
│
├── Cambodian Agro-Produce & Groceries (cat-grocery)
│   ├── Battambang Phka Rumduol Rice (cat-grocery-rice)
│   ├── Kampot Pepper (PGI Certified) (cat-grocery-pepper)
│   ├── Mondulkiri Highlands Coffee (cat-grocery-coffee)
│   └── Kampong Speu Palm Sugar (cat-grocery-sugar)
│
└── Home & Living (cat-home)
    ├── Rattan & Bamboo Handicrafts (cat-home-craft)
    └── Ceramic & Stoneware (cat-home-stone)
```

---

### 5.2 Core Catalog Products (Owned by Catalog Service)

```json
[
  {
    "productId": "prd-mbp-m3",
    "title": "Apple MacBook Pro 14\" (Apple M3 Pro, 18GB RAM, 512GB SSD) - Space Black",
    "brand": "Apple",
    "categoryId": "cat-elec-laptop",
    "description": "High-performance laptop featuring Apple M3 Pro chip, Liquid Retina XDR display, up to 18 hours battery life. Official 1-year Cambodia distributor warranty included.",
    "attributes": {
      "processor": "M3 Pro (11-core CPU, 14-core GPU)",
      "memory": "18GB Unified",
      "storage": "512GB SSD",
      "keyboard": "US English"
    },
    "images": [
      "https://cdn.example.kh/products/macbook-pro-14-m3-front.webp",
      "https://cdn.example.kh/products/macbook-pro-14-m3-keyboard.webp"
    ],
    "isActive": true
  },
  {
    "productId": "prd-ip15-pro",
    "title": "Apple iPhone 15 Pro 256GB - Natural Titanium (Nano-SIM + eSIM)",
    "brand": "Apple",
    "categoryId": "cat-elec-phone",
    "description": "A17 Pro chip with 6-core GPU, titanium design with textured matte glass back, Action button, USB-C connector with USB 3 speeds. Cambodia TRC certified.",
    "attributes": {
      "display": "6.1\" Super Retina XDR ProMotion",
      "capacity": "256GB",
      "color": "Natural Titanium",
      "sim": "Dual (Nano-SIM + eSIM)"
    },
    "images": [
      "https://cdn.example.kh/products/iphone-15-pro-titanium.webp"
    ],
    "isActive": true
  },
  {
    "productId": "prd-btb-rice",
    "title": "Battambang Premium Organic Phka Rumduol Jasmine Rice (5kg Bag)",
    "brand": "Angkor Harvest",
    "categoryId": "cat-grocery-rice",
    "description": "World-award-winning premium fragrant long-grain rice cultivated organically in Battambang province. Naturally soft, sweet-scented, and nutrient rich.",
    "attributes": {
      "weight": "5 kg",
      "harvestYear": "2026",
      "origin": "Thma Koul, Battambang",
      "organicCertified": "Cambodia Organic Agriculture Standard (COAS)"
    },
    "images": [
      "https://cdn.example.kh/products/battambang-jasmine-rice-5kg.webp"
    ],
    "isActive": true
  },
  {
    "productId": "prd-kpt-pepper",
    "title": "Kampot PGI Organic Whole Black Pepper (100g Vacuum Glass Jar)",
    "brand": "Kampot Origin",
    "categoryId": "cat-grocery-pepper",
    "description": "Geographical Indication (PGI) certified whole black peppercorns from Kampot foothills. Renowned internationally for intense aroma, subtle citrus floral notes, and lingering warmth.",
    "attributes": {
      "weight": "100 g",
      "grade": "Grade A Hand-picked",
      "origin": "Tuek Chhou, Kampot Province",
      "pgiCode": "PGI-KH-001"
    },
    "images": [
      "https://cdn.example.kh/products/kampot-black-pepper-jar.webp"
    ],
    "isActive": true
  },
  {
    "productId": "prd-mdk-coffee",
    "title": "Mondulkiri Highlands Peaberry Arabica Coffee Beans (250g Whole Bean)",
    "brand": "Mondulkiri Roasters",
    "categoryId": "cat-grocery-coffee",
    "description": "100% shade-grown mountain Arabica peaberry beans harvested at 800m altitude in Sen Monorom, Mondulkiri. Medium-dark roast with chocolate, hazelnut, and caramel finish.",
    "attributes": {
      "altitude": "800m Above Sea Level",
      "roastProfile": "Medium Dark",
      "process": "Washed & Sun-dried",
      "weight": "250 g"
    },
    "images": [
      "https://cdn.example.kh/products/mondulkiri-peaberry-coffee.webp"
    ],
    "isActive": true
  },
  {
    "productId": "prd-silk-sampot",
    "title": "Handwoven Siem Reap Golden Silk Hol Sampot (Fabric Length 3.5m)",
    "brand": "Sovann Silk",
    "categoryId": "cat-apparel-silk",
    "description": "Traditional Cambodian royal pattern handwoven using natural raw yellow golden silk threads dyed with natural plant extracts in Banteay Srei, Siem Reap.",
    "attributes": {
      "material": "100% Pure Cambodian Golden Silk",
      "technique": "Ikat (Chong Kiet) Handloom",
      "length": "3.5 meters",
      "width": "1.0 meter"
    },
    "images": [
      "https://cdn.example.kh/products/siem-reap-golden-silk-hol.webp"
    ],
    "isActive": true
  }
]
```

---

## 6. Multi-Vendor Listings, Pricing & Inventory

In an Amazon-like marketplace, multiple sellers can create listings for the **same catalog product** with distinct prices, warranties, and stock levels.

```text
Catalog Product: Apple MacBook Pro 14" (prd-mbp-m3)
       │
       ├── Listing 1: Phnom Penh Computer Hub (str-101)  ──> $1,999.00  ──> Stock: 15 (Sen Sok Warehouse)
       └── Listing 2: Sovann Mobile Tech      (str-105)  ──> $1,979.00  ──> Stock: 6  (Tuol Kouk Storefront)
```

### 6.1 Multi-Vendor Listings Matrix

| Listing ID | Product ID | Seller ID | Store Name | Price (USD) | Price (KHR) | Available Stock | Warehouse Location |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `lst-mbp-101` | `prd-mbp-m3` | `str-101` | Phnom Penh Computer Hub | **$1,999.00** | 8,195,900 ៛ | **15** | Phnom Penh Central (Sen Sok) |
| `lst-mbp-105` | `prd-mbp-m3` | `str-105` | Sovann Mobile Tech | **$1,979.00** | 8,113,900 ៛ | **6** | Phnom Penh North (Tuol Kouk) |
| `lst-ip15-105` | `prd-ip15-pro` | `str-105` | Sovann Mobile Tech | **$1,089.00** | 4,464,900 ៛ | **28** | Phnom Penh North (Tuol Kouk) |
| `lst-rice-103` | `prd-btb-rice` | `str-103` | Battambang Agrico Organics | **$9.50** | 38,950 ៛ | **350** | Battambang Hub (Svay Pao) |
| `lst-pep-103` | `prd-kpt-pepper` | `str-103` | Battambang Agrico Organics | **$6.25** | 25,625 ៛ | **200** | Battambang Hub (Svay Pao) |
| `lst-cof-104` | `prd-mdk-coffee` | `str-104` | Mondulkiri Coffee Roasters| **$7.50** | 30,750 ៛ | **120** | Phnom Penh South (Meanchey) |
| `lst-slk-102` | `prd-silk-sampot`| `str-102` | Angkor Silk & Handicrafts | **$120.00** | 492,000 ៛ | **18** | Siem Reap Artisan Hub |

---

## 7. Warehouses & Inventory Allocation

### Warehouses Dataset

| Warehouse ID | Name | Province | District | Capacity (sqm) | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wh-pp-main` | **Phnom Penh Central Distribution Center** | Phnom Penh | Khan Sen Sok | 8,500 | Primary Fulfillment |
| `wh-pp-south` | **Phnom Penh South Hub** | Phnom Penh | Khan Meanchey | 4,000 | Secondary Fulfillment |
| `wh-sr-hub` | **Siem Reap Regional Logistics Hub** | Siem Reap | Krong Siem Reap | 2,500 | Regional Cross-Dock |
| `wh-bb-hub` | **Battambang Agro Logistics Hub** | Battambang | Krong Battambang | 3,000 | Agri-Produce Warehouse |

### Inventory Reservation Model (Owned by Inventory Service)

```text
Available Stock = Total Quantity - Reserved Quantity
```

* **Listing `lst-mbp-101`**:
  - Warehouse: `wh-pp-main`
  - Total Stock: `15`
  - Reserved Stock: `2` (held in active checkout Sagas)
  - Available for Sale: `13`

---

## 8. Domestic Shipping & Carrier Matrix (Owned by Shipping Service)

### 8.1 Partner Carrier Integrations

| Carrier Code | Carrier Name | Coverage | Tracking Number Pattern | Average SLA |
| :--- | :--- | :--- | :--- | :--- |
| **VET** | **Virak Buntham Express (VET Logistics)** | Nationwide (25 Provinces) | `KH-VET-########` | 1–2 Days PP / 2–3 Days Provinces |
| **JNT** | **J&T Express Cambodia** | Nationwide Urban / Metro | `KH-JNT-########` | 1–2 Days PP / 2–4 Days Provinces |
| **FLS** | **Flash Express Cambodia** | Major Cities & Towns | `KH-FLS-########` | 1–2 Days Metro / 2–3 Days Provinces |
| **GOG** | **GoGoX Cambodia Delivery** | Intra-Phnom Penh Only | `KH-GOG-########` | Same-Day / 3-Hour Express |

### 8.2 Regional Shipping Rate Engine

```json
[
  {
    "routeId": "rate-pp-intra",
    "originZone": "KH-PP",
    "destinationZone": "KH-PP",
    "carrierCode": "JNT",
    "serviceLevel": "STANDARD",
    "flatRateUSD": 1.50,
    "freeShippingThresholdUSD": 25.00,
    "estimatedDaysMin": 1,
    "estimatedDaysMax": 2
  },
  {
    "routeId": "rate-pp-express",
    "originZone": "KH-PP",
    "destinationZone": "KH-PP",
    "carrierCode": "GOG",
    "serviceLevel": "EXPRESS_SAME_DAY",
    "flatRateUSD": 3.00,
    "freeShippingThresholdUSD": 100.00,
    "estimatedDaysMin": 0,
    "estimatedDaysMax": 1
  },
  {
    "routeId": "rate-pp-to-provinces",
    "originZone": "KH-PP",
    "destinationZone": "KH-SR",
    "carrierCode": "VET",
    "serviceLevel": "PROVINCIAL_STANDARD",
    "flatRateUSD": 2.50,
    "freeShippingThresholdUSD": 50.00,
    "estimatedDaysMin": 2,
    "estimatedDaysMax": 3
  }
]
```

---

## 9. Cambodia Payment Rails & Tax Configuration

### 9.1 Supported Payment Providers

```text
                      CHECKOUT PAYMENT
                             │
     ┌───────────────┬───────┴───────┬───────────────┐
     ▼               ▼               ▼               ▼
Bakong KHQR     ABA PAYWAY      Wing Bank       Cash on Delivery
 (National)     (Mobile App)    (Mobile App)         (COD)
```

1. **Bakong KHQR (`KHQR`)**:
   - Universal National QR standard created by the National Bank of Cambodia (NBC).
   - Generates standardized EMVCo payload with dynamic transaction amount in USD or KHR.
   - Immediate asynchronous webhook verification via Bakong OpenAPI gateway.
2. **ABA PAYWAY (`ABA_PAY`)**:
   - Seamless deep-linking directly to ABA Mobile app with instant tokenized push confirmation.
3. **WingPay / Wing Bank (`WING_PAY`)**:
   - Broad retail reach across urban and rural customer bases.
4. **Cash on Delivery (`COD`)**:
   - Supported for domestic orders below $100 across Phnom Penh, Siem Reap, and Battambang.

### 9.2 Cambodian Taxation Rules (Owned by Pricing Service)
* **General Department of Taxation (GDT) VAT**: Standard **10% Value Added Tax (VAT)** applied to electronics, lifestyle, and consumer goods.
* **Agricultural Exemption**: Unprocessed domestic agricultural produce (raw Battambang rice) qualifies for **0% VAT**.

---

## 10. Cambodian Festivals & Seasonal Promotions

```json
[
  {
    "promotionId": "promo-kny-2026",
    "campaignName": "Khmer New Year Mega Celebration (បុណ្យចូលឆ្នាំថ្មី)",
    "couponCode": "KNY2026",
    "discountType": "PERCENTAGE",
    "discountValue": 15.0,
    "minOrderValueUSD": 30.0,
    "maxDiscountUSD": 50.0,
    "startDate": "2026-04-01T00:00:00Z",
    "endDate": "2026-04-20T23:59:59Z",
    "status": "SCHEDULED"
  },
  {
    "promotionId": "promo-pchum-ben",
    "campaignName": "Pchum Ben Ancestor Festival Voucher (បុណ្យភ្ជុំបិណ្ឌ)",
    "couponCode": "PCHUMBEN",
    "discountType": "FIXED_AMOUNT",
    "discountValue": 10.0,
    "minOrderValueUSD": 50.0,
    "maxDiscountUSD": 10.0,
    "startDate": "2026-09-15T00:00:00Z",
    "endDate": "2026-10-05T23:59:59Z",
    "status": "ACTIVE"
  },
  {
    "promotionId": "promo-water-fest",
    "campaignName": "Water Festival Royal Regatta Sale (បុណ្យអុំទូក)",
    "couponCode": "WATERFEST",
    "discountType": "FREE_SHIPPING",
    "discountValue": 0.0,
    "minOrderValueUSD": 20.0,
    "maxDiscountUSD": 5.0,
    "startDate": "2026-11-15T00:00:00Z",
    "endDate": "2026-11-25T23:59:59Z",
    "status": "SCHEDULED"
  }
]
```

---

## 11. Customer Reviews & Ratings Dataset

Genuine bilingual reviews showcasing mixed English and Khmer script from verified purchases:

```json
[
  {
    "reviewId": "rev-001",
    "productId": "prd-mbp-m3",
    "userId": "usr-c001",
    "authorName": "Sok Dara",
    "rating": 5,
    "title": "Best laptop for software development in Phnom Penh",
    "comment": "ទិញពីហាង Phnom Penh Computer Hub ដឹកជញ្ជូនលឿនណាស់ ត្រឹមតែ១ថ្ងៃបានដល់ផ្ទះនៅសែនសុខ។ ម៉ាស៊ីនដើរលឿន ថ្មកាន់បានយូរខ្លាំងណាស់។ Excellent official Apple warranty and fast delivery via J&T!",
    "verifiedPurchase": true,
    "helpfulVotes": 14,
    "createdAt": "2026-09-10T08:30:00Z"
  },
  {
    "reviewId": "rev-002",
    "productId": "prd-btb-rice",
    "userId": "usr-c002",
    "authorName": "Chea Bopha",
    "rating": 5,
    "title": "អង្ករផ្ការំដួលពិតជាក្រអូបឆ្ងាញ់",
    "comment": "បាយទន់ ក្រអូបឈ្ងុយ គុណភាពល្អឥតខ្ចោះ។ គ្រួសារខ្ញុំចូលចិត្តខ្លាំងណាស់។ Authentic Battambang rice, nicely vacuum-packed.",
    "verifiedPurchase": true,
    "helpfulVotes": 8,
    "createdAt": "2026-09-11T12:15:00Z"
  },
  {
    "reviewId": "rev-003",
    "productId": "prd-kpt-pepper",
    "userId": "usr-c003",
    "authorName": "Chan Vanna",
    "rating": 5,
    "title": "World standard Kampot pepper",
    "comment": "ម្រេចកំពតពិតប្រាកដ ក្លិនឈ្ងុយខ្លាំង រសជាតិហឹរស្រទន់។ Great glass bottle packaging with authentic PGI QR verification seal.",
    "verifiedPurchase": true,
    "helpfulVotes": 5,
    "createdAt": "2026-09-12T16:45:00Z"
  }
]
```

---

## 12. Complete End-to-End Synthetic Order Saga Seed

### Order Scenario: Sok Dara (`usr-c001`) buys a MacBook Pro

```text
Customer: Sok Dara (usr-c001)
Delivery Address: #42, St 1986, Phnom Penh Thmey, Sen Sok (addr-pp-01)
Store: Phnom Penh Computer Hub (str-101)
Product: Apple MacBook Pro 14" M3 Pro (prd-mbp-m3 / lst-mbp-101)
```

### Relational Chain Trace

1. **Order Record (`order_db.orders`)**:
   - `orderId`: `ord-kh-90214`
   - `userId`: `usr-c001`
   - `status`: `DELIVERED`
   - `currency`: `USD`
   - `subtotal`: `$1,999.00`
   - `discountAmount`: `$10.00` (Applied coupon: `PCHUMBEN`)
   - `taxAmount`: `$198.90` (10% GDT VAT)
   - `shippingAmount`: `$0.00` (Free shipping promotion applied)
   - `totalAmount`: **`$2,187.90`** (Equivalent: **`8,970,390 ៛`**)

2. **Immutable Address Snapshot (`order_db.order_addresses`)**:
   - `recipient`: `Sok Dara`
   - `phone`: `+855 12 884 102`
   - `street`: `#42, Street 1986`
   - `sangkat`: `Phnom Penh Thmey`
   - `khan`: `Sen Sok`
   - `city`: `Phnom Penh`

3. **Inventory Reservation (`inventory_db.reservations`)**:
   - `reservationId`: `res-77210`
   - `orderId`: `ord-kh-90214`
   - `listingId`: `lst-mbp-101`
   - `quantity`: `1`
   - `status`: `CONFIRMED`
   - `warehouseId`: `wh-pp-main`

4. **Payment Transaction (`payment_db.payments`)**:
   - `paymentId`: `pay-kh-55102`
   - `orderId`: `ord-kh-90214`
   - `provider`: `KHQR_BAKONG`
   - `amount`: `$2,187.90`
   - `currency`: `USD`
   - `status`: `CAPTURED`
   - `transactionReference`: `BAKONG-TXN-20260914-884192`

5. **Shipment Dispatch (`shipping_db.shipments`)**:
   - `shipmentId`: `shp-kh-33019`
   - `orderId`: `ord-kh-90214`
   - `carrier`: `VET_LOGISTICS`
   - `trackingNumber`: `KH-VET-88391204`
   - `status`: `DELIVERED`
   - `timeline`:
     - `2026-09-12 09:00`: Picked up at Phnom Penh Central Warehouse (Sen Sok)
     - `2026-09-12 14:30`: In Transit (Sorting Hub Chamkarmon)
     - `2026-09-13 10:15`: Out for Delivery (Driver: Vibol +855 89 220 192)
     - `2026-09-13 11:40`: Successfully Delivered & Signed by Sok Dara

---

## 13. Database Seeding Execution Architecture

Developers can load this complete Cambodian dataset into local microservice databases using standard database migrations or SQL seed scripts:

```bash
# Seed Auth & User databases
docker exec -i ecommerce-postgres psql -U postgres -d auth_db < seeds/01_auth_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d user_db < seeds/02_users_cambodia.sql

# Seed Catalog, Pricing & Inventory
docker exec -i ecommerce-postgres psql -U postgres -d catalog_db < seeds/03_catalog_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d pricing_db < seeds/04_pricing_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d inventory_db < seeds/05_inventory_cambodia.sql

# Seed Seller Marketplace, Orders, Payments, Shipping, Reviews
docker exec -i ecommerce-postgres psql -U postgres -d seller_marketplace_db < seeds/06_sellers_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d order_db < seeds/07_orders_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d payment_db < seeds/08_payments_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d shipping_db < seeds/09_shipping_cambodia.sql
docker exec -i ecommerce-postgres psql -U postgres -d review_db < seeds/10_reviews_cambodia.sql
```

This ensures the local environment functions like a real, enterprise Cambodian e-commerce marketplace from day one.
