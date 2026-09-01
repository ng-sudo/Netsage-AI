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

NetSage AI is an AI-assisted network troubleshooting system for Cisco Packet Tracer scenarios. It analyzes network symptoms and Cisco show command outputs to identify probable faults, provide evidence-based diagnoses, suggest troubleshooting commands and fixes, and support human-in-the-loop review and Responsible AI evaluation.

The project combines machine learning-powered inference with deterministic rule checks to provide explainable, auditable guidance for network engineers and students.

---

## ✨ Key Features

- 🧠 Automated AI Diagnosis — Analyzes network state and show-command outputs to surface likely root-causes and supporting evidence.
- 🛡️ Deterministic Rule Validation — Validates configurations against a set of networking rules to catch misconfigurations and policy violations.
- 🧑‍💻 Human-in-the-Loop (HITL) — Allows experts to review, correct, and annotate AI predictions; feedback can be used to improve models.
- 📊 Real-Time Dashboard — Static web UI for visualizing cases, metrics (AI vs. human agreement), and recent diagnoses.
- 🔎 Explainability & Evidence — Each diagnosis is accompanied by the evidence (command outputs, rule hits) used to support it.
- ♻️ Responsible AI Evaluation — Tracks confidence, disagreement, and audit artifacts to help evaluate model behavior and safety.

---

## 🏗️ Project Structure

The repository is organized to separate the backend intelligence from the frontend visualization and support tooling:

- ai_engine/ — Python backend for parsing device outputs, running inference, and producing diagnoses (e.g., diagnoser.py).
- dashboard/ — Static frontend (HTML/CSS/JS) that displays cases, metrics, and review workflows.
- checker/ — Deterministic validation tools and rule definitions for configuration checks.
- review/ — Modules for human review workflows, annotations, and audit logs.
- prompts/ — Prompt templates and definitions used by the diagnosis engine.
- logs/ — Application and system logs (runtime artifacts).

---

## 🚀 Quickstart (Local)

Follow these steps to run a minimal local setup.

1) Prerequisites
- Python 3.8+ (recommended)
- A modern web browser for the dashboard

2) Clone the repository

```bash
git clone https://github.com/ng-sudo/Netsage-AI.git
cd Netsage-AI
```

3) (Optional but recommended) Create a virtual environment and install dependencies

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
# If a requirements.txt exists, install dependencies
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
```

4) Run the AI diagnoser

```bash
python ai_engine/diagnoser.py
```

Notes:
- diagnoser.py is the entry point for running the analysis engine. It may accept flags or configuration files depending on your local copy — run with `-h` or inspect the file for available options.
- The dashboard is static. To view it locally, open `dashboard/index.html` in your browser or use the Live Server extension in VS Code for a better developer experience.

---

## 🔧 Usage & Examples

- Run a single Packet Tracer scenario: feed the collected `show` outputs to the diagnoser and review the generated case in the dashboard or logs.
- Validate configurations: use `checker/` utilities to run deterministic checks against device running-config snippets.

Add example command lines and sample inputs in `examples/` (recommended) so new users can try a complete end-to-end case quickly.

---

## 🧪 Responsible AI & Evaluation

NetSage AI collects evidence and confidence scores alongside every diagnosis to support transparent decisions and auditability. Key recommended practices:

- Keep human review enabled for low-confidence or high-severity cases.
- Record reviewer annotations and disagreements to improve model calibration.
- Maintain an audit trail (logs and reviewer notes) for every production diagnosis.

---

## 🛠️ Development

- Frontend: dashboard/ is static HTML/CSS/JS. No build step required; contributions to UI can be made by editing files directly.
- Backend: ai_engine/ contains the diagnostic logic. When contributing, include unit tests for parsing and rule checks.

Suggested development workflow:
1. Fork the repo and create a feature branch
2. Implement changes and add tests
3. Run the diagnoser and verify outputs
4. Open a Pull Request with a clear description of the change

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m "Add feature: ..."`
4. Push and open a Pull Request

Please include a short description of the problem your change fixes and add tests where appropriate.

---

## 📄 License

This project is distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">
  <i>Built with ❤️ for safer, more reliable networks.</i>
</div>
