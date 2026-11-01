// Pinouts shared by the carrier and its reference boards, so the two sides of a mate cannot disagree.

/**
 * ESP32-S3-WROOM-1 pad names, pads 1 to 41 (KiCad's RF_Module symbol): 1-14 down the left side from
 * the antenna end, 15-26 along the bottom, 27-40 up the right side, 41 the ground pad.
 */
export const WROOM_PADS = [
  'GND', '3V3', 'EN', 'IO4', 'IO5', 'IO6', 'IO7', 'IO15', 'IO16', 'IO17', 'IO18', 'IO8', 'IO19', 'IO20',
  'IO3', 'IO46', 'IO9', 'IO10', 'IO11', 'IO12', 'IO13', 'IO14', 'IO21', 'IO47', 'IO48', 'IO45',
  'IO0', 'IO35', 'IO36', 'IO37', 'IO38', 'IO39', 'IO40', 'IO41', 'IO42', 'RXD0', 'TXD0', 'IO2', 'IO1', 'GND',
  'GND',
] as const

/**
 * The GPIO map, chosen by the module's pad order so each group leaves the module on its own side
 * with no crossings:
 * - the display bus fans straight down from ten bottom pads: /WR (pad 15), RDY (pad 17), then
 *   D0..D7 (pads 18-25), D7 at the right;
 * - down the left side: 3V3 and EN (pads 2, 3), the expansion header (pads 4-9), I2C (pads 10, 11),
 *   USB (pads 13, 14).
 * IO3 (/WR) and IO0 (BOOT) are strapping pins, harmless here: IO3 only selects the JTAG source when
 * an eFuse asks it to, and /WR is pulled high, inactive, while the chip boots.
 * The bus is not one run of GPIO numbers, so firmware writes it with a dedicated-GPIO bundle
 * (dedic_gpio), one instruction for all eight bits, or with the LCD_CAM i80 peripheral.
 * IO47 and IO48 are 3.3 V only on 3.3 V-flash modules such as the N16R8; never fit an "R16V" module.
 */
export const GPIO = {
  WR: 'IO3',
  RDY: 'IO9',
  D: ['IO10', 'IO11', 'IO12', 'IO13', 'IO14', 'IO21', 'IO47', 'IO48'],
  EXP: ['IO4', 'IO5', 'IO6', 'IO7', 'IO15', 'IO16'],
  SDA: 'IO17',
  SCL: 'IO18',
  USB_DN: 'IO19',
  USB_DP: 'IO20',
  BOOT: 'IO0',
} as const

/** VFD CN4 = carrier J2, pins 1 to 16. */
export const CN4 = [
  'VFD_D7', 'VFD_D6', 'VFD_D5', 'VFD_D4', 'VFD_D3', 'VFD_D2', 'VFD_D1', 'VFD_D0',
  'GND', 'VFD_WR', 'GND', 'RDY', 'GND', 'GND', 'V5', 'V5',
] as const
