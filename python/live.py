import pyshark
from datetime import datetime

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
            if hasattr(packet, 'tls') and packet.tls.get_field_by_showname:
                print(capture_time, packet.tls.get_field_by_showname('Server Name').show, packet.captured_length)
        elif 'IPv6' in packet:
            src_ip = packet.ipv6.src
            dst_ip = packet.ipv6.dst
    except AttributeError:
        pass

def process_live_capture(wlan_interface, pwd, ssid):
    display_filter = 'tls.handshake.type==1 or eapol'
    # Updated preferences for decryption using a password
    override_prefs = {
        'wlan.enable_decryption': 'True',
        'uat:80211_keys': f'"wpa-pwd","{pwd}:{ssid}"'
    }
    capture = pyshark.LiveCapture(
        interface=wlan_interface,
        display_filter=display_filter,
        override_prefs=override_prefs
    )
    capture.set_debug(True)

    try:
        for packet in capture.sniff_continuously(packet_count=0):
            print_packet_info(packet)
    except KeyboardInterrupt:
        capture.close()

def main(wlan_interface, pwd, ssid):
    process_live_capture(wlan_interface, pwd, ssid)

if __name__ == '__main__':
    import sys
    wlan_interface = 'wlan1'  # Change to the appropriate WLAN interface name
    pwd = sys.argv[1]  # Using password for WLAN decryption
    ssid = sys.argv[2]

    main(wlan_interface, pwd, ssid)
