import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  buildDateSet,
  buildHighlightedMap,
  clampDateToRange,
  formatMonthLabel,
  generateMonthMatrix,
  getWeekdayLabels,
  normalizeDate,
  startOfMonth
} from '../utils/dateUtils.js'

export const useCalendar = ({
  initialDate = new Date(),
  weekStartsOn = 0,
  locale = 'default',
  minDate,
  maxDate,
  disabledDates,
  highlightedDates,
  weekdayFormatOptions,
  monthLabelOptions,
  onMonthChange
} = {}) => {
  const normalizedMinDate = useMemo(() => normalizeDate(minDate), [minDate])
  const normalizedMaxDate = useMemo(() => normalizeDate(maxDate), [maxDate])

  const startDate = useMemo(() => {
    const normalizedInitial = normalizeDate(initialDate) || normalizeDate(new Date())
    return clampDateToRange(startOfMonth(normalizedInitial), normalizedMinDate, normalizedMaxDate) || startOfMonth(new Date())
  }, [initialDate, normalizedMinDate, normalizedMaxDate])

  const [activeMonthDate, setActiveMonthDate] = useState(startDate)

  useEffect(() => {
    setActiveMonthDate(startDate)
  }, [startDate])

  useEffect(() => {
    if (typeof onMonthChange === 'function') {
      onMonthChange(activeMonthDate)
    }
  }, [activeMonthDate, onMonthChange])

  const disabledSet = useMemo(() => buildDateSet(disabledDates), [disabledDates])
  const highlightedMap = useMemo(() => buildHighlightedMap(highlightedDates), [highlightedDates])

  const activeYear = activeMonthDate.getFullYear()
  const activeMonth = activeMonthDate.getMonth()

  const weeks = useMemo(
    () => generateMonthMatrix(activeYear, activeMonth, { weekStartsOn }),
    [activeYear, activeMonth, weekStartsOn]
  )

  const monthLabel = useMemo(
    () => formatMonthLabel(activeMonthDate, locale, monthLabelOptions),
    [activeMonthDate, locale, monthLabelOptions]
  )

  const weekdayLabels = useMemo(
    () => getWeekdayLabels(locale, weekStartsOn, weekdayFormatOptions),
    [locale, weekStartsOn, weekdayFormatOptions]
  )

  const goToNextMonth = useCallback(() => {
    setActiveMonthDate((current) => addMonths(current, 1))
  }, [])

  const goToPreviousMonth = useCallback(() => {
    setActiveMonthDate((current) => addMonths(current, -1))
  }, [])

  const goToNextYear = useCallback(() => {
    setActiveMonthDate((current) => addMonths(current, 12))
  }, [])

  const goToPreviousYear = useCallback(() => {
    setActiveMonthDate((current) => addMonths(current, -12))
  }, [])

  const goToMonth = useCallback((year, month) => {
    const next = startOfMonth(new Date(year, month, 1))
    setActiveMonthDate(next)
  }, [])

  const goToDate = useCallback((value) => {
    const normalized = startOfMonth(normalizeDate(value))
    if (normalized) {
      setActiveMonthDate(normalized)
    }
  }, [])

  const goToToday = useCallback(() => {
    setActiveMonthDate(startOfMonth(new Date()))
  }, [])

  return {
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
    goToMonth,
    goToDate,
    goToToday,
    goToNextYear,
    goToPreviousYear,
    locale,
    weekStartsOn
  }
}
