#!/usr/bin/env python3
"""
NetSage AI - Human Review Interface
Reviews AI diagnoses and marks them as Accepted, Edited, or Rejected.
Logs corrected cases to logs/responsible_ai_log.md.
"""

import json
import os
import sys
import csv
from datetime import datetime

# ─────────────────────────────────────────────
# ANSI Colors
# ─────────────────────────────────────────────
class C:
    BOLD    = "\033[1m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    RED     = "\033[91m"
    CYAN    = "\033[96m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    RESET   = "\033[0m"
    CLEAR   = "\033[2J\033[H"

AI_RESPONSES_PATH  = "logs/ai_responses.json"
CASES_PATH         = "cases.csv"
REVIEW_LOG_PATH    = "logs/human_review_log.json"
RESPONSIBLE_AI_LOG = "logs/responsible_ai_log.md"


def load_ai_responses() -> dict:
    """Load AI diagnosis responses."""
    if not os.path.exists(AI_RESPONSES_PATH):
        print(f"{C.RED}Error: {AI_RESPONSES_PATH} not found. Run ai_engine/diagnoser.py first.{C.RESET}")
        sys.exit(1)
    with open(AI_RESPONSES_PATH, encoding='utf-8') as f:
        return json.load(f)


def load_cases() -> dict:
    """Load cases as a dict keyed by case id."""
    cases = {}
    if not os.path.exists(CASES_PATH):
        return cases
    with open(CASES_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cases[row['id']] = row
    return cases


def load_existing_reviews() -> list:
    """Load any existing review log."""
    if os.path.exists(REVIEW_LOG_PATH):
        with open(REVIEW_LOG_PATH, encoding='utf-8') as f:
            return json.load(f)
    return []


def save_reviews(reviews: list):
    """Save review log to JSON."""
    os.makedirs("logs", exist_ok=True)
    with open(REVIEW_LOG_PATH, "w", encoding='utf-8') as f:
        json.dump(reviews, f, indent=2)


def save_responsible_ai_log(reviews: list):
    """Generate Responsible AI markdown log for corrected cases."""
    corrected = [r for r in reviews if r["status"] in ("Edited", "Rejected")]

    lines = ["# NetSage AI – Responsible AI Log\n",
             f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n",
             f"Total cases reviewed: {len(reviews)}  \n",
             f"Accepted: {sum(1 for r in reviews if r['status'] == 'Accepted')}  \n",
             f"Edited: {sum(1 for r in reviews if r['status'] == 'Edited')}  \n",
             f"Rejected: {sum(1 for r in reviews if r['status'] == 'Rejected')}  \n\n",
             "---\n\n"]

    for i, rev in enumerate(corrected, 1):
        lines.append(f"## Case {i}: Case ID {rev['case_id']}\n\n")
        lines.append(f"**Status:** {rev['status']}  \n")
        lines.append(f"**Reviewed at:** {rev['reviewed_at']}  \n")
        lines.append(f"**Reviewer:** {rev.get('reviewer_name', 'Human Expert')}  \n\n")
        lines.append(f"### Symptom\n{rev.get('symptom', 'N/A')}\n\n")
        lines.append(f"### AI Diagnosis\n> {rev.get('ai_root_cause', 'N/A')}\n\n")
        lines.append(f"**AI Confidence:** {rev.get('ai_confidence', 'N/A')}  \n\n")
        lines.append(f"### Human Correction\n{rev.get('human_correction', 'No correction provided.')}\n\n")
        lines.append(f"### Why AI Was Wrong\n{rev.get('why_wrong', 'Not specified.')}\n\n")
        lines.append(f"### Improvement Note\n{rev.get('improvement_note', 'N/A')}\n\n")
        lines.append("---\n\n")

    os.makedirs("logs", exist_ok=True)
    with open(RESPONSIBLE_AI_LOG, "w", encoding='utf-8') as f:
        f.writelines(lines)

    print(f"\n{C.CYAN}Responsible AI log saved to: {RESPONSIBLE_AI_LOG}{C.RESET}")


def print_header():
    print(f"\n{C.BOLD}{C.BLUE}╔══════════════════════════════════════════════════╗{C.RESET}")
    print(f"{C.BOLD}{C.BLUE}║        NetSage AI – Human Review Interface        ║{C.RESET}")
    print(f"{C.BOLD}{C.BLUE}╚══════════════════════════════════════════════════╝{C.RESET}\n")


def display_case(diagnosis: dict, case: dict, index: int, total: int):
    """Display a single case for review."""
    print(f"\n{C.BOLD}{'═'*55}{C.RESET}")
    print(f"{C.BOLD}  Case {index}/{total} | ID: {diagnosis.get('case_id', '?')}{C.RESET}")
    print(f"{C.BOLD}{'═'*55}{C.RESET}")

    print(f"\n{C.CYAN}SYMPTOM:{C.RESET}")
    print(f"  {case.get('symptom', 'N/A')}")

    print(f"\n{C.CYAN}TOPOLOGY:{C.RESET}")
    print(f"  {case.get('topology_note', 'N/A')}")

    print(f"\n{C.CYAN}SHOW COMMAND OUTPUT:{C.RESET}")
    print(f"  {case.get('show_output', 'N/A')}")

    print(f"\n{C.BOLD}{C.YELLOW}──── AI DIAGNOSIS ────{C.RESET}")
    print(f"{C.BOLD}Root Cause:   {C.RESET}{diagnosis.get('root_cause', 'N/A')}")
    print(f"{C.BOLD}OSI Layer:    {C.RESET}{diagnosis.get('osi_layer', 'N/A')}")
    print(f"{C.BOLD}Concept:      {C.RESET}{diagnosis.get('concept_tag', 'N/A')}")
    print(f"{C.BOLD}Confidence:   {C.RESET}", end="")

    conf = diagnosis.get('confidence', 'medium').lower()
    if conf == 'high':    print(f"{C.GREEN}HIGH{C.RESET}")
    elif conf == 'medium': print(f"{C.YELLOW}MEDIUM{C.RESET}")
    else:                  print(f"{C.RED}LOW{C.RESET}")

    print(f"{C.BOLD}Evidence:     {C.RESET}{diagnosis.get('evidence', 'N/A')[:120]}...")
    print(f"{C.BOLD}Next Command: {C.RESET}{diagnosis.get('next_command', 'N/A')}")

    fix = diagnosis.get('fix_steps', [])
    print(f"{C.BOLD}Fix Steps:{C.RESET}")
    for j, step in enumerate(fix, 1):
        print(f"  {j}. {step}")

    print(f"{C.BOLD}Severity:     {C.RESET}{diagnosis.get('severity', 'N/A')}")

    print(f"\n{C.CYAN}EXPECTED (from dataset):{C.RESET}")
    print(f"  Fault:     {case.get('expected_fault', 'N/A')}")
    print(f"  OSI Layer: {case.get('osi_layer', 'N/A')}")
    print(f"  Concept:   {case.get('concept_tag', 'N/A')}")


def get_review_decision() -> str:
    """Prompt user for review decision."""
    print(f"\n{C.BOLD}Review Decision:{C.RESET}")
    print(f"  {C.GREEN}[A]{C.RESET} Accept  - AI diagnosis is correct")
    print(f"  {C.YELLOW}[E]{C.RESET} Edit    - AI was partially correct, provide correction")
    print(f"  {C.RED}[R]{C.RESET} Reject  - AI was wrong, provide correct diagnosis")
    print(f"  {C.CYAN}[S]{C.RESET} Skip    - Review this case later")
    print(f"  {C.MAGENTA}[Q]{C.RESET} Quit    - Save and exit review")

    while True:
        choice = input(f"\n{C.BOLD}Enter choice [A/E/R/S/Q]: {C.RESET}").strip().upper()
        if choice in ("A", "E", "R", "S", "Q"):
            return choice
        print(f"{C.RED}Invalid choice. Please enter A, E, R, S, or Q.{C.RESET}")


def get_correction_details(status: str) -> tuple[str, str, str, str]:
    """Collect human correction details for Edited/Rejected cases."""
    print(f"\n{C.BOLD}Please provide correction details:{C.RESET}")
    correction    = input(f"Correct root cause / fix: ").strip() or "No correction provided."
    why_wrong     = input(f"Why was AI wrong (what clue did it miss?): ").strip() or "Not specified."
    improvement   = input(f"How to improve AI for similar cases: ").strip() or "N/A."
    reviewer_name = input(f"Your name/role (default: Human Expert): ").strip() or "Human Expert"
    return correction, why_wrong, improvement, reviewer_name


def interactive_review():
    """Main interactive review loop."""
    print_header()

    data   = load_ai_responses()
    cases  = load_cases()
    existing_reviews = load_existing_reviews()

    diagnoses = data.get("diagnoses", [])
    if not diagnoses:
        print(f"{C.RED}No diagnoses found. Run ai_engine/diagnoser.py first.{C.RESET}")
        sys.exit(1)

    # Build set of already-reviewed case IDs
    reviewed_ids = {r["case_id"] for r in existing_reviews if r["status"] != "Skipped"}

    pending = [d for d in diagnoses if d.get("case_id") not in reviewed_ids]
    print(f"{C.CYAN}Total diagnoses: {len(diagnoses)} | Already reviewed: {len(reviewed_ids)} | Pending: {len(pending)}{C.RESET}")

    reviews = list(existing_reviews)
    accepted = rejected = edited = 0

    for i, diagnosis in enumerate(pending, 1):
        case_id = diagnosis.get("case_id", "?")
        case = cases.get(str(case_id), {})

        display_case(diagnosis, case, i, len(pending))
        choice = get_review_decision()

        if choice == "Q":
            print(f"\n{C.YELLOW}Saving and exiting...{C.RESET}")
            break

        if choice == "S":
            reviews.append({
                "case_id": case_id,
                "status": "Skipped",
                "reviewed_at": datetime.now().isoformat()
            })
            continue

        review_record = {
            "case_id": case_id,
            "status": "Accepted" if choice == "A" else ("Edited" if choice == "E" else "Rejected"),
            "reviewed_at": datetime.now().isoformat(),
            "symptom": case.get("symptom", ""),
            "ai_root_cause": diagnosis.get("root_cause", ""),
            "ai_confidence": diagnosis.get("confidence", ""),
            "ai_concept": diagnosis.get("concept_tag", ""),
            "human_correction": None,
            "why_wrong": None,
            "improvement_note": None,
            "reviewer_name": "Human Expert"
        }

        if choice == "A":
            accepted += 1
            print(f"{C.GREEN}✓ Accepted.{C.RESET}")

        elif choice in ("E", "R"):
            correction, why_wrong, improvement, reviewer = get_correction_details(choice)
            review_record.update({
                "human_correction": correction,
                "why_wrong": why_wrong,
                "improvement_note": improvement,
                "reviewer_name": reviewer
            })
            if choice == "E":
                edited += 1
                print(f"{C.YELLOW}✎ Edited and logged.{C.RESET}")
            else:
                rejected += 1
                print(f"{C.RED}✗ Rejected and logged.{C.RESET}")

        reviews.append(review_record)

    # Save all results
    save_reviews(reviews)
    save_responsible_ai_log(reviews)

    total_reviewed = accepted + edited + rejected
    print(f"\n{C.BOLD}{'─'*44}{C.RESET}")
    print(f"{C.BOLD}REVIEW COMPLETE{C.RESET}")
    print(f"  Total reviewed this session: {total_reviewed}")
    print(f"  {C.GREEN}Accepted: {accepted}{C.RESET}")
    print(f"  {C.YELLOW}Edited:   {edited}{C.RESET}")
    print(f"  {C.RED}Rejected: {rejected}{C.RESET}")
    corrected = edited + rejected
    agreement = (accepted / total_reviewed * 100) if total_reviewed > 0 else 0
    print(f"  AI agreement rate: {C.CYAN}{agreement:.1f}%{C.RESET}")
    print(f"{'─'*44}\n")


if __name__ == "__main__":
    interactive_review()
