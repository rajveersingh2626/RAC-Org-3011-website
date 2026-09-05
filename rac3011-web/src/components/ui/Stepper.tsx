import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type StepState = 'done' | 'current' | 'todo';

export interface StepperStep {
  id: string;
  label: ReactNode;
}

export interface StepperProps {
  steps: StepperStep[];
  currentId: string;
  label: string;
  className?: string;
}

const circleClass: Record<StepState, string> = {
  done: 'bg-accent text-accent-fg',
  current: 'border-2 border-accent bg-surface text-accent',
  todo: 'border border-line bg-surface text-fg-3',
};

const stateText: Record<StepState, string> = {
  done: 'Done',
  current: 'Current step',
  todo: 'Not started',
};

export function Stepper({ steps, currentId, label, className }: StepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentId),
  );

  return (
    <div className={className}>
      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.1em] text-fg-3">
        Step {currentIndex + 1} of {steps.length}
      </p>
      <ol aria-label={label} className="flex w-full items-start">
        {steps.map((step, index) => {
          const state: StepState = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
          const beforeFilled = index <= currentIndex;
          const afterFilled = index < currentIndex;
          return (
            <li
              key={step.id}
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex flex-1 flex-col items-center gap-1.5 text-center"
            >
              <div className="flex w-full items-center">
                <span aria-hidden className={cn('h-px flex-1', index === 0 ? 'invisible' : beforeFilled ? 'bg-accent' : 'bg-line')} />
                <span aria-hidden className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', circleClass[state])}>
                  {state === 'done' ? <Check size={14} /> : index + 1}
                </span>
                <span aria-hidden className={cn('h-px flex-1', index === steps.length - 1 ? 'invisible' : afterFilled ? 'bg-accent' : 'bg-line')} />
              </div>
              <span className="text-[11px] font-bold text-fg-3">
                <span className="sr-only">{stateText[state]}: </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
