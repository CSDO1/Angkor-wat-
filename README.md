# ANGKOR: Legacy of the Khmer Empire

A third-person 3D exploration game set at Angkor Wat, Cambodia. You explore, discover Khmer
history, collect artifacts, solve puzzles and watch cinematic scenes. There is no combat. It runs
in the browser (Three.js + Vite). The environment comes from the project's Blender model.

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # static build in dist/
npm run export-assets  # re-run the Blender → game pipeline (needs Blender 5.x on PATH)
```

## Desktop app (macOS and Windows)

The game ships as an offline desktop app built with Electron (`electron/`). The window serves the
Vite build from a private `app://` origin, so saves and settings persist between launches.

```bash
npm run desktop     # build and open the desktop app
npm run dist:mac    # release/Angkor-<ver>-mac-arm64.dmg (Apple Silicon) and -mac-x64.dmg (Intel), plus .zip
npm run dist:win    # release/Angkor-Setup-<ver>-win-x64.exe (installer) and Angkor-Portable-<ver>-win-x64.exe
```

Both platforms build from a Mac. The builds are **not code-signed**:

- **macOS.** On first open, right-click the app and choose Open, or allow it under
  System Settings → Privacy & Security.
- **Windows.** SmartScreen shows "Windows protected your PC"; click More info, then Run anyway.

Signing needs an Apple Developer ID and a Windows code-signing certificate.

In the app, F11 toggles fullscreen (on macOS, ⌃⌘F also works). The title screen has a Quit button.

## Languages

English and Khmer (ខ្មែរ). On first launch the player picks a language. After that they can switch
with the EN | ខ្មែរ control on the title screen, at the top of Settings, in the pause-menu sidebar,
or on the Language tab. Fonts (Marcellus, Source Sans 3, Noto Sans/Serif Khmer) are bundled, so
Khmer renders correctly offline.

## Source model

The brief names `pet_model.blend`. The Angkor Wat scene that `angkor_wat/build_angkor.py` wrote
as `pet_model.blend` is now saved as **`../angkor_wat.blend`**, and that is the file the pipeline
reads. It is identical to `pet_model.blend1`. `me pet/pet_model.blend` is an unrelated pet model.
To export another copy, run
`blender -b <file>.blend -P tools/blender/export_angkor.py`.

## Blender → game pipeline (`tools/blender/export_angkor.py`)

The source .blend on disk is never modified. The export takes about 30 s.

- **Walk-through gateways.** In the model, every gopura doorway was a dark panel on a solid shell.
  The script finds the 48 doorway panels, pairs them into 28 passages, and cuts them with exact
  booleans. The dark panels are then removed.
- **Visual meshes.** The script evaluates the modifiers (arrays, Geometry Nodes). It merges all
  stone materials into 64 m chunks and keeps the material id per vertex, so each chunk is one draw
  call. Ground uses 256 m chunks. Ambient occlusion is baked per vertex with 10 ray casts. Every
  heavy chunk gets a decimated **LOD1**. Output: 92 chunks, ~380k triangles.
- **Collision.** A separate ~150k-triangle mesh. Architecture is planar-dissolved, towers and
  naga heads are convex hulls, paving keeps only its top faces, and vegetation and ornaments are
  left out. It is never the high-poly visual mesh.
- **Stairs.** The 41 steep Khmer stairways are exported as analytic ramp volumes, so the
  character climbs them smoothly.
- **Vegetation.** The Geometry Nodes scatter is exported as compact instance transforms
  (~110k instances) plus a small library GLB.
- **`level.json`** holds water bodies, map footprints, landmarks and bounds.

## Project layout

```
public/assets/environment/angkor_wat/   angkor_visual.glb, angkor_collision.glb, level.json
public/assets/environment/vegetation/   vegetation.glb, instances.bin/json
public/assets/textures/                 rosette normal map (from the Blender build)
src/core/          Game (loop, modes, renderer), Input, EventBus, utils
src/levels/        SceneManager (loads the level once; menus never reload it)
src/environment/   AngkorEnvironment (chunks + LOD), Vegetation, Water, TimeOfDay, Wildlife
src/materials/     sandstone / ground / foliage / water shaders, atmosphere (fog + mist)
src/shaders/       shared GLSL noise
src/characters/    procedural humanoid (player + NPCs)
src/artifacts/     procedural artifact models, markers
src/systems/       PlayerController, CameraController, CollisionWorld, InteractionSystem,
                   ObjectiveManager, QuestManager, ArtifactManager, PuzzleManager,
                   DialogueSystem, JournalSystem, DiscoverySystem, LocalizationManager,
                   AudioManager, SaveManager, SettingsManager, CinematicDirector,
                   PerformanceManager (occlusion culling, frame limiter)
src/music/         generative music
src/ui/            HUD, panels, inspector, menu, map, illustrations, styles
src/localization/  en.js, km.js
src/data/          history (researched), artifacts, chapters, NPCs & quests
tools/blender/     export pipeline
```

## Controls

| Action | Keyboard / mouse | Controller |
|---|---|---|
| Move / look | WASD / mouse (click to capture; right-drag also works) | sticks |
| Sprint / walk toggle | Shift / V | L3 / LB |
| Jump / crouch | Space / C | A / B |
| Interact | E | X |
| First-person inspection view | F | Y |
| Zoom | wheel, − = | D-pad |
| Map / journal / menu | M or Tab / J / Esc | View / RB / Menu |
| Change time of day (after the story, or when not in Story mode) | T | — |

## Story

1. **Arrival.** Explore the entrance, then cross the causeway over the moat.
2. **Gateway.** Explore the western entrance gopura.
3. **Stories in Stone.** Find four survey markers beside real bas-reliefs: Lanka, Kurukshetra,
   the Historic Procession and the Churning of the Ocean of Milk.
4. **Echoes of Angkor.** Recover 5 artifacts. A 6th, secret one is a note on the 1632
   inscription.
5. **Five Towers.** Solve four puzzles, in any order for the first three:
   - the symbol stones (Preah Poan),
   - the mirror and sunbeam (second courtyard, south),
   - the story panels (second courtyard, north),
   - the stone-key door at the western Bakan stairway.

   Then climb.
6. **Sunrise Over Angkor.** Reach the summit to trigger the sunrise cinematic. You can keep
   exploring afterwards.

Optional quests: Devata Survey (Vuthy), Five Towers view (Maya) and A Lost Page (Chanthy).

## Fact and fiction

- **Researched.** Discovery-marker texts, bas-relief descriptions, artifact "Historical context"
  sections and the 1632 inscription. Sources are listed in `src/data/history.js` and shown in the
  in-game journal.
- **Fictional, and labelled in game.** All characters, the conservation team and its study
  replicas, the markers, all four puzzles (explicitly not historical mechanisms) and the
  stairway barriers.
- **Needs review.**
  - The Khmer translation is a draft and should be reviewed by a native speaker before release.
  - The historical texts should get an expert read.

## Settings and performance

- **Presets.** Low / Medium / High / Ultra.
- **Individual options.**
  - Resolution scale, texture detail, shadows and anti-aliasing (FXAA / MSAA).
  - Ambient occlusion: baked, or baked + GTAO.
  - Reflections (planar, shared by the moat and ponds), vegetation density and view distance.
  - Occlusion culling, VSync / FPS limit, fullscreen and FPS display.
- **Techniques.** Chunked frustum culling, LODs, and WebGL2 occlusion queries. Occluded chunks
  still cast shadows and reflect. Vegetation is chunked and instanced, grass is distance-culled,
  and wildlife is pooled.

Measured in headless Chrome (Apple GPU, 1280×720):

| Preset | FPS | Draw calls | Triangles |
|---|---|---|---|
| High | 60 (vsync) | ~750 | ~0.9M |
| Ultra | 60 (vsync) | more | more |

The Ultra numbers were measured before vegetation chunking: ~1100 draws and 5.4M triangles. Ultra
is not tuned for mid-range GPUs, and 1080p on real mid-range hardware has not been benchmarked
yet.

**Save.** Autosave runs after discoveries, artifacts, puzzles, quests and chapter progress. There
is also a manual slot. Both are stored in `localStorage`, together with settings, language and
audio levels.

**Audio.** Everything is synthesised live with Web Audio and is original: birds, wind, insects,
water, crickets, surface-aware footsteps, and interior reverb and filtering. The music is
generative and uses Cambodian-inspired timbres. It reproduces no traditional piece or recording.
