import { HoloCard } from "../card";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CardData, defaultOptions, ImageAssets, renderCard } from "./blood-bowl-render";

export type PlayerType = 'normal' | 'star';

interface FantasyFootballCardProps {
  rarity: CardRarity;
  set?: string;
  types?: string | string[];
  subtypes?: string | string[];
  supertype?: string;

  playerData: {
    number?: string,
    ag: string,
    av: string,
    ma: string,
    pa: string,
    playerType: PlayerType,
    st: string,
    teamName: string,
    cost: string,
    cardName: string,
    skillsAndTraits: string,
    positionName: string,
    primary: string,
    secondary: string,
    footer: string,
  },

  imagery: {
    lenticularImages?: Map<string, string>
    imageProperties: {
      offsetX: number, // px
      offsetY: number, // px
      scalePercent: number
    },
  }

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
                                        rarity,
                                        imagery,
                                        set,
                                        types,
                                        subtypes,
                                        supertype
                                      }:FantasyFootballCardProps) {

  const ref = useRef<HTMLCanvasElement | null>(null);
  const [lenticular, setLenticular] = useState({x:0, y:0})

  let url = "data:image/gif;base64,R0lGODl...";


  const bloodBowlCardDefaultAssets: Promise<ImageAssets> = useMemo(async ()=> {

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

  const data: CardData = useMemo(()=> {
    const url = imagery?.lenticularImages?.get(lenticular.x.toString())
    return {
      ...playerData,
      imageProperties: imagery?.imageProperties,
      imageUrl: url,
    }
  },[lenticular.x, lenticular.y, imagery?.lenticularImages]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    bloodBowlCardDefaultAssets.then(assets=>{
      return renderCard(ctx, data, assets, defaultOptions);
    })
  }, [data, bloodBowlCardDefaultAssets]);

  return (
    <HoloCard
      rarity={rarity as CardRarity}
      set={set}
      types={types}
      subtypes={subtypes}
      supertype={supertype}
      showcase={false}
      onLenticularChange={(lenticularX: number) => setLenticular({x:lenticularX, y:0})}
      lenticularLength={imagery?.lenticularImages?.size ?? 0}
    >
      <canvas ref={ref} width={822} height={1122} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </HoloCard>
  )
}