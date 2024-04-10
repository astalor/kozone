import pyshark
from datetime import datetime
import sys
import os

LAST_PACKET_FILE = 'last_packet.txt'

def print_packet_info(packet):
    try:
        mac_src = mac_dst = None
        if 'WLAN' in packet:
            mac_src = packet.wlan.sa
            mac_dst = packet.wlan.da

        if 'EAPOL' in packet:
            capture_time = datetime.utcfromtimestamp(float(packet.sniff_timestamp)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            print(f'e {capture_time} {mac_src} {mac_dst}')

        if 'IP' in packet:
            src_ip = packet.ip.src
            dst_ip = packet.ip.dst
            capture_time = datetime.utcfromtimestamp(float(packet.sniff_timestamp)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            if mac_src and mac_dst:
                print('d', capture_time, packet.tls.get_field_by_showname('Server Name').show, packet.captured_length, mac_src, mac_dst, src_ip, dst_ip)
            else:
                print('d', capture_time, packet.tls.get_field_by_showname('Server Name').show, packet.captured_length, src_ip, dst_ip)
    except AttributeError as e:
        pass

def get_last_packet():
    if os.path.exists(LAST_PACKET_FILE):
        with open(LAST_PACKET_FILE, 'r') as f:
            last_packet = f.read().strip()
            if last_packet:
                return int(last_packet)
    return 0

def set_last_packet(packet_number):
    with open(LAST_PACKET_FILE, 'w') as f:
        f.write(str(packet_number))

def process_cap_file(cap_path, wlan_key, ssid):
    last_packet_number = get_last_packet()
    display_filter = 'tls.handshake.type==1 or eapol'

    cap = pyshark.FileCapture(
        input_file=cap_path,
        display_filter=display_filter,
        only_summaries=False,
        keep_packets=False,
        override_prefs={
            'wlan.enable_decryption': 'True',
            'uat:80211_keys': f'"wpa-pwd","{wlan_key}:{ssid}"'
        }
    )
    try:
        packet_number = 0
        for packet in cap:
            packet_number += 1
            if packet_number > last_packet_number:
                print_packet_info(packet)
        set_last_packet(packet_number)
    finally:
        cap.close()
        print("f f f")

def main(cap_path, psk, ssid):
    process_cap_file(cap_path, psk, ssid)

if __name__ == '__main__':
    cap_path = sys.argv[1]
    psk = sys.argv[2]
    ssid = sys.argv[3]

    main(cap_path, psk, ssid)
