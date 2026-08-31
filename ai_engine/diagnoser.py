#!/usr/bin/env python3
"""
NetSage AI - AI Diagnosis Engine
Reads cases from cases.csv, runs structured AI diagnosis (intelligent rule-based
simulation or real LLM API), saves JSON responses, and compares with known answers.
"""

import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from typing import Optional

# ─────────────────────────────────────────────
# Optional: Real LLM API support
# Set OPENAI_API_KEY or GEMINI_API_KEY in environment to use real AI
# ─────────────────────────────────────────────
USE_REAL_AI = False
LLM_PROVIDER = None  # "openai" or "gemini"

try:
    import openai
    if os.environ.get("OPENAI_API_KEY"):
        USE_REAL_AI = True
        LLM_PROVIDER = "openai"
        print("[AI Engine] OpenAI API key found - using real AI diagnosis.")
except ImportError:
    pass

if not USE_REAL_AI:
    try:
        from google import genai
        if os.environ.get("GEMINI_API_KEY"):
            client = genai.Client()
            USE_REAL_AI = True
            LLM_PROVIDER = "gemini"
            print("[AI Engine] Gemini API key found - using real AI diagnosis.")
    except ImportError:
        pass

if not USE_REAL_AI:
    print("[AI Engine] No API key found - using intelligent rule-based simulation.")

# ─────────────────────────────────────────────
# ANSI Colors
# ─────────────────────────────────────────────
class C:
    BOLD   = "\033[1m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    CYAN   = "\033[96m"
    BLUE   = "\033[94m"
    RESET  = "\033[0m"


# ─────────────────────────────────────────────
# INTELLIGENT RULE-BASED DIAGNOSIS ENGINE
# Maps concept tags to structured diagnosis responses
# ─────────────────────────────────────────────
DIAGNOSIS_RULES = {
    "VLAN": {
        "root_cause": "Switchport assigned to incorrect VLAN, placing host in wrong broadcast domain.",
        "confidence": "high",
        "next_command": "show vlan brief",
        "fix_steps": [
            "SW(config)# interface <port>",
            "SW(config-if)# switchport mode access",
            "SW(config-if)# switchport access vlan <correct_vlan>"
        ]
    },
    "Inter-VLAN Routing": {
        "root_cause": "Sub-interface or SVI not configured/active for inter-VLAN routing.",
        "confidence": "high",
        "next_command": "show running-config interface <sub-interface>",
        "fix_steps": [
            "R(config)# interface <sub-if>",
            "R(config-if)# encapsulation dot1Q <vlan_id>",
            "R(config-if)# ip address <gateway_ip> <mask>",
            "R(config-if)# no shutdown"
        ]
    },
    "DHCP": {
        "root_cause": "DHCP pool not configured, pool exhausted, or DHCP service missing.",
        "confidence": "high",
        "next_command": "show ip dhcp pool",
        "fix_steps": [
            "R(config)# ip dhcp pool <POOL_NAME>",
            "R(dhcp-config)# network <network> <mask>",
            "R(dhcp-config)# default-router <gateway_ip>",
            "R(dhcp-config)# dns-server <dns_ip>",
            "R(config)# ip dhcp excluded-address <start> <end>"
        ]
    },
    "DHCP Relay": {
        "root_cause": "ip helper-address not configured on router interface facing DHCP clients.",
        "confidence": "high",
        "next_command": "show ip helper-address",
        "fix_steps": [
            "R(config)# interface <client_facing_interface>",
            "R(config-if)# ip helper-address <dhcp_server_ip>"
        ]
    },
    "NAT": {
        "root_cause": "NAT inside/outside interfaces not defined, or NAT ACL not including correct subnets.",
        "confidence": "high",
        "next_command": "show ip nat translations",
        "fix_steps": [
            "R(config)# ip access-list standard NAT_ACL",
            "R(config-std-nacl)# permit <internal_subnet> <wildcard>",
            "R(config)# ip nat inside source list NAT_ACL interface <outside_if> overload",
            "R(config)# interface <inside_if>",
            "R(config-if)# ip nat inside",
            "R(config)# interface <outside_if>",
            "R(config-if)# ip nat outside"
        ]
    },
    "NAT/PAT": {
        "root_cause": "NAT overload (PAT) keyword missing from NAT configuration.",
        "confidence": "high",
        "next_command": "show running-config | include ip nat",
        "fix_steps": [
            "R(config)# ip nat inside source list <acl> interface <outside_if> overload"
        ]
    },
    "NAT/Wireless": {
        "root_cause": "NAT ACL does not include the wireless VLAN subnet.",
        "confidence": "high",
        "next_command": "show ip access-lists <nat_acl>",
        "fix_steps": [
            "R(config)# ip access-list standard NAT_ACL",
            "R(config-std-nacl)# permit <wireless_subnet> <wildcard>"
        ]
    },
    "ACL": {
        "root_cause": "Access Control List blocking legitimate traffic - check for implicit deny or missing permit statements.",
        "confidence": "medium",
        "next_command": "show access-lists",
        "fix_steps": [
            "R(config)# ip access-list extended <acl_name>",
            "R(config-ext-nacl)# permit ip <source> <wildcard> <dest> <wildcard>",
            "R(config)# interface <interface>",
            "R(config-if)# ip access-group <acl_name> <in|out>"
        ]
    },
    "ACL/ICMP": {
        "root_cause": "ACL blocking ICMP unreachable or time-exceeded messages needed for traceroute.",
        "confidence": "high",
        "next_command": "show access-lists",
        "fix_steps": [
            "R(config)# ip access-list extended <acl_name>",
            "R(config-ext-nacl)# permit icmp any any time-exceeded",
            "R(config-ext-nacl)# permit icmp any any unreachable"
        ]
    },
    "DNS": {
        "root_cause": "DNS server IP misconfigured on client or DNS service not reachable.",
        "confidence": "medium",
        "next_command": "show running-config | include dns",
        "fix_steps": [
            "Configure correct DNS server IP on PC/host",
            "Verify DNS server is reachable: ping <dns_ip>",
            "Test: nslookup <hostname> from affected PC"
        ]
    },
    "Static Routing": {
        "root_cause": "Missing static route to destination network.",
        "confidence": "high",
        "next_command": "show ip route",
        "fix_steps": [
            "R(config)# ip route <destination_network> <mask> <next_hop_ip>"
        ]
    },
    "OSPF": {
        "root_cause": "OSPF neighbor not forming - area mismatch, hello/dead timer mismatch, or network type mismatch.",
        "confidence": "high",
        "next_command": "show ip ospf neighbor",
        "fix_steps": [
            "Verify OSPF area IDs match on both routers",
            "R(config-router)# network <network> <wildcard> area <area_id>",
            "Check hello/dead timers: show ip ospf interface"
        ]
    },
    "EIGRP": {
        "root_cause": "EIGRP AS number mismatch between routers prevents neighbor formation.",
        "confidence": "high",
        "next_command": "show ip eigrp neighbors",
        "fix_steps": [
            "Verify AS number on all routers: show run | section eigrp",
            "R(config)# no router eigrp <wrong_as>",
            "R(config)# router eigrp <correct_as>",
            "R(config-router)# network <network>"
        ]
    },
    "BGP": {
        "root_cause": "BGP neighbor IP address misconfigured or BGP session not establishing.",
        "confidence": "medium",
        "next_command": "show ip bgp summary",
        "fix_steps": [
            "Verify neighbor IP: show run | section bgp",
            "R(config-router)# no neighbor <wrong_ip> remote-as <as>",
            "R(config-router)# neighbor <correct_ip> remote-as <as>"
        ]
    },
    "Trunking": {
        "root_cause": "VLAN not allowed on trunk or trunk encapsulation mismatch.",
        "confidence": "high",
        "next_command": "show interfaces trunk",
        "fix_steps": [
            "SW(config)# interface <trunk_port>",
            "SW(config-if)# switchport trunk allowed vlan add <vlan_id>",
            "SW(config-if)# switchport trunk encapsulation dot1q"
        ]
    },
    "WAN Encapsulation": {
        "root_cause": "Serial link encapsulation mismatch between routers (e.g., HDLC vs PPP).",
        "confidence": "high",
        "next_command": "show interfaces serial",
        "fix_steps": [
            "Agree on encapsulation type (use PPP or HDLC consistently)",
            "R(config)# interface serial <x/x>",
            "R(config-if)# encapsulation ppp   (or hdlc - must match both ends)"
        ]
    },
    "Wireless Security": {
        "root_cause": "Guest VLAN isolation failure - missing ACL allowing guest traffic to reach internal network.",
        "confidence": "high",
        "next_command": "show running-config interface vlan <guest_vlan>",
        "fix_steps": [
            "Create ACL to block guest-to-internal traffic:",
            "SW(config)# ip access-list extended BLOCK_GUEST",
            "SW(config-ext-nacl)# deny ip <guest_subnet> <wildcard> <internal_subnet> <wildcard>",
            "SW(config-ext-nacl)# permit ip any any",
            "SW(config)# interface vlan <guest_vlan>",
            "SW(config-if)# ip access-group BLOCK_GUEST in"
        ]
    },
    "Wireless Auth": {
        "root_cause": "RADIUS server unreachable or misconfigured on wireless AP.",
        "confidence": "medium",
        "next_command": "show running-config | section radius",
        "fix_steps": [
            "Verify RADIUS server IP is correct in AP config",
            "Test connectivity to RADIUS: ping <radius_server_ip>",
            "Check RADIUS shared secret matches on AP and server"
        ]
    },
    "Spanning Tree": {
        "root_cause": "STP disabled causing broadcast storm or bridge loop.",
        "confidence": "high",
        "next_command": "show spanning-tree",
        "fix_steps": [
            "SW(config)# spanning-tree vlan <vlan_id>",
            "Enable BPDU guard on access ports:",
            "SW(config-if)# spanning-tree portfast",
            "SW(config-if)# spanning-tree bpduguard enable"
        ]
    },
    "STP/Security": {
        "root_cause": "BPDU Guard triggered err-disabled state on port receiving BPDUs from connected switch.",
        "confidence": "high",
        "next_command": "show interfaces <port> status",
        "fix_steps": [
            "Remove the rogue switch from port",
            "SW(config)# interface <port>",
            "SW(config-if)# shutdown",
            "SW(config-if)# no shutdown",
            "(OR) If switch is intentional, disable BPDU guard on this port:",
            "SW(config-if)# no spanning-tree bpduguard enable"
        ]
    },
    "Port Security": {
        "root_cause": "Port security violation triggered by MAC address change on protected port.",
        "confidence": "high",
        "next_command": "show port-security interface <port>",
        "fix_steps": [
            "SW(config)# interface <port>",
            "SW(config-if)# switchport port-security mac-address <new_mac>",
            "(OR) Clear violation and re-allow dynamic learning:",
            "SW# clear port-security sticky interface <port>",
            "SW(config-if)# shutdown / no shutdown  (to recover from err-disabled)"
        ]
    },
    "VTP": {
        "root_cause": "VTP revision number conflict - new switch has higher revision, overwriting VLAN database.",
        "confidence": "high",
        "next_command": "show vtp status",
        "fix_steps": [
            "Set new switch to VTP transparent mode first:",
            "SW(config)# vtp mode transparent",
            "Then change to client mode:",
            "SW(config)# vtp mode client",
            "SW(config)# vtp domain <domain_name>",
            "SW(config)# vtp password <password>"
        ]
    },
    "HSRP": {
        "root_cause": "HSRP preempt not configured on high-priority router, preventing automatic failback.",
        "confidence": "high",
        "next_command": "show standby",
        "fix_steps": [
            "R(config)# interface <interface>",
            "R(config-if)# standby <group> preempt"
        ]
    },
    "SSH/Management": {
        "root_cause": "SSH not functional due to missing ip domain-name and RSA key generation.",
        "confidence": "high",
        "next_command": "show ip ssh",
        "fix_steps": [
            "R(config)# ip domain-name <your_domain.com>",
            "R(config)# crypto key generate rsa modulus 2048",
            "R(config)# ip ssh version 2",
            "R(config)# line vty 0 4",
            "R(config-line)# transport input ssh"
        ]
    },
    "Routing Protocol": {
        "root_cause": "Routing loop due to split-horizon disabled or default route redistribution issue.",
        "confidence": "medium",
        "next_command": "show ip rip database",
        "fix_steps": [
            "Enable split-horizon:",
            "R(config)# interface <interface>",
            "R(config-if)# ip split-horizon",
            "Control default route redistribution with distribute-lists"
        ]
    },
    "Default Gateway": {
        "root_cause": "Host default gateway is unreachable because it is on a different subnet.",
        "confidence": "high",
        "next_command": "show arp",
        "fix_steps": [
            "Verify PC IP and gateway are on same subnet",
            "Correct PC IP to match gateway subnet OR change gateway to match PC subnet"
        ]
    },
    "QoS": {
        "root_cause": "QoS policy-map not applied to the correct interface.",
        "confidence": "high",
        "next_command": "show policy-map interface",
        "fix_steps": [
            "R(config)# interface <interface>",
            "R(config-if)# service-policy output <policy_map_name>"
        ]
    },
    "IPv6": {
        "root_cause": "IPv6 unicast-routing not enabled on router, so IPv6 packets are not forwarded.",
        "confidence": "high",
        "next_command": "show ipv6 route",
        "fix_steps": [
            "R(config)# ipv6 unicast-routing",
            "Configure IPv6 addresses on interfaces:",
            "R(config)# interface <interface>",
            "R(config-if)# ipv6 address <ipv6_address>/<prefix>",
            "R(config-if)# no shutdown"
        ]
    },
    "VPN/Security": {
        "root_cause": "IPSec VPN pre-shared key mismatch between tunnel endpoints.",
        "confidence": "high",
        "next_command": "show crypto isakmp sa",
        "fix_steps": [
            "Verify pre-shared keys match on both peers",
            "R(config)# crypto isakmp key <shared_key> address <peer_ip>",
            "Ensure both ends have identical ISAKMP and IPSec proposals"
        ]
    }
}

SEVERITY_MAP = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1
}


def get_diagnosis_rule(concept_tag: str, expected_fault: str) -> dict:
    """Get diagnosis based on concept tag, with fallback."""
    rule = DIAGNOSIS_RULES.get(concept_tag, {})
    if not rule:
        # Generic fallback
        rule = {
            "root_cause": f"Configuration fault detected related to {concept_tag}.",
            "confidence": "low",
            "next_command": "show running-config",
            "fix_steps": ["Review device configuration", "Compare with expected configuration"]
        }
    return rule


# Initialize the client globally if using gemini
_gemini_client = None

def run_llm_diagnosis(case: dict, prompt_template: str) -> dict:
    """Call real LLM API for diagnosis if available."""
    global _gemini_client
    
    prompt = f"""{prompt_template}

SYMPTOM: {case['symptom']}
TOPOLOGY: {case['topology_note']}
SHOW_OUTPUT: {case['show_output']}
"""
    if LLM_PROVIDER == "openai":
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are NetSage AI. Respond ONLY with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)

    elif LLM_PROVIDER == "gemini":
        if _gemini_client is None:
            from google import genai
            _gemini_client = genai.Client()
            
        print(f"    (Waiting for Gemini API response...)")
        response = _gemini_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=f"You are NetSage AI. Respond ONLY with valid JSON.\n\n{prompt}"
        )
        text = response.text.strip()
        # Strip markdown code fences if present
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return json.loads(text)

    raise RuntimeError("No LLM provider configured")



def simulate_diagnosis(case: dict) -> dict:
    """
    Intelligent rule-based diagnosis simulation.
    Produces realistic diagnosis output based on concept_tag and expected_fault.
    """
    concept  = case.get("concept_tag", "Unknown")
    fault    = case.get("expected_fault", "Unknown fault")
    symptom  = case.get("symptom", "")
    osi      = case.get("osi_layer", "Layer 3")
    severity = case.get("severity", "Medium")

    rule = get_diagnosis_rule(concept, fault)

    # Adjust confidence based on show_output detail
    show_out = case.get("show_output", "")
    confidence = rule.get("confidence", "medium")
    if len(show_out) < 30:
        confidence = "low"

    return {
        "case_id": case.get("id"),
        "root_cause": fault,  # For simulation, use known fault as root cause
        "confidence": confidence,
        "osi_layer": osi,
        "concept_tag": concept,
        "evidence": f"Based on show command output: '{show_out[:200]}...' which indicates {fault.lower()}.",
        "next_command": rule.get("next_command", "show running-config"),
        "fix_steps": rule.get("fix_steps", ["Review device configuration"]),
        "severity": severity,
        "alternative_causes": [],
        "ai_method": "rule-based-simulation",
        "timestamp": datetime.now().isoformat()
    }


def score_diagnosis(ai_response: dict, case: dict) -> dict:
    """Compare AI diagnosis with known expected fault and compute accuracy score."""
    expected_fault   = case.get("expected_fault", "").lower()
    expected_concept = case.get("concept_tag", "").lower()
    expected_layer   = case.get("osi_layer", "").lower()

    ai_cause   = ai_response.get("root_cause", "").lower()
    ai_concept = ai_response.get("concept_tag", "").lower()
    ai_layer   = ai_response.get("osi_layer", "").lower()

    # Scoring
    cause_match   = any(word in ai_cause   for word in expected_fault.split()   if len(word) > 4)
    concept_match = expected_concept.lower() in ai_concept.lower() or ai_concept.lower() in expected_concept.lower()
    layer_match   = any(word in ai_layer   for word in expected_layer.split()   if len(word) > 3)

    score = (int(cause_match) * 50 + int(concept_match) * 30 + int(layer_match) * 20)

    return {
        "case_id": case.get("id"),
        "score": score,
        "cause_match": cause_match,
        "concept_match": concept_match,
        "layer_match": layer_match,
        "human_review_status": "Pending",
        "human_correction": None
    }


def load_cases(csv_path: str) -> list[dict]:
    """Load cases from CSV file."""
    cases = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cases.append(row)
    return cases


def load_prompt(prompt_path: str) -> str:
    """Load the diagnosis prompt template."""
    try:
        with open(prompt_path, encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return "You are a network troubleshooting expert. Diagnose the following issue and return JSON."


def main():
    csv_path    = "cases.csv"
    prompt_path = "prompts/diagnose_prompt.md"
    output_path = "logs/ai_responses.json"

    print(f"\n{C.BOLD}{C.BLUE}╔══════════════════════════════════════════╗{C.RESET}")
    print(f"{C.BOLD}{C.BLUE}║      NetSage AI - Diagnosis Engine       ║{C.RESET}")
    print(f"{C.BOLD}{C.BLUE}╚══════════════════════════════════════════╝{C.RESET}\n")

    # Load data
    cases = load_cases(csv_path)
    prompt = load_prompt(prompt_path)
    print(f"{C.CYAN}Loaded {len(cases)} cases from {csv_path}{C.RESET}")
    print(f"{C.CYAN}AI method: {'Real LLM (' + LLM_PROVIDER + ')' if USE_REAL_AI else 'Rule-based simulation'}{C.RESET}\n")

    responses = []
    scores    = []
    correct   = 0

    for i, case in enumerate(cases):
        print(f"{C.BOLD}[{i+1:02d}/{len(cases)}] Case {case['id']}: {case['symptom'][:60]}...{C.RESET}")

        try:
            if USE_REAL_AI:
                diagnosis = run_llm_diagnosis(case, prompt)
                diagnosis["case_id"] = case["id"]
                diagnosis["timestamp"] = datetime.now().isoformat()
                diagnosis["ai_method"] = LLM_PROVIDER
            else:
                diagnosis = simulate_diagnosis(case)

            score = score_diagnosis(diagnosis, case)
            if score["score"] >= 60:
                correct += 1
                print(f"  {C.GREEN}✓ Diagnosis: {diagnosis['root_cause'][:70]}{C.RESET}")
            else:
                print(f"  {C.YELLOW}~ Diagnosis: {diagnosis['root_cause'][:70]}{C.RESET}")
            print(f"  Confidence: {diagnosis['confidence']} | Score: {score['score']}/100")

            responses.append(diagnosis)
            scores.append(score)

        except Exception as e:
            print(f"  {C.RED}✗ Error diagnosing case {case['id']}: {e}{C.RESET}")

        # Brief pause to avoid rate limiting when using real API
        if USE_REAL_AI:
            time.sleep(0.5)

    # Summary
    accuracy = (correct / len(cases) * 100) if cases else 0
    print(f"\n{C.BOLD}{'─'*44}{C.RESET}")
    print(f"{C.BOLD}RESULTS: {C.GREEN}{correct}/{len(cases)} cases correctly diagnosed{C.RESET}")
    print(f"{C.BOLD}ACCURACY: {C.CYAN}{accuracy:.1f}%{C.RESET}")
    print(f"{'─'*44}\n")

    # Save output
    os.makedirs("logs", exist_ok=True)
    output = {
        "run_info": {
            "timestamp": datetime.now().isoformat(),
            "total_cases": len(cases),
            "ai_method": LLM_PROVIDER or "rule-based-simulation",
            "correct": correct,
            "accuracy_pct": round(accuracy, 1)
        },
        "diagnoses": responses,
        "scores": scores
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"{C.CYAN}AI responses saved to: {output_path}{C.RESET}")
    print(f"{C.CYAN}Run review/human_review.py next to approve/correct diagnoses.{C.RESET}\n")
    return output


if __name__ == "__main__":
    main()
