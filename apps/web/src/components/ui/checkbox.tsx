import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import * as React from "react"

import { cn } from "@/lib/utils"
import { checkMark, checkboxBox, springBouncy } from "@/lib/animation-variants"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

// Reduced motion variants - defined outside component
const reducedCheckMarkVariants = { unchecked: { opacity: 0 }, checked: { opacity: 1 } } as const
const reducedBoxVariants = { unchecked: { scale: 1 }, checked: { scale: 1 } } as const
const reducedTransition = { duration: 0 } as const

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion()

  // Use controlled state from props if available, otherwise use internal state
  const isControlled = props.checked !== undefined
  const [internalChecked, setInternalChecked] = React.useState(false)
  const isChecked = isControlled ? !!props.checked : internalChecked

  // Memoize variant selection based on reduced motion preference
  const checkMarkVariants = prefersReducedMotion ? reducedCheckMarkVariants : checkMark
  const boxVariants = prefersReducedMotion ? reducedBoxVariants : checkboxBox
  const transition = prefersReducedMotion ? reducedTransition : springBouncy

  // Memoized change handler
  const handleCheckedChange = React.useCallback((checked: boolean | 'indeterminate') => {
    if (!isControlled) {
      setInternalChecked(!!checked)
    }
    props.onCheckedChange?.(checked)
  }, [isControlled, props.onCheckedChange])

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transform-gpu",
        className
      )}
      onCheckedChange={handleCheckedChange}
      asChild
      {...props}
    >
      <motion.button
        variants={boxVariants}
        animate={isChecked ? 'checked' : 'unchecked'}
        transition={transition}
        aria-checked={isChecked}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}
          asChild
        >
          <motion.div
            variants={checkMarkVariants}
            initial="unchecked"
            animate={isChecked ? 'checked' : 'unchecked'}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </motion.div>
        </CheckboxPrimitive.Indicator>
      </motion.button>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
