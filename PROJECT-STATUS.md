# Trendy Store — Management System

> Built: 2026-03-22
> Status: Fully functional, all features implemented

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + Custom CSS (Mawj ERP design system) |
| Font | IBM Plex Sans Arabic |
| Database | SQLite via Prisma ORM 6.19 |
| Auth | JWT (httpOnly cookies) + bcryptjs |
| State | Zustand (persisted) |
| Icons | Lucide React |

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Worker | `worker` | `worker123` |

---

## Design System

Exact replica of the **Mawj ERP** design language:

- **Color system**: oklch tokens — "SaaS Trust Blue + Midnight Cinema"
- **Themes**: Light / Dark (toggle in top bar)
- **Glassmorphism**: Sidebar & navbar use `backdrop-filter: blur(20-24px)`
- **Border radius**: `rounded-xl` (12px) components, `rounded-2xl` (16px) dialogs
- **Card shadows**: Blue-tinted `surface-shadow` with glow on hover
- **Typography**: IBM Plex Sans Arabic, `-0.01em` letter-spacing
- **Animations**: 150ms transitions, 20ms stagger, fadeInUp/fadeInScale
- **RTL-first**: Arabic language, right-to-left layout throughout

---

## Project Structure

```
Trendy store/
├── prisma/
│   ├── schema.prisma          # 5 models: User, Customer, Order, Batch, Settings
│   ├── seed.ts                # Default admin/worker + settings
│   ├── dev.db                 # SQLite database
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root: RTL, Arabic, ThemeProvider, AuthGuard
│   │   ├── globals.css        # Full Mawj design tokens + animations
│   │   ├── login/page.tsx     # Login page (Arabic)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # AppShell wrapper
│   │   │   ├── page.tsx       # Dashboard (stats, open batch, recent orders)
│   │   │   ├── orders/page.tsx    # Orders CRUD + multi-product + color/size pickers
│   │   │   ├── batches/page.tsx   # Batches CRUD + profit calculations
│   │   │   ├── customers/page.tsx # Mini-CRM (admin only) + VIP flagging
│   │   │   ├── finance/page.tsx   # Financial overview (admin only)
│   │   │   └── settings/page.tsx  # Store settings + exchange rates (admin only)
│   │   └── api/
│   │       ├── auth/login/        # POST — JWT login
│   │       ├── auth/logout/       # POST — clear cookie
│   │       ├── auth/me/           # GET — current session
│   │       ├── orders/            # GET (list+filter), POST (create)
│   │       ├── orders/[id]/       # GET, PUT, DELETE
│   │       ├── batches/           # GET, POST
│   │       ├── batches/[id]/      # GET, PUT, DELETE
│   │       ├── customers/         # GET, POST (admin only)
│   │       ├── customers/[id]/    # GET, PUT, DELETE (admin only)
│   │       ├── settings/          # GET, PUT (admin only)
│   │       ├── settings/backup/   # GET — download SQLite file
│   │       ├── dashboard/         # GET — aggregated stats
│   │       ├── scrape/            # POST — fetch product from URL
│   │       └── translate/         # POST — Google Translate TR→AR
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx      # Flex layout (sidebar + content)
│   │   │   ├── sidebar.tsx        # Glass sidebar on RIGHT (RTL)
│   │   │   ├── top-bar.tsx        # Glass navbar + dark mode toggle
│   │   │   └── mobile-nav.tsx     # Bottom nav for mobile
│   │   ├── ui/
│   │   │   ├── button.tsx         # CVA variants (Mawj tokens)
│   │   │   ├── input.tsx          # Styled input
│   │   │   ├── select.tsx         # Native select with RTL chevron
│   │   │   ├── badge.tsx          # Transparent color badges
│   │   │   ├── card.tsx           # card-glow shadow
│   │   │   ├── dialog.tsx         # Portal-based, animated, scrollable
│   │   │   ├── table.tsx          # Minimal borders
│   │   │   ├── textarea.tsx       # Styled textarea
│   │   │   ├── label.tsx          # Form label
│   │   │   └── tabs.tsx           # State-driven tabs
│   │   ├── theme-provider.tsx     # Applies data-theme attribute
│   │   └── auth-guard.tsx         # Route protection + role check
│   ├── lib/
│   │   ├── db.ts                  # Prisma singleton
│   │   ├── auth.ts                # JWT sign/verify/getSession
│   │   └── utils.ts               # cn(), formatIQD(), formatTRY(), formatUSD()
│   ├── store/
│   │   ├── auth.ts                # Zustand: user, token, logout, isAdmin
│   │   └── theme.ts               # Zustand: light/dark toggle
│   └── middleware.ts              # Cookie-based route protection
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── PROJECT-STATUS.md              # This file
```

---

## Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| username | String | Unique |
| password | String | bcrypt hashed |
| role | String | "admin" or "worker" |
| name | String | Display name |

### Customer
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| instagram | String? | |
| phone | String? | |
| city | String? | Governorate |
| area | String? | |
| orders | Order[] | Relation |

### Order
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| customerId | String | FK → Customer |
| batchId | String? | FK → Batch |
| productType | String | Bag, Shoe, Clothing, Accessory, Other |
| productName | String? | |
| color | String? | |
| size | String? | |
| instagramLink | String? | |
| productLink | String? | Source URL |
| governorate | String? | |
| area | String? | |
| phone | String? | |
| purchaseCost | Float | TRY |
| sellingPrice | Float | IQD |
| deliveryCost | Float | IQD |
| deposit | Float | IQD |
| status | String | new, in_progress, bought, shipped, delivered, cancelled |
| paymentStatus | String | unpaid, partial, paid |
| notes | String? | |
| images | String? | JSON array of image URLs |
| items | String? | JSON array of additional product items |

### Batch
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| openDate | DateTime | |
| closeDate | DateTime? | |
| shippingCost | Float | USD |
| status | String | open, shipped, in_distribution, completed |
| orders | Order[] | Relation |

### Settings
| Field | Type | Notes |
|-------|------|-------|
| id | String | Always "default" |
| storeName | String | |
| logo | String? | URL |
| usdToTry | Float | Exchange rate |
| usdToIqd | Float | Exchange rate |
| tryToIqd | Float | Exchange rate |

---

## Features

### Authentication & Roles
- JWT-based login with httpOnly cookies (7-day expiry)
- **Admin**: Full access to all pages
- **Worker**: Orders + Batches only (no Customers, Finance, Settings)
- Middleware protects API routes and pages

### Dashboard (/)
- 4 stat cards: Total Orders, Pending, Revenue (IQD), Outstanding Debts
- Open batch widget with progress bar
- Recent orders table (last 10)
- Unpaid delivered orders with WhatsApp reminder links

### Orders (/orders)
- Filter tabs: All, New, In Progress, Bought, Shipped, Delivered, Unpaid
- Search by customer name/phone
- **Multi-product orders**: Add multiple products per order
- **Product link fetch**: Paste URL from Trendyol, HepsiBurada, N11, Koton, LC Waikiki, DeFacto, Boyner — auto-extracts name, price, images, colors, sizes
- **Color picker**: Visual swatches from fetched product variants
- **Size picker**: Clickable chip selectors
- **Translate button**: Turkish → Arabic translation (Google Translate)
- Auto-calculated final price (selling + delivery - deposit)
- WhatsApp pre-filled messages
- Print-friendly invoice generation
- Product images in table and invoice

### Batches (/batches)
- Create/edit batch shipments
- Track orders per batch
- Progress: bought vs total orders
- Estimated profit calculation using exchange rates:
  - Profit = Revenue - (Purchase costs × TRY→IQD) - (Shipping × USD→IQD)
- Status flow: Open → Shipped → In Distribution → Completed

### Customers (/customers) — Admin Only
- Mini-CRM with search
- Auto VIP flagging (3+ orders)
- Lifetime value (LTV) calculation
- Order history per customer
- Cannot delete customers with existing orders

### Finance (/finance) — Admin Only
- Total Revenue (paid orders)
- Estimated Costs (TRY → IQD conversion)
- Total Shipping (USD → IQD conversion)
- Net Profit
- Outstanding debts table with WhatsApp links

### Settings (/settings) — Admin Only
- Store name and logo
- Exchange rates: USD↔TRY, USD↔IQD, TRY↔IQD
- Database backup (download SQLite file)

### Product Scraper (/api/scrape)
Supports all major Turkish shopping sites:
- **Trendyol** — Full variant extraction (colors with images, sizes, brand, category)
- **HepsiBurada** — Product data, images, color/size variants
- **N11** — Price, images, colors, sizes
- **Koton, LC Waikiki, DeFacto, Boyner** — Images + product data
- **Any site** — Universal OG tags + JSON-LD extraction
- Auto-detects product type from Turkish keywords

### Translation (/api/translate)
- Google Translate free API
- Turkish → Arabic translation
- Per-product translate button in order form

---

## Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database (creates default users + settings)
npx tsx prisma/seed.ts

# Run Prisma Studio (database GUI)
npx prisma studio

# Create migration after schema changes
npx prisma migrate dev --name <name>

# Generate Prisma client
npx prisma generate
```

---

## Environment Variables

File: `.env`
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="trendy-store-secret-key-change-in-production"
```

---

## Known Notes

- The `middleware.ts` file convention shows a deprecation warning in Next.js 16 (still works)
- Prisma v6 shows upgrade available to v7 (not needed, v6 is stable)
- The dev server runs on `http://localhost:3000` by default
- SQLite database is stored at `prisma/dev.db`
- All text is in Arabic, RTL layout throughout
