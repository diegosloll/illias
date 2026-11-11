// ILLIAS RADIO — the stations.
// Each station is a folder inside music/. Put your songs in the folder,
// then list the file names here (the browser can't see inside folders on its own).
// Run  python3 make_stations.py  from the site folder to write this list automatically.
window.STATIONS = [
  {
    folder: "tavern",
    name: "The Tavern",
    motto: "ale, noise and a fiddle",
    tracks: [
      // "some_song.mp3",
      // { file: "another.mp3", title: "A nicer title" },
    ]
  },
  {
    folder: "hearth",
    name: "The Hearth",
    motto: "slow songs for late hours",
    tracks: []
  },
  {
    folder: "road",
    name: "The Road",
    motto: "for walking far",
    tracks: []
  },
  {
    folder: "court",
    name: "The Court",
    motto: "grand, solemn, a little pompous",
    tracks: []
  },
];
