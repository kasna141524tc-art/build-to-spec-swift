//PRD
CryptoFlow Journal PRD (Updated Final Draft)
1. Product Overview
1.1 Product Name
CryptoFlow Journal
1.2 Product Description
CryptoFlow Journal is a web-based React application for crypto traders and investors to manually log, manage, and analyze cryptocurrency trades (spot, futures) and investments (DeFi, dual investment, liquidity pool, liquidity mining). Powered by Supabase (database, auth, real-time), it features a Trader-Investor model where Traders manage portfolios and share read-only metrics with bound Investors (min. 3, max. 10 in free tier; premium unlocks higher limits). The app offers a simplistic, modern UI inspired by Phantom Wallet, with rounded corners, professional yet approachable graphics, and interactive snackbar notifications.
1.3 Goals and Objectives

Primary Goal: Deliver an intuitive platform for journaling crypto trades and investments with tailored forms, robust analytics, and secure Trader-Investor data sharing.
Secondary Goals:

Enable real-time portfolio transparency for Investors.
Track cash flows and performance metrics in USD or PHP.
Support distinct trade/investment categories with manual P&L for investments.
Plan for premium features (WIP: data exports, higher binding limits).


Success Metrics: 70% monthly active users, 50+ Trader-Investor pairs in 3 months, 4+ star user feedback.

2. Target Audience and User Roles
2.1 Target Audience

Crypto traders (day/swing) and investors (e.g., fund manager clients).
Ages 18-45, tech-savvy, familiar with crypto.
Users seeking a streamlined journaling tool over spreadsheets.

2.2 User Roles

Trader:

Log, edit, delete trades/investments; manage cash flows and analytics.
Generate UID to bind Investors (min. 3, max. 10 in free tier; premium unlocks more).
Approve/deny Investor binding requests.
Manage profile and preferences.


Investor:

Read-only access to bound Trader’s trades, investments, metrics, and analytics.
Permanent role selected at sign-up.
Enter Trader’s UID post-sign-up; binding requires Trader approval (pending status visible).
Manage own profile and preferences.



3. Key Features (MVP)
3.1 Authentication and Onboarding

Sign-Up/Login: Supabase Auth (email/password, Google OAuth).

Role selection (Trader/Investor) at sign-up; permanent.
Investors enter Trader UID post-sign-up; request sent to Trader.
Investors see “Pending Approval” snackbar notification.


Profile Setup: Username, optional bio, preferences (currency: USD or PHP, notifications).
Security: Supabase Row Level Security (RLS), 2FA support.

3.2 Trade and Investment Journaling

Manual Entry:

Trades:

Spot: Asset (e.g., BTC), price, quantity, trade date, fees, buy/sell, notes.
Futures: Asset, price, quantity, trade date, fees, buy/sell, leverage, margin, notes.


Investments (manual P&L input by Trader):

DeFi: Asset, initial investment, quantity, date, fees, P&L, platform, APY, notes.
Dual Investment: Asset, initial investment, quantity, date, fees, P&L, platform, strike price, notes.
Liquidity Pool: Asset (e.g., BTC-ETH), initial investment, quantity, date, fees, P&L, platform, pool share, notes.
Liquidity Mining: Asset, initial investment, quantity, date, fees, P&L, platform, rewards token, notes.




Management: Traders edit/delete entries; audit log in Supabase.
Portfolio View: Filterable list of trades/investments (by category, asset, date).

3.3 Analytics and Monitoring

Trader Dashboard:

Metrics:

Total portfolio value (USD or PHP).
Profit/loss (P&L, absolute and %; manual for investments, calculated for trades).
ROI per asset.
Cash flow summary (inflows/outflows).
Trade frequency (trades per week/month).
Average holding period per asset.


Visuals: Line chart (portfolio value over time), pie chart (asset allocation), bar chart (trade frequency).


Investor Dashboard:

Read-only view of bound Trader’s metrics and visuals.
No access to other Traders’ data.


Tech: Recharts for clean, performant charts.
Notifications: Phantom Wallet-style snackbars (e.g., “Trade Added”, “P&L Updated”).

3.4 Trader-Investor Binding

Binding Process:

Traders generate unique UID (Supabase-generated) to share manually.
Investors enter UID post-sign-up; request sent to Trader.
Traders approve/deny via dashboard or snackbar.
Min. 3, max. 10 Investors per Trader (free tier); premium unlocks higher limits.
Investors see “Pending Approval” snackbar until confirmed.
Binding permanent unless Trader revokes.


Real-Time Sync: Supabase Realtime for instant Investor updates.
Access Control: Supabase RLS ensures Investors see only their Trader’s data.

3.5 Account and Profile Management

Update profile: Username, bio, avatar.
Preferences: Currency (USD/PHP), theme (light/dark), notifications.
Security: 2FA toggle.

3.6 Monetization (WIP)

Premium Features for Traders (post-MVP):

Data exports (CSV/PDF).
Higher Investor binding limits (>10).
Advanced analytics (TBD, e.g., risk metrics, portfolio comparisons).


Subscription model TBD; Investors remain free-tier.

3.7 Non-Functional Requirements

Performance: Page loads <2s; support 1,000 trades/investments per user.
Security: Supabase RLS, encryption, secure auth.
Scalability: Supabase for DB scaling; React on Vercel.
Accessibility: WCAG 2.1 basics (contrast, keyboard nav).
Tech Stack:

Frontend: React (hooks, context), React Router, Tailwind CSS.
Backend: Supabase (PostgreSQL, Auth, Realtime).
Charts: Recharts.
Deployment: Vercel.



4. Design System (Phantom Wallet-Inspired)
4.1 Design Principles

Simplistic and Modern: Clean layouts, intuitive navigation.
Rounded Aesthetics: Rounded corners (border-radius: 16px) for buttons, cards, inputs.
Professional Yet Approachable: Professional typography/colors with playful crypto graphics.
Interactive Feedback: Phantom-style snackbars for actions (e.g., “Investment Added”, “Binding Approved”).

4.2 Key Elements

Typography: Inter font; 16px (body), 24px (headings), 12px (captions).
Colors:

Primary: #5855FF (purple-blue gradient).
Secondary: #F5F5FA (light gray background).
Accent: #00D632 (green for profits), #FF3B30 (red for losses).
Neutral: #1A1A3D (dark text), #FFFFFF (cards).


Icons: Lightweight SVGs (crypto-themed: coins, charts, wallets) with hover animations.
Graphics: Flat, playful illustrations (e.g., smiling coin for empty states).
Components:

Buttons: Rounded (16px), gradient primary, outline secondary, hover scale (1.05).
Cards: White, rounded, subtle shadow.
Forms: Rounded inputs, tailored fields per category (e.g., APY for DeFi).
Snackbars: Top-right, auto-dismiss (3s), Phantom-style slide-in.
Charts: Smooth Recharts visuals, color-coded.


Theme: Light mode default, dark mode toggle; high contrast for accessibility.
Layout: Responsive Tailwind CSS grid; mobile: stacked cards; desktop: sidebar nav, card-based dashboard.

4.3 Sample Components

Button:

css.button-primary {
  background: linear-gradient(90deg, #5855FF, #7875FF);
  color: #FFFFFF;
  border-radius: 16px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease;
}
.button-primary:hover {
  background: linear-gradient(90deg, #4845EE, #6865EE);
  transform: scale(1.05);
}

Snackbar:

css.snackbar {
  background: #1A1A3D;
  color: #FFFFFF;
  border-radius: 8px;
  padding: 12px 16px;
  position: fixed;
  top: 16px;
  right: 16px;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
5. Assumptions

Manual entry for trades/investments (no exchange/wallet APIs).
Investors permanently bound to one Trader unless revoked.
Currency support: USD and PHP.
No onboarding tutorial; users understand crypto basics.
Premium features (exports, higher binding limits) planned but WIP.
Manual P&L for investments simplifies tracking across platforms.


Addressing Your Idea

Distinct Categories and Forms:

Trades (spot, futures) and investments (DeFi, dual investment, liquidity pool, liquidity mining) have tailored forms with category-specific fields (e.g., leverage for futures, APY for DeFi).
Implemented via a single Trades table with category and details (JSONB) to keep the schema flexible.
UI will render dynamic forms based on category (e.g., DeFi form includes platform and APY inputs).


Manual P&L for Investments:

Traders manually input P&L for investments to account for platform-specific complexities (e.g., impermanent loss, staking rewards).
P&L is optional for trades (auto-calculated if applicable) but mandatory for investments (enforced in app logic).
Benefits: Simplifies MVP, ensures accurate P&L from Traders’ external data, and provides consistent metrics for Investors.


Database Support:

Trades table updated with category (spot, futures, defi, etc.) and details (JSONB) for fields like platform, APY, or pool share.
profit_loss column added for manual input on investments.
Audit log tracks P&L changes for transparency.


//DATABASE DESIGN
Updated Supabase Database Schema
Design Principles (Updated)

Category-Specific Forms: Separate forms for trades (spot, futures) and investments (DeFi, dual investment, liquidity pool, liquidity mining) with tailored fields.
Manual P&L for Investments: Traders manually input P&L for investments to account for platform-specific calculations.
Simplicity: Use a single Trades table with a JSONB column for category-specific fields to avoid excessive table proliferation.
Security: Maintain Supabase RLS for Trader-Investor access control.
Currency Support: USD and PHP for all price/P&L fields.
Scalability: Support 1,000+ entries per user with real-time updates.

Updated Tables
The main change is to the Trades table, which will now handle both trades and investments with a category column to differentiate types and a details JSONB column for category-specific fields. Other tables (Users, Bindings, Audit_Log) remain unchanged from the previous schema unless noted.
1. Users (Unchanged)













































































ColumnTypeDescriptionConstraintsidUUIDUnique user ID (Supabase Auth)Primary KeyemailTEXTUser emailUnique, Not NullroleTEXTRole: 'trader' or 'investor'Not NullusernameTEXTDisplay nameNot Null, UniquebioTEXTOptional bioOptionalcurrencyTEXTPreferred currency: 'USD' or 'PHP'Default 'USD', Not Nullavatar_urlTEXTURL to avatar imageOptionaltrader_uidTEXTUnique Trader ID (for Traders)Unique (for Traders)bound_trader_idUUIDTrader ID for InvestorsForeign Key (Users.id), Optionalcreated_atTIMESTAMPCreation timestampAuto-generatedupdated_atTIMESTAMPLast update timestampAuto-generated
2. Trades (Updated)
Stores both trades and investments, with a category column and details JSONB for category-specific fields. Traders manually input P&L for investments.































































































ColumnTypeDescriptionConstraintsidUUIDUnique trade/investment IDPrimary Keyuser_idUUIDTrader who created the entryForeign Key (Users.id), Not NullcategoryTEXTCategory: 'spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining'Not NullassetTEXTCrypto asset (e.g., 'BTC', 'ETH')Not NullpriceDECIMALBuy/sell price (trades) or initial investment amountNot NullcurrencyTEXTCurrency: 'USD' or 'PHP'Not Null, Default 'USD'quantityDECIMALAmount of assetNot Nulltrade_dateTIMESTAMPDate of trade/investmentNot NullfeesDECIMALFees paid (in currency)Optionalprofit_lossDECIMALP&L (manual for investments; calculated for trades)OptionaldetailsJSONBCategory-specific fields (e.g., leverage for futures, APY for DeFi)OptionalnotesTEXTOptional notesOptionalcreated_atTIMESTAMPCreation timestampAuto-generatedupdated_atTIMESTAMPLast update timestampAuto-generated

Notes:

category determines the form fields displayed in the UI:

Spot: asset, price, quantity, trade_date, fees, notes, details (e.g., { "buy_sell": "buy" }).
Futures: asset, price, quantity, trade_date, fees, notes, details (e.g., { "buy_sell": "buy", "leverage": 10, "margin": 1000 }).
DeFi: asset, price (initial investment), quantity, trade_date, fees, profit_loss (manual), notes, details (e.g., { "platform": "Aave", "apy": 5.2 }).
Dual Investment: asset, price, quantity, trade_date, fees, profit_loss (manual), notes, details (e.g., { "platform": "Binance", "strike_price": 50000 }).
Liquidity Pool: asset (e.g., 'BTC-ETH'), price, quantity, trade_date, fees, profit_loss (manual), notes, details (e.g., { "platform": "Uniswap", "pool_share": 0.01 }).
Liquidity Mining: asset, price, quantity, trade_date, fees, profit_loss (manual), notes, details (e.g., { "platform": "SushiSwap", "rewards_token": "SUSHI" }).


profit_loss: Optional for trades (calculated as (sell_price - buy_price) * quantity - fees if applicable); mandatory for investments (manual input by Trader).
details (JSONB) stores category-specific fields, allowing flexibility without multiple tables.
currency ensures all monetary fields (price, fees, profit_loss) are in USD or PHP.



3. Bindings (Unchanged)















































ColumnTypeDescriptionConstraintsidUUIDUnique binding IDPrimary Keytrader_idUUIDTrader’s user IDForeign Key (Users.id), Not Nullinvestor_idUUIDInvestor’s user IDForeign Key (Users.id), Not NullstatusTEXTStatus: 'pending', 'approved', 'revoked'Not Null, Default 'pending'created_atTIMESTAMPCreation timestampAuto-generatedupdated_atTIMESTAMPLast update timestampAuto-generated
4. Audit_Log (Updated)
Tracks changes to trades/investments.















































ColumnTypeDescriptionConstraintsidUUIDUnique log IDPrimary Keytrade_idUUIDTrade/investment being modifiedForeign Key (Trades.id), Not Nulluser_idUUIDTrader who made the changeForeign Key (Users.id), Not NullactionTEXTAction: 'create', 'update', 'delete'Not NullchangesJSONBDetails of changes (e.g., old/new P&L)Optionalcreated_atTIMESTAMPTimestamp of actionAuto-generated

Notes:

Updated to include investment changes (e.g., manual P&L updates).
changes logs field updates, including profit_loss for investments.



Relationships (Unchanged)

Users ↔ Trades: One-to-Many (Trades.user_id → Users.id).
Users ↔ Bindings: One-to-Many (Bindings.trader_id → Users.id, Bindings.investor_id → Users.id).
Users (Investor) → Users (Trader): One-to-One (Users.bound_trader_id → Users.id).
Trades ↔ Audit_Log: One-to-Many (Audit_Log.trade_id → Trades.id).

Row Level Security (RLS) Policies (Updated)
Updated to handle trades and investments in the Trades table:

Users Table: Unchanged.

Read/Update: Users access their own profile (auth.uid() = id).
Trader UID: Investors read trader_uid; Traders read their own.


Trades Table:

Create/Update/Delete: Traders modify their own entries (auth.uid() = user_id).
Read: Traders read their own entries (auth.uid() = user_id). Investors read their bound Trader’s entries (auth.uid() = Users.id AND Users.bound_trader_id = Trades.user_id AND Bindings.status = 'approved').
Ensure profit_loss for investments is only editable by Traders.


Bindings Table: Unchanged.

Create: Investors create requests (auth.uid() = investor_id).
Update: Traders approve/revoke (auth.uid() = trader_id).
Read: Traders see their bindings; Investors see their status.


Audit_Log Table: Unchanged.

Create: Auto-generated via triggers.
Read: Traders only (auth.uid() = user_id).



Example RLS Policy (Trades Table, Updated)
sql-- Traders: Read/Write their own trades/investments
CREATE POLICY trader_access ON Trades
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Investors: Read bound Trader's trades/investments
CREATE POLICY investor_access ON Trades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM Users u
      JOIN Bindings b ON b.trader_id = u.bound_trader_id
      WHERE u.id = auth.uid()
        AND b.investor_id = auth.uid()
        AND b.status = 'approved'
        AND Trades.user_id = u.bound_trader_id
    )
  );
Constraints and Validations (Updated)

Users: Unchanged.
Trades:

category: Must be 'spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining'.
currency: Must be 'USD' or 'PHP'.
price and quantity: Must be positive.
profit_loss: Mandatory for investments (category in ['defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining']); optional for trades.
details (JSONB): Validated in app logic for category-specific fields (e.g., leverage for futures, platform for DeFi).


Bindings:

Investor cap: 10 for free-tier Traders (enforced via trigger or app logic).


Audit_Log: Log profit_loss changes for investments.

Supabase Setup (Updated)

Auth: Email/password, Google OAuth.
Storage: For avatars (optional).
Realtime: Enable on Trades and Bindings for real-time updates.
Triggers:

Generate trader_uid on User creation.
Log trade/investment actions to Audit_Log (including profit_loss updates).
Enforce Investor binding cap (reject if >10 for free-tier Traders).


Validation: App logic ensures details JSONB matches category (e.g., apy for DeFi).

Sample SQL Setup (Updated)
sql-- Trades Table (Updated)
CREATE TABLE Trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES Users(id),
  category TEXT NOT NULL CHECK (category IN ('spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining')),
  asset TEXT NOT NULL,
  price DECIMAL NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'PHP')),
  quantity DECIMAL NOT NULL CHECK (quantity > 0),
  trade_date TIMESTAMP NOT NULL,
  fees DECIMAL CHECK (fees >= 0),
  profit_loss DECIMAL,
  details JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger for Audit_Log (Updated)
CREATE FUNCTION log_trade_changes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO Audit_Log (trade_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'create', NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO Audit_Log (trade_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'update', jsonb_build_object(
      'price', jsonb_build_object('old', OLD.price, 'new', NEW.price),
      'profit_loss', jsonb_build_object('old', OLD.profit_loss, 'new', NEW.profit_loss),
      'details', jsonb_build_object('old', OLD.details, 'new', NEW.details)
    ));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO Audit_Log (trade_id, user_id, action, changes)
    VALUES (OLD.id, OLD.user_id, 'delete', NULL);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_trades
  AFTER INSERT OR UPDATE OR DELETE ON Trades
  FOR EACH ROW
  EXECUTE FUNCTION log_trade_changes();
Addressing Your Idea

Distinct Forms: Using a category column and details JSONB allows tailored forms in the React UI. For example:

Spot: Simple buy/sell form.
Futures: Adds leverage and margin fields.
DeFi: Adds platform and APY fields, with manual P&L input.
This keeps the database flexible while supporting unique UIs per category.


Manual P&L for Investments: Requiring Traders to input P&L for investments (defi, dual_investment, liquidity_pool, liquidity_mining) is a good approach for MVP, as platforms like Aave or Uniswap have complex P&L calculations (e.g., impermanent loss, staking rewards) that are hard to automate without API integrations. The profit_loss column is optional for trades (auto-calculated if needed) but mandatory for investments (enforced in app logic).
Benefits:

Simplifies MVP by avoiding external data fetching.
Gives Traders flexibility to input accurate P&L based on their platform data.
Investors see consistent P&L metrics across all categories.


Considerations:

App logic must validate profit_loss for investments (non-null).
UI should guide Traders to enter P&L for investments (e.g., with a clear input field and snackbar confirmation).