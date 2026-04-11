import React from "react";
import { motion } from "framer-motion";

export default function LessonSkeleton() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0.3 },
    show: {
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 1.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-surface-50 border border-border-subtle shadow-sm rounded-[24px] p-6 md:p-8 min-h-[500px] flex flex-col relative w-full"
    >
      <span className="sr-only">
        AI is currently generating your personalized lesson content.
      </span>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 w-full mt-4"
      >
        <div className="flex items-center gap-4 mb-8">
          <motion.div variants={childVariants} className="w-12 h-12 rounded-2xl bg-surface-200" />
          <div className="space-y-2.5">
            <motion.div variants={childVariants} className="h-4 w-48 bg-surface-200 rounded-full" />
            <motion.div variants={childVariants} className="h-3 w-32 bg-surface-100 rounded-full" />
          </div>
        </div>

        <div className="space-y-4 w-full mb-10">
          <motion.div variants={childVariants} className="h-4 w-full bg-surface-200 rounded-full" />
          <motion.div variants={childVariants} className="h-4 w-[90%] bg-surface-200 rounded-full" />
          <motion.div variants={childVariants} className="h-4 w-[95%] bg-surface-100 rounded-full" />
          <motion.div variants={childVariants} className="h-4 w-[80%] bg-surface-200 rounded-full" />
        </div>

        <div className="space-y-4 w-full">
          <motion.div variants={childVariants} className="h-4 w-[85%] bg-surface-100 rounded-full" />
          <motion.div variants={childVariants} className="h-4 w-[90%] bg-surface-200 rounded-full" />
          <motion.div variants={childVariants} className="h-4 w-[70%] bg-surface-100 rounded-full" />
        </div>

        <div className="mt-8 flex justify-center pt-8 border-t border-border-subtle/50">
          <motion.div variants={childVariants} className="px-4 py-2 rounded-full bg-surface-100 border border-border-subtle">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              AI is crafting your lesson...
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}