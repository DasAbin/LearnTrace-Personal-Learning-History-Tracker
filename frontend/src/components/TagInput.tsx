import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { X, Hash } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput = ({ tags, onChange, placeholder = 'Add skills (comma separated)...' }: TagInputProps) => {
  const [input, setInput] = useState('');

  const processInput = (value: string) => {
    // If input contains comma, split and add multiple tags
    if (value.includes(',')) {
      const newItems = value.split(',').map(item => item.trim()).filter(item => item !== '');
      const uniqueNewItems = newItems.filter(item => !tags.includes(item));
      
      if (uniqueNewItems.length > 0) {
        onChange([...tags, ...uniqueNewItems]);
      }
      
      // If the last character was a comma, clear input. Otherwise keep the remainder.
      if (value.endsWith(',')) {
        setInput('');
      } else {
        setInput(value.split(',').pop()?.trim() || '');
      }
    } else {
      setInput(value);
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="group min-h-[52px] w-full px-3 py-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-2 transition-all duration-200 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500 shadow-sm">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white pl-2 pr-1 py-1 rounded-lg text-xs font-semibold animate-in zoom-in-75 duration-200 shadow-sm"
        >
          <Hash className="h-3 w-3 text-gray-400" />
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-white/20 p-0.5 rounded-md transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => processInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[140px] outline-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400"
      />
    </div>
  );
};
