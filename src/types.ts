import { CardRarity, PlayerType } from "./bloodbowl/FantasyFootballCard";

export type LenticularUrl = string;

export interface ImageProperties {
  offsetX: number; // px
  offsetY: number; // px
  scalePercent: number; // 100 = 1.0
}

export interface PlayerData {
  number?: string;
  ag: string;
  av: string;
  ma: string;
  pa: string;
  playerType: PlayerType;
  st: string;
  teamName: string;
  cost: string;
  cardName: string;
  skillsAndTraits: string;
  positionName: string;
  primary: string;
  secondary: string;
  footer: string;
}

export interface CardSerializable {
  rarity: CardRarity;
  types?: string | string[];
  subtypes?: string | string[];
  supertype?: string;
  playerData: PlayerData;
  imagery: {
    imageProperties: ImageProperties;
    lenticularUrls: LenticularUrl[]; // serialized as array; viewer will convert to Map
  }
}

export interface CardSetPayloadV1 {
  v: 1;
  cards: CardSerializable[];
}

export type AnyPayload = CardSetPayloadV1;