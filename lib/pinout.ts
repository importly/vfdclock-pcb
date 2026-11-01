// Pinouts shared by the carrier and its reference boards, so the two sides of a mate cannot disagree.

/** ESP32-S3-DevKitC-1 header J1, pins 1 to 22 (pin 1 at the antenna end). */
export const DEVKIT_J1 = [
  '3V3', '3V3', 'RST', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18',
  'GPIO8', 'GPIO3', 'GPIO46', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', '5V', 'GND',
] as const

/** ESP32-S3-DevKitC-1 header J3, pins 1 to 22 (pin 1 at the antenna end). */
export const DEVKIT_J3 = [
  'GND', 'TX', 'RX', 'GPIO1', 'GPIO2', 'GPIO42', 'GPIO41', 'GPIO40', 'GPIO39', 'GPIO38', 'GPIO37',
  'GPIO36', 'GPIO35', 'GPIO0', 'GPIO45', 'GPIO48', 'GPIO47', 'GPIO21', 'GPIO20', 'GPIO19', 'GND', 'GND',
] as const

export type DevkitPin = (typeof DEVKIT_J1)[number] | (typeof DEVKIT_J3)[number]

/**
 * Carrier net for each devkit pin the carrier uses; every other devkit pin is left open (NC).
 * VFD bit Dk comes from GPIO(4+k) for D0..D3, then GPIO8, 9, 10, 11 for D4..D7.
 */
export const CARRIER_NET_OF: Partial<Record<DevkitPin, string>> = {
  '3V3': '3V3',
  '5V': 'V5_ESP',
  GND: 'GND',
  GPIO4: 'D0',
  GPIO5: 'D1',
  GPIO6: 'D2',
  GPIO7: 'D3',
  GPIO8: 'D4',
  GPIO9: 'D5',
  GPIO10: 'D6',
  GPIO11: 'D7',
  GPIO12: 'WR',
  GPIO13: 'RDY',
  GPIO1: 'SDA',
  GPIO2: 'SCL',
  GPIO14: 'GPIO14',
  GPIO15: 'GPIO15',
  GPIO16: 'GPIO16',
  GPIO17: 'GPIO17',
  GPIO18: 'GPIO18',
  GPIO21: 'GPIO21',
}

/** Carrier net name to devkit net name, for the reference mate's `nets` check. */
export const DEVKIT_NET_OF: Record<string, string> = Object.fromEntries(
  Object.entries(CARRIER_NET_OF).map(([devkit, carrier]) => [carrier as string, devkit]),
)

/** VFD CN4 = carrier J2, pins 1 to 16. */
export const CN4 = [
  'VFD_D7', 'VFD_D6', 'VFD_D5', 'VFD_D4', 'VFD_D3', 'VFD_D2', 'VFD_D1', 'VFD_D0',
  'GND', 'VFD_WR', 'GND', 'RDY', 'GND', 'GND', 'V5', 'V5',
] as const
