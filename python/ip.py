import pyshark
from datetime import datetime

def print_packet_info(packet):
    try:
        if 'IP' in packet:
            src_ip = packet.ip.src
            dst_ip = packet.ip.dst
            capture_time = datetime.utcfromtimestamp(float(packet.sniff_timestamp)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            print(capture_time, packet.tls.get_field_by_showname('Server Name').show, packet.captured_length)
        elif 'IPv6' in packet:
            src_ip = packet.ipv6.src
            dst_ip = packet.ipv6.dst
    except AttributeError:
        pass

def process_cap_file(cap_path, wlan_key, ssid):
    display_filter = 'tls.handshake.type==1'
    cap = pyshark.FileCapture(
        cap_path,
        display_filter=display_filter,
        only_summaries=False,
        keep_packets=False,
        override_prefs={
            'wlan.enable_decryption': 'True',
            'uat:80211_keys': f'"wpa-pwd","{wlan_key}:{ssid}"'
        }
    )
    cap.set_debug(True)

    try:
        for packet in cap:
            print_packet_info(packet)
    finally:
        cap.close()

def main(cap_path, psk, ssid):
    process_cap_file(cap_path, psk, ssid)

if __name__ == '__main__':
    import sys
    cap_path = sys.argv[1]
    psk = sys.argv[2]
    ssid = sys.argv[3]

    main(cap_path, psk, ssid)
