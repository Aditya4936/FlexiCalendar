import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { defaultTheme } from '../../theme/defaultTheme.js'
import { defaultDarkTheme } from '../../theme/defaultDarkTheme.js'
import { useCalendar } from '../../hooks/useCalendar.js'
import {
  dateKey,
  isSameDay,
  isWithinRange,
  normalizeDate,
  shiftDate
} from '../../utils/dateUtils.js'
import '../../styles/flexiCalendar.css'

const dateFromKey = (key) => {
  if (!key) {
    return null
  }
  const segments = key.split('-').map(Number)
  if (segments.length !== 3) {
    return null
  }
  const [year, month, day] = segments
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }
  const parsed = new Date(year, month - 1, day)
  parsed.setHours(0, 0, 0, 0)
  return parsed
}

const buildClassName = (base, tokens = {}) => {
  const extra = Object.entries(tokens)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => `${base}--${key}`)
  return [base, ...extra].join(' ')
}

const formatAriaLabel = (date, locale) => {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'full' })
  return formatter.format(date)
}

export const FlexiCalendar = ({
  initialDate,
  selectedDate,
  defaultSelectedDate,
  onDateSelect,
  locale = 'default',
  weekStartsOn = 0,
  minDate,
  maxDate,
  disabledDates,
  highlightedDates,
  renderDay,
  headerRender,
  monthLabelOptions,
  weekdayFormatOptions,
  showWeekdays = true,
  showAdjacentDays = true,
  allowOutsideDaysNavigation = true,
  theme,
  darkTheme,
  colorScheme = 'system',
  showYearControls = true,
  size = 'md',
  onMonthChange
}) => {
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (colorScheme === 'dark') {
      return true
    }
    if (colorScheme === 'light') {
      return false
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    if (colorScheme !== 'system') {
      setSystemPrefersDark(colorScheme === 'dark')
      return
    }
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemPrefersDark(event.matches)
    setSystemPrefersDark(media.matches)
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }
    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [colorScheme])

  const isDarkMode = colorScheme === 'dark' || (colorScheme === 'system' && systemPrefersDark)

  const {
    activeMonthDate,
    activeYear,
    activeMonth,
    monthLabel,
    weeks,
    weekdayLabels,
    disabledSet,
    highlightedMap,
    normalizedMinDate,
    normalizedMaxDate,
    goToNextMonth,
    goToPreviousMonth,
    goToNextYear,
    goToPreviousYear,
    goToDate,
    goToToday
  } = useCalendar({
    initialDate,
    weekStartsOn,
    locale,
    minDate,
    maxDate,
    disabledDates,
    highlightedDates,
    weekdayFormatOptions,
    monthLabelOptions,
    onMonthChange
  })

  const [internalSelected, setInternalSelected] = useState(() => normalizeDate(defaultSelectedDate))

  useEffect(() => {
    if (defaultSelectedDate) {
      setInternalSelected(normalizeDate(defaultSelectedDate))
    }
  }, [defaultSelectedDate])

  const controlledSelected = normalizeDate(selectedDate)
  const effectiveSelectedDate = controlledSelected || internalSelected
  const effectiveSelectedKey = effectiveSelectedDate ? dateKey(effectiveSelectedDate) : null
  const effectiveSelectedStable = useMemo(() => {
    if (!effectiveSelectedDate) {
      return null
    }
    return normalizeDate(effectiveSelectedDate)
  }, [effectiveSelectedKey, effectiveSelectedDate])

  const dayRefs = useRef(new Map())

  const isDateDisabled = useCallback((value) => {
    const normalized = normalizeDate(value)
    if (!normalized) {
      return true
    }
    if (!isWithinRange(normalized, normalizedMinDate, normalizedMaxDate)) {
      return true
    }
    return disabledSet.has(dateKey(normalized))
  }, [disabledSet, normalizedMinDate, normalizedMaxDate])

  const findFocusableDate = useCallback((candidate, direction = 1) => {
    const normalizedCandidate = normalizeDate(candidate)
    if (!normalizedCandidate) {
      return null
    }
    if (!isDateDisabled(normalizedCandidate)) {
      return normalizedCandidate
    }

    const step = direction >= 0 ? 1 : -1
    let attempts = 0
    let cursor = normalizedCandidate
    while (attempts < 120) {
      cursor = shiftDate(cursor, step)
      if (!cursor) {
        return null
      }
      if (!isDateDisabled(cursor)) {
        return cursor
      }
      attempts += 1
    }
    return null
  }, [isDateDisabled])

  const [focusDate, setFocusDate] = useState(() =>
    findFocusableDate(effectiveSelectedDate || activeMonthDate) ||
    effectiveSelectedDate ||
    activeMonthDate ||
    normalizeDate(new Date())
  )

  const focusKey = focusDate ? dateKey(focusDate) : null
  const activeMonthKey = dateKey(activeMonthDate)
  const activeMonthStable = useMemo(() => (activeMonthDate ? new Date(activeMonthDate.getTime()) : null), [activeMonthKey, activeMonthDate])

  const lightThemeTokens = useMemo(() => ({ ...defaultTheme, ...(theme || {}) }), [theme])
  const darkThemeTokens = useMemo(
    () => ({ ...defaultDarkTheme, ...(theme || {}), ...(darkTheme || {}) }),
    [darkTheme, theme]
  )

  const mergedTheme = useMemo(
    () => (isDarkMode ? darkThemeTokens : lightThemeTokens),
    [darkThemeTokens, isDarkMode, lightThemeTokens]
  )

  const themeStyles = useMemo(
    () => ({
      '--flexi-cal-bg': mergedTheme.background,
      '--flexi-cal-border': mergedTheme.borderColor,
      '--flexi-cal-radius': mergedTheme.borderRadius,
      '--flexi-cal-text': mergedTheme.textColor,
      '--flexi-cal-muted-text': mergedTheme.mutedTextColor,
      '--flexi-cal-accent': mergedTheme.accentColor,
      '--flexi-cal-accent-text': mergedTheme.accentTextColor,
      '--flexi-cal-hover': mergedTheme.hoverColor,
      '--flexi-cal-selected-bg': mergedTheme.selectedBgColor,
      '--flexi-cal-selected-text': mergedTheme.selectedTextColor,
      '--flexi-cal-disabled-text': mergedTheme.disabledTextColor,
      '--flexi-cal-highlight': mergedTheme.highlightColor,
      '--flexi-cal-focus': mergedTheme.focusRing,
      '--flexi-cal-shadow': mergedTheme.shadow,
      fontFamily: mergedTheme.fontFamily
    }),
    [mergedTheme]
  )

  useEffect(() => {
    if (!effectiveSelectedStable) {
      return
    }
    setFocusDate((current) => {
      if (current && isSameDay(current, effectiveSelectedStable)) {
        return current
      }
      const next = findFocusableDate(effectiveSelectedStable)
      if (next) {
        if (current && isSameDay(current, next)) {
          return current
        }
        return next
      }
      return current || effectiveSelectedStable
    })
  }, [effectiveSelectedKey, effectiveSelectedStable, findFocusableDate])

  useEffect(() => {
    setFocusDate((current) => {
      if (!activeMonthStable) {
        return current
      }
      if (current && current.getFullYear() === activeMonthStable.getFullYear() && current.getMonth() === activeMonthStable.getMonth()) {
        return current
      }
      const baseline = effectiveSelectedStable &&
        effectiveSelectedStable.getFullYear() === activeMonthStable.getFullYear() &&
        effectiveSelectedStable.getMonth() === activeMonthStable.getMonth()
        ? effectiveSelectedStable
        : activeMonthStable
      const next = findFocusableDate(baseline)
      if (current && next && isSameDay(current, next)) {
        return current
      }
      if (!next) {
        return current || baseline
      }
      return next
    })
  }, [activeMonthKey, activeMonthStable, effectiveSelectedStable, findFocusableDate])

  useEffect(() => {
    if (!focusKey) {
      return
    }
    const node = dayRefs.current.get(focusKey)
    if (node && node !== document.activeElement) {
      node.focus({ preventScroll: true })
    }
  }, [focusKey])

  const moveFocusToDate = useCallback((candidate, direction = 1) => {
    const next = findFocusableDate(candidate, direction)
    if (!next) {
      return
    }
  setFocusDate((current) => (current && isSameDay(current, next) ? current : next))
    if (next.getFullYear() !== activeYear || next.getMonth() !== activeMonth) {
      if (!showAdjacentDays) {
        goToDate(next)
        return
      }
      if (allowOutsideDaysNavigation) {
        goToDate(next)
      }
    }
  }, [activeMonth, activeYear, allowOutsideDaysNavigation, findFocusableDate, goToDate, showAdjacentDays])

  const moveFocusByDays = useCallback((offset, baseDateOverride) => {
    if (!offset) {
      return
    }
    const reference = normalizeDate(baseDateOverride || focusDate || effectiveSelectedDate || activeMonthDate)
    if (!reference) {
      return
    }
    const candidate = shiftDate(reference, offset)
    moveFocusToDate(candidate, offset >= 0 ? 1 : -1)
  }, [activeMonthDate, effectiveSelectedDate, focusDate, moveFocusToDate])

  const moveFocusByMonths = useCallback((delta, baseDateOverride) => {
    const reference = normalizeDate(baseDateOverride || focusDate || effectiveSelectedDate || activeMonthDate)
    if (!reference) {
      return
    }
    const candidate = new Date(reference.getTime())
    candidate.setMonth(candidate.getMonth() + delta)
    moveFocusToDate(candidate, delta >= 0 ? 1 : -1)
  }, [activeMonthDate, effectiveSelectedDate, focusDate, moveFocusToDate])

  const focusWeekEdge = useCallback((edge, baseDateOverride) => {
    const reference = normalizeDate(baseDateOverride || focusDate || effectiveSelectedDate || activeMonthDate)
    if (!reference) {
      return
    }
    const dayIndex = (reference.getDay() - weekStartsOn + 7) % 7
    const offset = edge === 'start' ? -dayIndex : 6 - dayIndex
    if (offset !== 0) {
      moveFocusByDays(offset, reference)
    }
  }, [activeMonthDate, effectiveSelectedDate, focusDate, moveFocusByDays, weekStartsOn])

  const focusToday = useCallback(() => {
    const today = normalizeDate(new Date())
    if (!today) {
      return
    }
    moveFocusToDate(today, 1)
  }, [moveFocusToDate])

  const handleSelect = (date) => {
    if (!date) return
    if (!controlledSelected) {
      setInternalSelected(date)
    }
    onDateSelect?.(date)
  }

  const renderHeader = () => {
    const context = {
      activeMonthDate,
      monthLabel,
      goToNextMonth,
      goToPreviousMonth,
      goToNextYear,
      goToPreviousYear,
      goToDate,
      goToToday
    }
    if (headerRender) {
      return headerRender(context)
    }
    return (
      <div className="flexi-calendar__header-default">
        <div className="flexi-calendar__nav-group">
          {showYearControls ? (
            <button
              type="button"
              className="flexi-calendar__nav-button flexi-calendar__nav-button--year"
              onClick={goToPreviousYear}
              aria-label="Previous year"
            >
              {'<<'}
            </button>
          ) : null}
          <button
            type="button"
            className="flexi-calendar__nav-button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            {'<'}
          </button>
        </div>
        <div className="flexi-calendar__current-month" aria-live="polite">
          {monthLabel}
        </div>
        <div className="flexi-calendar__nav-group">
          <button
            type="button"
            className="flexi-calendar__nav-button"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            {'>'}
          </button>
          {showYearControls ? (
            <button
              type="button"
              className="flexi-calendar__nav-button flexi-calendar__nav-button--year"
              onClick={goToNextYear}
              aria-label="Next year"
            >
              {'>>'}
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const renderDayCell = (date) => {
    const key = dateKey(date)
    const isCurrentMonth = date.getMonth() === activeMonth
    if (!isCurrentMonth && !showAdjacentDays) {
      return <div key={key} className="flexi-calendar__day flexi-calendar__day--placeholder" aria-hidden="true" />
    }

    const isOutOfRange = !isWithinRange(date, normalizedMinDate, normalizedMaxDate)
    const isDisabled = isOutOfRange || disabledSet.has(key)
    const isHighlighted = highlightedMap.has(key)
    const highlightMeta = highlightedMap.get(key)
    const normalizedDate = normalizeDate(date)
    const isSelected = effectiveSelectedDate ? isSameDay(normalizedDate, effectiveSelectedDate) : false
    const isToday = isSameDay(normalizedDate, new Date())
    const isFocused = focusDate ? isSameDay(normalizedDate, focusDate) : false

    const dayClassName = buildClassName('flexi-calendar__day', {
      'outside': !isCurrentMonth,
      'disabled': isDisabled,
      'selected': isSelected,
      'today': isToday,
      'highlighted': isHighlighted,
      'focused': isFocused
    })

    const composedClassName = highlightMeta?.className ? `${dayClassName} ${highlightMeta.className}` : dayClassName

    const dayContent = renderDay?.({
      date: normalizedDate,
      isCurrentMonth,
      isSelected,
      isToday,
      isDisabled,
      isHighlighted
    })

    const ariaLabel = formatAriaLabel(date, locale)

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          moveFocusByDays(-7, normalizedDate)
          break
        case 'ArrowDown':
          event.preventDefault()
          moveFocusByDays(7, normalizedDate)
          break
        case 'ArrowLeft':
          event.preventDefault()
          moveFocusByDays(-1, normalizedDate)
          break
        case 'ArrowRight':
          event.preventDefault()
          moveFocusByDays(1, normalizedDate)
          break
        case 'PageUp':
          event.preventDefault()
          moveFocusByMonths(event.shiftKey || event.ctrlKey ? -12 : -1, normalizedDate)
          break
        case 'PageDown':
          event.preventDefault()
          moveFocusByMonths(event.shiftKey || event.ctrlKey ? 12 : 1, normalizedDate)
          break
        case 'Home':
          event.preventDefault()
          focusWeekEdge('start', normalizedDate)
          break
        case 'End':
          event.preventDefault()
          focusWeekEdge('end', normalizedDate)
          break
        case 'Enter':
        case ' ': // fallthrough intended
        case 'Spacebar':
          if (isDisabled) {
            return
          }
          event.preventDefault()
          handleSelect(normalizedDate)
          break
        case 't':
        case 'T':
          event.preventDefault()
          focusToday()
          break
        default:
      }
    }

    const handleClick = () => {
      if (isDisabled) return
      if (!isCurrentMonth && allowOutsideDaysNavigation) {
        goToDate(date)
      }
      handleSelect(normalizedDate)
    }

    const buttonProps = {
      type: 'button',
      className: composedClassName,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      onFocus: () => {
        if (!isDisabled) {
          setFocusDate((current) => (current && isSameDay(current, normalizedDate) ? current : normalizedDate))
        }
      },
      disabled: isDisabled,
      'aria-pressed': isSelected,
      'aria-label': ariaLabel,
      'aria-current': isToday ? 'date' : undefined,
      'data-today': isToday || undefined,
      'data-selected': isSelected || undefined,
      'data-highlight': isHighlighted || undefined,
      'data-focused': isFocused || undefined,
      'data-date': key,
      tabIndex: isDisabled ? -1 : (isFocused ? 0 : -1),
      style: highlightMeta?.color ? { '--flexi-cal-highlight': highlightMeta.color } : undefined
    }

    const highlightKind = highlightMeta?.kind || 'dot'
    const showBadge = Boolean(highlightMeta?.label) || highlightKind === 'badge'
    const badgeContent = highlightMeta?.label || (highlightKind === 'badge' ? '' : null)
    const showDot = isHighlighted && highlightKind === 'dot'

    return (
      <button
        key={key}
        {...buttonProps}
        ref={(node) => {
          if (node) {
            dayRefs.current.set(key, node)
          } else {
            dayRefs.current.delete(key)
          }
        }}
      >
        {dayContent || <span className="flexi-calendar__day-number">{date.getDate()}</span>}
        {showBadge ? <span className="flexi-calendar__badge">{badgeContent}</span> : null}
        {showDot ? <span className="flexi-calendar__dot" /> : null}
      </button>
    )
  }

  return (
    <section
      className={buildClassName('flexi-calendar', { [size]: true, dark: isDarkMode, light: !isDarkMode })}
      style={themeStyles}
      data-color-scheme={isDarkMode ? 'dark' : 'light'}
    >
      <header className="flexi-calendar__header">{renderHeader()}</header>
      {showWeekdays ? (
        <div className="flexi-calendar__weekday-row" role="row">
          {weekdayLabels.map(({ short, long }) => (
            <span key={long} className="flexi-calendar__weekday" title={long} role="columnheader">
              {short}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flexi-calendar__grid" role="grid">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="flexi-calendar__week" role="row">
            {week.map(renderDayCell)}
          </div>
        ))}
      </div>
    </section>
  )
}

FlexiCalendar.propTypes = {
  initialDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  selectedDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  defaultSelectedDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  onDateSelect: PropTypes.func,
  locale: PropTypes.string,
  weekStartsOn: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6]),
  minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  disabledDates: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number])
  ),
  highlightedDates: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string,
        color: PropTypes.string,
        className: PropTypes.string,
        kind: PropTypes.oneOf(['dot', 'badge', 'none'])
      })
    ])
  ),
  renderDay: PropTypes.func,
  headerRender: PropTypes.func,
  monthLabelOptions: PropTypes.object,
  weekdayFormatOptions: PropTypes.object,
  showWeekdays: PropTypes.bool,
  showAdjacentDays: PropTypes.bool,
  allowOutsideDaysNavigation: PropTypes.bool,
  theme: PropTypes.object,
  darkTheme: PropTypes.object,
  colorScheme: PropTypes.oneOf(['light', 'dark', 'system']),
  showYearControls: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onMonthChange: PropTypes.func
}
