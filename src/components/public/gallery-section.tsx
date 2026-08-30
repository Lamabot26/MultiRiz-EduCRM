'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, X } from 'lucide-react'
import { GALLERY_IMAGES } from '@/lib/school-data'
import Image from 'next/image'

export function GallerySection() {
  const [selected, setSelected] = useState<(typeof GALLERY_IMAGES)[0] | null>(null)
  const categories = ['All', ...Array.from(new Set(GALLERY_IMAGES.map((g) => g.category)))]
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? GALLERY_IMAGES
    : GALLERY_IMAGES.filter((g) => g.category === activeCategory)

  return (
    <section id="gallery" className="py-16 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <ImageIcon className="w-4 h-4" />
            Gallery
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Life at SP International School
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A glimpse into our vibrant campus life — learning, playing, creating, and growing together.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-foreground/70 hover:bg-primary/10 hover:text-primary border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {filtered.map((image, i) => (
            <motion.div
              key={image.src}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
              whileHover={{ y: -5 }}
              onClick={() => setSelected(image)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow ${
                i % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div className={`relative ${i % 5 === 0 ? 'h-64 md:h-full' : 'h-40 md:h-48'}`}>
                <Image
                  src={image.src}
                  alt={image.caption}
                  fill
                  sizes="100%"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-[10px] text-white/70 mb-0.5">{image.category}</div>
                  <div className="text-sm text-white font-semibold">{image.caption}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative w-full max-w-4xl h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selected.src}
                alt={selected.caption}
                fill
                sizes="100%"
                className="object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                <div className="text-accent text-sm font-medium mb-1">{selected.category}</div>
                <div className="text-white text-xl font-bold">{selected.caption}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
