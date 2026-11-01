# vfdclock ESP32-S3 VFD carrier, rev 0.2

A 131 × 66 mm backpack for the Noritake GU256X128C-3900, on the display's own four M3 holes and 15 mm standoffs. An ESP32-S3-DevKitC-1 drives the display's parallel port (graphic DMA mode) through two SN74AHCT245N level shifters, with an SGP40 and an SCD-41 air sensor on board.

**Every part sits on the top face**, the outside of the stack, so a clear back panel shows all of them. The underside carries only solder tails, so the 15 mm gap to the display just needs the tails trimmed.

- Board: JLCPCB 2-layer, 1.6 mm, GND poured on both layers and stitched at 6 mm.
- `npx pcbjs check`: DRC 0, ERC 0, all 36 automatic routes placed from a cold cache. `npx pcbjs build -q`: ORDERABLE.
- Fab set: `.pcbjs/fab/vfdclock-carrier/` (zip, Gerbers, drills, `bom.csv`, `cpl.csv`). Shots: `.pcbjs/shots/`.
- Online preview: https://aryanthakur.com/vfdclock-pcb/ (importly.github.io/vfdclock-pcb redirects there; see Online preview below).
- The `wroom` branch holds the next revision, with a bare ESP32-S3-WROOM-1 module instead of the devkit.

## Layout (top view = the clock's back)

| Where | What |
| --- | --- |
| Left, mid-height | The devkit, soldered straight in by its own pins (no sockets), sitting 2.5 mm up on its header plastic. Both USB-C ports open out of the left edge. |
| Middle | The antenna end of the devkit. It lands mid-board because the 63 mm devkit has its USB end at the left edge. Its area has no copper on either layer and no parts near it, and nothing metal sits above it behind a clear back. |
| Above the devkit | U1 (D0–D7) with C3, D2 (devkit 5 V feed), the RDY divider and TP3. |
| Below the devkit | The SGP40 breakout, and J8 (right-angle expansion header, its pins pointing at the bottom edge and ending 0.4 mm inside it). |
| Right, middle | U2 (/WR buffer) with C4 and TP4. |
| Bottom right | The SCD-41 breakout, away from the devkit's heat. |
| Power corner | J2 to the display beside the CN4 notch, C1, C2, the barrel jack (opening on the right edge), the power LED, TP1 and TP2. |

Silk carries only polarity, pin 1, pin names and test-pad names, plus a small `vfdclock r0.2`.

## Connectors and GPIO map

| Signal | GPIO | Path |
| --- | --- | --- |
| D0–D3 | 4, 5, 6, 7 | U1 → VFD_D0–D3 |
| D4–D7 | 8, 9, 10, 11 | U1 → VFD_D4–D7 |
| /WR | 12 | U2 A1 → B1 → VFD pin 10 |
| RDY | 13 | VFD pin 12 via the divider (see Power) |
| SDA, SCL | 1, 2 | SGP40 and SCD-41; their own 10 kΩ pull-ups are the bus pull-ups |
| expansion | 14, 15, 16, 17, 18, 21 | J8 |

U1's channel n carries bit 8−n (A1/B1 = D7 … A8/B8 = D0). This keeps the devkit's left-to-right order on both sides of the chip, so the bus has no crossings.

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

**Devkit rows J3/J4:** these are the devkit's J1 and J3 headers, with pin 1 of both at the antenna end.
- **J3:** 1, 2 = 3V3; 4–7 = D0–D3; 8–11 = GPIO15–18; 12 = D4; 15–17 = D5–D7; 18 = /WR; 19 = RDY; 20 = GPIO14; 21 = 5V (from D2); 22 = GND.
- **J4:** 1, 21, 22 = GND; 4 = SDA; 5 = SCL; 18 = GPIO21.

**Sensor headers, U3 (SGP40) and U4 (SCD-41):** 1 VIN = 3V3, 2 3V = open, 3 GND, 4 SCL, 5 SDA. VIN takes 3.3 V, not 5 V: the SGP40's pull-ups go to VIN, and the ESP32's pins are 3.3 V only.

**J8 (expansion), left to right:** GPIO21, 18, 17, 16, 15, 14, GND, 3V3 (pad 1 is the 3V3 pin at the right).

**Test pads:** TP1 +5 V, TP2 GND, TP3 RDY, TP4 /WR (5 V side).

## Power

- **Input:** 5 V into J1, centre positive, at least 2.5 A: the owned 5 V 15 W (3 A) wall adapter, DigiKey 839-16-00119-ND. The VFD draws up to 1.1 A, and twice that at switch-on.
- **5 V path:** an F.Cu zone joins J1's centre pin, C1, C2 and J2 pins 15/16. A 0.8 mm B.Cu track runs from C1 under J2 and along the top edge to U1, C3 and D2.
- **Return path:** J2's GND pins are joined solid, with stubs to vias into the B.Cu ground.
- **Acceptance check:** at least 4.9 V on TP1 with the display running.
- **Bulk and decoupling:**
  - C1: Rubycon 16YXJ1000MT810X16, 1000 µF 16 V. It is the tallest part, 17.5 mm, so leave room behind the back panel or bend it over onto its side. Polarity: "+" and the shaded negative side are on the silk.
  - C2: 10 µF 0805.
  - C3 and C4: 100 nF radials (Vishay K104K15X7RF5TL2), one at each DIP's pin 20.
- **Devkit supply:** D2 (B5819W) feeds +5 V to the devkit's 5V pin, so its USB can't back-feed the VFD supply. The devkit's 3V3 powers the sensors, J8 and the RDY divider.
- **RDY readback:** RDY is open-collector with 47 kΩ to 5 V inside the VFD. R_RDY1 (10 kΩ to 3V3) and R_RDY2 (47 kΩ to GND) give about 3.06 V high (3.0–3.13 V worst case; V_IH 2.475 V, never above 3V3) and 0.2 V low.

## BOM

The rule: parts already owned stay through-hole; everything bought new is SMD. "Owned" means the DigiKey order of 2026-08-30.

| Ref | Qty | Part | Status |
| --- | --- | --- | --- |
| U1, U2 | 2 | TI SN74AHCT245N, DIP-20 (DigiKey 296-1476-5-ND; 4 owned) | owned (THT) |
| C1 | 1 | Rubycon 16YXJ1000MT810X16, 1000 µF 16 V, D10 × 16, P5.0 (1189-1545-1-ND; 2 owned) | owned (THT) |
| C3, C4 | 2 | Vishay K104K15X7RF5TL2, 100 nF 50 V X7R radial, P5.0 (BC1084CT-ND; 12 owned) | owned (THT) |
| J1 | 1 | SparkFun PRT-10811 DC barrel jack 5.5/2.1, right angle (4UCON 18742; 1568-10811-ND) | owned (THT) |
| U3 | 1 | Adafruit 4829, SGP40, soldered by its own 1 × 5 header | owned |
| U4 | 1 | Adafruit 5190, SCD-41, soldered by its own 1 × 5 header | owned |
| — | 1 | ESP32-S3-DevKitC-1 N16R8, USB-C clone, soldered by its own pins | owned |
| J2 | 1 | 2 × 8 2.54 mm male box header, SMD, keyed | to buy (SMD) |
| J8 | 1 | 1 × 8 2.54 mm male header, right-angle | to buy (THT) |
| C2 | 1 | 10 µF 0805, CL21A106KAYNNNE | to buy (SMD) |
| R1 | 1 | 1 kΩ 0805 | to buy (SMD) |
| R_RDY1, R_RDY2 | 2 | 10 kΩ and 47 kΩ 0805 | to buy (SMD) |
| D1 | 1 | green LED 0805 | to buy (SMD) |
| D2 | 1 | B5819W Schottky, SOD-123 | to buy (SMD) |
| — | 2 | Ribbon cable: 2 × AWP 16-7540-T IDC sockets (HHKC16S-ND), 2 × AWZ-16-T strain reliefs (HSSR16-ND), 16-way 1.27 mm grey flat ribbon AWG28-16/G/300, 5–8 cm | owned |
| — | 1 | 5 V 15 W wall adapter, 5.5/2.1 plug (839-16-00119-ND) | owned |
| — | 4 | M3 standoffs, 15 mm, with screws | to buy |

The devkit and sensor rows are bare plated holes, so they are left out of `bom.csv` and `cpl.csv`. The SMD parts carry LCSC numbers, checked against JLCPCB's parts list, all JLCPCB basic parts: C2 C15850, R1 C17513, D1 C2297, D2 C8598, R_RDY1 C17414, R_RDY2 C17713. J2 has none: hand-solder it, as it has 2.54 mm pads.

Owned but not on this board: the THT 10 kΩ and 20 kΩ resistors (the board's resistors are SMD, by choice), two spare 245s, the second 1000 µF can, ten spare 100 nF caps, and the breadboard parts from the earlier rig.

## Assembly order

1. **SMD, top:** J2, C2, D1, D2, R1, R_RDY1, R_RDY2.
2. **Low THT parts:** U1, U2, C3, C4, J8, J1.
3. **The breakouts:** solder the 1 × 5 headers into the carrier with the plastic on top, set the breakout on the pins, and solder it. Trim the tails underneath to 3 mm.
4. **The devkit:** solder it straight in on its own header pins; it sits on their plastic. Trim the tails underneath to 3 mm.
5. **C1 last** (it is the tallest part); mind the + mark.

## Check before ordering

1. **Devkit row spacing.** 22.86 mm (`DEVKIT_ROW` in `lib/frame.ts`), confirmed from a photo of the owner's board: the rows are 8.96 pin pitches apart.
2. **Barrel jack.** The footprint (`lib/barrelJack.tsx`) follows the SparkFun PRT-10811 / 4UCON 18742 drawing: centre pin 13.6 mm and sleeve 7.8 mm behind the front face, switch pin 10.6 mm back and 4.8 mm to the side. It matches SparkFun's own footprint to 0.1 mm.
3. **C3/C4 lead spacing:** 5.0 mm, from Vishay's part code (F5).
4. **VFD SW1 No.6 = ON** (graphic DMA mode). Set it before stacking: the carrier covers the switch.
5. **Cable:** press an IDC socket onto each end of the 16-way ribbon, both facing the same way, with the red stripe on pin 1 at both ends, then clip on the strain reliefs.

## The stack and its checks

- `refs/devkit` mates on the devkit's header rows (stack above, 2.5 mm), with the nets checked across the mate.
- `refs/vfd` sits 16.6 mm below. Its rear-part positions are measured from the owner's photos (`lib/frame.ts`).
- Under the carrier, every solder tail is modelled and checked against the display's rear parts. The display's tall parts are each grown by ±2 mm photo tolerance plus 1.5 mm clearance.

**3D view:**
- **Sensor boards:** Adafruit's own models (Adafruit_CAD_Parts, MIT), on KiCad header models; the sensor geometry comes from Adafruit's Eagle boards.
- **Barrel jack:** KiCad's model of the same jack body.
- **Why stand-ins:** the viewer tints a reference board's parts. So the devkit (`lib/devkitVisual.tsx`) and the display (`lib/vfdVisual.tsx`) are drawn as model-only footprints on the carrier, in their own colours.
  - **The devkit:** a black board plus KiCad models of its module, USB-C ports, regulator, USB-serial chip, buttons and RGB LED, placed from a photo of the owner's board.
  - **The display:** a green board, glass and dot area, plus KiCad models of the parts its rear photo shows.
  - The references still do the checks; their own drawing is hidden.

## Online preview

Every push to `master` runs `.github/workflows/pages.yml`, which builds the pcbjs viewer and publishes it to https://aryanthakur.com/vfdclock-pcb/. The site has the 2D layout, the schematic, the 3D view with the reference boards, and the DRC/ERC findings. Clicking an item opens its source line on GitHub, and the board page has a download for the fab zip.

- **Setup:** done. Settings → Pages → Source is set to **GitHub Actions**, and `github-pages` deploys from `master`.
- **Local copy:** `npm run build && npm run preview` serves the same site under `/vfdclock-pcb/`.

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
