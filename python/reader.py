import pyshark

def has_human_readable_info(packet):
    readable_protocols = ['HTTP', 'DNS', 'TLS']
    for protocol in readable_protocols:
        if protocol.lower() in packet:
            return True
    return False

def print_packet_info(packet):
    if not has_human_readable_info(packet):
        return

    timestamp = packet.sniff_time
    print(f"\n[Packet #{packet.number}] Timestamp: {timestamp}")

    for layer in packet.layers:
        protocol = layer.layer_name.upper()
        if protocol in ['IP', 'IPV6']:
            print(f"{protocol}: {packet.ip.src} -> {packet.ip.dst}")
        if protocol in ['TCP', 'UDP']:
            print(f"{protocol}: Port {packet[protocol.lower()].srcport} -> {packet[protocol.lower()].dstport}")
        if protocol == 'HTTP':
            method = packet.http.get_field_value('request_method', 'N/A')
            host = packet.http.get_field_value('host', 'N/A')
            path = packet.http.get_field_value('request_uri', 'N/A')
            print(f"HTTP: {method} Host: {host}, Path: {path}")
        if protocol == 'DNS':
            query_name = packet.dns.get_field_value('qry_name', 'N/A')
            print(f"DNS Query: {query_name}")
        if protocol == 'TLS':
            print_tls_sni(packet)

def print_tls_sni(packet):
    if 'handshake_type' in packet.tls.field_names:
        handshake_type = packet.tls.handshake_type
        if handshake_type == '1' and 'tls_handshake_extensions_server_name' in packet.tls.field_names:
            sni = packet.tls.get_field_value('tls_handshake_extensions_server_name')
            print(f"TLS SNI: {sni}")

def process_cap_file(cap_path):
    cap = pyshark.FileCapture(cap_path)
    for packet in cap:
        print_packet_info(packet)
    cap.close()

# Path to your .cap file
cap_path = '/tmp/ngcrack_output/clients-34.cap'
process_cap_file(cap_path)
