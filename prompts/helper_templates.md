# NetSage AI – Helper Prompt Templates

## Template 1: Quick Triage Prompt

Use when you need a fast first-pass severity assessment before full diagnosis.

```
You are a network triage assistant. Given the following symptom, classify:
1. Severity: Critical / High / Medium / Low
2. Most likely OSI layer: Layer 1-7
3. Top 3 possible causes (one sentence each)

Respond in JSON only.

SYMPTOM: {symptom}
TOPOLOGY: {topology_note}
```

---

## Template 2: Evidence Extraction Prompt

Use to extract relevant evidence from raw show-command dumps.

```
You are a Cisco IOS output parser. Given raw show-command output, extract:
- Key configuration parameters
- Any obvious misconfigurations or anomalies
- Missing expected entries

Format your response as a bullet-pointed list.

DEVICE_TYPE: {device_type}
SHOW_COMMAND: {command}
OUTPUT:
{raw_output}
```

---

## Template 3: Fix Verification Prompt

Use after applying the fix to verify success.

```
A network fault was diagnosed and a fix was applied. Evaluate whether the following
post-fix show-command output confirms the issue is resolved.

Original fault: {root_cause}
Fix applied: {fix_steps}
Post-fix output:
{post_fix_output}

Respond in JSON:
{
  "resolved": true/false,
  "confidence": "high/medium/low",
  "evidence": "what in the output confirms/denies resolution",
  "remaining_issues": ["any remaining problems"]
}
```

---

## Template 4: Responsible AI Review Prompt

Use to summarize a case where the AI diagnosis was corrected by a human.

```
A human reviewer corrected an AI network diagnosis. Summarize:
1. What the AI got wrong
2. What clues it missed
3. What the human reviewer identified
4. How to improve future prompts for similar cases

AI Diagnosis: {ai_diagnosis}
Human Correction: {human_correction}
Case Symptom: {symptom}
```

---

## Template 5: Confidence Escalation Prompt

Use when confidence is 'low' and more information is needed.

```
You are a network troubleshooting assistant. The initial diagnosis has low confidence.
List exactly 3 additional show commands to run and what specific output to look for
in each command to narrow down the root cause.

Initial diagnosis: {initial_diagnosis}
Symptom: {symptom}
Current evidence: {current_evidence}

Respond in JSON:
{
  "additional_commands": [
    {"command": "...", "look_for": "..."},
    {"command": "...", "look_for": "..."},
    {"command": "...", "look_for": "..."}
  ]
}
```
