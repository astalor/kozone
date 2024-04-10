import pyshark
from datetime import datetime
import time
import sys

def print_packet_info(packet):
    try:
        if 'IP' in packet:
            capture_time = datetime.utcfromtimestamp(float(packet.sniff_timestamp)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            server_name = packet.tls.get_field_by_showname('Server Name').show if hasattr(packet.tls, 'get_field_by_showname') else "N/A"
            print(capture_time, server_name, packet.captured_length)
        elif 'IPv6' in packet:
            pass
    except AttributeError:
        pass

def process_cap_file(cap_path, wlan_key, ssid, processed_packets=0, max_retries=5):
    display_filter = 'tls.handshake.type==1'
    retries = 0
    new_packets = False
    i = -1
    
    while retries < max_retries:
        try:
            cap = pyshark.FileCapture(
                cap_path,
                display_filter=display_filter,
                only_summaries=False,
                keep_packets=True,
                override_prefs={
                    'wlan.enable_decryption': 'True',
                    'uat:80211_keys': f'"wpa-pwd","{wlan_key}:{ssid}"'
                }
            )
            cap.set_debug(True)

            for i, packet in enumerate(cap):
                if i < processed_packets:
                    continue
                print_packet_info(packet)
                new_packets = True
            cap.close()
            break
        except (OSError, EOFError, pyshark.capture.capture.TSharkCrashException) as e:
            print(f"Error reading cap file, retrying... ({retries+1}/{max_retries})")
            time.sleep(2)
            retries += 1

    return processed_packets + i + 1 if new_packets else processed_packets

def continuous_processing(cap_path, psk, ssid, sleep_duration=10):
    processed_packets = 0
    try:
        while True:
            processed_packets = process_cap_file(cap_path, psk, ssid, processed_packets)
            time.sleep(sleep_duration)
    except KeyboardInterrupt:
        print("Stopping continuous processing...")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: script.py <cap_path> <psk> <ssid>")
        sys.exit(1)

    cap_path, psk, ssid = sys.argv[1:4]
    continuous_processing(cap_path, psk, ssid)
