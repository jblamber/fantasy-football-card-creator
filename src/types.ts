import {CardRarity, PlayerType} from "./card/fantasyFootballCard/FantasyFootballCard";
import {StatValue} from "./card/fantasyFootballCard/fantasyFootballRender";


export interface ImageProperties {
    offsetX: number; // px
    offsetY: number; // px
    scalePercent: number; // 100 = 1.0
}

export interface FantasyFootballPlayerData {
    number?: string;
    ag: StatValue;
    av: StatValue;
    ma: StatValue;
    pa: StatValue;
    st: StatValue;

    playerType: PlayerType;

    teamName: string;
    cost: string;
    cardName: string;
    skillsAndTraits: string;
    positionName: string;
    primary: string;
    secondary: string;

    //star player rules
    playsFor?: string;
    specialRules?: string;

    footer: string;
}

export interface FantasyFootballCardSerializable {
    rarity: CardRarity;
    types?: string | string[];
    subtypes?: string | string[];
    supertype?: string;
    playerData: FantasyFootballPlayerData;
    imagery: {
        imageProperties: ImageProperties;
        lenticularUrls: { [key: string]: string;} // 0: url, 1: url etc...
    }
}

export interface CardSetPayloadV1 {
    v: 1;
    cards: FantasyFootballCardSerializable[];
}

export type AnyPayload = CardSetPayloadV1;