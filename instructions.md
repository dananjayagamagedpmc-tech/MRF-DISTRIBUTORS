# Technical Requirements Specification: Tyre Dealer & Distributor Management System

## 1. Project Overview
A professional, high-performance, single-page web application designed for tracking and analyzing a complex network of tyre distributors and dealers. The system operates on an offline-first architecture, ensuring high data availability, fast search speeds, and seamless record management via unique distributor account numbers.

* **Target Stack:** HTML5, Tailwind CSS (UI/UX), Vanilla JavaScript (ES6+), and Dexie.js (IndexedDB wrapper for local storage).
* **Deployment:** Optimized for hosting on Netlify or packaging into a standalone Android APK.

---

## 2. Core Architecture & Tech Stack

### 2.1. Frontend & UI
* **Tailwind CSS:** Professional dashboard theme (Slate/Zinc color palette for a modern corporate look). Responsive layouts matching mobile and desktop views.
* **Component Structure:** Clean modular design using HTML5 sections managed dynamically via JS view switching (Single Page Application architecture).

### 2.2. Database & Storage (Offline-First)
* **Dexie.js:** Utilized to handle complex local queries, indexing, and high-capacity data storage.
* **Database Schemas:**
    * `distributors`: `++id, &accountNumber, name, region, contactNumber, status`
    * `targets`: `++id, accountNumber, period (YYYY-MM), targetQty, achievedQty, allowancePercentage, status (Pending/Processed)`
    * `salesLog`: `++id, accountNumber, date, invoiceNumber, quantity, brand, size`

---

## 3. Detailed Functional Modules

### 3.1. Dashboard & Global Search (Main Interface)
* **Aesthetic Metric Cards:** * Total Active Distributors
    * Total Sales Quantity (Current Month)
    * Pending Target Allowances Approval Count
* **Instant Search Bar:** Search by `Account Number`, `Name`, or `Region` with auto-suggestions.
* **Quick Actions:** Shortcut buttons for "Add New Distributor" and "Log Sales".

### 3.2. Distributor Profile & Data Management
* **Data Entry Form:** Validated inputs for:
    * Distributor Account Number (Unique Key - e.g., DIST-2026-001)
    * Business Name & Owner Details
    * Region / Route Category
    * Contact Info (Phone, Email)
* **Profile View:** Comprehensive dashboard per distributor showing biographical data, historical target achievements, and pending credit allowances.

### 3.3. Target & Allowance Tracker
* **Target Allocation:** Form to set monthly/quarterly unit targets (e.g., Target: 500 Tyres).
* **Progress Indicators:** Visual progress bars displaying percentage completion:
    $$\text{Achievement \%} = \left( \frac{\text{Achieved Qty}}{\text{Target Qty}} \right) \times 100$$
* **Allowance Engine:** Automate status checking:
    * If Achievement $\ge$ 100%, flag allowance as **"Eligible - Pending"**.
    * Action button to switch status to **"Processed"** once a credit note or cash allowance is issued.

### 3.4. Analytics & Performance Insights
* **Top Performers List:** Ranked view of dealers based on volume.
* **Underperforming Alerts:** Automatic warning flags for accounts below 50% target pacing mid-month.
* **Filtering Controls:** Filter analytics data by Region, Brand, or Tyre Size.

---

## 4. Technical & Non-Functional Requirements

### 4.1. Performance & UI Constraints
* **No Dense Text Walls:** Data tables must use clear typography, ample padding, alternating row colors (zebra striping), and status badges (Green for Processed, Amber for Pending).
* **Zero Latency Search:** Index the `accountNumber` in Dexie.js to render profile lookups under 50ms.

### 4.2. File & Data Portability
* **Backup & Restore:** JSON export feature to back up the Dexie.js local database to a file. Import feature to reload data seamlessly.
* **Sinhala Font Rendering:** Compatibility layer (CSS fallback to standard Sinhala Unicode fonts like *Noto Sans Sinhala* or *Iskoola Pota*) to ensure text fields hold accurate regional notation without breaking layout layouts when packaged into an Android APK.

---

## 5. View Switcher & Script Logic Framework

```javascript
// Database Initialization
const db = new Dexie("TyreNetworkDB");
db.version(1).stores({
    distributors: '++id, &accountNumber, name, region, status',
    targets: '++id, accountNumber, period, status',
    salesLog: '++id, accountNumber, date'
});

// Navigation Logic
function switchView(viewId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

// Search Logic
async function searchDistributor(accNum) {
    const distributor = await db.distributors.where("accountNumber").equals(accNum).first();
    if(distributor) {
        renderProfile(distributor);
    } else {
        alert("Distributor Account Number Not Found!");
    }
}