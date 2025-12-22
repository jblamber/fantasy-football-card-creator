import React, { useState, useMemo, useCallback } from "react";
import FantasyFootballCard, { CardRarity, PlayerType } from "./bloodbowl/FantasyFootballCard";

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

  const cards = useMemo(() => [grailKnightA, grailKnightB, thrower1], [grailKnightA, grailKnightB, thrower1]);
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => (i + 1) % cards.length), [cards.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + cards.length) % cards.length), [cards.length]);

  const onViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prev(); else next();
  }, [next, prev]);

  return (
    <section
      className="card-viewport"
      onClick={onViewportClick}
      style={{
        width: '100vw', height: '100vh', display: 'flex', padding: '0.3rem', justifyContent: 'center',
        background: '#111', touchAction: 'manipulation'
      }}
    >
      <div
        onClick={(e)=> e.stopPropagation()}
        style={{ width: 'min(90vw, calc(90vh * 822 / 1122))', aspectRatio: '822 / 1122' }}
      >
        <FantasyFootballCard {...cards[index]} />
      </div>
    </section>
  );
}
