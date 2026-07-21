// BGG's /thing endpoint hard-caps requests at 20 ids ("Cannot load more than 20 items").
export const DETAIL_BATCH_SIZE = 20;

export interface SearchListItem {
  bggId: number;
  name: string;
  yearPublished: number | null;
}

export interface GameDetails {
  bggId: number;
  name: string;
  yearPublished: number | null;
  image: string | null;
  thumbnail: string | null;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  weight: number | null;
  bggRating: number | null;
  alreadyInLibrary: boolean;
}
