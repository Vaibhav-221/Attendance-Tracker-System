"use client";

export default function SkeletonLoader({ isDark }) {
  const bgColor = isDark ? 'bg-slate-800/50' : 'bg-slate-200';
  const cardBg = isDark ? '#0F1629' : '#FFFFFF';
  const pageBg = isDark ? '#0A0E27' : '#F8FAFC';
  const borderColor = isDark ? '#1A1F3A' : '#E2E8F0';

  const SkeletonBlock = ({ className = "" }) => (
    <div className={`${bgColor} rounded skeleton-shimmer ${className}`}></div>
  );

  return (
    <div className={`min-h-screen p-3 sm:p-5 lg:p-8 relative overflow-hidden`} style={{ backgroundColor: pageBg }}>
      {/* Animated Background */}
      <div className="absolute -top-25 -right-25 w-75 h-75 sm:w-100 sm:h-100 bg-[#00D9FF]/5 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute -bottom-37.5 -left-37.5 w-87.5 h-87.5 sm:w-125 sm:h-125 bg-[#7C3AED]/5 rounded-full blur-[120px] animate-pulse"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Skeleton */}
        <div className="flex flex-row justify-between items-center gap-3 mb-8 sm:mb-12">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar Skeleton */}
            <SkeletonBlock className="w-10 h-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              {/* Title Skeleton */}
              <SkeletonBlock className="h-6 w-48" />
              {/* Subtitle Skeleton */}
              <SkeletonBlock className="h-4 w-32" />
            </div>
          </div>

          {/* Menu Button Skeleton */}
          <SkeletonBlock className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-4 mb-4">
          {/* Overall Attendance Card Skeleton */}
          <div
            className={`col-span-2 sm:col-span-2 lg:col-span-6 rounded-xl p-4 relative overflow-hidden`}
            style={{ backgroundColor: cardBg, borderColor, borderWidth: '1px' }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-2 w-12" />
                  </div>
                </div>
                <SkeletonBlock className="w-6 h-6 rounded" />
              </div>

              {/* Percentage */}
              <SkeletonBlock className="h-10 w-24" />

              {/* Progress Bar */}
              <SkeletonBlock className="w-full h-2 rounded-full" />

              {/* Footer Text */}
              <SkeletonBlock className="h-2 w-32 mx-auto" />
            </div>
          </div>

          {/* Weekly Trend Card Skeleton */}
          <div
            className={`col-span-2 sm:col-span-2 lg:col-span-6 rounded-xl p-4 relative overflow-hidden`}
            style={{ backgroundColor: cardBg, borderColor, borderWidth: '1px' }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-4 h-4 rounded" />
                <SkeletonBlock className="h-3 w-32" />
              </div>

              {/* Chart Area */}
              <SkeletonBlock className="w-full h-32 rounded" />
            </div>
          </div>
        </div>

        {/* Today's Classes Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-4 mb-4">
          {/* Classes List */}
          <div
            className={`col-span-1 lg:col-span-4 rounded-xl p-4 relative overflow-hidden`}
            style={{ backgroundColor: cardBg, borderColor, borderWidth: '1px' }}
          >
            <div className="space-y-3">
              {/* Header */}
              <SkeletonBlock className="h-4 w-32" />

              {/* Class Items */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg space-y-2">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-2 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className={`col-span-1 lg:col-span-3 rounded-xl p-4 relative overflow-hidden space-y-3`}
            style={{ backgroundColor: cardBg, borderColor, borderWidth: '1px' }}
          >
            {/* Card 1 */}
            <div className="p-3 rounded-lg space-y-2">
              <SkeletonBlock className="h-2 w-20" />
              <SkeletonBlock className="h-6 w-16" />
              <SkeletonBlock className="h-2 w-24" />
            </div>

            {/* Card 2 */}
            <div className="p-3 rounded-lg space-y-2">
              <SkeletonBlock className="h-2 w-20" />
              <SkeletonBlock className="h-6 w-16" />
              <SkeletonBlock className="h-2 w-24" />
            </div>

            {/* Card 3 */}
            <div className="p-3 rounded-lg space-y-2">
              <SkeletonBlock className="h-2 w-20" />
              <SkeletonBlock className="h-6 w-16" />
              <SkeletonBlock className="h-2 w-24" />
            </div>
          </div>
        </div>

        {/* Additional Sections Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Subject Stats */}
          <div
            className={`rounded-xl p-4 relative overflow-hidden`}
            style={{ backgroundColor: cardBg, borderColor, borderWidth: '1px' }}
          >
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-32" />
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBlock key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Monthly Chart */}
          <div
            className={`rounded-xl p-4 relative overflow-hidden`}
            style={{ backgroundColor: cardBg, borderColor, borderWidth: '1px' }}
          >
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-48 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
