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

def process_live_capture(wlan_interface, wlan_key, ssid):
    display_filter = 'tls.handshake.type==1'
    capture = pyshark.LiveCapture(
        interface=wlan_interface,
        display_filter=display_filter,
        decryption_key=wlan_key,
        wlan_key=ssid
    )
    capture.set_debug(True)

    try:
        for packet in capture.sniff_continuously(packet_count=0):
            print_packet_info(packet)
    except KeyboardInterrupt:
        capture.close()

def main(wlan_interface, psk, ssid):
    process_live_capture(wlan_interface, psk, ssid)

if __name__ == '__main__':
    import sys
    wlan_interface = 'wlan1'  # Change to the appropriate WLAN interface name
    psk = sys.argv[1]
    ssid = sys.argv[2]

    main(wlan_interface, psk, ssid)
