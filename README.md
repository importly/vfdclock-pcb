# vfdclock ESP32-S3 VFD carrier, rev 0.1

A 131 × 66 mm two-layer backpack for the **Noritake GU256X128C-3900** VFD module. It replaces the Raspberry Pi test rig. It bolts onto the VFD's own four M3 holes on standoffs and takes an **ESP32-S3-DevKitC-1 (N16R8)**, or its 44-pin USB-C clone, plugged in through-hole.

The board drives the VFD's 8-bit parallel port through two SN74AHCT245N level shifters, reads the VFD's RDY line back, feeds 5 V to both the VFD and the devkit, and breaks out I2C (Qwiic) and spare GPIOs.

Designed in [pcbjs](https://pcbjs.dev) for the JLCPCB 2-layer preset. `npx pcbjs check` is clean: DRC 0 errors, 0 warnings, 0 unconnected; ERC 0. `npx pcbjs build -q` writes the fab set to `.pcbjs/fab/vfdclock-carrier/` with `STATUS: ORDERABLE`.

| File | What |
| --- | --- |
| `pcb.tsx` | layout: outline, placement, routes, pours, keep-outs, silk, board stack |
| `pcb.sch.ts` | nets, parts, part numbers |
| `lib/frame.ts` | every shared dimension: VFD outline and holes, CN4, notch, devkit geometry (`DEVKIT_ROW`), standoff length |
| `lib/pinout.ts` | devkit J1/J3 pin lists, carrier ↔ devkit net map, CN4/J2 pin map |
| `refs/devkit/pcb.tsx` | mechanical-only devkit reference: outline, 2 × 22 headers on its underside, nets by GPIO, module and USB-C bodies |
| `refs/vfd/pcb.tsx` | mechanical-only VFD reference: outline, 4 holes, CN4, CN1, C36, two inductors, SW1, the ≤ 3 mm rear parts, display glass |

Only `pcb.tsx` is in `pcb.config.ts` `entries`; the two refs are never ordered.

## Which side each part is on

Everything that fits goes in the 15 mm gap between the carrier and the display, so the top carries only what needs access, light or height.

| Side | Parts | Why there |
| --- | --- | --- |
| **Top** | J3, J4 devkit sockets; J2 box header (ribbon through the notch); C1 470 µF (12.5 mm); J1 barrel jack (11 mm); D1 + R1 power LED; J7, J8 Dupont headers; TP1–TP4 | access, visibility, or too tall for the gap |
| **Bottom** (sandwiched) | U1, U2 SN74AHCT245N (DIP-20 bodies underneath); C3, C4 0.1 µF discs, beside each DIP's pin 20; C2, D2, R_RDY1, R_RDY2, R3, R4 (0805 / SOD-123); J5, J6 Qwiic, side-entry, mouths out of the left edge | none of them needs access once built |

Placement on the bottom:
- **U1** sits right of the devkit's J1 row, A column toward the socket, above the VFD's C36. It is mirrored, so channel n carries bit n−1.
- **U2** lies along the bottom over the VFD's SW1. Its body hangs 9.7 mm above the VFD's rear and SW1 is 4 mm tall, so they clear.
- **Bottom labels** are on B.SilkS; the top silk marks "U1 under" / "U2 under".
- **Not under the devkit:** putting U1 between the devkit's socket rows would push the 8 bus inputs in, and the 8 outputs back out, through the 2.54 mm gaps of the J1 socket row. U2 there would block the GPIO14–18 and 3V3 runs to J8.

### Clearance to the display

`refs/vfd/pcb.tsx` models the VFD's rear from the user's photo:

| Part | Position | Size |
| --- | --- | --- |
| C36 electrolytic | (51.3, 54.3) | ⌀8, 10 mm tall |
| Inductors | (27.4, 40.2) and (44.4, 31.3) | ⌀7, 5 mm tall |
| SW1 | (86.0, 56.6) | 11 × 6 mm, 4 mm tall |
| CN1 | x ≈ 4.4, y 36–57 | 7 mm tall |
| CN4 | x 121.7–130.2, y 9.3–37.2 | 9 mm tall |
| everything else | — | ≤ 3 mm |

How the check works:
- Every VFD box is grown by the ±2 mm photo tolerance plus 1.5 mm sideways, and by 1.5 mm upwards.
- On the carrier, every underside body carries an honest `height`: DIP 5.3 mm, discs 8 mm, JST-SH 4.25 mm. The 2 mm solder tails of the top-side THT parts (sockets, J1, C1, J7, J8) are modelled as bodies too.
- `npx pcbjs check` shows no `reference-collision`, so every carrier body keeps at least 1.5 mm from every VFD part, tolerance included.
- The check was probed: moving U1 2.5 mm toward C36 makes it fire.

Nominal clearances:
- 3.0 mm: J3's solder tails over the top of C36.
- 4.0 mm: the C3/C4 discs over the ≤ 3 mm parts.
- 4.2 mm: U1 beside C36.
- 5.7 mm: U2 over SW1.

## Assembly order

1. **Bottom SMD:** C2, D2, R_RDY1, R_RDY2, R3, R4, J5, J6, by reflow or by hand.
2. **Top SMD:** J2, D1, R1.
3. **The bottom THT parts, inserted from the underside and soldered on the top:** U1 and U2 (optionally in DIP sockets, which add about 3 mm, still clear), then C3 and C4. Trim their leads on the top. U1's leads are close to the devkit's underside, which is 11 mm above.
4. **The top THT parts:** J3, J4, J7, J8, C1 (observe the + mark), J1. Trim their tails to ≤ 2 mm underneath.

**JLCPCB assembly:** this is a two-sided board, so SMT on both sides is billed as two-sided assembly. Cheaper options:
- Order JLC SMT for the bottom side only (C2, D2, the resistors, J5, J6) and hand-solder the top SMD: J2, the LED and its resistor.
- Or order the bare board and hand-solder everything; all parts are 0805 or larger.

The CPL in the fab set lists each part's side.

## The stack

Seen from the front: **VFD → 15 mm M3 standoffs → carrier → devkit on its sockets**.

- **Standoffs:** 4 × M3, 15 mm, from the VFD's rear to the carrier's underside. The level shifters, discs, Qwiic sockets and small SMD parts live in this gap; see Clearance to the display. The four carrier holes sit exactly over the VFD's holes, at (3, 4), (128, 4), (3, 62) and (128, 62), with a 6.5 mm copper-free ring for the standoff or nut.
- **Cable:** a 16-way 2.54 mm IDC ribbon, female–female, about 5–8 cm, with both sockets crimped the same way (straight, pin 1 to pin 1). It rises from the VFD's CN4 through the notch in the carrier's right edge (x 119–131, y 7–40) and drops onto J2.
- **J2 orientation:** J2 is oriented exactly like CN4:
  - its key slot faces −x, toward the board centre;
  - pin 1 is at the end toward the top (I/O-hole) edge, marked with a silk triangle and "red stripe";
  - odd pins are in the −x column;
  - pins 15/16 are at the end away from the top edge.

  A plain straight cable then needs no twist: the red stripe goes on pin 1 at both ends.
- **Devkit:** two 1 × 22 2.54 mm female sockets (J3, J4) at 22.86 mm row spacing. The devkit's USB end is flush with the carrier's top edge, so both USB-C ports overhang the edge and take cables with the devkit seated. The antenna end points down, and both copper layers are kept clear under the antenna and the last 6 mm of the module (keep-out x 25.7–43.7, y 56.9–66). Mated height, carrier top to devkit underside, is 11.0 mm (8.5 mm socket + 2.5 mm header spacer).

`npx pcbjs inspect references` shows both references:
- **Devkit:** placed by its two header mates, with pin assignment and nets checked (`reference-mate`, `reference-net`, both passing).
- **VFD:** placed by anchor 15 mm below with its holes on the carrier's. No `reference-collision` findings against the grown rear bodies.

## Connectors and GPIO map

**ESP32 GPIO use**

| Signal | GPIO | Path |
| --- | --- | --- |
| D0–D3 | 4, 5, 6, 7 | U1 → VFD_D0–D3 |
| D4 | 8 | U1 → VFD_D4 |
| D5, D6, D7 | 9, 10, 11 | U1 → VFD_D5–D7 |
| /WR | 12 | U2 A1 → B1 → VFD_WR |
| RDY | 13 | VFD RDY via divider (see Power) |
| SDA, SCL | 1, 2 | 4.7 kΩ pull-ups to 3V3 |
| expansion | 14, 15, 16, 17, 18, 21 | J8 |

U1 sits on the underside, mirrored, so channel n carries bit n−1: A1/B1 = D0, …, A8/B8 = D7. This keeps both sides of the bus in the devkit's pin order, so the bus has no crossings.

**J2: VFD CN4, male 2 × 8 2.54 mm SMD box header (keyed)**

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

**J3 / J4: devkit sockets.** J3 takes devkit header J1, J4 takes devkit header J3; pin 1 of both is at the antenna (bottom) end.
- **J3:** 1, 2 = 3V3; 4–7 = D0–D3; 8–11 = GPIO15–18; 12 = D4; 15–17 = D5–D7; 18 = /WR (GPIO12); 19 = RDY (GPIO13); 20 = GPIO14; 21 = 5V (from D2); 22 = GND.
- **J4:** 1, 21, 22 = GND; 4 = SDA (GPIO1); 5 = SCL (GPIO2); 18 = GPIO21.
- Every other pin is open.

**Other connectors**

| Ref | Part | Pins |
| --- | --- | --- |
| J1 | DC jack 5.5/2.1, centre + | centre = +5 V, sleeve and switch = GND; mouth on the right edge |
| J5, J6 | JST-SH 4-pin (Qwiic / STEMMA QT) | 1 GND, 2 3V3, 3 SDA, 4 SCL; mouths on the left edge |
| J7 | 1 × 4 2.54 header, I2C | 1 GND, 2 3V3, 3 SDA, 4 SCL |
| J8 | 1 × 8 2.54 header, EXP | 1 3V3, 2 GND, 3 GPIO14, 4 GPIO15, 5 GPIO16, 6 GPIO17, 7 GPIO18, 8 GPIO21 |

**Test pads:** TP1 +5 V at J2, TP2 GND, TP3 RDY, TP4 /WR (5 V side).

## Power

- **Input:** 5 V into J1, centre positive, at least 2.5 A. The VFD draws up to 1.1 A, and twice that at switch-on.
- **5 V path:** J1's centre pin feeds an F.Cu copper zone about 18 × 25 mm that reaches J2 pins 15/16 and C1 directly, far wider than the 2 mm minimum. J1, C1 and J2 sit within about 20 mm of each other.
- **Return path:**
  - Each of J2's GND pins (9, 11, 13, 14) is joined solid and gets a 0.8 mm stub to vias (7 in all).
  - The vias drop into an unbroken B.Cu ground pour under the power corner, which runs to J1's sleeve; that pad is joined solid too.
  - Both layers are ground-poured and stitched at 6 mm.
- **Acceptance check:** at least 4.9 V on **TP1** with the display running. The old breadboard rig browned out at 4.2 V through about 1 Ω; this path is milliohms.
- **Bulk and decoupling:** C1 is a 470 µF THT radial (polarity marked: "+" and the shaded negative side on silk), with C2 10 µF 0805 beside it. C3 and C4 are 100 nF THT discs, right at each DIP's pin 20.
- **Devkit supply:** D2 (B5819W Schottky) feeds +5 V to the devkit's 5V pin, so the devkit's own USB cannot back-feed the VFD supply. The devkit's 3V3 output powers the I2C side and the RDY divider.
- **RDY readback:** the VFD's RDY is open-collector with an internal 47 kΩ pull-up to 5 V. R_RDY1 (10 kΩ to 3V3) and R_RDY2 (39 kΩ to GND) hold GPIO13 at about 2.97 V high (2.9–3.1 V worst case, against V_IH 2.475 V) and about 0.2 V low. No buffer chip.
- **Power LED:** D1, green, with R1 1 kΩ on +5 V.

## BOM summary

The rule: parts already owned stay through-hole; everything bought new is SMD.

| Ref | Qty | Part | Status |
| --- | --- | --- | --- |
| U1, U2 | 2 | SN74AHCT245N, DIP-20 | already owned (THT) |
| C1 | 1 | 470 µF 16 V electrolytic, radial D10 P5.0 | already owned (THT) |
| C3, C4 | 2 | 100 nF ceramic disc, P5.0 | already owned (THT) |
| J1 | 1 | DC barrel jack 5.5/2.1 (DC-005 style, slotted pads) | already owned (THT) |
| J3, J4 | 2 | 1 × 22 2.54 mm female header | to buy; or solder the devkit's own pins straight in (same footprint) |
| J7, J8 | 2 | 1 × 4 and 1 × 8 2.54 mm male header | to buy (THT) |
| J2 | 1 | 2 × 8 2.54 mm male box header, SMD, keyed | to buy (SMD) |
| J5, J6 | 2 | JST SM04B-SRSS-TB (Qwiic) | to buy (SMD) |
| C2 | 1 | 10 µF 0805 X5R, CL21A106KAYNNNE | to buy (SMD) |
| R1 | 1 | 1 kΩ 0805 | to buy (SMD) |
| R3, R4 | 2 | 4.7 kΩ 0805 | to buy (SMD) |
| R_RDY1 | 1 | 10 kΩ 0805 | to buy (SMD) |
| R_RDY2 | 1 | 39 kΩ 0805 | to buy (SMD) |
| D1 | 1 | green LED 0805 | to buy (SMD) |
| D2 | 1 | B5819W Schottky, SOD-123 | to buy (SMD) |
| — | 1 | 16-way 2.54 mm IDC ribbon, female–female, 5–8 cm | to buy |
| — | 4 | M3 standoffs, 15 mm, with screws | to buy |

MPNs are in `pcb.sch.ts` and `.pcbjs/fab/vfdclock-carrier/bom.csv`. No LCSC numbers are entered: none were verified, so check them before ordering JLC assembly.

## Check before ordering

1. **Devkit row spacing.** Measure your USB-C clone's row centre-to-centre distance and set `DEVKIT_ROW` in `lib/frame.ts` (default 22.86 mm, Espressif's figure). Also check the clone's pin order, its USB-C positions at the board edge, and that pin 1 of both rows is at the antenna end.
2. **VFD holes and CN4.**
   - The carrier's holes, outline and CN4 position come from Noritake DS-1604-0001-02 / DS-903-0001-00: holes Ø3.5 at a pitch of 125.0 × 58.0, CN4 pin 1 at about (124.7, 14.3). Caliper-check CN4 against the nearest hole so the notch clears the IDC socket.
   - The rear-part positions in the VFD reference (C36, inductors) come from a photo, ±3 mm.
3. **VFD SW1 No.6 = ON** (graphic DMA mode). ON is toward the "ON" print on the OTAX switch body. It is also printed on the carrier's silk.
4. **Barrel jack.** The footprint is KiCad's generic `BarrelJack_Horizontal`: slotted pads that fit the common DC-005 style jacks. Check it against the jack you own.
5. **Cable.** Make a straight 16-way ribbon with the red stripe on pin 1 at both ends, and the keys as described in The stack.

## Commands

```sh
npm install
npx pcbjs check          # DRC, ERC, typecheck
npx pcbjs build -q       # fab set in .pcbjs/fab/vfdclock-carrier/
npx pcbjs shot           # PNGs in .pcbjs/shots/
npx pcbjs inspect references
npm run dev              # live viewer
```
