/**
 * NetSage AI - Dashboard JavaScript
 * Dynamically fetches ../logs/ai_responses.json + ../logs/human_review_log.json
 * on every page-load and on every Refresh click, so the dashboard always
 * reflects the latest diagnoser.py / human_review.py run.
 *
 * Falls back to the embedded snapshot below if the files cannot be fetched
 * (e.g. the page is opened directly via file:// without a local HTTP server).
 */

/* ─────────────────────────────────────────
   FALLBACK EMBEDDED DATA
   (used only when ../logs/*.json cannot be fetched)
───────────────────────────────────────────*/

const AI_RESPONSES_EMBEDDED = {
  "run_info": {
    "timestamp": "2026-08-26T11:47:17.953281",
    "total_cases": 35,
    "ai_method": "rule-based-simulation",
    "correct": 35,
    "accuracy_pct": 100.0
  },
  "diagnoses": [
    { "case_id":"1",  "root_cause":"PC1 assigned to wrong VLAN (VLAN 1 instead of VLAN 10)",            "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"VLAN",             "severity":"Medium",   "next_command":"show vlan brief",                              "fix_steps":["SW(config)# interface <port>","SW(config-if)# switchport mode access","SW(config-if)# switchport access vlan <correct_vlan>"],                                                                                                                                                          "evidence":"Based on show command output: 'show vlan brief: PC1 port Fa0/1 in VLAN 1; PC2 port Fa0/2 in VLAN 10...' which indicates pc1 assigned to wrong vlan (vlan 1 instead of vlan 10)." },
    { "case_id":"2",  "root_cause":"Sub-interface Fa0/0.30 not configured or encapsulation missing",    "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"Inter-VLAN Routing","severity":"High",     "next_command":"show running-config interface <sub-interface>", "fix_steps":["R(config)# interface <sub-if>","R(config-if)# encapsulation dot1Q <vlan_id>","R(config-if)# ip address <gateway_ip> <mask>","R(config-if)# no shutdown"],                                                                                                                    "evidence":"Based on show command output: 'show ip route: no route for 192.168.30.0; show interfaces Fa0/0.30: down/down...' which indicates sub-interface fa0/0.30 not configured or encapsulation missing." },
    { "case_id":"3",  "root_cause":"DHCP pool not configured on router",                                "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"DHCP",             "severity":"High",     "next_command":"show ip dhcp pool",                            "fix_steps":["R(config)# ip dhcp pool <POOL_NAME>","R(dhcp-config)# network <network> <mask>","R(dhcp-config)# default-router <gateway_ip>","R(dhcp-config)# dns-server <dns_ip>","R(config)# ip dhcp excluded-address <start> <end>"],                                                  "evidence":"Based on show command output: 'show ip dhcp pool: no pool defined; show running-config: no ip dhcp pool...' which indicates dhcp pool not configured on router." },
    { "case_id":"4",  "root_cause":"NAT inside interface not defined",                                  "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"NAT",              "severity":"High",     "next_command":"show ip nat translations",                      "fix_steps":["R(config)# ip access-list standard NAT_ACL","R(config-std-nacl)# permit <internal_subnet> <wildcard>","R(config)# ip nat inside source list NAT_ACL interface <outside_if> overload","R(config)# interface <inside_if>","R(config-if)# ip nat inside","R(config)# interface <outside_if>","R(config-if)# ip nat outside"], "evidence":"Based on show command output: 'show ip nat translations: empty; show run: no ip nat inside on Fa0/0...' which indicates nat inside interface not defined." },
    { "case_id":"5",  "root_cause":"DNS server IP misconfigured on client",                             "confidence":"medium", "osi_layer":"Layer 7",   "concept_tag":"DNS",              "severity":"Medium",   "next_command":"show running-config | include dns",             "fix_steps":["Configure correct DNS server IP on PC/host","Verify DNS server is reachable: ping <dns_ip>","Test: nslookup <hostname> from affected PC"],                                                                                                                                  "evidence":"Based on show command output: 'show run on PC: dns-server 192.168.1.254 (wrong)...' which indicates dns server ip misconfigured on client." },
    { "case_id":"6",  "root_cause":"Extended ACL blocking inter-VLAN traffic",                          "confidence":"medium", "osi_layer":"Layer 4",   "concept_tag":"ACL",              "severity":"High",     "next_command":"show access-lists",                            "fix_steps":["R(config)# ip access-list extended <acl_name>","R(config-ext-nacl)# permit ip <source> <wildcard> <dest> <wildcard>","R(config)# interface <interface>","R(config-if)# ip access-group <acl_name> <in|out>"],                                                              "evidence":"Based on show command output: 'show access-lists: ACL 100 blocking 192.168.10.0 to 192.168.20.0...' which indicates extended acl blocking inter-vlan traffic." },
    { "case_id":"7",  "root_cause":"VLAN 40 pruned from trunk",                                         "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"Trunking",         "severity":"Medium",   "next_command":"show interfaces trunk",                        "fix_steps":["SW(config)# interface <trunk_port>","SW(config-if)# switchport trunk allowed vlan add <vlan_id>","SW(config-if)# switchport trunk encapsulation dot1q"],                                                                                                                   "evidence":"Based on show command output: 'show interfaces trunk: allowed VLANs 1-39,41-4094 (VLAN 40 missing)...' which indicates vlan 40 pruned from trunk." },
    { "case_id":"8",  "root_cause":"ip helper-address not configured for DHCP relay",                   "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"DHCP Relay",       "severity":"High",     "next_command":"show ip helper-address",                       "fix_steps":["R(config)# interface <client_facing_interface>","R(config-if)# ip helper-address <dhcp_server_ip>"],                                                                                                                                                                   "evidence":"Based on show command output: 'show ip helper-address on Fa0/0: not configured...' which indicates ip helper-address not configured for dhcp relay." },
    { "case_id":"9",  "root_cause":"Encapsulation mismatch on serial link",                             "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"WAN Encapsulation","severity":"High",     "next_command":"show interfaces serial",                       "fix_steps":["Agree on encapsulation type (use PPP or HDLC consistently)","R(config)# interface serial <x/x>","R(config-if)# encapsulation ppp   (or hdlc - must match both ends)"],                                                                                                 "evidence":"Based on show command output: 'show interfaces Se0/0: encapsulation HDLC on R1; show interfaces Se0/0 R2: encapsulation PPP...' which indicates encapsulation mismatch on serial link." },
    { "case_id":"10", "root_cause":"Guest VLAN isolation failure - missing ACL",                        "confidence":"high",   "osi_layer":"Layer 2/3", "concept_tag":"Wireless Security","severity":"Critical", "next_command":"show running-config interface vlan <guest_vlan>","fix_steps":["Create ACL to block guest-to-internal traffic:","SW(config)# ip access-list extended BLOCK_GUEST","SW(config-ext-nacl)# deny ip <guest_subnet> <wildcard> <internal_subnet> <wildcard>","SW(config-ext-nacl)# permit ip any any","SW(config)# interface vlan <guest_vlan>","SW(config-if)# ip access-group BLOCK_GUEST in"], "evidence":"Based on show command output: 'show access-lists: no ACL on guest VLAN interface; show vlan: guest in same broadcast domain...' which indicates guest vlan isolation failure - missing acl." },
    { "case_id":"11", "root_cause":"RIP split-horizon disabled causing routing loop",                   "confidence":"medium", "osi_layer":"Layer 3",   "concept_tag":"Routing Protocol", "severity":"High",     "next_command":"show ip rip database",                         "fix_steps":["Enable split-horizon:","R(config)# interface <interface>","R(config-if)# ip split-horizon","Control default route redistribution with distribute-lists"],                                                                                                                "evidence":"Based on show command output: 'show ip rip: R2 advertising default route back to R1...' which indicates rip split-horizon disabled causing routing loop." },
    { "case_id":"12", "root_cause":"Gateway IP misconfigured on PC (wrong subnet)",                     "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"Default Gateway",  "severity":"Medium",   "next_command":"show arp",                                     "fix_steps":["Verify PC IP and gateway are on same subnet","Correct PC IP to match gateway subnet OR change gateway to match PC subnet"],                                                                                                                                            "evidence":"Based on show command output: 'show arp: gateway MAC missing; ping 192.168.1.1 fails; show run on router: gateway IP 192.168.2.1...' which indicates gateway ip misconfigured on pc (wrong subnet)." },
    { "case_id":"13", "root_cause":"STP disabled causing broadcast storm",                              "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"Spanning Tree",    "severity":"Critical", "next_command":"show spanning-tree",                           "fix_steps":["SW(config)# spanning-tree vlan <vlan_id>","Enable BPDU guard on access ports:","SW(config-if)# spanning-tree portfast","SW(config-if)# spanning-tree bpduguard enable"],                                                                                              "evidence":"Based on show command output: 'show spanning-tree: STP disabled on VLAN 1...' which indicates stp disabled causing broadcast storm." },
    { "case_id":"14", "root_cause":"IPSec pre-shared key mismatch",                                    "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"VPN/Security",     "severity":"High",     "next_command":"show crypto isakmp sa",                        "fix_steps":["Verify pre-shared keys match on both peers","R(config)# crypto isakmp key <shared_key> address <peer_ip>","Ensure both ends have identical ISAKMP and IPSec proposals"],                                                                                            "evidence":"Based on show command output: 'show crypto isakmp sa: QM_IDLE not reached; show run: pre-shared key mismatch...' which indicates ipsec pre-shared key mismatch." },
    { "case_id":"15", "root_cause":"OSPF area mismatch between routers",                               "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"OSPF",             "severity":"High",     "next_command":"show ip ospf neighbor",                        "fix_steps":["Verify OSPF area IDs match on both routers","R(config-router)# network <network> <wildcard> area <area_id>","Check hello/dead timers: show ip ospf interface"],                                                                                                  "evidence":"Based on show command output: 'show ip ospf neighbor: empty; show run: R1 area 0, R2 area 1...' which indicates ospf area mismatch between routers." },
    { "case_id":"16", "root_cause":"ACL on Layer 3 SVI blocking return traffic",                       "confidence":"medium", "osi_layer":"Layer 3/4", "concept_tag":"ACL",              "severity":"Medium",   "next_command":"show access-lists",                            "fix_steps":["R(config)# ip access-list extended <acl_name>","R(config-ext-nacl)# permit ip <source> <wildcard> <dest> <wildcard>","R(config)# interface <interface>","R(config-if)# ip access-group <acl_name> <in|out>"],                                                              "evidence":"Based on show command output: 'show ip route: routes present; show access-lists: ACL 101 implicit deny...' which indicates acl on layer 3 svi blocking return traffic." },
    { "case_id":"17", "root_cause":"Duplicate DHCP servers assigning overlapping pool",                 "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"DHCP",             "severity":"Medium",   "next_command":"show ip dhcp pool",                            "fix_steps":["R(config)# ip dhcp pool <POOL_NAME>","R(dhcp-config)# network <network> <mask>","R(dhcp-config)# default-router <gateway_ip>","R(dhcp-config)# dns-server <dns_ip>","R(config)# ip dhcp excluded-address <start> <end>"],                                                  "evidence":"Based on show command output: 'show ip dhcp conflict: entries present; two routers both running DHCP for same pool...' which indicates duplicate dhcp servers assigning overlapping pool." },
    { "case_id":"18", "root_cause":"IP domain-name not configured, RSA keys not generated",            "confidence":"high",   "osi_layer":"Layer 7",   "concept_tag":"SSH/Management",   "severity":"Low",      "next_command":"show ip ssh",                                  "fix_steps":["R(config)# ip domain-name <your_domain.com>","R(config)# crypto key generate rsa modulus 2048","R(config)# ip ssh version 2","R(config)# line vty 0 4","R(config-line)# transport input ssh"],                                                                        "evidence":"Based on show command output: 'show ip ssh: SSH disabled; show run: no ip domain-name configured...' which indicates ip domain-name not configured, rsa keys not generated." },
    { "case_id":"19", "root_cause":"Port security violation - MAC address not updated",                 "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"Port Security",    "severity":"Medium",   "next_command":"show port-security interface <port>",          "fix_steps":["SW(config)# interface <port>","SW(config-if)# switchport port-security mac-address <new_mac>","(OR) Clear violation and re-allow dynamic learning:","SW# clear port-security sticky interface <port>","SW(config-if)# shutdown / no shutdown  (to recover from err-disabled)"], "evidence":"Based on show command output: 'show port-security interface Fa0/5: violation shutdown; new MAC not allowed...' which indicates port security violation - mac address not updated." },
    { "case_id":"20", "root_cause":"EIGRP AS number mismatch on R3",                                   "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"EIGRP",            "severity":"High",     "next_command":"show ip eigrp neighbors",                      "fix_steps":["Verify AS number on all routers: show run | section eigrp","R(config)# no router eigrp <wrong_as>","R(config)# router eigrp <correct_as>","R(config-router)# network <network>"],                                                                                      "evidence":"Based on show command output: 'show ip eigrp neighbors R3: empty; show run R3: eigrp AS 200...' which indicates eigrp as number mismatch on r3." },
    { "case_id":"21", "root_cause":"Wrong default-router in DHCP pool configuration",                  "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"DHCP",             "severity":"Medium",   "next_command":"show ip dhcp pool",                            "fix_steps":["R(config)# ip dhcp pool <POOL_NAME>","R(dhcp-config)# network <network> <mask>","R(dhcp-config)# default-router <gateway_ip>","R(dhcp-config)# dns-server <dns_ip>","R(config)# ip dhcp excluded-address <start> <end>"],                                                  "evidence":"Based on show command output: 'show ip dhcp pool: default-router 192.168.1.254 (should be 192.168.1.1)...' which indicates wrong default-router in dhcp pool configuration." },
    { "case_id":"22", "root_cause":"RADIUS server IP wrong in AP configuration",                       "confidence":"medium", "osi_layer":"Layer 2",   "concept_tag":"Wireless Auth",    "severity":"High",     "next_command":"show running-config | section radius",         "fix_steps":["Verify RADIUS server IP is correct in AP config","Test connectivity to RADIUS: ping <radius_server_ip>","Check RADIUS shared secret matches on AP and server"],                                                                                                      "evidence":"Based on show command output: 'show dot11 associations: none; AP logs show EAP failure; RADIUS server unreachable...' which indicates radius server ip wrong in ap configuration." },
    { "case_id":"23", "root_cause":"NAT overload (PAT) keyword missing",                               "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"NAT/PAT",          "severity":"High",     "next_command":"show running-config | include ip nat",         "fix_steps":["R(config)# ip nat inside source list <acl> interface <outside_if> overload"],                                                                                                                                                                                         "evidence":"Based on show command output: 'show ip nat translations: only one entry; show run: ip nat pool has no overload keyword...' which indicates nat overload (pat) keyword missing." },
    { "case_id":"24", "root_cause":"ACL blocking ICMP time-exceeded messages",                         "confidence":"high",   "osi_layer":"Layer 3/4", "concept_tag":"ACL/ICMP",         "severity":"Low",      "next_command":"show access-lists",                            "fix_steps":["R(config)# ip access-list extended <acl_name>","R(config-ext-nacl)# permit icmp any any time-exceeded","R(config-ext-nacl)# permit icmp any any unreachable"],                                                                                                        "evidence":"Based on show command output: 'show access-lists on R2: ICMP unreachable blocked; show run: ACL blocking time-exceeded...' which indicates acl blocking icmp time-exceeded messages." },
    { "case_id":"25", "root_cause":"VTP configuration revision number conflict",                        "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"VTP",              "severity":"High",     "next_command":"show vtp status",                              "fix_steps":["Set new switch to VTP transparent mode first:","SW(config)# vtp mode transparent","Then change to client mode:","SW(config)# vtp mode client","SW(config)# vtp domain <domain_name>","SW(config)# vtp password <password>"],                                               "evidence":"Based on show command output: 'show vtp status: new switch in VTP server mode with higher revision number...' which indicates vtp configuration revision number conflict." },
    { "case_id":"26", "root_cause":"BGP neighbor IP address misconfigured",                            "confidence":"medium", "osi_layer":"Layer 3",   "concept_tag":"BGP",              "severity":"Critical", "next_command":"show ip bgp summary",                          "fix_steps":["Verify neighbor IP: show run | section bgp","R(config-router)# no neighbor <wrong_ip> remote-as <as>","R(config-router)# neighbor <correct_ip> remote-as <as>"],                                                                                                    "evidence":"Based on show command output: 'show ip bgp summary: BGP state Idle/Active; show run: wrong neighbor IP...' which indicates bgp neighbor ip address misconfigured." },
    { "case_id":"27", "root_cause":"QoS policy-map not applied to correct interface",                  "confidence":"high",   "osi_layer":"Layer 2-4", "concept_tag":"QoS",              "severity":"Low",      "next_command":"show policy-map interface",                    "fix_steps":["R(config)# interface <interface>","R(config-if)# service-policy output <policy_map_name>"],                                                                                                                                                                           "evidence":"Based on show command output: 'show policy-map interface: policy not applied; show run: service-policy missing on interface...' which indicates qos policy-map not applied to correct interface." },
    { "case_id":"28", "root_cause":"HSRP preempt not configured on higher priority router",            "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"HSRP",             "severity":"Medium",   "next_command":"show standby",                                 "fix_steps":["R(config)# interface <interface>","R(config-if)# standby <group> preempt"],                                                                                                                                                                                          "evidence":"Based on show command output: 'show standby: R2 priority 90, R1 priority 100; preempt not configured on R1...' which indicates hsrp preempt not configured on higher priority router." },
    { "case_id":"29", "root_cause":"ACL missing permit for established/return TCP sessions",           "confidence":"medium", "osi_layer":"Layer 4",   "concept_tag":"ACL",              "severity":"High",     "next_command":"show access-lists",                            "fix_steps":["R(config)# ip access-list extended <acl_name>","R(config-ext-nacl)# permit ip <source> <wildcard> <dest> <wildcard>","R(config)# interface <interface>","R(config-if)# ip access-group <acl_name> <in|out>"],                                                              "evidence":"Based on show command output: 'show access-lists 110: permit tcp any any established; missing permit icmp...' which indicates acl missing permit for established/return tcp sessions." },
    { "case_id":"30", "root_cause":"NAT ACL not including wireless VLAN 50 subnet",                   "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"NAT/Wireless",     "severity":"Medium",   "next_command":"show ip access-lists <nat_acl>",               "fix_steps":["R(config)# ip access-list standard NAT_ACL","R(config-std-nacl)# permit <wireless_subnet> <wildcard>"],                                                                                                                                                                "evidence":"Based on show command output: 'show ip nat inside: Fa0/0 only; show run: access-list for NAT missing VLAN 50 subnet...' which indicates nat acl not including wireless vlan 50 subnet." },
    { "case_id":"31", "root_cause":"BPDU Guard triggered by connected switch - port err-disabled",    "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"STP/Security",     "severity":"High",     "next_command":"show interfaces <port> status",                "fix_steps":["Remove the rogue switch from port","SW(config)# interface <port>","SW(config-if)# shutdown","SW(config-if)# no shutdown","(OR) If switch is intentional, disable BPDU guard on this port:","SW(config-if)# no spanning-tree bpduguard enable"],                          "evidence":"Based on show command output: 'show interfaces Fa0/3: err-disabled; show logging: BPDU received...' which indicates bpdu guard triggered by connected switch - port err-disabled." },
    { "case_id":"32", "root_cause":"Trunk encapsulation mismatch (ISL vs 802.1Q)",                    "confidence":"high",   "osi_layer":"Layer 2",   "concept_tag":"Trunking",         "severity":"Medium",   "next_command":"show interfaces trunk",                        "fix_steps":["SW(config)# interface <trunk_port>","SW(config-if)# switchport trunk allowed vlan add <vlan_id>","SW(config-if)# switchport trunk encapsulation dot1q"],                                                                                                                   "evidence":"Based on show command output: 'show interfaces trunk: ISL encapsulation; other switches use 802.1Q...' which indicates trunk encapsulation mismatch (isl vs 802.1q)." },
    { "case_id":"33", "root_cause":"Missing static route to remote network",                          "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"Static Routing",   "severity":"Medium",   "next_command":"show ip route",                                "fix_steps":["R(config)# ip route <destination_network> <mask> <next_hop_ip>"],                                                                                                                                                                                                    "evidence":"Based on show command output: 'show ip route: route to 10.0.2.0 missing; only directly connected routes...' which indicates missing static route to remote network." },
    { "case_id":"34", "root_cause":"IPv6 unicast-routing not enabled on router",                      "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"IPv6",             "severity":"Medium",   "next_command":"show ipv6 route",                              "fix_steps":["R(config)# ipv6 unicast-routing","Configure IPv6 addresses on interfaces:","R(config)# interface <interface>","R(config-if)# ipv6 address <ipv6_address>/<prefix>","R(config-if)# no shutdown"],                                                                         "evidence":"Based on show command output: 'show ipv6 route: no routes; show run router: no ipv6 unicast-routing...' which indicates ipv6 unicast-routing not enabled on router." },
    { "case_id":"35", "root_cause":"ip helper-address points to wrong DHCP server IP",                "confidence":"high",   "osi_layer":"Layer 3",   "concept_tag":"DHCP Relay",       "severity":"High",     "next_command":"show ip helper-address",                       "fix_steps":["R(config)# interface <client_facing_interface>","R(config-if)# ip helper-address <dhcp_server_ip>"],                                                                                                                                                                   "evidence":"Based on show command output: 'show ip helper-address: configured but wrong DHCP server IP...' which indicates ip helper-address points to wrong dhcp server ip." }
  ],
  "scores": [
    {"case_id":"1","score":100},{"case_id":"2","score":100},{"case_id":"3","score":100},
    {"case_id":"4","score":100},{"case_id":"5","score":100},{"case_id":"6","score":100},
    {"case_id":"7","score":100},{"case_id":"8","score":100},{"case_id":"9","score":100},
    {"case_id":"10","score":100},{"case_id":"11","score":100},{"case_id":"12","score":100},
    {"case_id":"13","score":100},{"case_id":"14","score":100},{"case_id":"15","score":100},
    {"case_id":"16","score":100},{"case_id":"17","score":100},{"case_id":"18","score":100},
    {"case_id":"19","score":100},{"case_id":"20","score":100},{"case_id":"21","score":100},
    {"case_id":"22","score":100},{"case_id":"23","score":100},{"case_id":"24","score":100},
    {"case_id":"25","score":100},{"case_id":"26","score":100},{"case_id":"27","score":100},
    {"case_id":"28","score":100},{"case_id":"29","score":100},{"case_id":"30","score":100},
    {"case_id":"31","score":100},{"case_id":"32","score":100},{"case_id":"33","score":100},
    {"case_id":"34","score":100},{"case_id":"35","score":100}
  ]
};

const HUMAN_REVIEWS_EMBEDDED = [
  { "case_id":"1",  "status":"Accepted", "reviewed_at":"2026-08-26T09:00:00",           "symptom":"PC1 cannot ping PC2 in same VLAN",                          "ai_root_cause":"PC1 assigned to wrong VLAN (VLAN 1 instead of VLAN 10)",        "ai_confidence":"high",   "ai_concept":"VLAN",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Network Engineer - Alice" },
  { "case_id":"2",  "status":"Accepted", "reviewed_at":"2026-08-26T09:05:00",           "symptom":"PC gets IP but cannot reach server in VLAN 30",             "ai_root_cause":"Sub-interface Fa0/0.30 not configured or encapsulation missing","ai_confidence":"high",   "ai_concept":"Inter-VLAN Routing","human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Network Engineer - Alice" },
  { "case_id":"3",  "status":"Accepted", "reviewed_at":"2026-08-26T09:10:00",           "symptom":"DHCP clients not getting IP address",                       "ai_root_cause":"DHCP pool not configured on router",                            "ai_confidence":"high",   "ai_concept":"DHCP",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Network Engineer - Alice" },
  { "case_id":"4",  "status":"Accepted", "reviewed_at":"2026-08-26T11:46:19.167858",   "symptom":"PC can ping gateway but not reach internet",                 "ai_root_cause":"NAT inside interface not defined",                              "ai_confidence":"high",   "ai_concept":"NAT",              "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"5",  "status":"Edited",   "reviewed_at":"2026-08-26T09:15:00",           "symptom":"DNS resolution failing but IP connectivity works",           "ai_root_cause":"DNS server IP misconfigured on client",                         "ai_confidence":"medium", "ai_concept":"DNS",              "human_correction":"The DNS server itself was operational but the client was pointing to the wrong IP (192.168.1.254 instead of 8.8.8.8). Additionally, the router ACL was blocking outbound DNS (UDP port 53) queries, which the AI did not identify as a secondary factor.", "why_wrong":"AI focused only on DNS server IP config but missed that an ACL was also blocking UDP port 53 outbound on the router. The show output only mentioned wrong DNS IP, but the reviewer verified ACL was also a factor during lab replication.", "improvement_note":"When DNS symptom is present, AI should also check for ACL rules blocking UDP/TCP port 53. Include 'show access-lists' as a recommended next command for DNS cases.", "reviewer_name":"Network Engineer - Bob" },
  { "case_id":"6",  "status":"Accepted", "reviewed_at":"2026-08-26T11:46:24.017187",   "symptom":"Inter-VLAN traffic blocked between VLAN 10 and VLAN 20",     "ai_root_cause":"Extended ACL blocking inter-VLAN traffic",                     "ai_confidence":"medium", "ai_concept":"ACL",              "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"7",  "status":"Accepted", "reviewed_at":"2026-08-26T11:46:28.021286",   "symptom":"Trunk link not passing VLAN 40 traffic",                    "ai_root_cause":"VLAN 40 pruned from trunk",                                    "ai_confidence":"high",   "ai_concept":"Trunking",         "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"8",  "status":"Accepted", "reviewed_at":"2026-08-26T11:46:29.502764",   "symptom":"PC obtains APIPA address (169.254.x.x)",                    "ai_root_cause":"ip helper-address not configured for DHCP relay",               "ai_confidence":"high",   "ai_concept":"DHCP Relay",       "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"9",  "status":"Accepted", "reviewed_at":"2026-08-26T11:48:04.851274",   "symptom":"Router shows route but ping fails across WAN",               "ai_root_cause":"Encapsulation mismatch on serial link",                         "ai_confidence":"high",   "ai_concept":"WAN Encapsulation","human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"10", "status":"Edited",   "reviewed_at":"2026-08-26T09:25:00",           "symptom":"Guest WiFi can reach internal server",                      "ai_root_cause":"Guest VLAN isolation failure - missing ACL",                    "ai_confidence":"high",   "ai_concept":"Wireless Security","human_correction":"Root cause is correct but the fix is incomplete. The AP also needs to enable client isolation (wireless client-to-client isolation) in addition to the ACL. Without AP-level isolation, wireless clients in the guest VLAN can still communicate with each other and potentially ARP-spoof the gateway.", "why_wrong":"AI only recommended a router/switch ACL but did not account for the AP-level client isolation setting. This is a wireless-specific feature that purely routing-based AI diagnosis may overlook.", "improvement_note":"For wireless security cases, AI should recommend both network-layer (ACL/VLAN) isolation AND access-point-level client isolation configuration. Include 'show dot11 associations' and AP web GUI check in the fix steps.", "reviewer_name":"Network Engineer - Alice" },
  { "case_id":"11", "status":"Rejected", "reviewed_at":"2026-08-26T09:35:00",           "symptom":"Routing loop detected between R1 and R2",                   "ai_root_cause":"RIP split-horizon disabled causing routing loop",               "ai_confidence":"medium", "ai_concept":"Routing Protocol", "human_correction":"The actual cause was that a student accidentally configured 'default-information originate' on BOTH R1 and R2, causing each router to advertise a default route to the other. This created a mutual dependency routing loop. Split-horizon was actually enabled correctly. The fix was to remove 'default-information originate' from R2 and only keep it on R1 (which had the actual internet connection).", "why_wrong":"The AI correctly identified a routing loop but diagnosed the wrong sub-cause. The show output said 'R2 advertising default route back to R1' which the AI interpreted as a split-horizon issue. However, the actual config shows split-horizon was on, and the issue was redundant default route advertisement from both routers.", "improvement_note":"When routing loops involve default routes, AI should always check 'default-information originate' configuration on ALL routers, not just assume split-horizon. Add check: 'show run | include default-information' to the routing loop diagnostic prompt.", "reviewer_name":"Senior Network Engineer - Carlos" },
  { "case_id":"12", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:05.480242",   "symptom":"PC cannot ping default gateway",                            "ai_root_cause":"Gateway IP misconfigured on PC (wrong subnet)",                 "ai_confidence":"high",   "ai_concept":"Default Gateway",  "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"13", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:05.951159",   "symptom":"STP causing network loop",                                  "ai_root_cause":"STP disabled causing broadcast storm",                         "ai_confidence":"high",   "ai_concept":"Spanning Tree",    "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"14", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:06.395726",   "symptom":"VPN tunnel not establishing",                               "ai_root_cause":"IPSec pre-shared key mismatch",                                 "ai_confidence":"high",   "ai_concept":"VPN/Security",     "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"15", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:06.830362",   "symptom":"OSPF neighbors not forming",                                "ai_root_cause":"OSPF area mismatch between routers",                           "ai_confidence":"high",   "ai_concept":"OSPF",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"16", "status":"Rejected", "reviewed_at":"2026-08-26T09:50:00",           "symptom":"PC in VLAN 10 cannot reach server in VLAN 20 despite routing","ai_root_cause":"ACL on Layer 3 SVI blocking return traffic",                  "ai_confidence":"medium", "ai_concept":"ACL",              "human_correction":"While an ACL was involved, the specific issue was that the student had applied the ACL in the wrong direction (inbound on VLAN 20 SVI instead of VLAN 10). The ACL itself had correct permit rules but was applied to the wrong interface direction. Moving the ACL to VLAN 10 SVI inbound resolved the issue without changing the ACL rules.", "why_wrong":"AI correctly identified ACL as the issue but did not distinguish between wrong ACL rules vs. wrong ACL placement/direction. The show access-lists output showed the ACL hit counts increasing, which the AI interpreted as 'ACL blocking traffic' without identifying WHICH interface direction the ACL was applied.", "improvement_note":"ACL diagnosis should always include checking BOTH the ACL content AND the interface/direction it is applied. Recommend adding 'show running-config | include access-group' to the ACL troubleshooting prompt to reveal interface application direction.", "reviewer_name":"Senior Network Engineer - Carlos" },
  { "case_id":"17", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:07.202344",   "symptom":"DHCP duplicate IP conflict",                                "ai_root_cause":"Duplicate DHCP servers assigning overlapping pool",             "ai_confidence":"high",   "ai_concept":"DHCP",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"18", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:07.558553",   "symptom":"Cannot SSH to router from management PC",                   "ai_root_cause":"IP domain-name not configured, RSA keys not generated",         "ai_confidence":"high",   "ai_concept":"SSH/Management",   "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"19", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:07.899256",   "symptom":"Port security violation dropping frames",                   "ai_root_cause":"Port security violation - MAC address not updated",             "ai_confidence":"high",   "ai_concept":"Port Security",    "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"20", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:08.272955",   "symptom":"EIGRP routes not appearing on R3",                          "ai_root_cause":"EIGRP AS number mismatch on R3",                                "ai_confidence":"high",   "ai_concept":"EIGRP",            "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"21", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:08.682980",   "symptom":"PC gets correct IP but wrong gateway via DHCP",             "ai_root_cause":"Wrong default-router in DHCP pool configuration",               "ai_confidence":"high",   "ai_concept":"DHCP",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"22", "status":"Edited",   "reviewed_at":"2026-08-26T10:05:00",           "symptom":"Wireless client cannot associate to AP",                    "ai_root_cause":"RADIUS server IP wrong in AP configuration",                    "ai_confidence":"medium", "ai_concept":"Wireless Auth",    "human_correction":"RADIUS server IP was correct. The actual issue was a RADIUS shared-secret mismatch between the AP and the RADIUS server. The AI correctly identified RADIUS as the area of failure but incorrectly attributed it to wrong IP rather than wrong shared secret.", "why_wrong":"The show output mentioned 'RADIUS server unreachable' which could mean either wrong IP OR a firewall/secret issue. AI assumed wrong IP without verifying if the server was actually pingable. A ping test to the RADIUS server from the AP would have confirmed the IP was reachable but authentication still failed.", "improvement_note":"For RADIUS failures, AI should recommend: (1) ping RADIUS server from AP, (2) check shared secret, (3) check RADIUS port (1812/1813), (4) verify RADIUS client definition on server side. Order matters - IP/reachability first, then auth parameters.", "reviewer_name":"Network Engineer - Bob" },
  { "case_id":"23", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:09.067927",   "symptom":"NAT overload not working for multiple users",               "ai_root_cause":"NAT overload (PAT) keyword missing",                           "ai_confidence":"high",   "ai_concept":"NAT/PAT",          "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"24", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:09.466158",   "symptom":"Traceroute shows all hops timing out after R2",             "ai_root_cause":"ACL blocking ICMP time-exceeded messages",                     "ai_confidence":"high",   "ai_concept":"ACL/ICMP",         "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"25", "status":"Accepted", "reviewed_at":"2026-08-26T10:15:00",           "symptom":"VLAN database not propagating to new switch",               "ai_root_cause":"VTP configuration revision number conflict",                    "ai_confidence":"high",   "ai_concept":"VTP",              "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Network Engineer - Alice" },
  { "case_id":"26", "status":"Accepted", "reviewed_at":"2026-08-26T10:20:00",           "symptom":"BGP session flapping",                                      "ai_root_cause":"BGP neighbor IP address misconfigured",                         "ai_confidence":"medium", "ai_concept":"BGP",              "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Senior Network Engineer - Carlos" },
  { "case_id":"27", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:09.854745",   "symptom":"Traffic not being QoS marked correctly",                    "ai_root_cause":"QoS policy-map not applied to correct interface",               "ai_confidence":"high",   "ai_concept":"QoS",              "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"28", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:10.287675",   "symptom":"HSRP failover not occurring",                               "ai_root_cause":"HSRP preempt not configured on higher priority router",         "ai_confidence":"high",   "ai_concept":"HSRP",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"29", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:10.714844",   "symptom":"PC cannot reach server after ACL applied",                  "ai_root_cause":"ACL missing permit for established/return TCP sessions",        "ai_confidence":"medium", "ai_concept":"ACL",              "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"30", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:11.159200",   "symptom":"Wireless client gets IP but no internet",                   "ai_root_cause":"NAT ACL not including wireless VLAN 50 subnet",                 "ai_confidence":"high",   "ai_concept":"NAT/Wireless",     "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"31", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:11.552863",   "symptom":"Switch port stuck in err-disabled state",                   "ai_root_cause":"BPDU Guard triggered by connected switch - port err-disabled",  "ai_confidence":"high",   "ai_concept":"STP/Security",     "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"32", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:11.976746",   "symptom":"Slow network performance across trunk link",                 "ai_root_cause":"Trunk encapsulation mismatch (ISL vs 802.1Q)",                  "ai_confidence":"high",   "ai_concept":"Trunking",         "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" },
  { "case_id":"33", "status":"Accepted", "reviewed_at":"2026-08-26T10:25:00",           "symptom":"PC1 can ping R1 but not R2 on different segment",            "ai_root_cause":"Missing static route to remote network",                        "ai_confidence":"high",   "ai_concept":"Static Routing",   "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Network Engineer - Alice" },
  { "case_id":"34", "status":"Accepted", "reviewed_at":"2026-08-26T10:28:00",           "symptom":"IPv6 hosts cannot reach each other",                        "ai_root_cause":"IPv6 unicast-routing not enabled on router",                    "ai_confidence":"high",   "ai_concept":"IPv6",             "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Network Engineer - Bob" },
  { "case_id":"35", "status":"Accepted", "reviewed_at":"2026-08-26T11:48:12.368659",   "symptom":"DHCP server not reaching clients on remote segment",         "ai_root_cause":"ip helper-address points to wrong DHCP server IP",              "ai_confidence":"high",   "ai_concept":"DHCP Relay",       "human_correction":null, "why_wrong":null, "improvement_note":null, "reviewer_name":"Human Expert" }
];

/* ─────────────────────────────────────────
   LIVE DATA (populated by loadData)
───────────────────────────────────────────*/
let AI_RESPONSES   = AI_RESPONSES_EMBEDDED;
let HUMAN_REVIEWS  = HUMAN_REVIEWS_EMBEDDED;

/* scoreMap rebuilt after every data load */
let scoreMap = {};
function rebuildScoreMap() {
  scoreMap = {};
  (AI_RESPONSES.scores || []).forEach(s => { scoreMap[s.case_id] = s.score; });
}
rebuildScoreMap();

/* ─────────────────────────────────────────
   DATA LOADER  — fetches from ../logs/
───────────────────────────────────────────*/
async function loadData() {
  const bust = `?t=${Date.now()}`; // prevent browser from using cached copy
  let aiData, reviewData;

  try {
    const [r1, r2] = await Promise.all([
      fetch(`../logs/ai_responses.json${bust}`),
      fetch(`../logs/human_review_log.json${bust}`)
    ]);
    if (!r1.ok || !r2.ok) throw new Error('fetch failed');
    aiData     = await r1.json();
    reviewData = await r2.json();
  } catch {
    // Running via file:// or logs not yet generated — use embedded snapshot
    aiData     = AI_RESPONSES_EMBEDDED;
    reviewData = HUMAN_REVIEWS_EMBEDDED;
  }

  AI_RESPONSES  = aiData;
  HUMAN_REVIEWS = Array.isArray(reviewData) ? reviewData : HUMAN_REVIEWS_EMBEDDED;
  rebuildScoreMap();

  // Show "Live · HH:MM:SS" in topbar
  const updEl = document.getElementById('topbarUpdated');
  if (updEl) {
    const t = new Date();
    updEl.textContent = `Live · ${t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
    updEl.style.display = '';
  }
}

const RULE_CHECKER_RESULTS = {
  "total_issues": 7,
  "checks": {
    "duplicate_ips": ["Duplicate IP 192.168.1.1 on R2/Fa0/0 and R1/Fa0/0"],
    "wrong_masks": [],
    "gateway_mismatch": ["Gateway mismatch on PC_BAD: host IP 192.168.2.50/24 but gateway 192.168.1.1 is NOT in the same subnet."],
    "interfaces_down": [
      "Interface R1/Fa0/0.30 is down (status=up, protocol=down) - check cable/config.",
      "Interface R1/Fa0/1 is administratively down - run 'no shutdown'."
    ],
    "missing_vlans": [
      "VLAN 30 is assigned to a port but MISSING from the VLAN database - add it with 'vlan 30'.",
      "VLAN 40 is assigned to a port but MISSING from the VLAN database - add it with 'vlan 40'."
    ],
    "missing_routes": [
      "Required network 192.168.30.0 is MISSING from the routing table - add static/dynamic route.",
      "Required network 192.168.20.0 is MISSING from the routing table - add static/dynamic route."
    ]
  }
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────────*/

function confBadge(c) {
  const cls = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[c?.toLowerCase()] || 'badge-low';
  return `<span class="badge ${cls}">${c || 'N/A'}</span>`;
}

function sevBadge(s) {
  const cls = { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[s] || 'badge-low';
  return `<span class="badge ${cls}">${s || 'N/A'}</span>`;
}

function statusBadge(s) {
  const cls = { Accepted:'badge-accepted', Edited:'badge-edited', Rejected:'badge-rejected' }[s] || '';
  return `<span class="badge ${cls}">${s}</span>`;
}

function scoreBar(score) {
  const cls = score >= 80 ? 'score-high' : score >= 50 ? 'score-medium' : 'score-low';
  return `<div style="display:flex;align-items:center;gap:8px;">
    <span style="font-family:var(--mono);font-size:12px;color:var(--text-secondary);">${score}</span>
    <div class="score-bar" style="flex:1"><div class="score-fill ${cls}" style="width:${score}%"></div></div>
  </div>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function shortStr(str, n = 60) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) + ' ' +
           d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  } catch { return iso; }
}

/* ─────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────*/
const SECTIONS = ['overview','diagnoses','reviews','responsible','checker'];
const TITLES   = { overview:'Overview', diagnoses:'AI Diagnoses', reviews:'Human Reviews', responsible:'Responsible AI', checker:'Rule Checker' };

function showSection(id) {
  SECTIONS.forEach(s => {
    document.getElementById(`section-${s}`)?.classList.toggle('active', s === id);
    document.getElementById(`nav-${s}`)?.classList.toggle('active', s === id);
  });
  document.getElementById('breadcrumb').textContent = TITLES[id] || id;
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    showSection(el.dataset.section);
  });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ─────────────────────────────────────────
   CLOCK
───────────────────────────────────────────*/
function updateClock() {
  const now = new Date();
  document.getElementById('topbarTime').textContent =
    now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

/* ─────────────────────────────────────────
   KPI CARDS
───────────────────────────────────────────*/
function renderKPIs() {
  const { total_cases, accuracy_pct } = AI_RESPONSES.run_info;
  const reviewed  = HUMAN_REVIEWS.length;
  const accepted  = HUMAN_REVIEWS.filter(r => r.status === 'Accepted').length;
  const agreement = reviewed > 0 ? (accepted / reviewed * 100).toFixed(1) : '—';

  animateCount('kpiTotalCases', total_cases, '');
  animateCount('kpiAccuracy',   accuracy_pct, '%');
  animateCount('kpiReviewed',   reviewed, '');
  animateCount('kpiAgreement',  parseFloat(agreement), '%');
}

function animateCount(id, target, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 800, start = performance.now();
  const tick = now => {
    const prog = Math.min((now - start) / dur, 1);
    const val  = target * prog;
    el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
    if (prog < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ─────────────────────────────────────────
   CHARTS (Chart.js)
───────────────────────────────────────────*/

/* Track chart instances so we can destroy them before re-rendering */
const chartInstances = {};

function renderCharts() {
  const diagnoses = AI_RESPONSES.diagnoses;

  // Concept frequency
  const conceptCount = {};
  diagnoses.forEach(d => { conceptCount[d.concept_tag] = (conceptCount[d.concept_tag] || 0) + 1; });
  const cLabels = Object.keys(conceptCount).sort((a,b) => conceptCount[b] - conceptCount[a]);
  const cVals   = cLabels.map(k => conceptCount[k]);

  const PALETTE = [
    '#4f8ef7','#2ecc8e','#f5c842','#a855f7','#f05252','#22d3ee',
    '#fb923c','#e879f9','#34d399','#facc15','#60a5fa','#f87171',
    '#a3e635','#c084fc','#38bdf8','#fb7185','#4ade80','#fbbf24'
  ];

  // Destroy previous chart instance if it exists
  if (chartInstances.conceptChart) { chartInstances.conceptChart.destroy(); }
  chartInstances.conceptChart = new Chart(document.getElementById('conceptChart'), {
    type: 'bar',
    data: {
      labels: cLabels,
      datasets: [{
        data: cVals,
        backgroundColor: cLabels.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
        borderColor:     cLabels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b93b0', font: { size: 10, family: 'Inter' }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8b93b0', font: { size: 11 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Severity donut
  const sevCount = { Critical:0, High:0, Medium:0, Low:0 };
  diagnoses.forEach(d => { if (sevCount[d.severity] !== undefined) sevCount[d.severity]++; });

  // Destroy previous chart instance if it exists
  if (chartInstances.severityChart) { chartInstances.severityChart.destroy(); }
  chartInstances.severityChart = new Chart(document.getElementById('severityChart'), {
    type: 'doughnut',
    data: {
      labels: ['Critical','High','Medium','Low'],
      datasets: [{
        data: [sevCount.Critical, sevCount.High, sevCount.Medium, sevCount.Low],
        backgroundColor: ['#f05252cc','#4f8ef7cc','#f5c842cc','#6b7280cc'],
        borderColor:     ['#f05252','#4f8ef7','#f5c842','#6b7280'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { color: '#8b93b0', boxWidth: 12, padding: 12, font: { size: 12 } } }
      }
    }
  });

  // Review summary donut
  const acc = HUMAN_REVIEWS.filter(r=>r.status==='Accepted').length;
  const edi = HUMAN_REVIEWS.filter(r=>r.status==='Edited').length;
  const rej = HUMAN_REVIEWS.filter(r=>r.status==='Rejected').length;

  // Reset legend and destroy previous donut
  document.getElementById('reviewLegend').innerHTML = '';
  if (chartInstances.reviewDonut) { chartInstances.reviewDonut.destroy(); }
  chartInstances.reviewDonut = new Chart(document.getElementById('reviewDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Accepted','Edited','Rejected'],
      datasets: [{
        data: [acc, edi, rej],
        backgroundColor: ['#2ecc8ecc','#f5c842cc','#f05252cc'],
        borderColor: ['#2ecc8e','#f5c842','#f05252'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '62%',
      plugins: { legend: { display: false } }
    }
  });

  // Legend
  const leg = document.getElementById('reviewLegend');
  [['Accepted',acc,'#2ecc8e'],['Edited',edi,'#f5c842'],['Rejected',rej,'#f05252']].forEach(([lbl,val,col]) => {
    leg.innerHTML += `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
      <span style="width:10px;height:10px;border-radius:50%;background:${col};display:inline-block;"></span>
      <span style="color:var(--text-secondary);">${lbl}</span>
      <span style="margin-left:auto;font-weight:700;color:var(--text-primary);font-family:var(--mono);">${val}</span>
    </div>`;
  });
}

/* ─────────────────────────────────────────
   RECENT TABLE (overview)
───────────────────────────────────────────*/
function renderRecentTable() {
  const tb = document.getElementById('recentTableBody');
  const badge = document.getElementById('recentBadge');
  const recent = AI_RESPONSES.diagnoses.slice(0, 10);
  badge.textContent = `${recent.length} of ${AI_RESPONSES.diagnoses.length}`;
  tb.innerHTML = recent.map(d => {
    const score = scoreMap[d.case_id] ?? 0;
    return `<tr onclick="openModal(${JSON.stringify(d).replace(/"/g,'&quot;')})">
      <td>#${d.case_id}</td>
      <td style="max-width:220px;color:var(--text-primary);">${shortStr(d.root_cause,50)}</td>
      <td><span style="font-size:11.5px;color:var(--accent-cyan);">${escHtml(d.concept_tag)}</span></td>
      <td>${confBadge(d.confidence)}</td>
      <td>${sevBadge(d.severity)}</td>
      <td>${scoreBar(score)}</td>
    </tr>`;
  }).join('');
}

/* ─────────────────────────────────────────
   DIAGNOSES TABLE
───────────────────────────────────────────*/
let allDiagnoses = [];

function renderDiagnosesTable(list) {
  const tb = document.getElementById('diagTableBody');
  document.getElementById('diagCount').textContent = `${list.length} cases`;
  if (list.length === 0) {
    tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">No results match your filters.</td></tr>`;
    return;
  }
  tb.innerHTML = list.map(d => {
    const score = scoreMap[d.case_id] ?? 0;
    const dStr = JSON.stringify(d).replace(/"/g, '&quot;');
    return `<tr>
      <td>#${d.case_id}</td>
      <td style="max-width:260px;color:var(--text-primary);">${shortStr(d.root_cause,55)}</td>
      <td><span style="font-size:11.5px;color:var(--accent-cyan);">${escHtml(d.concept_tag)}</span></td>
      <td style="font-size:11.5px;">${escHtml(d.osi_layer)}</td>
      <td>${confBadge(d.confidence)}</td>
      <td>${sevBadge(d.severity)}</td>
      <td>${scoreBar(score)}</td>
      <td><button class="view-btn" onclick="openModal(${dStr})">View</button></td>
    </tr>`;
  }).join('');
}

function initDiagnosesFilters() {
  allDiagnoses = AI_RESPONSES.diagnoses;

  // Reset and repopulate concept filter (avoid duplicates on refresh)
  const sel = document.getElementById('diagFilterConcept');
  sel.innerHTML = '<option value="">All Concepts</option>';
  const concepts = [...new Set(allDiagnoses.map(d => d.concept_tag))].sort();
  concepts.forEach(c => { sel.innerHTML += `<option value="${escHtml(c)}">${escHtml(c)}</option>`; });

  renderDiagnosesTable(allDiagnoses);

  function applyFilters() {
    const q    = document.getElementById('diagSearch').value.toLowerCase();
    const con  = document.getElementById('diagFilterConcept').value;
    const conf = document.getElementById('diagFilterConf').value;
    const sev  = document.getElementById('diagFilterSeverity').value;

    const filtered = allDiagnoses.filter(d => {
      const matchQ    = !q    || d.root_cause.toLowerCase().includes(q) || d.concept_tag.toLowerCase().includes(q) || d.evidence?.toLowerCase().includes(q);
      const matchCon  = !con  || d.concept_tag === con;
      const matchConf = !conf || d.confidence?.toLowerCase() === conf;
      const matchSev  = !sev  || d.severity === sev;
      return matchQ && matchCon && matchConf && matchSev;
    });
    renderDiagnosesTable(filtered);
  }

  ['diagSearch','diagFilterConcept','diagFilterConf','diagFilterSeverity'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
  });
}

/* ─────────────────────────────────────────
   REVIEWS TABLE
───────────────────────────────────────────*/
function renderReviewsTable(list) {
  const tb = document.getElementById('revTableBody');
  document.getElementById('revCount').textContent = `${list.length} reviews`;
  if (list.length === 0) {
    tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">No results match your filters.</td></tr>`;
    return;
  }
  tb.innerHTML = list.map(r => {
    const rStr = JSON.stringify(r).replace(/"/g, '&quot;');
    return `<tr>
      <td>#${r.case_id}</td>
      <td style="max-width:200px;color:var(--text-primary);">${shortStr(r.symptom,45)}</td>
      <td style="max-width:220px;">${shortStr(r.ai_root_cause,50)}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="font-size:12px;color:var(--text-secondary);">${escHtml(r.reviewer_name)}</td>
      <td style="font-size:11px;font-family:var(--mono);color:var(--text-muted);">${fmtDate(r.reviewed_at)}</td>
      <td><button class="view-btn" onclick="openReviewModal(${rStr})">View</button></td>
    </tr>`;
  }).join('');
}

function initReviewsFilters() {
  // Reset reviewer filter (avoid duplicates on refresh)
  const sel = document.getElementById('revFilterReviewer');
  sel.innerHTML = '<option value="">All Reviewers</option>';
  const reviewers = [...new Set(HUMAN_REVIEWS.map(r => r.reviewer_name))].sort();
  reviewers.forEach(rv => { sel.innerHTML += `<option value="${escHtml(rv)}">${escHtml(rv)}</option>`; });

  renderReviewsTable(HUMAN_REVIEWS);

  function applyFilters() {
    const q   = document.getElementById('revSearch').value.toLowerCase();
    const st  = document.getElementById('revFilterStatus').value;
    const rv  = document.getElementById('revFilterReviewer').value;

    const filtered = HUMAN_REVIEWS.filter(r => {
      const matchQ  = !q  || r.symptom.toLowerCase().includes(q) || r.ai_root_cause.toLowerCase().includes(q) || (r.human_correction||'').toLowerCase().includes(q);
      const matchSt = !st || r.status === st;
      const matchRv = !rv || r.reviewer_name === rv;
      return matchQ && matchSt && matchRv;
    });
    renderReviewsTable(filtered);
  }

  ['revSearch','revFilterStatus','revFilterReviewer'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
  });
}

/* ─────────────────────────────────────────
   RESPONSIBLE AI
───────────────────────────────────────────*/
function renderResponsibleAI() {
  const total   = HUMAN_REVIEWS.length;
  const acc     = HUMAN_REVIEWS.filter(r => r.status === 'Accepted').length;
  const edited  = HUMAN_REVIEWS.filter(r => r.status === 'Edited').length;
  const rejected= HUMAN_REVIEWS.filter(r => r.status === 'Rejected').length;
  const corrected = edited + rejected;
  const agreement = total > 0 ? (acc / total * 100).toFixed(1) : 0;

  document.getElementById('respKpis').innerHTML = `
    <div class="resp-kpi"><div class="resp-kpi-val" style="color:var(--accent-blue);">${total}</div><div class="resp-kpi-lbl">Total Reviewed</div></div>
    <div class="resp-kpi"><div class="resp-kpi-val" style="color:var(--accent-red);">${corrected}</div><div class="resp-kpi-lbl">AI Corrections</div></div>
    <div class="resp-kpi"><div class="resp-kpi-val" style="color:var(--accent-green);">${agreement}%</div><div class="resp-kpi-lbl">AI Agreement Rate</div></div>
  `;

  const correctedCases = HUMAN_REVIEWS.filter(r => r.status === 'Edited' || r.status === 'Rejected');
  document.getElementById('respCases').innerHTML = correctedCases.map(r => `
    <div class="resp-case">
      <div class="resp-case-header">
        <span class="resp-case-id">Case #${r.case_id}</span>
        ${statusBadge(r.status)}
        <span style="margin-left:auto;font-size:11.5px;color:var(--text-muted);">${fmtDate(r.reviewed_at)} · ${escHtml(r.reviewer_name)}</span>
      </div>
      <p style="font-size:13.5px;color:var(--text-primary);margin-bottom:14px;font-weight:600;">${escHtml(r.symptom)}</p>
      <div class="resp-case-body">
        <div class="resp-field">
          <div class="resp-field-lbl">🤖 AI Diagnosis</div>
          <div class="resp-field-val ai-text">${escHtml(r.ai_root_cause)}</div>
        </div>
        <div class="resp-field">
          <div class="resp-field-lbl">✓ Human Correction</div>
          <div class="resp-field-val correction-text">${escHtml(r.human_correction) || '—'}</div>
        </div>
        <div class="resp-field">
          <div class="resp-field-lbl">🔍 Why AI Was Wrong</div>
          <div class="resp-field-val">${escHtml(r.why_wrong) || '—'}</div>
        </div>
        <div class="resp-field">
          <div class="resp-field-lbl">💡 Improvement Note</div>
          <div class="resp-field-val">${escHtml(r.improvement_note) || '—'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────
   RULE CHECKER
───────────────────────────────────────────*/
function renderRuleChecker() {
  const checks = RULE_CHECKER_RESULTS.checks;
  const defs = [
    { key:'duplicate_ips',    icon:'⊕', title:'Duplicate IPs' },
    { key:'wrong_masks',      icon:'◌', title:'Subnet Masks' },
    { key:'gateway_mismatch', icon:'⇌', title:'Gateway Reachability' },
    { key:'interfaces_down',  icon:'⬇', title:'Interface Status' },
    { key:'missing_vlans',    icon:'▣', title:'VLAN Database' },
    { key:'missing_routes',   icon:'↝', title:'Routing Table' }
  ];

  document.getElementById('checkerGrid').innerHTML = defs.map(def => {
    const issues = checks[def.key] || [];
    const hasFails = issues.some(i => i.toLowerCase().includes('missing') || i.toLowerCase().includes('duplicate') || i.toLowerCase().includes('not') || i.toLowerCase().includes('admin'));
    const hasWarns = issues.some(i => i.toLowerCase().includes('unusual') || i.toLowerCase().includes('check') || i.toLowerCase().includes('down'));
    const status = issues.length === 0 ? 'pass' : (hasFails ? 'fail' : 'warn');
    const statusLabel = { pass:'PASS', fail:'FAIL', warn:'WARN' }[status];

    const issueItems = issues.length > 0
      ? issues.map(i => {
          const isFail = i.toLowerCase().includes('missing') || i.toLowerCase().includes('duplicate') || i.toLowerCase().includes('admin');
          const isWarn = !isFail;
          const cls = isFail ? 'issue-fail' : 'issue-warn';
          const prefix = isFail ? '✕' : '⚠';
          return `<li class="check-issue ${cls}"><span>${prefix}</span><span>${escHtml(i)}</span></li>`;
        }).join('')
      : `<li class="check-issue issue-pass"><span>✓</span><span>No issues found</span></li>`;

    return `<div class="check-card">
      <div class="check-card-header">
        <span class="check-icon" style="color:${status==='pass'?'var(--accent-green)':status==='fail'?'var(--accent-red)':'var(--accent-yellow)'}">${def.icon}</span>
        <span class="check-title">${def.title}</span>
        <span class="check-status ${status}">${statusLabel}</span>
      </div>
      <ul class="check-issues">${issueItems}</ul>
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────────
   MODALS
───────────────────────────────────────────*/
function openModal(d) {
  const score = scoreMap[d.case_id] ?? 0;
  const review = HUMAN_REVIEWS.find(r => String(r.case_id) === String(d.case_id));
  const scoreCls = score >= 80 ? 'score-high' : score >= 50 ? 'score-medium' : 'score-low';

  const stepsHtml = (d.fix_steps || []).map((s,i) =>
    `<div class="modal-step"><span class="step-num">${i+1}</span><span class="step-text">${escHtml(s)}</span></div>`
  ).join('');

  const reviewSection = review ? `
    <div class="modal-field" style="border-color:${review.status==='Accepted'?'rgba(46,204,142,0.3)':review.status==='Edited'?'rgba(245,200,66,0.3)':'rgba(240,82,82,0.3)'}">
      <div class="modal-field-label">Human Review</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">${statusBadge(review.status)}<span style="font-size:11.5px;color:var(--text-muted);">${escHtml(review.reviewer_name)} · ${fmtDate(review.reviewed_at)}</span></div>
      ${review.human_correction ? `<div style="font-size:12.5px;color:var(--accent-green);line-height:1.55;">${escHtml(review.human_correction)}</div>` : ''}
    </div>
  ` : '';

  document.getElementById('modalTitle').textContent = `Case #${d.case_id} — ${d.concept_tag}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-field">
      <div class="modal-field-label">Root Cause</div>
      <div class="modal-field-value">${escHtml(d.root_cause)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
      <div class="modal-field"><div class="modal-field-label">Confidence</div><div>${confBadge(d.confidence)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Severity</div><div>${sevBadge(d.severity)}</div></div>
      <div class="modal-field"><div class="modal-field-label">OSI Layer</div><div style="font-size:12.5px;color:var(--accent-cyan);">${escHtml(d.osi_layer)}</div></div>
    </div>
    <div class="modal-field">
      <div class="modal-field-label">Evidence</div>
      <div class="modal-code">${escHtml(d.evidence)}</div>
    </div>
    <div class="modal-field">
      <div class="modal-field-label">Next Command</div>
      <div class="modal-code">${escHtml(d.next_command)}</div>
    </div>
    <div class="modal-field">
      <div class="modal-field-label">Fix Steps</div>
      <div class="modal-steps">${stepsHtml}</div>
    </div>
    <div class="modal-field">
      <div class="modal-field-label">Accuracy Score</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
        <span style="font-size:24px;font-weight:800;font-family:var(--mono);color:${score>=80?'var(--accent-green)':score>=50?'var(--accent-yellow)':'var(--accent-red)'};">${score}</span>
        <div class="score-bar" style="flex:1;height:8px;"><div class="score-fill ${scoreCls}" style="width:${score}%"></div></div>
      </div>
    </div>
    ${reviewSection}
  `;
  document.getElementById('modalBackdrop').style.display = 'flex';
}

function openReviewModal(r) {
  document.getElementById('modalTitle').textContent = `Review: Case #${r.case_id}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
      ${statusBadge(r.status)}
      <span style="font-size:12px;color:var(--text-muted);">${escHtml(r.reviewer_name)} · ${fmtDate(r.reviewed_at)}</span>
    </div>
    <div class="modal-field"><div class="modal-field-label">Symptom</div><div class="modal-field-value">${escHtml(r.symptom)}</div></div>
    <div class="modal-field"><div class="modal-field-label">AI Root Cause</div><div class="modal-field-value" style="color:var(--accent-yellow);">${escHtml(r.ai_root_cause)}</div></div>
    <div class="modal-field"><div class="modal-field-label">AI Confidence</div>${confBadge(r.ai_confidence)}</div>
    ${r.human_correction ? `<div class="modal-field"><div class="modal-field-label">Human Correction</div><div class="modal-field-value" style="color:var(--accent-green);">${escHtml(r.human_correction)}</div></div>` : ''}
    ${r.why_wrong ? `<div class="modal-field"><div class="modal-field-label">Why AI Was Wrong</div><div class="modal-field-value">${escHtml(r.why_wrong)}</div></div>` : ''}
    ${r.improvement_note ? `<div class="modal-field"><div class="modal-field-label">Improvement Note</div><div class="modal-field-value" style="color:var(--accent-cyan);">${escHtml(r.improvement_note)}</div></div>` : ''}
  `;
  document.getElementById('modalBackdrop').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalBackdrop').style.display = 'none';
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─────────────────────────────────────────
   REFRESH
───────────────────────────────────────────*/
document.getElementById('refreshBtn').addEventListener('click', async () => {
  const btn = document.getElementById('refreshBtn');
  btn.textContent = '↻ Loading…';
  btn.disabled = true;
  try {
    await loadData();
    // Reset filter search boxes
    ['diagSearch','revSearch'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['diagFilterConcept','diagFilterConf','diagFilterSeverity','revFilterStatus','revFilterReviewer']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderKPIs();
    renderCharts();
    renderRecentTable();
    initDiagnosesFilters();
    initReviewsFilters();
    renderResponsibleAI();
    renderRuleChecker();
  } finally {
    btn.textContent = '↻ Refresh';
    btn.disabled = false;
  }
});

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────────*/
(async function init() {
  await loadData();
  renderKPIs();
  renderCharts();
  renderRecentTable();
  initDiagnosesFilters();
  initReviewsFilters();
  renderResponsibleAI();
  renderRuleChecker();
})();
