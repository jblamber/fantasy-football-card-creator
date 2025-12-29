import {CardRarity, PlayerType} from "./card/fantasyFootballCard/FantasyFootballCard";
import {StatValue} from "./card/fantasyFootballCard/fantasyFootballRender";

export enum CardGlowType {
    blue,
    red,
    green,
    electric,
    purple,
    brown,
    gold,
    pink,
    metal,
    darkness,
}

export const CardHoloTypes = [
    {
        rarity: "common",
        label: "Basic"
    },
    {
        rarity: "rare holo",
        label: "Vertical Bars"
    },
    {
        rarity: "rare holo v",
        label: "Diagonal Shine"
    },
    {
        rarity: "reverse holo",
        label: "Reverse Diagonal Shine"
    },
    {
        rarity: "rare secret",
        label: "Crosshatch"
    },
    {
        rarity: "rare shiny",
        label: "Diagonal Shine Texture"
    },
    {
        rarity: "rare shiny v",
        label: "Diagonal Shine Texture 2"
    },
    {
        rarity: "rare holo vmax",
        trainer_gallery: true,
        label: "Diagonal Shine Texture 3"
    },
    {
        rarity: "rare holo vstar",
        label: "Diagonal Shine Texture 4"
    },
    {
        rarity: "rare shiny vmax",
        label: "Ultra Shine"
    },
    {
        rarity: "rare holo cosmos",
        label: "Cosmic"
    },
    {
        rarity: "radiant rare",
        label: "Radiant Cross Glow"
    },
    {
        rarity: "rare rainbow alt",
        label: "Sparkle"
    },
    {
        rarity: "rare rainbow",
        label: "Texture"
    },
]

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