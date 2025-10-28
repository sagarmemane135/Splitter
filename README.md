
# Splitter: Expense Splitter and Debt Simplifier

Splitter is a powerful and intuitive web application designed to simplify group expense management and streamline debt settlement. Whether you're sharing costs with roommates, planning a trip with friends, or managing team expenses, Splitter helps you track who paid what, who owes whom, and then intelligently simplifies the transactions to minimize the number of payments needed.

## Features

*   **Group Management:** Create and manage multiple expense groups for different events or circles.
*   **User Management:** Easily add and remove participants within each group.
*   **Expense Tracking:** Record expenses with details like title, amount, payers, and participants. Supports various split types (equal, by amount, by percentage).
*   **Real-time Collaboration:** Share your expense groups with others and collaborate in real-time.
*   **Debt Simplification:** Automatically calculates and simplifies debts, showing the fewest transactions required to settle up.
*   **Balance Summary:** Get a clear overview of each user's balance within a group.
*   **PDF Report Generation:** Download a comprehensive PDF report of your group's expenses, balances, and simplified transactions.
*   **Local Storage Persistence:** All your data is saved locally in your browser, ensuring your groups and expenses are available even after you close the tab.

## Technologies Used

*   **React:** A JavaScript library for building user interfaces.
*   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
*   **Vite:** A fast build tool that provides a lightning-fast development experience.
*   **PeerJS:** For real-time peer-to-peer collaboration.
*   **jsPDF & html2canvas:** For client-side PDF generation.
*   **Tailwind CSS:** For rapid UI development and styling.

## Run Locally

**Prerequisites:** Node.js (LTS version recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sagarmemane135/Splitter.git
    cd Splitter
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the app in development mode:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

This project uses `gh-pages` for deployment to GitHub Pages.

1.  **Build the project:**
    ```bash
    npm run build
    ```
2.  **Deploy to GitHub Pages:**
    ```bash
    npm run deploy
    ```
    Your application will be deployed to `https://sagarmemane135.github.io/Splitter/`.

## Repository

[https://github.com/sagarmemane135/Splitter/](https://github.com/sagarmemane135/Splitter/)
