const PACKAGES = [
  {
    id: "build-essential",
    name: "build-essential",
    kind: "cpp",
    blurb: "Compiler, make, and libc headers for native Ubuntu builds.",
    pin: "bench-2026.11",
  },
  {
    id: "cmake",
    name: "CMake",
    kind: "cpp",
    blurb: "Generates the Ninja or Unix Makefiles you already drive from the terminal.",
    pin: "bench-2026.11",
  },
  {
    id: "rustc",
    name: "rustc",
    kind: "rust",
    blurb: "The Rust compiler. This pin is a bench fixture, not a rustup channel.",
    pin: "bench-2026.11",
  },
  {
    id: "cargo",
    name: "cargo",
    kind: "rust",
    blurb: "Fetches crates and runs the tests you would otherwise type by hand.",
    pin: "bench-2026.11",
  },
  {
    id: "adb",
    name: "adb",
    kind: "android",
    blurb: "Android Debug Bridge. The same socket you use to install an APK.",
    pin: "bench-2026.11",
  },
  {
    id: "scrcpy",
    name: "scrcpy",
    kind: "android",
    blurb: "Mirrors an Android screen when a browser test is the wrong tool.",
    pin: "bench-2026.11",
  },
];

module.exports = { PACKAGES };
