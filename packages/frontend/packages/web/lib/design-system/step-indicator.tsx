import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Step Indicator Variants
 *
 * Multi-step progress visualization component.
 * Shows current step in a sequence with filled/unfilled states.
 *
 * Design specs from decoded.pen:
 * - StepIndicator/Default (Step 1): gap 8px, three circles (24x24), first filled primary, rest muted
 * - StepIndicator/Step2: first two filled primary, last muted
 * - StepIndicator/Step3: all three filled primary
 *
 * @see docs/design-system/decoded.pen
 */
export const stepIndicatorVariants = cva("inline-flex items-center gap-2", {
  variants: {
    size: {
      xs: "gap-1.5",
      sm: "gap-1.5",
      md: "gap-2",
      lg: "gap-3",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const stepCircleVariants = cva("rounded-full transition-colors duration-200", {
  variants: {
    size: {
      xs: "h-2 w-2",
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    },
    state: {
      active: "bg-primary",
      inactive: "bg-muted",
    },
  },
  defaultVariants: {
    size: "md",
    state: "inactive",
  },
});

const stepNumberVariants = cva(
  "flex items-center justify-center rounded-full font-semibold transition-colors duration-200",
  {
    variants: {
      size: {
        xs: "h-2 w-2 text-[8px]",
        sm: "h-4 w-4 text-[10px]",
        md: "h-6 w-6 text-xs",
        lg: "h-8 w-8 text-sm",
      },
      state: {
        active: "bg-primary text-primary-foreground",
        inactive: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      state: "inactive",
    },
  }
);

const connectorVariants = cva("transition-colors duration-200", {
  variants: {
    size: {
      xs: "h-0.5 w-3",
      sm: "h-0.5 w-4",
      md: "h-0.5 w-6",
      lg: "h-0.5 w-8",
    },
    state: {
      active: "bg-primary",
      inactive: "bg-muted",
    },
  },
  defaultVariants: {
    size: "md",
    state: "inactive",
  },
});

export interface StepIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepIndicatorVariants> {
  /** Current active step (1-indexed) */
  currentStep: number;
  /** Total number of steps (default: 3) */
  totalSteps?: number;
  /** Visual style variant */
  variant?: "dots" | "numbered" | "labeled";
  /** Show connector lines between steps */
  showConnectors?: boolean;
  /** Labels for each step (used with "labeled" variant) */
  labels?: string[];
}

/**
 * StepIndicator Component
 *
 * Visualizes progress through a multi-step flow.
 * Supports dots, numbered, and labeled variants.
 *
 * @example
 * // Basic 3-step indicator on step 2
 * <StepIndicator currentStep={2} totalSteps={3} />
 *
 * @example
 * // Numbered variant with connectors
 * <StepIndicator currentStep={1} variant="numbered" showConnectors />
 *
 * @example
 * // Large labeled variant
 * <StepIndicator
 *   currentStep={2}
 *   variant="labeled"
 *   labels={["Upload", "Detect", "Confirm"]}
 *   size="lg"
 * />
 */
export const StepIndicator = ({
  className,
  currentStep,
  totalSteps = 3,
  size = "md",
  variant = "dots",
  showConnectors = false,
  labels,
  ...props
}: StepIndicatorProps) => {
  // Clamp currentStep to valid range
  const validStep = Math.max(1, Math.min(currentStep, totalSteps));

  const renderStep = (stepNumber: number) => {
    const isActive = stepNumber <= validStep;
    const state = isActive ? "active" : "inactive";

    switch (variant) {
      case "numbered":
        return (
          <div
            key={stepNumber}
            className={cn(stepNumberVariants({ size, state }))}
            aria-current={stepNumber === validStep ? "step" : undefined}
          >
            {stepNumber}
          </div>
        );

      case "labeled":
        return (
          <div
            key={stepNumber}
            className="flex flex-col items-center gap-1"
            aria-current={stepNumber === validStep ? "step" : undefined}
          >
            <div className={cn(stepCircleVariants({ size, state }))} />
            {labels && labels[stepNumber - 1] && (
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {labels[stepNumber - 1]}
              </span>
            )}
          </div>
        );

      default: // dots
        return (
          <div
            key={stepNumber}
            className={cn(stepCircleVariants({ size, state }))}
            aria-current={stepNumber === validStep ? "step" : undefined}
          />
        );
    }
  };

  const renderConnector = (afterStep: number) => {
    if (!showConnectors || afterStep >= totalSteps) return null;
    const isActive = afterStep < validStep;
    return (
      <div
        key={`connector-${afterStep}`}
        className={cn(
          connectorVariants({ size, state: isActive ? "active" : "inactive" })
        )}
      />
    );
  };

  return (
    <div
      className={cn(stepIndicatorVariants({ size }), className)}
      role="group"
      aria-label={`Step ${validStep} of ${totalSteps}`}
      {...props}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        return (
          <div key={stepNumber} className="contents">
            {renderStep(stepNumber)}
            {renderConnector(stepNumber)}
          </div>
        );
      })}
    </div>
  );
};

StepIndicator.displayName = "StepIndicator";
