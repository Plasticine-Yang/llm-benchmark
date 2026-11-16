(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});

  PelicanGame.CONFIG = {
    VIRTUAL_BASE_HEIGHT: 540,
    MIN_VIEW_WIDTH: 760,
    GROUND_Y: 396,
    PLAYER_SCREEN_X_RATIO: 0.24,

    // Speed & pacing (world units / sec)
    BASE_SPEED: 370,
    MAX_CRUISE_SPEED: 670,
    SPEED_RAMP_PER_SEC: 2.3,
    PEDAL_BOOST_BONUS: 145,
    FEVER_SPEED_BONUS: 170,
    BOOST_PAD_IMPULSE: 240,
    BOOST_PAD_DURATION: 1.15,

    // Vertical physics
    GRAVITY: 1900,
    JUMP_IMPULSE: -690,
    FLAP_IMPULSE: -610,
    JUMP_HOLD_GRAVITY_MULT: 0.56,
    JUMP_HOLD_MAX_TIME: 0.22,
    DIVE_VELOCITY: 780,
    DIVE_GRAVITY_MULT: 1.85,
    UMBRELLA_BOUNCE_VY: -680,
    UMBRELLA_SUPER_BOUNCE_VY: -840,
    GULL_BOUNCE_VY: -600,
    CRATE_SMASH_BOUNCE_VY: -450,
    COYOTE_TIME: 0.11,
    JUMP_BUFFER_TIME: 0.13,

    // Rotation, Wheelie & Flips (radians / sec)
    FLIP_SPEED_BACK: -7.9,
    FLIP_SPEED_FRONT: 8.2,
    WHEELIE_TARGET_ANGLE: -0.52,
    WHEELIE_THRESHOLD_ANGLE: -0.27,
    WHEELIE_TICK_INTERVAL: 0.42,
    LANDING_SAFE_RAD: 1.05,

    // Gameplay rules
    MAX_HEARTS: 3,
    INVULN_DURATION: 1.5,
    COMBO_DURATION: 3.1,
    MAX_COMBO_MULT: 10,
    FEVER_MAX: 100,
    FEVER_DURATION: 6.5,
    PIXELS_PER_METER: 26,

    // Particle caps for rock-solid 60fps
    MAX_PARTICLES: 180,
    MAX_POPUPS: 32,

    // Sky cycle themes (interpolated smoothly by distance)
    SKY_PHASES: [
      {
        name: 'Morning Breeze',
        skyTop: [72, 181, 232],
        skyBottom: [255, 224, 178],
        sunColor: [255, 241, 168],
        sunY: 118,
        oceanTop: [29, 148, 178],
        oceanBottom: [17, 94, 128],
        cloudAlpha: 0.92,
        starsAlpha: 0
      },
      {
        name: 'Sunburst Noon',
        skyTop: [36, 158, 224],
        skyBottom: [184, 242, 244],
        sunColor: [255, 248, 200],
        sunY: 82,
        oceanTop: [24, 166, 192],
        oceanBottom: [15, 106, 138],
        cloudAlpha: 0.95,
        starsAlpha: 0
      },
      {
        name: 'Golden Hour',
        skyTop: [232, 102, 108],
        skyBottom: [255, 207, 134],
        sunColor: [255, 214, 118],
        sunY: 174,
        oceanTop: [198, 108, 116],
        oceanBottom: [42, 68, 104],
        cloudAlpha: 0.85,
        starsAlpha: 0.1
      },
      {
        name: 'Harbor Twilight',
        skyTop: [22, 42, 82],
        skyBottom: [110, 74, 126],
        sunColor: [255, 236, 190],
        sunY: 102,
        oceanTop: [32, 66, 108],
        oceanBottom: [14, 30, 56],
        cloudAlpha: 0.45,
        starsAlpha: 0.85
      }
    ],

    SEED_HIGH_SCORES: [
      { id: 'seed-1', name: 'CAPN BEAK', score: 4200, distance: 410, fish: 38, isSeed: true },
      { id: 'seed-2', name: 'SUNNY', score: 2850, distance: 295, fish: 27, isSeed: true },
      { id: 'seed-3', name: 'PIER PAL', score: 1700, distance: 190, fish: 18, isSeed: true },
      { id: 'seed-4', name: 'CRABBY', score: 950, distance: 115, fish: 11, isSeed: true },
      { id: 'seed-5', name: 'SARDINE', score: 450, distance: 60, fish: 6, isSeed: true }
    ]
  };
})(window);
