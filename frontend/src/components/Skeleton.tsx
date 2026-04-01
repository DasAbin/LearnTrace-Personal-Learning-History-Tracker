/**
 * Skeleton Components
 * 
 * Reusable shimmer skeleton loaders that mimic the actual UI layout.
 * Using Tailwind's animate-pulse combined with a custom gradient for a premium look.
 */

const Shimmer = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
  `}} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
    <Shimmer />
    <div className="flex items-start gap-6">
      <div className="flex-1 space-y-4">
        {/* Title Bar - Wide */}
        <div className="h-6 w-3/4 animate-shimmer rounded-lg" />
        
        {/* Meta Lines - Shorter */}
        <div className="space-y-2">
            <div className="h-4 w-1/2 animate-shimmer rounded-md" />
            <div className="h-4 w-1/3 animate-shimmer rounded-md" />
        </div>

        {/* Tag Pills - Side by side */}
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 animate-shimmer rounded-full" />
          <div className="h-6 w-16 animate-shimmer rounded-full" />
          <div className="h-6 w-16 animate-shimmer rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
    <Shimmer />
    <div className="flex items-center justify-between mb-6">
      {/* Icon Placeholder */}
      <div className="h-12 w-12 animate-shimmer rounded-2xl" />
      <div className="h-3 w-10 animate-shimmer rounded-md" />
    </div>
    {/* Big Number */}
    <div className="h-10 w-24 animate-shimmer rounded-xl mb-2" />
    {/* Label */}
    <div className="h-3 w-20 animate-shimmer rounded-md" />
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
    <Shimmer />
    <div className="flex items-center justify-between mb-10">
        <div className="space-y-2">
            <div className="h-5 w-32 animate-shimmer rounded-md" />
            <div className="h-3 w-48 animate-shimmer rounded-md" />
        </div>
        <div className="h-10 w-10 animate-shimmer rounded-xl" />
    </div>
    {/* Large Content Area */}
    <div className="h-48 w-full animate-shimmer rounded-2xl" />
  </div>
);
