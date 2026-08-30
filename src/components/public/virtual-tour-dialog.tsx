'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VIRTUAL_TOUR_SCENES } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import Image from 'next/image'

export function VirtualTourDialog() {
  const { showTour, setShowTour } = useAppStore()
  const [currentScene, setCurrentScene] = useState(0)

  const next = () => setCurrentScene((p) => (p + 1) % VIRTUAL_TOUR_SCENES.length)
  const prev = () => setCurrentScene((p) => (p - 1 + VIRTUAL_TOUR_SCENES.length) % VIRTUAL_TOUR_SCENES.length)

  const scene = VIRTUAL_TOUR_SCENES[currentScene]

  return (
    <AnimatePresence>
      {showTour && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowTour(false)}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
        >
          <button
            onClick={() => setShowTour(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[80vh]"
          >
            {/* Main scene */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image
                src={scene.image}
                alt={scene.title}
                fill
                sizes="100%"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Scene info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <div className="flex items-center gap-2 text-accent text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4" />
                  Scene {currentScene + 1} of {VIRTUAL_TOUR_SCENES.length}
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">{scene.title}</h3>
                <p className="text-white/80 max-w-2xl">{scene.description}</p>
              </div>

              {/* Navigation */}
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 overflow-x-auto pb-2">
              {VIRTUAL_TOUR_SCENES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentScene(i)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 ring-2 transition-all ${
                    i === currentScene ? 'ring-accent scale-105' : 'ring-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={s.image} alt={s.title} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
