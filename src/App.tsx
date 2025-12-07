import React, { useState, useMemo } from "react";
import BloodBowlCard, { CardRarity, PlayerType } from "./bloodbowl/BloodBowlCard";

export default function App() {

  const grailKnightA = useMemo(() => {
    return {
      rarity: "rare rainbow alt" as CardRarity,
      playerData: {
        ma: "7",
        st: "3",
        ag: "3+",
        av: "10+",
        pa: "4+",
        cardName: "Sir Grail 1",
        skillsAndTraits: "Block, Dauntless, Steady Footing",
        positionName: "Blitzer",
        primary: "G,S",
        secondary: "A",
        footer: "Games Plus Spring 2026 League",
        playerType: "normal" as PlayerType,
        teamName: "Bruisers of Brione",
        cost: "95,000"
      },
      imagery: {
        imageProperties: {
          offsetX: -60, // px
          offsetY: -0, // px
          scalePercent: 150
        },
        lenticularImages: new Map<string, string>([
          ["0", "/img/players/grail1.png"]
        ])
      },
      types: "fire"
    };
  }, []);

  const grailKnightB = useMemo(() => {
    return {
      rarity: "rare rainbow" as CardRarity,
      playerData: {
        ma: "7",
        st: "3",
        ag: "3+",
        av: "10+",
        pa: "4+",
        cardName: "Sir Grail 2",
        skillsAndTraits: "Block, Dauntless, Steady Footing",
        positionName: "Blitzer",
        primary: "G,S",
        secondary: "A",
        footer: "Games Plus Spring 2026 League",
        playerType: "normal" as PlayerType,
        teamName: "Bruisers of Brione",
        cost: "95,000"
      },
      imagery: {
        imageProperties: {
          offsetX: -50, // px
          offsetY: -0, // px
          scalePercent: 150
        },
        lenticularImages: new Map<string, string>([
          ["0", "/img/players/grail2.png"]
        ])
      },
      types: "electric"
    };
  }, []);

  const thrower1 = useMemo(() => {
    return {
      rarity: "rare shiny v" as CardRarity,
      playerData: {
        ma: "6",
        st: "3",
        ag: "3+",
        av: "9+",
        pa: "3+",
        cardName: "Sir Thrower",
        skillsAndTraits: "Dauntless, Nerves of Steel, Pass",
        positionName: "Thrower",
        primary: "G,P",
        secondary: "A,S",
        footer: "Games Plus Spring 2026 League",
        playerType: "normal" as PlayerType,
        teamName: "Bruisers of Brione",
        cost: "80,000"
      },
      imagery: {
        imageProperties: {
          offsetX: 0, // px
          offsetY: -0, // px
          scalePercent: 150
        },
        lenticularImages: new Map<string, string>([
          ["0", "/img/players/thrower1.png"]
        ])
      },
      types: "water"
    };
  }, []);

  return (

    <section
      className="card-grid"
    >
      <BloodBowlCard
        {...grailKnightA}
      />

      <BloodBowlCard
        {...grailKnightB}
      />

      <BloodBowlCard
        {...thrower1}
      />
    </section>

  );
}
