<div align="center">
  <h1>🌐 NetSage AI</h1>
  <p><strong>Intelligent Network Fault Diagnosis & Configuration Validation System</strong></p>
  
  <p>
    <a href="https://github.com/ng-sudo/Netsage-AI/stargazers"><img src="https://img.shields.io/github/stars/ng-sudo/Netsage-AI?style=flat-square&color=blue" alt="Stars"></a>
    <a href="https://github.com/ng-sudo/Netsage-AI/network/members"><img src="https://img.shields.io/github/forks/ng-sudo/Netsage-AI?style=flat-square&color=blue" alt="Forks"></a>
    <a href="https://github.com/ng-sudo/Netsage-AI/issues"><img src="https://img.shields.io/github/issues/ng-sudo/Netsage-AI?style=flat-square&color=blue" alt="Issues"></a>
    <a href="https://github.com/ng-sudo/Netsage-AI/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ng-sudo/Netsage-AI?style=flat-square&color=blue" alt="License"></a>
  </p>
</div>

---

## 📖 Overview

**NetSage AI** is a comprehensive, AI-driven platform designed to revolutionize how network faults are diagnosed, reviewed, and resolved. By combining advanced AI inference with deterministic rule-checking and a human-in-the-loop review system, NetSage AI provides network engineers with a powerful toolset to maintain network health and validate configurations with confidence.

---

## ✨ Key Features

- 🧠 **Automated AI Diagnosis**: Rapidly analyzes network state and detects complex faults using advanced AI inference.
- 🛡️ **Deterministic Rule Validation**: Checks network configurations (e.g., Cisco devices) against strict networking rules to ensure compliance and prevent misconfigurations.
- 🧑‍💻 **Human-in-the-Loop (HITL)**: Empowers network experts to review, edit, and validate AI diagnoses, creating a feedback loop that continuously improves model accuracy.
- 📊 **Real-Time Interactive Dashboard**: A sleek, web-based UI that visualizes system performance, AI vs. Human agreement rates, case severities, and recent diagnoses.

---

## 🏗️ Project Architecture

The repository is modularly structured to separate the backend intelligence from the frontend visualization:

| Directory | Description |
| --- | --- |
| 📁 **`ai_engine/`** | Core Python backend for analyzing network states and running AI inference (`diagnoser.py`). |
| 📁 **`dashboard/`** | The web-based frontend (HTML/CSS/JS) for visualizing data and system metrics. |
| 📁 **`checker/`** | Tools for deterministic validation of network configurations. |
| 📁 **`review/`** | Modules managing human expert validation and feedback on AI predictions. |
| 📁 **`prompts/`** | AI prompt templates and definitions used by the diagnosis engine. |
| 📁 **`logs/`** | Directory for storing application and system execution logs. |

---

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### 1. Prerequisites
- **Python 3.8+** (for the backend AI Engine)
- A modern web browser (for the Dashboard)

### 2. Backend Setup (AI Engine)
Clone the repository and set up the Python environment:
```bash
# Clone the repository
git clone https://github.com/ng-sudo/Netsage-AI.git
cd Netsage-AI

# Create and activate a virtual environment (Recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the diagnoser
python ai_engine/diagnoser.py
```

### 3. Frontend Setup (Dashboard)
The dashboard is entirely static and requires no build steps!
1. Navigate to the `dashboard/` directory.
2. Open `index.html` in your favorite web browser. 
   *(Tip: Use the **Live Server** extension in VS Code for an optimal development experience).*

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  <i>Built with ❤️ for better networks.</i>
</div>
