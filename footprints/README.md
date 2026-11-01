# KiCad footprints used by the board

Copies of the KiCad 10 library footprints that `pcb.sch.ts` names with `kicadFootprint('Lib:Name')`. pcbjs searches `.pretty` folders here before an installed KiCad, so the board builds without KiCad: the GitHub Pages workflow depends on this. Their 3D models (`${KICAD10_3DMODEL_DIR}`) come from an installed KiCad, or else pcbjs downloads them from KiCad's packages3D on GitLab.

Licence: KiCad library, CC-BY-SA 4.0 with the exception that designs using them may be licensed freely; see https://www.kicad.org/libraries/license/.
