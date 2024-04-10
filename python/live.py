import pyshark
from datetime import datetime
import sys
import os

def print_packet_info(packet):
    try:
        if 'IP' in packet:
            capture_time = datetime.utcfromtimestamp(float(packet.sniff_timestamp)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            server_name = packet.tls.get_field_by_showname('Server Name').show if hasattr(packet.tls, 'get_field_by_showname') else 'N/A'
            print(f"{capture_time}, Server Name: {server_name}, Length: {packet.captured_length}")
    except AttributeError:
        pass

def continuous_capture(pipe_path, wlan_key, ssid):
    display_filter = 'tls.handshake.type==1'
    decryption_key_string = f'"wpa-pwd","{wlan_key}:{ssid}"'

    cap = pyshark.FileCapture(
        input_file=pipe_path,
        display_filter=display_filter,
        only_summaries=False,
        keep_packets=False,
        override_prefs={
            'wlan.enable_decryption': 'True',
            'uat:80211_keys': decryption_key_string
        }
    )
    cap.set_debug(True)

    try:
        for packet in cap:
            print_packet_info(packet)
    finally:
        cap.close()

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python script.py <PIPE_PATH> <WLAN_KEY> <SSID>")
        sys.exit(1)
    
    pipe_path, wlan_key, ssid = sys.argv[1], sys.argv[2], sys.argv[3]
    
    if not os.path.exists(pipe_path):
        print(f"Pipe {pipe_path} does not exist. Please create it with mkfifo.")
        sys.exit(1)

    continuous_capture(pipe_path, wlan_key, ssid)
