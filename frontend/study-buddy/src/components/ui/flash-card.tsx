import React, { useState } from "react";
import { motion } from "framer-motion";

interface FlashCardProps {
  question: string;
  answer: string;
}

export function FlashCard({ question, answer }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 w-full h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full backface-hidden bg-white dark:bg-white rounded-xl shadow-lg p-6 flex items-center justify-center text-center"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-lg font-medium text-black dark:text-black">
            {question}
          </p>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full backface-hidden bg-white dark:bg-white rounded-xl shadow-lg p-6 flex items-center justify-center text-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-lg text-black dark:text-black">{answer}</p>
        </div>
      </motion.div>
    </div>
  );
}
