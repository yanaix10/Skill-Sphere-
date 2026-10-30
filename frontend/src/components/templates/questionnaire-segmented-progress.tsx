"use client";

import { useState, type FormEvent } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type QuestionnaireItemConfig = {
  name: string;
  required?: boolean;
};

export type QuestionnaireState = {
  current: number;
  total: number;
};

export type QuestionnaireContextValue = {
  items: QuestionnaireItemConfig[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  values: Record<string, string>;
  setValue: (name: string, value: string) => void;
  attemptedAdvance: boolean;
  setAttemptedAdvance: (value: boolean) => void;
};

const QuestionnaireContext =
  React.createContext<QuestionnaireContextValue | null>(null);

export function useQuestionnaireContext(component: string) {
  const context = React.useContext(QuestionnaireContext);
  if (!context) {
    throw new Error(`${component} must be used within a <Questionnaire>`);
  }
  return context;
}

const ActiveItemContext = React.createContext<string | null>(null);

export function useActiveItemName() {
  return React.useContext(ActiveItemContext);
}

export type QuestionnaireProps = Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "children"
> & {
  items: QuestionnaireItemConfig[];
  defaultItem?: string;
  children: React.ReactNode;
};

export function Questionnaire({
  items,
  defaultItem,
  className,
  children,
  onSubmit,
  ...props
}: QuestionnaireProps) {
  const foundDefaultIndex = items.findIndex(
    (item) => item.name === defaultItem,
  );
  const [currentIndex, setCurrentIndex] = React.useState(
    foundDefaultIndex === -1 ? 0 : foundDefaultIndex,
  );
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [attemptedAdvance, setAttemptedAdvance] = React.useState(false);

  const setValue = React.useCallback((name: string, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const currentItem = items[currentIndex];
    if (currentItem?.required && !values[currentItem.name]) {
      event.preventDefault();
      setAttemptedAdvance(true);
      return;
    }
    onSubmit?.(event);
  }

  return (
    <QuestionnaireContext.Provider
      value={{
        items,
        currentIndex,
        setCurrentIndex,
        values,
        setValue,
        attemptedAdvance,
        setAttemptedAdvance,
      }}
    >
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </QuestionnaireContext.Provider>
  );
}

export function QuestionnaireProgress({
  className,
  render,
}: {
  className?: string;
  render?: (
    props: React.HTMLAttributes<HTMLDivElement>,
    state: QuestionnaireState,
  ) => React.ReactNode;
}) {
  const { items, currentIndex } = useQuestionnaireContext(
    "QuestionnaireProgress",
  );
  const state: QuestionnaireState = {
    current: currentIndex + 1,
    total: items.length,
  };
  const label = `Question ${state.current} of ${state.total}`;
  const baseProps: React.HTMLAttributes<HTMLDivElement> = {
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": state.total,
    "aria-valuenow": state.current,
    "aria-valuetext": label,
    className: cn("text-sm text-muted-foreground", className),
  } as React.HTMLAttributes<HTMLDivElement>;

  if (render) {
    return <>{render(baseProps, state)}</>;
  }

  return <div {...baseProps}>{label}</div>;
}

export function QuestionnaireItem({
  name,
  required,
  className,
  children,
}: {
  name: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { items, currentIndex } = useQuestionnaireContext("QuestionnaireItem");
  const index = items.findIndex((item) => item.name === name);

  if (index !== currentIndex) {
    return null;
  }

  return (
    <ActiveItemContext.Provider value={name}>
      <fieldset
        name={name}
        aria-required={required}
        className={cn("flex flex-col gap-4", className)}
      >
        {children}
      </fieldset>
    </ActiveItemContext.Provider>
  );
}

export function QuestionnaireTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <legend className={cn("text-base font-medium text-foreground", className)}>
      {children}
    </legend>
  );
}

export function QuestionnaireChoices({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="radiogroup" className={cn("flex flex-col gap-2", className)}>
      {children}
    </div>
  );
}

export function QuestionnaireChoice({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const name = useActiveItemName();
  const { values, setValue } = useQuestionnaireContext("QuestionnaireChoice");

  if (!name) {
    return null;
  }

  const checked = values[name] === value;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm transition-colors",
        checked
          ? "border-primary bg-primary/5 text-foreground"
          : "text-foreground hover:bg-accent",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => setValue(name, value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

export function QuestionnaireError({ className }: { className?: string }) {
  const name = useActiveItemName();
  const { items, attemptedAdvance, values } =
    useQuestionnaireContext("QuestionnaireError");

  if (!name) {
    return null;
  }

  const item = items.find((candidate) => candidate.name === name);
  const hasError = Boolean(item?.required) && !values[name];

  if (!hasError || !attemptedAdvance) {
    return null;
  }

  return (
    <p role="alert" className={cn("text-sm text-destructive", className)}>
      Please select an option to continue.
    </p>
  );
}

export function QuestionnaireActions({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      {children}
    </div>
  );
}

export function QuestionnairePrevious({
  className,
  children = "Back",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { currentIndex, setCurrentIndex, setAttemptedAdvance } =
    useQuestionnaireContext("QuestionnairePrevious");

  if (currentIndex === 0) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => {
        setAttemptedAdvance(false);
        setCurrentIndex(currentIndex - 1);
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export function QuestionnaireNext({
  className,
  children = "Next",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { items, currentIndex, setCurrentIndex, values, setAttemptedAdvance } =
    useQuestionnaireContext("QuestionnaireNext");
  const isLast = currentIndex === items.length - 1;

  if (isLast) {
    return null;
  }

  function handleClick() {
    const currentItem = items[currentIndex];
    if (currentItem?.required && !values[currentItem.name]) {
      setAttemptedAdvance(true);
      return;
    }
    setAttemptedAdvance(false);
    setCurrentIndex(currentIndex + 1);
  }

  return (
    <Button
      type="button"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export function QuestionnaireSubmit({
  className,
  children = "Submit",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { items, currentIndex } = useQuestionnaireContext(
    "QuestionnaireSubmit",
  );
  const isLast = currentIndex === items.length - 1;

  if (!isLast) {
    return null;
  }

  return (
    <Button type="submit" className={className} {...props}>
      {children}
    </Button>
  );
}

type Question = {
  name: string;
  step: string;
  title: string;
  choices: { value: string; label: string }[];
};

const QUESTIONS: Question[] = [
  {
    name: "source",
    step: "Source",
    title: "Where does the data come from?",
    choices: [
      { value: "warehouse", label: "A warehouse table" },
      { value: "stream", label: "An event stream" },
      { value: "uploads", label: "Files uploaded by hand" },
    ],
  },
  {
    name: "volume",
    step: "Volume",
    title: "How much arrives in a day?",
    choices: [
      { value: "small", label: "Under 1M rows" },
      { value: "medium", label: "1M to 50M rows" },
      { value: "large", label: "More than 50M rows" },
    ],
  },
  {
    name: "alerting",
    step: "Alerting",
    title: "Who should be alerted when it stalls?",
    choices: [
      { value: "oncall", label: "The on-call rota" },
      { value: "data", label: "The data team channel" },
      { value: "none", label: "Nobody yet" },
    ],
  },
  {
    name: "owner",
    step: "Owner",
    title: "Who owns the pipeline?",
    choices: [
      { value: "me", label: "Me" },
      { value: "teammate", label: "A teammate" },
      { value: "undecided", label: "Still deciding" },
    ],
  },
];

const ITEMS = QUESTIONS.map((question) => ({
  name: question.name,
  required: true,
}));

export function Pattern() {
  const [created, setCreated] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const source = QUESTIONS[0].choices.find(
      (choice) => choice.value === formData.get("source"),
    );

    setCreated(source?.label.toLowerCase() ?? "the chosen source");
  }

  if (created) {
    return (
      <Empty className="mx-auto w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleCheckIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Pipeline queued</EmptyTitle>
          <EmptyDescription>
            We are provisioning a pipeline from {created}. The first run starts
            as soon as the connection is verified.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline" onClick={() => setCreated(null)}>
            Set up another
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Questionnaire
      className="mx-auto w-full max-w-md"
      defaultItem="source"
      items={ITEMS}
      onSubmit={handleSubmit}
    >
      <QuestionnaireProgress
        className="w-full"
        render={(props, state) => {
          const step = QUESTIONS[state.current - 1]?.step;
          const label = `Step ${state.current} of ${state.total} - ${step}`;

          return (
            <div {...props} aria-valuetext={label}>
              <div aria-hidden="true" className="mb-2 flex gap-1.5">
                {Array.from({ length: state.total }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      index < state.current ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <span>{label}</span>
            </div>
          );
        }}
      />

      {QUESTIONS.map((question) => (
        <QuestionnaireItem key={question.name} name={question.name} required>
          <QuestionnaireTitle>{question.title}</QuestionnaireTitle>
          <QuestionnaireChoices>
            {question.choices.map((choice) => (
              <QuestionnaireChoice key={choice.value} value={choice.value}>
                {choice.label}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
      ))}

      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireNext>Next</QuestionnaireNext>
        <QuestionnaireSubmit>Create the pipeline</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  );
}

export default Pattern;
