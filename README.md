# AI Network Fault Diagnosis System

This project is a comprehensive AI-driven system for network fault diagnosis, configuration validation, and human-in-the-loop review.

## Project Structure

- **`ai_engine/`**: Contains the core Python scripts (e.g., `diagnoser.py`) responsible for analyzing network state, running inference, and outputting diagnosis results.
- **`dashboard/`**: The web-based frontend (HTML/CSS/JS) for visualizing AI diagnoses, tracking system performance, and viewing human review logs.
- **`checker/`**: Tools for deterministic validation of network configurations (e.g., Cisco devices).
- **`review/`**: Modules dedicated to managing human expert validation and feedback on AI-generated diagnoses.
- **`prompts/`**: Contains templates and prompt definitions used by the AI engine.
- **`logs/`**: Directory for storing application and system logs.

## Setup and Installation

### 1. AI Engine (Backend)
Requires Python 3.8+ (or appropriate version).
```bash
# Navigate to the project root
cd "path/to/ai project"

# (Optional but recommended) Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the diagnoser
python ai_engine/diagnoser.py
```

### 2. Dashboard (Frontend)
The dashboard is built with vanilla HTML, CSS, and JavaScript.
1. Navigate to the `dashboard/` directory.
2. Open `index.html` in your web browser, or serve it using a local HTTP server.

## Features

- **Automated Diagnosis**: Uses AI to detect and diagnose complex network faults.
- **Rule-Based Validation**: Deterministically checks configurations against defined networking rules.
- **Human-in-the-Loop**: Allows network experts to review, edit, and validate AI diagnoses to improve the model.
- **Real-Time Dashboard**: Visualizes overall system accuracy, case severities, and AI vs. Human agreement rates.

## License
[Add License Information Here]
