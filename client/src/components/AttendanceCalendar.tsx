/**
 * AttendanceCalendar Component
 * 
 * Design: Clinical Precision / Swiss Medical
 * Monthly calendar view showing attendance sessions at a glance.
 * Each day with a session shows a colored dot; clicking a day opens
 * that record or starts a new entry for that date.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { type ClientProfile } from '@/lib/clientProfileStorage';
import { getAttendanceByProfile, type AttendanceRecord } from '@/lib/attendanceStorage';

interface AttendanceCalendarProps {
  profile: ClientProfile;
  onBack: () => void;
  onNewEntry: (prefilledDate?: string) => void;
  onViewEntry: (record: AttendanceRecord) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AttendanceCalendar({ profile, onBack, onNewEntry, onViewEntry }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const records = useMemo(() => getAttendanceByProfile(profile.id), [profile.id]);

  // Map of date string -> records for that day
  const recordsByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord[]> = {};
    for (const record of records) {
      const dateKey = record.date; // ISO date string YYYY-MM-DD
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(record);
    }
    return map;
  }, [records]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Padding from previous month
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr });
    }

    // Padding for next month (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentMonth]);

  // Stats for current month
  const monthStats = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthRecords = records.filter(r => r.date.startsWith(prefix));
    const signed = monthRecords.filter(r => r.parentSignature && r.therapistSignature).length;
    return { total: monthRecords.length, signed };
  }, [records, currentMonth]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedRecords = selectedDate ? (recordsByDate[selectedDate] || []) : [];

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E5E1D8] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-[#2C2C2C]">
            Attendance Calendar
          </h1>
          <span className="text-sm text-slate-500">
            {profile.firstName} {profile.lastName}
          </span>
        </div>
        <Button
          onClick={() => onNewEntry()}
          className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Month Navigation */}
        <div className="bg-white rounded-xl border border-[#E5E1D8] p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={goToPrevMonth} className="h-8 w-8 p-0">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-[#2C2C2C]">
                {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
              </h2>
              <button onClick={goToToday} className="text-xs text-[#0D7377] hover:underline mt-0.5">
                Today
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </Button>
          </div>

          {/* Month Stats */}
          <div className="flex items-center gap-4 mb-4 px-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <CalendarIcon className="w-3.5 h-3.5 text-[#0D7377]" />
              <span><strong>{monthStats.total}</strong> sessions</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span><strong>{monthStats.signed}</strong> fully signed</span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, idx) => {
              const dayRecords = recordsByDate[dayInfo.date] || [];
              const hasRecords = dayRecords.length > 0;
              const allSigned = hasRecords && dayRecords.every(r => r.parentSignature && r.therapistSignature);
              const isSelected = selectedDate === dayInfo.date;

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(dayInfo.date)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                    ${dayInfo.isCurrentMonth ? 'text-[#2C2C2C]' : 'text-slate-300'}
                    ${dayInfo.isToday ? 'ring-2 ring-[#0D7377] ring-offset-1' : ''}
                    ${isSelected ? 'bg-[#0D7377]/10 font-bold' : 'hover:bg-[#F0EDE8]'}
                    ${hasRecords ? 'font-semibold' : ''}
                  `}
                >
                  <span className={dayInfo.isToday ? 'text-[#0D7377] font-bold' : ''}>
                    {dayInfo.day}
                  </span>
                  {hasRecords && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {dayRecords.length <= 3 ? (
                        dayRecords.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${allSigned ? 'bg-green-500' : 'bg-[#0D7377]'}`}
                          />
                        ))
                      ) : (
                        <>
                          <div className={`w-1.5 h-1.5 rounded-full ${allSigned ? 'bg-green-500' : 'bg-[#0D7377]'}`} />
                          <span className="text-[9px] text-[#0D7377] font-bold">{dayRecords.length}</span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E5E1D8] px-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-[#0D7377]" />
              <span>Session recorded</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Fully signed</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-4 h-4 rounded ring-2 ring-[#0D7377] ring-offset-1" />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Selected Day Detail */}
        {selectedDate && (
          <div className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E1D8] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2C2C2C]">
                {formatDateDisplay(selectedDate)}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNewEntry(selectedDate)}
                className="gap-1.5 text-xs border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377]/5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry
              </Button>
            </div>

            {selectedRecords.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-slate-500">No sessions on this date</p>
                <Button
                  size="sm"
                  onClick={() => onNewEntry(selectedDate)}
                  className="mt-3 bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record Session
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E1D8]">
                {selectedRecords.map(record => (
                  <button
                    key={record.id}
                    onClick={() => onViewEntry(record)}
                    className="w-full px-5 py-3 text-left hover:bg-[#FAF9F6] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#0D7377]" />
                        <span className="text-sm font-medium text-[#2C2C2C]">{record.time}</span>
                        {record.typeFrequency && (
                          <span className="text-xs bg-[#0D7377]/10 text-[#0D7377] px-2 py-0.5 rounded-full font-medium">
                            {record.typeFrequency}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {record.parentSignature && record.therapistSignature && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    {record.progressNote && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 ml-7">
                        {record.progressNote}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
