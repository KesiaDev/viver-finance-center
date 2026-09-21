import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

const COLORS = [
  "hsl(45, 100%, 60%)",   // amarelo
  "hsl(330, 100%, 65%)",  // rosa
  "hsl(200, 100%, 60%)",  // azul
  "hsl(120, 70%, 50%)",   // verde
  "hsl(25, 100%, 60%)",   // laranja
  "hsl(280, 80%, 60%)",   // roxo
  "hsl(0, 100%, 65%)",    // vermelho
];

export const Confetti = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const confettiPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 6,
    }));
    setPieces(confettiPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          <div
            className="animate-confetti-spin"
            style={{
              width: piece.size,
              height: piece.size * 0.6,
              backgroundColor: piece.color,
              borderRadius: "2px",
            }}
          />
        </div>
      ))}
    </div>
  );
};
