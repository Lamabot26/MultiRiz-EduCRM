'use client'

import { motion } from 'framer-motion'
import { Camera, MapPin, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VIRTUAL_TOUR_SCENES } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import Image from 'next/image'

export function VirtualTourSection() {
  const { setShowTour } = useAppStore()

  return (
    <section
      id="tour"
      className="py-16 lg:py-24 bg-gradient-to-br from-primary via-primary to-primary/80 text-white relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-4 backdrop-blur-sm">
            <Camera className="w-4 h-4" />
            Virtual Campus Tour
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">
            Explore Our Campus From Anywhere
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Take a virtual walkthrough of our 2-acre campus — from smart classrooms to science labs,
            from the library to the sports complex. Experience SP International School from the comfort
            of your home.
          </p>
        </motion.div>

        {/* Tour preview grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {VIRTUAL_TOUR_SCENES.slice(0, 6).map((scene, i) => (
            <motion.div
              key={scene.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -5 }}
              onClick={() => setShowTour(true)}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
            >
              <Image
                src={scene.image}
                alt={scene.title}
                fill
                sizes="100%"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1">
                  <MapPin className="w-3 h-3" />
                  Campus Tour
                </div>
                <h3 className="text-white font-semibold text-sm">{scene.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Button
            onClick={() => setShowTour(true)}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-base font-semibold"
          >
            Start Virtual Tour
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-white/60 text-sm mt-4">
            Or schedule an in-person campus visit — call{' '}
            <span className="text-accent font-semibold">9040417575</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
