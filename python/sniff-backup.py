import pyshark
from datetime import datetime
import sys

def print_packet_info(packet):
    try:
        mac_src = mac_dst = None
        if 'WLAN' in packet:
            mac_src = packet.wlan.sa
            mac_dst = packet.wlan.da

        if 'EAPOL' in packet:
            capture_time = datetime.utcfromtimestamp(float(packet.sniff_timestamp)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            print(f'e EAPOL {capture_time} Client MAC: {mac_src} Destination MAC: {mac_dst}')
 
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

def process_cap_file(cap_path, wlan_key, ssid):
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
        for packet in cap:
            print_packet_info(packet)
    finally:
        cap.close()
        print("Finished processing")

def main(cap_path, psk, ssid):
    print("Processing: ", cap_path, psk, ssid)
    process_cap_file(cap_path, psk, ssid)

if __name__ == '__main__':
    cap_path = sys.argv[1]
    psk = sys.argv[2]
    ssid = sys.argv[3]

    main(cap_path, psk, ssid)
