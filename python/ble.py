from pybleno import Bleno
import sys

bleno = Bleno()

def on_start(error):
    if error:
        print('Failed to start BLE advertising:', error)
    else:
        print('BLE advertising started')

def on_state_change(state):
    print('BLE state changed to', state)
    if state == 'poweredOn':
        # Advertise a device named 'RaspberryPi-BLE'
        # These are Bluetooth SIG-defined UUIDs for Generic Access and Generic Attribute profiles.
        bleno.startAdvertising('RaspberryPi-BLE', ['1800', '1801'])
    else:
        bleno.stopAdvertising()

bleno.on('stateChange', on_state_change)
bleno.on('advertisingStart', on_start)

try:
    bleno.start()
    print('Hit <ENTER> to stop.')
    input()
finally:
    bleno.stopAdvertising()
    bleno.disconnect()

print('Advertisement stopped.')
