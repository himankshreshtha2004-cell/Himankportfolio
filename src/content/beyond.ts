import music_1 from "../assets/beyond/music-1.webp";
import music_2 from "../assets/beyond/music-2.webp";
import music_3 from "../assets/beyond/music-3.webp";
import music_4 from "../assets/beyond/music-4.webp";
import music_5 from "../assets/beyond/music-5.webp";
import football_1 from "../assets/beyond/football-1.webp";
import football_2 from "../assets/beyond/football-2.webp";
import football_3 from "../assets/beyond/football-3.webp";
import football_4 from "../assets/beyond/football-4.webp";
import football_5 from "../assets/beyond/football-5.webp";
import badminton_1 from "../assets/beyond/badminton-1.webp";
/** Beyond Work — football, music, badminton. Photos are the person's own. Captions say only what the photo shows. */
export type BeyondPhoto = { src: string; cap: string; pos?: string };
export type BeyondSport = {
  id: "football" | "music" | "badminton";
  n: string;
  label: string;
  /** one short line under the title */
  line: string;
  /** where the bouncing tag points, % of the film frame (16:9) */
  tag: { x: number; y: number };
  /** which side the viewer opens on (the opposite side of the figure) */
  side: "left" | "right";
  /** crop for the round thumbnail on the tag */
  thumb: { src: string; pos: string };
  photos: BeyondPhoto[];
};


export const SPORTS: BeyondSport[] = [
  {
    id: "music",
    n: "01",
    label: "Music",
    line: "Guitar, keys and voice, from open stages to small rooms.",
    tag: { x: 35, y: 50.5 },
    side: "right",
    thumb: { src: music_1, pos: "50% 45%" },
    photos: [
      { src: music_1, cap: "On stage with the guitar" },
      { src: music_2, cap: "Facing the crowd, phone lights up" },
      { src: music_3, cap: "On the keys, mid-song" },
      { src: music_4, cap: "A quiet room, one microphone" },
      { src: music_5, cap: "Ukulele jam with friends" },
    ],
  },
  {
    id: "football",
    n: "02",
    label: "Football",
    line: "The team, the trophy and the huddle before the whistle.",
    tag: { x: 78.7, y: 44.5 },
    side: "left",
    thumb: { src: football_3, pos: "50% 50%" },
    photos: [
      { src: football_1, cap: "Trophy in the air" },
      { src: football_2, cap: "Trophy and medals" },
      { src: football_3, cap: "Team huddle at the stadium", pos: "50% 55%" },
      { src: football_4, cap: "The squad in team whites" },
      { src: football_5, cap: "The whole football crew" },
    ],
  },
  {
    id: "badminton",
    n: "03",
    label: "Badminton",
    line: "On court.",
    tag: { x: 50, y: 77 },
    side: "right",
    thumb: { src: badminton_1, pos: "50% 55%" },
    photos: [{ src: badminton_1, cap: "On court" }],
  },
];
