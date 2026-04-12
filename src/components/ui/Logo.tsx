'use client'

import { useState } from 'react'

export default function Logo() {
  const [hoveredLetter, setHoveredLetter] = useState<number | null>(null)
  const letters = ['P', 'R', 'O', 'J', 'E', 'X']

  return (
    <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex gap-2">
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block transition-transform duration-200 cursor-default hover:-translate-y-1"
          onMouseEnter={() => setHoveredLetter(index)}
          onMouseLeave={() => setHoveredLetter(null)}
          style={{
            transform: hoveredLetter === index ? 'translateY(-4px)' : 
                       hoveredLetter !== null && Math.abs(hoveredLetter - index) === 1 ? 'translateY(-2px)' : 'translateY(0)'
          }}
        >
          {letter}
        </span>
      ))}
    </h1>
  )
}
