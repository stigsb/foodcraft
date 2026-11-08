# Foodcraft v3 "Music Machine": Design

Status: draft for review. Builds on v1 and v2; everything there stays.

v3 adds a step sequencer that players build in the world: grids of beat blocks that play sounds in time, pattern blocks that repeat a grid and hand over to the next one, a conductor block for tempo and volume, and MIDI cables that link it all into songs.

## 1. Goals and constraints

- Same as v1 and v2. The kids build it, Claude explains and writes the harder script parts with them.
- Runs the same on PS5, Switch, Android and Windows. Console players get it through the Realm.
- Stable Script API only (no Beta APIs), so the Realm world stays normal.
- A few simple building blocks that combine into many songs, instead of one big machine.
- Tight timing: chained patterns must not drift or stumble at the seams, even on the Realm.
- Cheap on the Switch: no world scans while music plays, no light-emitting blocks that change every step.
- Every build step ends in something playable.

### 1.1 What Bedrock allows

Add-ons cannot make or change sound, only play pre-recorded samples with a volume and a pitch. So: no synths, effects, recording or export. Timing runs on game ticks (20 per second), so the shortest step is 1 tick (50 ms) and tempos are whole tick counts per step.

## 2. Content

### 2.1 Blocks

| Block (Norwegian name) | What it does |
|---|---|
| Beat block (beatblokk) | One step in a row. Tap to switch on/off. On = plays its row's sound on that step |
| Sound block (lydblokk) | Head of a row. Holds the row's instrument, note and volume |
| Pattern block (mønsterblokk) | Owns one grid. Plays it N times, then sends a signal out on its MIDI OUT |
| Conductor (dirigent) | Start/stop for a song, tempo and main volume |
| MIDI cable (MIDI-kabel) | Carries start signals from an OUT to INs. Connects only to cables and music blocks |
| Redstone to MIDI (redstone-til-MIDI) | Step 5. A redstone signal (button, pressure plate, daylight sensor) sends a MIDI start |
| MIDI to redstone (MIDI-til-redstone) | Step 5. A MIDI signal gives a short redstone pulse (doors, lamps, pistons) |

No music block gives off light. On/off is shown by texture only.

### 2.2 Building a grid

The grid lies flat on the ground. Seen by a player standing in front of the pattern block:

```
  back
  [S][B][B][B][B][B][B][B][B]...   row 3
  [S][B][B][B][B][B][B][B][B]...   row 2
  [S][B][B][B][B][B][B][B][B]...   row 1
  [P]=========cable to the next pattern========>
  front (player stands here)
```

- **P** = pattern block. Its front shows play state and repeat count. Placed facing the player.
- **S** = sound blocks in a line straight behind P, up to 8. Each one starts a row.
- **B** = beat blocks going right from each sound block, up to 16 per row.
- **MIDI IN** is P's left side, **MIDI OUT** its right side (shown on the texture). The OUT cable can run along the front of the grid to the next pattern, so a song reads left to right.
- Pattern length = the longest row. A gap or a shorter row is silence.
- A row ends at the first block that is not a beat block. The rows end at the first block behind P that is not a sound block.

### 2.3 Playing

- **Tap P:** start, or stop if it is playing. If its song is already playing, it starts on the next beat (every 4 steps), so it lands in time.
- **Sneak + tap P:** cycle the repeat count: 1, 2, 4, 8, ∞.
- After the last repeat P stops and sends a start signal out on its MIDI OUT. Every pattern on that cable starts on the very next step, so the seam is seamless. Several patterns on one OUT start together (drums + bass + melody as separate grids).
- ∞ plays until stopped and sends OUT at the end of every pass, so a drum loop can drive other patterns.
- A start signal to a pattern that is already playing is ignored. This stops loops from piling up.
- Looping a whole song: run a cable from the last pattern's OUT back to the first pattern's IN.
- While playing, a note particle rises from each beat block as it plays, so you can see where the song is.
- Sound plays at the grid's middle, at a volume that carries about 32 blocks. Music is a place: you walk to it to hear it.

### 2.4 Sound block

- **Tap:** a form with instrument (dropdown), note (dropdown, F♯3 to F♯5 like a note block), volume (slider 0–10) and mute (toggle). This is the row's mixer channel.
- **Sneak + tap:** cycle the instrument quickly without the form.
- The texture shows the instrument, so a grid is readable at a glance.
- A new sound block gets the next drum or instrument in the list, so a fresh grid has a kit by default.

**Instruments in step 1** are the vanilla note block sounds: no pack size and no licence questions. Drums: bass drum, snare, hi-hat. Pitched: piano (harp), bass, guitar, flute, bell, chime, xylophone, iron xylophone, cow bell, didgeridoo, bit, banjo, pling. Step 6 adds our own samples (kick, clap, 808 bass and more), with several samples per instrument where the pitch range needs it.

### 2.5 Conductor

- **Tap:** a form with Start, Stop all and Settings.
- **Settings:** tempo and main volume (0–10).
- **Start** sends a start signal on the cable connected to the conductor. **Stop all** stops every pattern in its song.
- Tempo choices (one step = a 16th note):

| Tempo | Ticks per step |
|---|---|
| 60 | 5 |
| 75 | 4 |
| 100 (default) | 3 |
| 120 shuffle | 2 and 3 in turn |
| 150 | 2 |

- A song with no conductor plays at 100 and full volume.

### 2.6 Songs and cables

- A **song** is every music block linked by MIDI cable, through any number of patterns. One song has one clock, one tempo and one main volume.
- A **cable network** is one run of connected cables. A start sent from an OUT (or a conductor, or a redstone-to-MIDI block) reaches every IN on the same network. Signals do not pass through music blocks, so a cable from A's OUT to B's IN only starts B.
- Cables connect on all six sides: along the ground, up and down walls.
- **Step 4 colours:** dyed cables only connect to cables of the same colour, so two runs can lie side by side without joining. Ports on music blocks accept any colour.
- Breaking a cable cuts the chain at that point; the song plays on up to there.

### 2.7 Recipes (draft; exact recipes in the plan)

| Block | Recipe idea |
|---|---|
| Beat block ×8 | 8 stone around 1 note block |
| Sound block | Note block + iron ingot |
| Pattern block | Note block + clock |
| Conductor | Note block + gold ingot + stick |
| MIDI cable ×8 | Copper ingot + black wool |
| Redstone to MIDI / MIDI to redstone | Cable + redstone dust + repeater / comparator |

Beat blocks are needed by the hundred (8×16 = 128 per grid), so they must be cheap.

### 2.8 Visual rules

As in v1 and v2: 16×16 textures with a dark outline, drawn by Ravn and Kasper in Blockbench, starting from generated placeholders. Beat block off = dark pad, on = bright pad. Sound block shows its instrument. Pattern block front shows the repeat count (1, 2, 4, 8, ∞) and a play light (texture, not real light). IN and OUT jacks are drawn on the pattern block's sides.

## 3. Architecture

Same two packs. New parts:

| Part | Mechanism |
|---|---|
| Beat block | Custom block, state `foodcraft:on`. Custom component: tap toggles, place and break mark nearby grids for a rescan |
| Sound block | Custom block, state `foodcraft:instrument` (for the texture). Note, volume and mute in a world dynamic property keyed by position. Form from `@minecraft/server-ui` |
| Pattern block | Custom block, states `foodcraft:repeats` (5 values), `foodcraft:playing`, cardinal facing |
| Conductor | Custom block. Tempo and volume in a dynamic property keyed by position |
| MIDI cable | Custom block with 6 connection states, geometry with an arm per side shown or hidden by state. Script sets the arms when a neighbour is placed or broken |
| Sequencer | One script module (`music.js`) with one `system.runInterval` every tick |
| Redstone adapters | `minecraft:redstone_consumer` with an `onRedstoneUpdate` custom component (skip `firstUpdate`); `minecraft:redstone_producer` on an "emitting" state, switched on for 4 ticks |

### 3.1 Sequencer

- **Cached grids.** A grid is scanned only when a pattern starts or a pass ends and the grid is marked dirty. The scan reads at most 8 × 17 blocks. While playing, each step reads only the cache: no world reads.
- **Instant edits.** A map from block position to (pattern, row, step) lets a beat block tap update the cache at once, so a change is heard on the next pass round.
- **Clock per song.** Each song keeps a step counter. Each tick: for every playing song, check if a step is due; if so, for every playing pattern play the notes of that step (`dimension.playSound` with pitch and volume = row volume × main volume) and spawn the particles.
- **Handover.** At the end of a pattern's last step, its OUT targets are looked up in the cached cable networks and marked to start on the next step. Everything happens inside the script, so redstone timing quirks do not apply.
- **Cable networks** are worked out when a cable or music block is placed or broken, and cached. Sending a signal is a lookup.
- **Saved state.** Steps live in block states. Instrument settings and tempo live in dynamic properties. What is playing is not saved: after a reload or Realm restart everything is stopped.
- **Unloaded chunks.** If part of a song is no longer loaded, that song stops.
- **Limit.** At most 16 sounds per tick per song; extra notes are dropped. The real number is decided by the probe (3.2).

### 3.2 Risks to check first in the plan

- **Timing on the Realm.** A probe script plays a fixed pattern at 150 BPM. Listen on Switch, PS5 and Android while connected to the Realm for wobble. If it is bad, drop 150 from the tempo list.
- **How many sounds at once** before Bedrock cuts some off, on each platform. Sets the limit in 3.1.
- **Pitch range** of `playSound`: check that 0.5–2.0 (two octaves) is not clamped tighter on any platform.
- **Cable shape.** A 6-arm cable needs 64 state combinations. Check if Bedrock's fence-style connection feature can do the side arms; otherwise the script sets all six.
- **Pistons.** Make music blocks immovable (`minecraft:movable`) if the block format allows it; otherwise rescan on every start.
- **Redstone in and out on one block** is not proven to work together. Step 5 starts with a test block.

## 4. Build order

Each step is playable before the next starts.

0. Probe: fixed pattern script, test timing, how many sounds at once and pitch on the Realm (3.2).
1. Beat block, sound block, pattern block: one grid that plays and loops, vanilla instruments, sound block form.
2. Conductor: tempo, main volume, start and stop all.
3. MIDI cable: IN and OUT, repeat ×N, handover, songs across several grids.
4. Coloured cables.
5. Redstone to MIDI and MIDI to redstone.
6. Polish: own samples, textures by the kids, Norwegian names, recipe book page, `.mcaddon`, Realm test on all platforms.

## 5. Testing

As in v1 and v2: no errors in the content log, and one line per block and edge case in `docs/test-checklist.md`. Plus:

- A two-pattern chain at every tempo, listening for a stumble at the seam.
- A loop (last OUT to first IN) running for 10 minutes without drift or piling up.
- Editing a grid while it plays; breaking a cable while it plays.
- Leaving and reloading the world while a song plays.
- Realm test on Switch, PS5 and Android with two players listening.

## 6. Out of scope for v3

- Real MIDI devices, audio export, recording, effects (reverb, filters), panning.
- Per-step volume, note length or pitch (one note per row).
- Copying patterns (a "sheet music" item that stores a grid), pattern banks.
- Music that follows the player anywhere.
