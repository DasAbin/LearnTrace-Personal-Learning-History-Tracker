import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: string;       // emoji
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

/**
 * Empty State Component
 * 
 * Reusable layout for when no data is available or search results are empty.
 */
export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) => {
  const CTA = () => {
    if (actionHref) {
      return (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      );
    }
    if (onAction) {
      return (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6">
      <div className="text-[80px] leading-none mb-6 animate-bounce">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">
          {title}
        </h3>
        <p className="text-gray-400 text-sm font-medium leading-relaxed">
          {description}
        </p>
      </div>
      <div className="pt-4">
        <CTA />
      </div>
    </div>
  );
};
