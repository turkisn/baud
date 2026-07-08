import { motion } from 'framer-motion';
import { fadeInUp, viewport } from '../../utils/animations';

export default function SectionHeader({ eyebrow, title, subtitle, center = true, light = false }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      className={center ? 'text-center' : ''}
    >
      {eyebrow && (
        <div className={`flex items-center gap-2 mb-3 text-gold text-xs font-semibold tracking-widest uppercase ${center ? 'justify-center' : ''}`}>
          <div className="h-px w-8 bg-gold" />
          {eyebrow}
          {center && <div className="h-px w-8 bg-gold" />}
        </div>
      )}
      <h2 className={`text-3xl sm:text-4xl font-bold leading-tight mb-4 ${light ? 'text-warm-white' : 'text-dark-brown'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg leading-relaxed ${light ? 'text-light-brown/80' : 'text-light-brown'} ${center ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
