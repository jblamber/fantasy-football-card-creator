import {HoloCard} from "../index";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {FantasyFootballCardData, defaultOptions, ImageAssets, renderCard} from "./fantasyFootballRender";
import {FantasyFootballCardSerializable, FantasyFootballPlayerData} from "../../types";

export type PlayerType = 'normal' | 'star';

interface FantasyFootballCardProps extends FantasyFootballCardSerializable {
    className?: string;
    /*rarity: CardRarity;
  className?: string;
  set?: string;
  types?: string | string[];
  subtypes?: string | string[];*/
    supertype?: string;
    onSwipe?: (direction: 'left' | 'right') => void;
    /*playerData: FantasyFootballPlayerData,
    imagery: {
      lenticularImages?: Map<string, string>
      imageProperties: {
        offsetX: number, // px
        offsetY: number, // px
        scalePercent: number
      },
    }*/

}

export enum RarityType {
    COMMON = "common",
    UNCOMMON = "uncommon",
    RARE = "rare",
    ULTRA_RARE = "ultra-rare",
    SECRET = "secret",
    PROMO = "promo",
    SHINY = "shiny",
    VMAX = "vmax",
    FULL_ART = "full-art"
}

export type CardRarity = `${RarityType}` | `${RarityType} ${RarityType}` | `${RarityType} ${RarityType} ${RarityType}`;

async function loadImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

export default function FantasyFootballCard({
                                                playerData,
                                                className = "",
                                                rarity,
                                                imagery,
                                                //set,
                                                types,
                                                subtypes,
                                                supertype,
                                                onSwipe,
                                            }: FantasyFootballCardProps) {

    const ref = useRef<HTMLCanvasElement | null>(null);
    const [lenticular, setLenticular] = useState({x: 0, y: 0})


    const bloodBowlCardDefaultAssets: Promise<ImageAssets> = useMemo(async () => {

        const bg1 = await loadImage('/img/card/blank.png')
        const frame = await loadImage('/img/card/bloodbowl_frame.png')
        const star_frame = await loadImage('/img/card/bloodbowl_specialplayer_frame.png')
        const border = await loadImage('/img/card/bloodbowl_border.png')

        const numbers: Record<string, CanvasImageSource> = {}

        numbers['0'] = await loadImage('/img/card/numbers/sf0.png')
        numbers['1'] = await loadImage('/img/card/numbers/sf1.png')
        numbers['2'] = await loadImage('/img/card/numbers/sf2.png')
        numbers['3'] = await loadImage('/img/card/numbers/sf3.png')
        numbers['4'] = await loadImage('/img/card/numbers/sf4.png')
        numbers['5'] = await loadImage('/img/card/numbers/sf5.png')
        numbers['6'] = await loadImage('/img/card/numbers/sf6.png')
        numbers['7'] = await loadImage('/img/card/numbers/sf7.png')
        numbers['8'] = await loadImage('/img/card/numbers/sf8.png')
        numbers['9'] = await loadImage('/img/card/numbers/sf9.png')
        numbers['-'] = await loadImage('/img/card/numbers/sf-.png')
        numbers['+'] = await loadImage('/img/card/numbers/sf+.png')

        return {
            bg1,
            border,
            frame,
            numbers,
            playerImage: undefined,
            star_frame
        }
    }, [])

    const data: FantasyFootballCardData = useMemo(() => {
        const url = imagery?.lenticularUrls[lenticular.x.toString()]
        return {
            ...playerData,
            imageProperties: imagery?.imageProperties,
            imageUrl: url,
        }
    }, [lenticular.x, lenticular.y, imagery, playerData]);

    useEffect(() => {
        const canvas = ref.current!;
        const ctx = canvas.getContext('2d')!;
        bloodBowlCardDefaultAssets.then(assets => {
            return renderCard(ctx, data, assets, defaultOptions);
        })
    }, [data, bloodBowlCardDefaultAssets]);

    return (
        <HoloCard
            rarity={rarity as CardRarity}
            set={""}
            types={types}
            subtypes={subtypes}
            supertype={supertype}
            showcase={false}
            onLenticularChange={(lenticularX: number) => setLenticular({x: lenticularX, y: 0})}
            lenticularLength={Object.keys(imagery?.lenticularUrls?.size || {}).length ?? 0}
            onSwipe={onSwipe}
            className={className}
        >
            <canvas ref={ref} width={822} height={1122} style={{width: '100%', height: 'auto', display: 'block'}}/>
        </HoloCard>
    )
}