# CODTECH_Extension_TimeTracking

*COMPANY*: CODTECH IT SOLUTIONS

*NAME*: ANKIT KUMAR KARN

*INTERN ID*: CT04DN529

*DOMAIN*: FULL STACK WEB DEVELOPMENT

*DURATION*: 4 WEEKS

*MENTOR*: NEELA SANTOSH

-------------------------------------------------------------
> Chrome Extension for time tracking and Productive analytics
 Develop a chrome Extension that tracks the time spent on 
 different Website and provides Productive Analytics.
 The Tool can classify websites as Productive 
 (e.g.,Coding Platforms) or  Unproductive (e.g., Social Media)
        and Provide Weekly Productive report.
-----------------------------------------------------------------------------------------------------------------------

# ⏱️ Time Tracking and Productivity Analytics - Chrome Extension

## 📌 Overview

The **Time Tracking and Productivity Analytics** Chrome Extension is a lightweight tool that helps users monitor and analyze the time they spend on various websites throughout their browsing sessions. The extension classifies websites into **productive** and **unproductive** categories and generates insightful **weekly productivity reports**.

This tool is ideal for students, professionals, and anyone who wants to enhance their digital productivity by understanding where their time goes online.

---

## 🔍 Key Features

* ⏱ **Real-Time Time Tracking**
  Automatically tracks the time spent on each website you visit.

* 📊 **Weekly Productivity Report**
  Generates a detailed weekly report categorizing websites as productive or unproductive.

* 🧠 **Smart Website Classification**
  Predefined categories help in identifying coding platforms (like GitHub, Stack Overflow) as **productive**, and social media (like Instagram, Facebook) as **unproductive**.

* 📁 **Local Data Storage**
  Stores your browsing time and analytics locally using Chrome's storage API.

* 💡 **User-Friendly UI**
  Clean and simple popup interface that displays productivity summary and reports.

---

## 🏗️ How It Works

1. The extension runs in the background and monitors your **active tab**.
2. Every few seconds, it logs the domain of the active tab and accumulates time for that domain.
3. It uses a **predefined JSON list** to classify domains into `productive`, `unproductive`, or `neutral`.
4. At the end of each week, it summarizes the time spent in each category and shows a **visual productivity report** in the popup.

---

## 📦 Folder Structure

```
CODTECH_Extension_TimeTracking/
│
├── background.js          // Background script for tracking activity
├── content.js             // (Optional) Content script for site detection
├── popup.html             // Popup UI
├── popup.js               // Logic for rendering analytics
├── styles.css             // Styling for popup
├── icon16.png             // Extension icon (16x16)
├── icon48.png             // Extension icon (48x48)
├── icon128.png            // Extension icon (128x128)
├── manifest.json          // Chrome extension manifest file
└── README.md              // Project documentation
```

---

## 🧪 Installation & Usage

1. Download or clone this repository.
2. Open **Chrome** and go to `chrome://extensions/`.
3. Enable **Developer Mode** (top-right corner).
4. Click on **"Load Unpacked"** and select the folder `CODTECH_Extension_TimeTracking`.
5. The extension icon should appear in your Chrome toolbar.
6. Click the icon to view your productivity stats and weekly summary.

---

## 🛠️ Technologies Used

* **JavaScript (Vanilla JS)** – Core logic and DOM interaction
* **Chrome Extension APIs** – Tabs, Storage, Background Scripts
* **HTML/CSS** – Interface design and layout
* **JSON** – Domain classification and config management

---

## 🔒 Privacy Policy

This extension does **not track or store** your browsing history on any external server. All time data and analytics are stored **locally** in your browser and are only visible to you.

---

## 💡 Future Enhancements

* 🔁 Custom domain classification by the user
* ☁ Cloud sync support for cross-device analytics
* 📅 Daily and monthly summary views
* 🔔 Focus mode and usage alerts for unproductive sites

---

## 🙌 Contributing

Pull requests are welcome! If you’d like to contribute or suggest improvements, feel free to fork the repo and submit a PR.

---

## 📧 Contact

**Developer:** Ankit Kumar Karn
**Email:** [imankitkumar.krn@gmail.com](mailto:imankitkumar.krn@gmail.com)
**GitHub:** [github.com/imankit-0912](https://github.com/imankit-0912)

---

# Output
> ![Image](https://github.com/user-attachments/assets/0cb910d2-d6f3-4570-8a8f-4308dfbac4df)
