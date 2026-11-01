# vfdclock ESP32-S3 VFD carrier, rev 0.3 (WROOM)

A 131 × 66 mm backpack for the Noritake GU256X128C-3900, on the display's own four M3 holes and 15 mm standoffs. A bare ESP32-S3-WROOM-1 module drives the display's parallel port (graphic DMA mode) through two SN74AHCT245N level shifters, with an SGP40 and an SCD-41 air sensor on board.

This branch (`wroom`) replaces rev 0.2's ESP32-S3-DevKitC-1 (on `master`) with the module itself. The module's antenna sits at the board edge, USB-C stays on the left side, and the board drops the devkit's 63 × 25 mm footprint and 9 mm height. Everything else carries over: the owned parts, the display connector, the power corner and the sensors.

**Every part sits on the top face**, the outside of the stack, so a clear back panel shows all of them. The underside carries only solder tails.

- Board: JLCPCB 2-layer, 1.6 mm, GND poured on both layers and stitched at 6 mm.
- `npx pcbjs check`: DRC 0, ERC 0, all 75 automatic routes placed from a cold cache. `npx pcbjs build -q`: ORDERABLE.
- Fab set: `.pcbjs/fab/vfdclock-carrier/` (zip, Gerbers, drills, `bom.csv`, `cpl.csv`). Shots: `.pcbjs/shots/`.
- Online preview of `master`: https://aryanthakur.com/vfdclock-pcb/ (importly.github.io/vfdclock-pcb redirects there).

## Layout (top view = the clock's back)

| Where | What |
| --- | --- |
| Top middle | U5, the ESP32-S3-WROOM-1, antenna up. The antenna hangs over a 19 × 6 mm notch in the top edge. Espressif's keep-out (no copper on either layer, 15 mm either side and past the end) covers the strip beside it. |
| Top left | U7 (AMS1117-3.3) with C5/C6, the RESET button SW1, the EN delay (R7, C8), C9/C7 at the module's 3V3 pad, and TP5 (3V3). |
| Left edge | J8, the right-angle expansion header, its pins pointing at the left edge and ending 0.4 mm inside it, then USB-C J5 low on the edge with its clamp U6, CC resistors R5/R6 and the 5 V diodes D2/D3. |
| Left, inboard | The SGP40 breakout above the SCD-41 breakout. |
| Below the module | R8 (/WR pull-up), the BOOT button SW2, and TX/RX test pads beside the module's right side. |
| Right of the module | U1 (D0–D7) and U2 (/WR) standing beside J2, with C3/C4, the RDY divider and TP3/TP4. |
| Power corner | J2 to the display beside the CN4 notch, C1, C2, the barrel jack (opening on the right edge), the power LED, TP1 and TP2. |

## GPIO map

The pins follow the module's pad order, so each group leaves the module on its own side with no crossings (`lib/pinout.ts`).

| Signal | GPIO | Module pad | Path |
| --- | --- | --- | --- |
| /WR | IO3 | 15 | R8 pull-up to 3V3 (inactive while booting), U2 A1 → B1 → VFD pin 10 |
| RDY | IO9 | 17 | VFD pin 12 via the divider (see Power) |
| D0–D4 | IO10–IO14 | 18–22 | U1 → VFD_D0–D4 |
| D5, D6, D7 | IO21, IO47, IO48 | 23–25 | U1 → VFD_D5–D7 |
| SDA, SCL | IO17, IO18 | 10, 11 | SGP40 and SCD-41; their own 10 kΩ pull-ups are the bus pull-ups |
| expansion | IO4, IO5, IO6, IO7, IO15, IO16 | 4–9 | J8 |
| USB D−, D+ | IO19, IO20 | 13, 14 | U6 → J5 |
| BOOT | IO0 | 27 | SW2 to GND |
| TX, RX | TXD0, RXD0 | 37, 36 | TP6, TP7 |

**Firmware notes**
- The bus is not one run of GPIO numbers. Write it with a dedicated-GPIO bundle (`dedic_gpio`), one CPU instruction for all eight bits, or with the LCD_CAM i80 peripheral.
- IO47/IO48 are 3.3 V on the N16R8. Never fit an "R16V" module: its IO47/IO48 run at 1.8 V.
- IO35–IO37 belong to the octal PSRAM, and IO45/IO46 are strapping pins; all are left open.
- IO3 is a strapping pin only when an eFuse asks for it, which it does not by default.
- Programming:
  - **USB-C:** normal flashing goes through USB-C, using the chip's own USB-Serial-JTAG; esptool resets it into the bootloader by itself.
  - **Fallback:** a 3.3 V USB-serial adapter on TP6/TP7/GND. Hold BOOT, tap RESET, and flash.

U1's channel n carries bit 8−n (A1/B1 = D7 … A8/B8 = D0). The bus leaves the module with D7 innermost, so it reaches U1's A column top-down D7..D0, and J2 the same way.

**J2: VFD CN4, male 2 × 8 2.54 mm SMD box header (keyed), oriented like CN4.**

| Pin | Net | Pin | Net |
| --- | --- | --- | --- |
| 1 | VFD_D7 | 2 | VFD_D6 |
| 3 | VFD_D5 | 4 | VFD_D4 |
| 5 | VFD_D3 | 6 | VFD_D2 |
| 7 | VFD_D1 | 8 | VFD_D0 |
| 9 | GND | 10 | /WR |
| 11 | GND | 12 | RDY |
| 13 | GND | 14 | GND |
| 15 | +5 V | 16 | +5 V |

**J8 (expansion), top to bottom:** 3V3, GND, IO4, IO5, IO6, IO7, IO15, IO16. Pad 1, the square pad, is IO16 at the bottom.

**Sensor headers, U3 (SGP40) and U4 (SCD-41):**
- Pins: 1 VIN = 3V3, 2 3V = open, 3 GND, 4 SCL, 5 SDA.
- VIN takes 3.3 V, not 5 V, because the SGP40's pull-ups go to VIN.
- Both sensors run on USB power alone too.

**Test pads:** TP1 +5 V, TP2 GND, TP3 RDY, TP4 /WR (5 V side), TP5 3V3, TP6 TX, TP7 RX.

## Power

- **Input:** 5 V into J1, centre positive, at least 2.5 A. That is the owned 5 V 15 W (3 A) wall adapter, DigiKey 839-16-00119-ND. The VFD draws up to 1.1 A, and twice that at switch-on.
- **5 V path:** an F.Cu zone joins J1's centre pin, C1, C2 and J2 pins 15/16. A 0.8 mm B.Cu track runs from C1 under J2 and along the top edge to U1 and C3.
- **Return path:** J2's GND pins are joined solid, with stubs to vias into the B.Cu ground.
- **Acceptance check:** at least 4.9 V on TP1 with the display running, and 3.3 V on TP5.
- **3.3 V:** U7, an AMS1117-3.3, the same regulator as on the owner's devkit. It is fed from V5_SYS: the jack's 5 V through D2 or USB's VBUS through D3, both B5819W Schottkys, whichever is higher.
  - **USB only:** the ESP32 and sensors run, and the VFD stays off.
  - **Jack only:** everything runs.
  - Neither source can back-feed the other.
- **Decoupling:**
  - C6 22 µF at U7.
  - C9 10 µF and C7 100 nF at the module's 3V3 pad.
  - C5 10 µF on V5_SYS.
  - C8 1 µF with R7 10 kΩ on EN: Espressif's power-up delay.
- **Bulk:** C1 is a Rubycon 16YXJ1000MT810X16, 1000 µF 16 V. It is the tallest part (17.5 mm), so leave room behind the back panel or bend it onto its side. Its polarity is marked on the silk ("+" and the shaded negative side). C2 is 10 µF 0805. C3 and C4 are 100 nF radials (Vishay K104K15X7RF5TL2), one at each DIP's pin 20.
- **USB-C:**
  - R5/R6, 5.1 kΩ on CC1/CC2, ask the host or charger for 5 V.
  - U6 (USBLC6-2SC6) clamps D+, D− and VBUS at the connector. D+ and D− pass through its pads 1→6 and 3→4.
- **RDY readback:** RDY is open-collector with 47 kΩ to 5 V inside the VFD. R_RDY1 (10 kΩ to 3V3) and R_RDY2 (47 kΩ to GND) give about 3.06 V high (3.0–3.13 V worst case; V_IH is 2.475 V, and it never goes above 3V3) and 0.2 V low.

## BOM

The rule: parts already owned stay through-hole, and everything bought new is SMD with an LCSC number for JLCPCB assembly. "Owned" means the DigiKey order of 2026-08-30. `.pcbjs/fab/vfdclock-carrier/bom.csv` is the full list.

**Owned, hand-soldered:**

| Ref | Qty | Part |
| --- | --- | --- |
| U1, U2 | 2 | TI SN74AHCT245N, DIP-20 (296-1476-5-ND; 4 owned) |
| C1 | 1 | Rubycon 16YXJ1000MT810X16, 1000 µF 16 V, D10 × 16, P5.0 (1189-1545-1-ND; 2 owned) |
| C3, C4 | 2 | Vishay K104K15X7RF5TL2, 100 nF 50 V X7R radial, P5.0 (BC1084CT-ND; 12 owned) |
| J1 | 1 | SparkFun PRT-10811 DC barrel jack 5.5/2.1, right angle (4UCON 18742; 1568-10811-ND) |
| U3 | 1 | Adafruit 4829, SGP40, soldered by its own 1 × 5 header |
| U4 | 1 | Adafruit 5190, SCD-41, soldered by its own 1 × 5 header |
| — | 2 | Ribbon cable: 2 × AWP 16-7540-T IDC sockets, 2 × AWZ-16-T strain reliefs, 16-way 1.27 mm flat ribbon, 5–8 cm |
| — | 1 | 5 V 15 W wall adapter, 5.5/2.1 plug (839-16-00119-ND) |

**JLCPCB assembly (SMD, top side only), numbers checked against JLCPCB's parts list:**

| Ref | Part | LCSC | JLCPCB class |
| --- | --- | --- | --- |
| U5 | ESP32-S3-WROOM-1-N16R8 | C2913202 | extended |
| J5 | Korean Hroparts TYPE-C-31-M-12, USB-C 16-pin | C165948 | extended |
| U6 | USBLC6-2SC6 | C7519 | extended |
| U7 | AMS1117-3.3, SOT-223 | C6186 | basic |
| D2, D3 | B5819W, SOD-123 | C8598 | basic |
| SW1, SW2 | TS-1187A-B-A-B, 5.1 × 5.1 tact switch | C318884 | basic |
| R7, R8, R_RDY1 | 10 kΩ 0805 | C17414 | basic |
| R_RDY2 | 47 kΩ 0805 | C17713 | basic |
| R5, R6 | 5.1 kΩ 0805 | C27834 | basic |
| R1 | 1 kΩ 0805 | C17513 | basic |
| C6 | 22 µF 0805 | C45783 | basic |
| C2, C5, C9 | 10 µF 0805 | C15850 | basic |
| C8 | 1 µF 0805 | C28323 | basic |
| C7 | 100 nF 0805 | C49678 | basic |
| D1 | green LED 0805 | C2297 | basic |

JLCPCB charges a one-off fee for each extended part (about $3 each).

**Hand-soldered, to buy:** J2 (2 × 8 2.54 mm male SMD box header, keyed; large pads), J8 (1 × 8 2.54 mm right-angle male header), 4 × M3 15 mm standoffs with screws.

Owned but not on this board: the THT 10 kΩ and 20 kΩ resistors (the board's resistors are SMD, by choice), two spare 245s, the second 1000 µF can, ten spare 100 nF caps, the breadboard parts from the earlier rig, and the ESP32-S3-DevKitC-1 (the `master` board's).

## Assembly

1. **JLCPCB:** every SMD part in the table above, top side only. If you place U5 yourself instead, untick it in JLCPCB's BOM.
2. **Hand-soldering U5:**
   - The castellated pads reach 1.5 mm past the module, so a fine tip and flux reach pad and castellation together.
   - Solder the ground pad from the back, through the 1 mm hole in its centre.
3. **J2:** SMD, but on 2.54 mm pads.
4. **Low THT parts:** U1, U2, C3, C4, J8, J1.
5. **The breakouts:** solder the 1 × 5 headers into the carrier with the plastic on top, set the breakout on the pins, and solder it. Trim the tails underneath to 3 mm.
6. **C1 last** (it is the tallest part); mind the + mark.

## Check before ordering

1. **Barrel jack:** the footprint (`lib/barrelJack.tsx`) follows the SparkFun PRT-10811 / 4UCON 18742 drawing. It matches SparkFun's own footprint to 0.1 mm.
2. **C3/C4 lead spacing:** 5.0 mm, from Vishay's part code (F5).
3. **Module variant:** ESP32-S3-WROOM-1-**N16R8**. Avoid "R16V" variants (see Firmware notes).
4. **VFD SW1 No.6 = ON** (graphic DMA mode). Set it before stacking: the carrier covers the switch.
5. **Cable:** press an IDC socket onto each end of the 16-way ribbon, both facing the same way, with the red stripe on pin 1 at both ends, then clip on the strain reliefs.

## The stack and its checks

- `refs/sgp40` and `refs/scd41` mate on their headers (stack above, 2.5 mm), with the nets checked across each mate. Their geometry comes from Adafruit's own Eagle boards (`Adafruit-SGP40-PCB`, `Adafruit-SCD-4x-PCB`).
- `refs/vfd` sits 16.6 mm below. The breakout header tails and C1's leads under the carrier are modelled and checked against the display's rear parts.
- The module footprint, `lib/esp32s3Wroom1.tsx`, keeps KiCad's pad centres. It has longer pads for hand soldering, and its ground-pad vias are replaced with a 1 mm hole and 0.4 mm vias, because KiCad's 0.2 mm drills are under JLCPCB's limit.

## Online preview

Every push to `master` runs `.github/workflows/pages.yml`, which builds the pcbjs viewer and publishes it to https://aryanthakur.com/vfdclock-pcb/. The site has:
- the 2D layout, the schematic, and the 3D view with the reference boards;
- the DRC/ERC findings;
- source links (clicking an item opens its source line on GitHub);
- a download for the fab zip.

`npm run build && npm run preview` serves the same site locally under `/vfdclock-pcb/`.

`footprints/` holds copies of the KiCad footprints the board uses, so it builds on a machine without KiCad, such as the GitHub runner. pcbjs downloads their 3D models from KiCad's library when no KiCad is installed.

## Commands

```sh
npm install              # then re-apply the local pcbjs fixes:
git apply --whitespace=nowarn patches/pcbjs-windows-fixes.patch
npx pcbjs check          # DRC, ERC, typecheck
npx pcbjs build -q       # fab set in .pcbjs/fab/vfdclock-carrier/
npx pcbjs shot           # PNGs in .pcbjs/shots/
npx pcbjs inspect references
```
