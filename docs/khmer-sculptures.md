# Khmer sculpture additions

The temple now contains 31 sculpted devata wall panels (including the three survey targets) and 16 crouching guardian statues, in pairs beside eight stairway landings. These are original stylized meshes modeled from the user's four reference photographs, not scans or archaeological reconstructions.

The devatas have standing poses, three-spired crowns, earrings, necklaces, bracelets, waist ornaments, pleated sampots, and lotus-scroll niche borders. Three pose variants support the existing survey quest. Crouching monkey and human guardians have modeled facial features, hands, folded legs, curled hair or crowns, and layered carved plinths. Their Banteay Srei-inspired appearance is an artistic addition to this Angkor Wat game, not a claim about the historical placement of Banteay Srei sculptures at Angkor Wat.

## Research references

- [Angkor Wat Devata Inventory](https://www.devata.org/angkor-wat-devata-inventory/): standing female divinities, varied poses and ornaments.
- [University of Michigan: Banteay Srei monkey guardians](https://quod.lib.umich.edu/h/hart/x-788395/1): photographic archival reference and temple attribution.
- [ISEAS: Banteay Srei temple guardian](https://sealionplus.iseas.edu.sg/nodes/view/10309): guardian sculptures with human bodies and monkey, lion, garuda, or demon heads.
- [APSARA National Authority: Banteay Srei](https://apsaraauthority.gov.kh/2021/08/04/banteay-srei/): temple history and conservation context.

Only the supplied images were used as visual modeling references. Research pages were consulted for identification and context; their photographs were not copied into the game.

## Implementation and preview

`src/environment/KhmerSculptures.js` builds shared mesh templates with near/far geometry. Each visible sculpture uses one merged mesh; small ornaments use fewer polygons. The sandstone material follows the game's atmosphere and adds grain and weathering without the architecture material's repeating block joints. Guardians have collision blockers; placements use the existing stair metadata and leave the stairs clear. The quest retains its interaction IDs, completion logic, and save format.

With the development server running, open `/tools/sculpture-preview.html` to orbit the models or inspect them at the western gate, survey courtyard, and western stairway. This inspection page is separate from the game's player interface and production entry point.

## Additional user-supplied Angkor Wat reference

[Angkor Wat — Wikipedia](https://en.wikipedia.org/wiki/Angkor_Wat), reviewed 1 October 2026, provides an overview of the monument and links to further research. Relevant features for future model refinement include:

- Five lotus-bud towers arranged with a central tower and four corner towers; three progressively raised gallery levels.
- A west-facing main approach, naga balustrades along the causeway, paired libraries, and reflecting ponds.
- Devata carvings both individually and in groups, with diverse crowns, hairstyles, clothing, and jewelry.
- Narrative bas-reliefs, including the Churning of the Sea of Milk in the eastern gallery.
- Lion guardians at the cruciform terrace. The crouching monkey/human additions above remain Banteay Srei-inspired artistic additions.

These are reference notes, not a claim that additional geometry was implemented after reviewing the link. Use the article's cited research and monument photographs to verify dimensions and placement before changing the environment or collision layout.

## Interior photo additions

The three supplied interior photographs informed a new `TempleInteriors` collection in the existing Preah Poan cloister. It contains three nested stone portal frames, ten standing/seated Buddha statues, a recessed shrine with two flanking devata panels, saffron sashes, five scalloped ceremonial parasols with ribs and hanging trim, short wooden shrine screens, flower bowls, and incense sticks. All are original stylized geometry; no photograph or stock-image watermark was used as a texture.

The doorway mouldings fit around the existing corridor openings. Statues are beside the walking lanes and the shrine occupies a side bay; the central junction remains open. Nineteen collision blockers protect statues, door jambs, shrine screens, and the shrine backing. Shared near/far meshes reduce the rendering cost of repeated Buddha statues. The screenshot references guide appearance, not an exact surveyed reconstruction or a claim that every depicted object occupies that particular historical location.

The preview now has **Shrine model**, **Stone corridor**, and **Shrine in temple** views. Run `node tools/check-interiors.mjs` to check mesh validity, supported statue bases, collision behavior, and both walking lanes against the original architecture. Existing sculpture checks remain in `node tools/check-sculptures.mjs`.

## Naga Buddha and corridor reference additions

The latest three photos informed an original seven-headed naga-sheltered Buddha, modeled with a solid flared hood, seven cobra heads, three rounded serpent coils, a seated meditation pose, and a stone plinth. It is installed in a side bay of the cloister at game coordinates (-17, 3.514, 69.95), scaled to fit the existing ceiling and keep the gallery route clear. The prototype is an artistic interpretation of the photograph, not a verified survey of that sculpture's exact location.

[The Metropolitan Museum of Art: Buddha Protected by a Seven-headed Naga](https://www.metmuseum.org/art/collection/search/38451) describes the Khmer motif of the meditating Buddha seated on serpent coils beneath a seven-headed hood. This source was used for identification and form; its photographs were not copied.

Two corridor statues now use a weathered, headless variant with a broken shoulder. Four framed windows have seven modeled turned-stone balusters each. Four groups of three devatas have been added to the second enclosure walls, using the existing crown, jewelry, pleated garment, and scroll-border variants. These additions use shared near/far meshes and extend the existing collision checks. Current interior totals are eleven Buddha sculptures (including damaged variants and the naga Buddha), four baluster windows, and twenty-four interior collision blockers. The original guardian statue checks still pass.

The preview provides **Naga Buddha**, **Naga in temple**, and **Grouped carvings** views alongside the previous corridor and shrine views.
