'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Building2, Home, Clock } from 'lucide-react'
import { SCHOOL, CAMPUSES } from '@/lib/school-data'


export default function ContactPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Contact Us
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We have two campuses in Bhubaneswar — a City Campus for day scholars and a Residential
            Campus for boarding students. Come visit us and experience the SP International difference.
          </p>
        </motion.div>

        {/* Campuses */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {CAMPUSES.map((campus, i) => {
            const Icon = campus.icon === 'building' ? Building2 : Home
            return (
              <motion.div
                key={campus.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-gradient-to-br from-white to-muted/30 rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">{campus.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground font-medium">
                        {campus.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{campus.address}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(campus.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      View on Map
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Contact info cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-6 text-center"
          >
            <Phone className="w-8 h-8 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Call Us</h3>
            <div className="space-y-1">
              {SCHOOL.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="block text-sm text-primary-foreground/90 hover:text-white transition-colors"
                >
                  {phone}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground rounded-2xl p-6 text-center"
          >
            <Mail className="w-8 h-8 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Email Us</h3>
            <a
              href={`mailto:${SCHOOL.email}`}
              className="text-sm text-accent-foreground/90 hover:text-accent-foreground break-all"
            >
              {SCHOOL.email}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-br from-foreground to-foreground/80 text-background rounded-2xl p-6 text-center"
          >
            <Clock className="w-8 h-8 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Office Hours</h3>
            <div className="text-sm text-background/90">Mon – Sat: 8:00 AM – 4:00 PM</div>
            <div className="text-sm text-background/70 mt-1">Sunday: Closed</div>
          </motion.div>
        </div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden border border-border shadow-sm h-80"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119906.681!2d85.78!3d20.27!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1909d5a5a1a5b5%3A0x6a5b5a5a5a5a5a5a!2sBhubaneswar%2C%20Odisha!5e0!3m2!1sen!2sin!4v1700000000000"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="School Location Map"
          />
        </motion.div>
      </div>
    </div>
  )
}
