import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { zhCN } from "date-fns/locale"          // ← 🆕 中文 locale

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  locale = zhCN,                                  // ← 🆕 默认中文
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}                              // ← 🆕 传入 locale
      className={cn(
        "bg-white group/calendar p-4 [--cell-size:3rem]",
        "[[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("zh-CN", { month: "short" }),  // ← ✏️ default → zh-CN
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root, "w-fit min-w-[23rem]"),
        months: cn(
          defaultClassNames.months,
          "relative flex flex-col gap-4 md:flex-row"
        ),
        month: cn(defaultClassNames.month, "flex w-full flex-col gap-4"),
        nav: cn(
          defaultClassNames.nav,
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1"
        ),
        button_previous: cn(
          defaultClassNames.button_previous,
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50"
        ),
        button_next: cn(
          defaultClassNames.button_next,
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50"
        ),
        month_caption: cn(
          defaultClassNames.month_caption,
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]"
        ),
        dropdowns: cn(
          defaultClassNames.dropdowns,
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium"
        ),
        dropdown_root: cn(
          defaultClassNames.dropdown_root,
          "has-focus:border-amber-500 relative rounded-md border border-gray-200 bg-white shadow-xs has-focus:ring-amber-500/50 has-focus:ring-[3px]"
        ),
        dropdown: cn(
          defaultClassNames.dropdown,
          "absolute inset-0 opacity-0 bg-white"
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5"
        ),
        month_grid: cn(defaultClassNames.month_grid, "w-full border-collapse"),

        // 保持 table-row 布局，不能用 flex，否则表格列对齐会失效
        weekdays: cn(defaultClassNames.weekdays),
        weekday: cn(
          defaultClassNames.weekday,
          "w-[--cell-size] text-gray-400 select-none text-center text-xs font-normal"
        ),
        week: cn(defaultClassNames.week, "mt-1"),

        week_number_header: cn(
          defaultClassNames.week_number_header,
          "w-[--cell-size] select-none"
        ),
        week_number: cn(
          defaultClassNames.week_number,
          "text-muted-foreground select-none text-[0.8rem]"
        ),

        // day 单元格：table-cell 内居中，不要加 flex
        day: cn(
          defaultClassNames.day,
          "group/day relative h-[--cell-size] w-[--cell-size] select-none p-0 text-center"
        ),
        range_start: cn(
          defaultClassNames.range_start,
          "bg-amber-50 rounded-l-md"
        ),
        range_middle: cn(defaultClassNames.range_middle, "rounded-none"),
        range_end: cn(defaultClassNames.range_end, "bg-amber-50 rounded-r-md"),
        today: cn(
          defaultClassNames.today,
          "bg-amber-50 text-gray-900 rounded-md data-[selected=true]:rounded-none"
        ),
        outside: cn(
          defaultClassNames.outside,
          "text-gray-300 aria-selected:text-gray-400"
        ),
        disabled: cn(
          defaultClassNames.disabled,
          "text-gray-300 opacity-50"
        ),
        hidden: cn(defaultClassNames.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        defaultClassNames.day,
        // 按钮固定尺寸 + 居中
        "flex aspect-square h-[--cell-size] w-[--cell-size] items-center justify-center",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50",
        "min-w-[--cell-size] flex-col gap-1 font-normal leading-none",
        "data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]",
        "[&>span]:text-xs [&>span]:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
