# Skia rendering spike (#11)

In an Expo development session, open **Settings → Open Skia spike**. The page
draws a radius-four board using the engine's 61 coordinates and one Skia path.
Drag the blue three-cell piece onto the board. It snaps to its nearest valid
anchor or returns to the tray when any part of the piece would be out of bounds.

The readout reports the frame callback rate during the last drag, including the
number of frames and the sample length. For the device check, perform three
drags lasting at least three seconds each, including one out-of-bounds drop.
Record the Android model, refresh rate, Expo client version, each sample and
whether the piece followed the finger. The emulator and bundle checks are
development checks. A physical-device measurement is required before deciding
whether to keep Skia or fall back to SVG.

Projection and cube rounding use the pointy-top layout from Red Blob Games,
[Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/). The projection
and gesture code are temporary and the screen is only exposed in development.
