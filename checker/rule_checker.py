#!/usr/bin/env python3
"""
NetSage AI - Rule Checker
Deterministic rule-based validation script for Cisco network configurations.
Checks common configuration mistakes before/after AI diagnosis.
"""

import re
import json
import sys
from typing import Optional

# ─────────────────────────────────────────────
# ANSI Colors for terminal output
# ─────────────────────────────────────────────
class Colors:
    RED    = "\033[91m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    BLUE   = "\033[94m"
    CYAN   = "\033[96m"
    BOLD   = "\033[1m"
    RESET  = "\033[0m"

def ok(msg):    print(f"  {Colors.GREEN}[PASS]{Colors.RESET} {msg}")
def warn(msg):  print(f"  {Colors.YELLOW}[WARN]{Colors.RESET} {msg}")
def fail(msg):  print(f"  {Colors.RED}[FAIL]{Colors.RESET} {msg}")
def info(msg):  print(f"  {Colors.CYAN}[INFO]{Colors.RESET} {msg}")


# ─────────────────────────────────────────────
# IP Utility Functions
# ─────────────────────────────────────────────
def ip_to_int(ip: str) -> int:
    """Convert dotted-decimal IP to integer."""
    parts = ip.strip().split(".")
    if len(parts) != 4:
        raise ValueError(f"Invalid IP: {ip}")
    return sum(int(p) << (24 - 8 * i) for i, p in enumerate(parts))

def mask_to_prefix(mask: str) -> int:
    """Convert dotted-decimal subnet mask to prefix length."""
    return bin(ip_to_int(mask)).count("1")

def network_address(ip: str, mask: str) -> int:
    """Return the network address integer for ip/mask."""
    return ip_to_int(ip) & ip_to_int(mask)

def same_subnet(ip1: str, ip2: str, mask: str) -> bool:
    """Check if two IPs are in the same subnet."""
    return network_address(ip1, mask) == network_address(ip2, mask)


# ─────────────────────────────────────────────
# CHECK 1: Duplicate IP Addresses
# ─────────────────────────────────────────────
def check_duplicate_ips(devices: list[dict]) -> list[str]:
    """
    Detect duplicate IP addresses across all device interfaces.
    
    devices: list of {"name": str, "interfaces": [{"name": str, "ip": str}]}
    """
    issues = []
    seen = {}  # ip -> (device, interface)

    for device in devices:
        for iface in device.get("interfaces", []):
            ip = iface.get("ip")
            if not ip or ip.lower() == "dhcp":
                continue
            key = ip.strip()
            if key in seen:
                msg = (f"Duplicate IP {key} on {device['name']}/{iface['name']} "
                       f"and {seen[key][0]}/{seen[key][1]}")
                issues.append(msg)
                fail(msg)
            else:
                seen[key] = (device["name"], iface["name"])

    if not issues:
        ok("No duplicate IP addresses found.")
    return issues


# ─────────────────────────────────────────────
# CHECK 2: Wrong Subnet Masks
# ─────────────────────────────────────────────
VALID_MASKS = {
    "255.255.255.0", "255.255.0.0", "255.0.0.0",
    "255.255.255.128", "255.255.255.192", "255.255.255.224",
    "255.255.255.240", "255.255.255.248", "255.255.255.252",
    "255.255.128.0", "255.255.192.0", "255.255.224.0",
    "255.255.240.0", "255.255.248.0"
}

def check_wrong_masks(devices: list[dict]) -> list[str]:
    """Detect non-standard or potentially wrong subnet masks."""
    issues = []

    for device in devices:
        for iface in device.get("interfaces", []):
            mask = iface.get("mask")
            if not mask:
                continue
            if mask not in VALID_MASKS:
                msg = (f"Unusual subnet mask {mask} on "
                       f"{device['name']}/{iface['name']} - verify intent")
                issues.append(msg)
                warn(msg)
            else:
                ok(f"{device['name']}/{iface['name']}: mask {mask} is standard.")

    return issues


# ─────────────────────────────────────────────
# CHECK 3: Gateway Mismatch
# ─────────────────────────────────────────────
def check_gateway_mismatch(hosts: list[dict]) -> list[str]:
    """
    Check if host default gateway is on the same subnet as the host IP.
    
    hosts: list of {"name": str, "ip": str, "mask": str, "gateway": str}
    """
    issues = []

    for host in hosts:
        ip      = host.get("ip")
        mask    = host.get("mask")
        gateway = host.get("gateway")
        name    = host.get("name", "Unknown")

        if not all([ip, mask, gateway]):
            warn(f"{name}: missing ip/mask/gateway - skipping.")
            continue

        try:
            if not same_subnet(ip, gateway, mask):
                msg = (f"Gateway mismatch on {name}: "
                       f"host IP {ip}/{mask_to_prefix(mask)} but gateway {gateway} "
                       f"is NOT in the same subnet.")
                issues.append(msg)
                fail(msg)
            else:
                ok(f"{name}: gateway {gateway} is reachable from {ip}/{mask_to_prefix(mask)}.")
        except ValueError as e:
            warn(f"{name}: could not check gateway - {e}")

    return issues


# ─────────────────────────────────────────────
# CHECK 4: Interface Down
# ─────────────────────────────────────────────
def check_interfaces_down(interfaces: list[dict]) -> list[str]:
    """
    Detect administratively down or link-down interfaces.
    
    interfaces: list of {"device": str, "name": str, "status": str, "protocol": str}
    """
    issues = []

    for iface in interfaces:
        status   = iface.get("status", "").lower()
        protocol = iface.get("protocol", "").lower()
        name     = f"{iface.get('device','?')}/{iface.get('name','?')}"

        if "admin" in status or "administratively" in status:
            msg = f"Interface {name} is administratively down - run 'no shutdown'."
            issues.append(msg)
            fail(msg)
        elif status == "down" or protocol == "down":
            msg = f"Interface {name} is down (status={status}, protocol={protocol}) - check cable/config."
            issues.append(msg)
            warn(msg)
        else:
            ok(f"Interface {name}: status={status}, protocol={protocol} - UP.")

    return issues


# ─────────────────────────────────────────────
# CHECK 5: Missing VLAN
# ─────────────────────────────────────────────
def check_missing_vlans(vlan_database: list[int], used_vlans: list[int]) -> list[str]:
    """
    Detect VLANs referenced by ports but not present in the VLAN database.
    
    vlan_database: list of VLAN IDs in the switch VLAN DB
    used_vlans: list of VLAN IDs assigned to ports
    """
    issues = []
    missing = [v for v in used_vlans if v not in vlan_database]

    for vlan in missing:
        msg = f"VLAN {vlan} is assigned to a port but MISSING from the VLAN database - add it with 'vlan {vlan}'."
        issues.append(msg)
        fail(msg)

    present = [v for v in used_vlans if v in vlan_database]
    for vlan in present:
        ok(f"VLAN {vlan} exists in database and is assigned to ports.")

    return issues


# ─────────────────────────────────────────────
# CHECK 6: Missing Routes
# ─────────────────────────────────────────────
def check_missing_routes(routing_table: list[str], required_networks: list[str]) -> list[str]:
    """
    Detect required networks that are absent from the routing table.
    
    routing_table: list of network strings from 'show ip route' (e.g., "192.168.10.0/24")
    required_networks: list of networks that must be reachable
    """
    issues = []

    for net in required_networks:
        found = any(net in entry for entry in routing_table)
        if not found:
            msg = f"Required network {net} is MISSING from the routing table - add static/dynamic route."
            issues.append(msg)
            fail(msg)
        else:
            ok(f"Route to {net} found in routing table.")

    return issues


# ─────────────────────────────────────────────
# RULE CHECKER RUNNER
# ─────────────────────────────────────────────
def run_all_checks(config: dict) -> dict:
    """
    Run all deterministic checks against a network configuration dict.
    Returns a summary dict with results.
    """
    results = {
        "total_issues": 0,
        "checks": {}
    }

    print(f"\n{Colors.BOLD}{Colors.BLUE}╔══════════════════════════════════════════╗{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}║        NetSage AI - Rule Checker         ║{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}╚══════════════════════════════════════════╝{Colors.RESET}\n")

    # ── Check 1: Duplicate IPs ──
    print(f"{Colors.BOLD}[1] Checking for Duplicate IP Addresses...{Colors.RESET}")
    dup_issues = check_duplicate_ips(config.get("devices", []))
    results["checks"]["duplicate_ips"] = dup_issues
    results["total_issues"] += len(dup_issues)
    print()

    # ── Check 2: Wrong Masks ──
    print(f"{Colors.BOLD}[2] Checking Subnet Masks...{Colors.RESET}")
    mask_issues = check_wrong_masks(config.get("devices", []))
    results["checks"]["wrong_masks"] = mask_issues
    results["total_issues"] += len(mask_issues)
    print()

    # ── Check 3: Gateway Mismatch ──
    print(f"{Colors.BOLD}[3] Checking Gateway Reachability...{Colors.RESET}")
    gw_issues = check_gateway_mismatch(config.get("hosts", []))
    results["checks"]["gateway_mismatch"] = gw_issues
    results["total_issues"] += len(gw_issues)
    print()

    # ── Check 4: Interfaces Down ──
    print(f"{Colors.BOLD}[4] Checking Interface Status...{Colors.RESET}")
    iface_issues = check_interfaces_down(config.get("interfaces", []))
    results["checks"]["interfaces_down"] = iface_issues
    results["total_issues"] += len(iface_issues)
    print()

    # ── Check 5: Missing VLANs ──
    print(f"{Colors.BOLD}[5] Checking VLAN Database...{Colors.RESET}")
    vlan_issues = check_missing_vlans(
        config.get("vlan_database", []),
        config.get("used_vlans", [])
    )
    results["checks"]["missing_vlans"] = vlan_issues
    results["total_issues"] += len(vlan_issues)
    print()

    # ── Check 6: Missing Routes ──
    print(f"{Colors.BOLD}[6] Checking Routing Table...{Colors.RESET}")
    route_issues = check_missing_routes(
        config.get("routing_table", []),
        config.get("required_networks", [])
    )
    results["checks"]["missing_routes"] = route_issues
    results["total_issues"] += len(route_issues)
    print()

    # ── Summary ──
    total = results["total_issues"]
    color = Colors.RED if total > 0 else Colors.GREEN
    print(f"{Colors.BOLD}{'─'*44}{Colors.RESET}")
    print(f"{Colors.BOLD}SUMMARY: {color}{total} issue(s) found across all checks.{Colors.RESET}")
    print(f"{'─'*44}\n")

    return results


# ─────────────────────────────────────────────
# DEMO / SAMPLE RUN
# ─────────────────────────────────────────────
SAMPLE_CONFIG = {
    "devices": [
        {
            "name": "R1",
            "interfaces": [
                {"name": "Fa0/0",   "ip": "192.168.1.1",  "mask": "255.255.255.0"},
                {"name": "Fa0/1",   "ip": "10.0.0.1",     "mask": "255.255.255.252"},
                {"name": "Fa0/0.30","ip": "192.168.30.1",  "mask": "255.255.255.0"},
            ]
        },
        {
            "name": "R2",
            "interfaces": [
                {"name": "Fa0/0",   "ip": "192.168.1.1",  "mask": "255.255.255.0"},  # DUPLICATE!
                {"name": "Fa0/1",   "ip": "10.0.0.2",     "mask": "255.255.255.252"},
            ]
        }
    ],
    "hosts": [
        {"name": "PC1",    "ip": "192.168.1.10", "mask": "255.255.255.0", "gateway": "192.168.1.1"},
        {"name": "PC2",    "ip": "192.168.1.20", "mask": "255.255.255.0", "gateway": "192.168.1.1"},
        {"name": "PC_BAD", "ip": "192.168.2.50", "mask": "255.255.255.0", "gateway": "192.168.1.1"},  # MISMATCH!
        {"name": "Server", "ip": "192.168.30.10","mask": "255.255.255.0", "gateway": "192.168.30.1"},
    ],
    "interfaces": [
        {"device": "R1", "name": "Fa0/0",   "status": "up",                   "protocol": "up"},
        {"device": "R1", "name": "Fa0/0.30","status": "up",                   "protocol": "down"},  # DOWN!
        {"device": "R1", "name": "Fa0/1",   "status": "administratively down","protocol": "down"},  # ADMIN DOWN!
        {"device": "SW1", "name": "Fa0/1",  "status": "up",                   "protocol": "up"},
    ],
    "vlan_database": [1, 10, 20],
    "used_vlans":    [1, 10, 20, 30, 40],   # 30, 40 MISSING!
    "routing_table": [
        "192.168.1.0/24 directly connected",
        "10.0.0.0/30 directly connected",
    ],
    "required_networks": [
        "192.168.30.0",
        "192.168.20.0",
        "10.0.0.0",
    ]
}


def parse_show_ip_route(raw: str) -> list[str]:
    """Parse raw 'show ip route' output into a list of network strings."""
    lines = raw.strip().splitlines()
    routes = []
    for line in lines:
        match = re.search(r'(\d+\.\d+\.\d+\.\d+)/(\d+)', line)
        if match:
            routes.append(f"{match.group(1)}/{match.group(2)}")
    return routes


def parse_show_vlan_brief(raw: str) -> tuple[list[int], list[int]]:
    """
    Parse 'show vlan brief' output.
    Returns (vlan_ids_in_db, vlan_ids_assigned_to_ports).
    """
    vlan_ids = []
    lines = raw.strip().splitlines()
    for line in lines:
        match = re.match(r'^\s*(\d+)\s+\S+', line)
        if match:
            vid = int(match.group(1))
            if vid != 1002 <= vid <= 1005:  # exclude reserved
                vlan_ids.append(vid)
    return vlan_ids, vlan_ids  # simplified: all in DB are also assigned


if __name__ == "__main__":
    print(f"\n{Colors.BOLD}Running NetSage AI Rule Checker with SAMPLE CONFIG...{Colors.RESET}")
    print("(Pass a JSON config file path as argument for real use)\n")

    config = SAMPLE_CONFIG

    # Allow passing a JSON config file as argument
    if len(sys.argv) > 1:
        try:
            with open(sys.argv[1]) as f:
                config = json.load(f)
            print(f"Loaded config from: {sys.argv[1]}\n")
        except Exception as e:
            print(f"Warning: Could not load {sys.argv[1]}: {e}")
            print("Using sample config instead.\n")

    results = run_all_checks(config)

    # Save results to JSON
    output_file = "logs/rule_checker_results.json"
    try:
        import os
        os.makedirs("logs", exist_ok=True)
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"{Colors.CYAN}Results saved to {output_file}{Colors.RESET}")
    except Exception as e:
        print(f"Could not save results: {e}")
