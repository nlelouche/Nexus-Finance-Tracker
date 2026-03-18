# Nexus Finance Tracker 🚀

[🇪🇸 Leer en Español](README.es.md)

**Nexus Finance Tracker** is not just another budgeting app; it is a **comprehensive, local-first Personal Finance & Wealth Management hub**. Built specifically to shift the focus from merely tracking expenses to actively building long-term wealth, Nexus provides institutional-grade portfolio metrics, goal tracking, and an integrated AI financial mentor—all while keeping your data 100% private in your browser.

### 🌟 Core Philosophy

Most finance apps treat users as consumers. Nexus treats you as an *investor*. Instead of simply scolding you for buying coffee, it runs Time-Weighted Rate of Return (TWRR) calculations on your portfolio, projects your wealth into the future, and audits your spending using an uncompromising (and fully private) AI Mentor.

### 🚀 Key Features

*   🔒 **True Local-First Architecture:** Your money, your data. Nexus runs entirely in the browser using `localStorage`. No cloud syncing, no databases, no tracking. Total privacy.
*   🧠 **Nexus AI Advisor:** Connects directly to **Ollama** (running locally on your machine) for an uncompromising, private financial audit. Ask questions or request an analysis of your spending habits without sending your data to external servers.
*   📈 **Institutional Investment Metrics:** Track your portfolio across multiple asset classes (Crypto, Stocks, Bonds). Features automatic TWRR calculation, ROI, and a target-allocation rebalancing engine.
*   🔮 **Wealth Projections & Simulation:** Run 1, 2, or 5-year compounding interest models based on your historical TWRR to forecast your path to financial independence.
*   🎯 **Granular Goal Tracking:** Map your savings to specific milestones with built-in multicurrency support.
*   🔄 **Data Portability Engine:** Export your entire financial state to a `.json` backup file or import it into any other device running Nexus. You are never locked in.
*   🌐 **Bilingual Engine:** Fully localized in English and Neutral Spanish dynamically.

### 🛠️ Tech Stack

*   **Core:** React 18, TypeScript, Vite
*   **State Management:** Zustand (with Persistence Middleware)
*   **Styling & UI:** Tailwind CSS, Lucide Icons, Headless UI concepts
*   **Charts & Visualization:** Recharts
*   **Internationalization:** `i18next` & `react-i18next`
*   **AI Integration:** Native `fetch` bridge to local Ollama API (Llama3.1)

### 🏁 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/nexus-finance.git
    cd nexus-finance
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  *(Optional)* **Connect AI:** Ensure you have [Ollama](https://ollama.com/) running locally with an active model (default: `llama3.1`). The Nexus Advisor will automatically bridge to `http://localhost:11434`.

---
<div align="center">
  <i>Built with React, TypeScript, and financial common sense.</i>
</div>
