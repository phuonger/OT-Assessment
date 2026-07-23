/**
 * GoalBankPicker Component
 * 
 * Design: Clinical Precision / Swiss Medical
 * A hierarchical picker that lets the tech browse pre-set goals by type
 * (OT/Early Intervention or Feeding Therapy) and category, then click to add.
 * Also includes a free-form option.
 * 
 * Features:
 * - Search/filter across all goals
 * - Edit goal text before adding (customize wording)
 * - Smart category auto-creation when bank goal category differs from current
 * - Favorites / recently used goals surfaced at the top
 * - Spanish language toggle for Feeding Therapy goals
 */

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronRight, ChevronDown, Plus, BookOpen, PenLine, Check, X, Search, Pencil, Star, Globe
} from 'lucide-react';
import { GOAL_BANK, type GoalBankType, type GoalBankCategory, type GoalBankItem } from '@/lib/goalBank';

// --- Favorites / Recently Used persistence ---
const FAVORITES_KEY = 'bayley4-goal-favorites';
const RECENT_KEY = 'bayley4-goal-recent';
const MAX_RECENT = 10;

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch { return []; }
}

function saveFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}

function addToRecent(goalId: string) {
  const recent = loadRecent().filter(id => id !== goalId);
  recent.unshift(goalId);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function findGoalById(id: string): { goal: GoalBankItem; typeName: string; categoryName: string } | null {
  for (const type of GOAL_BANK) {
    for (const cat of type.categories) {
      for (const goal of cat.goals) {
        if (goal.id === id) return { goal, typeName: type.name, categoryName: cat.name };
      }
    }
  }
  return null;
}

interface GoalBankPickerProps {
  categoryId: string;
  categoryName: string;
  profileId: string;
  existingCategoryNames: string[];
  onAddGoal: (text: string, goalDate?: string) => void;
  onAddGoalToNewCategory: (categoryName: string, goalText: string) => void;
  onClose: () => void;
}

export default function GoalBankPicker({
  categoryId, categoryName, profileId, existingCategoryNames,
  onAddGoal, onAddGoalToNewCategory, onClose
}: GoalBankPickerProps) {
  const [mode, setMode] = useState<'choose' | 'bank' | 'freeform'>('choose');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [addedGoalIds, setAddedGoalIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSpanish, setShowSpanish] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [recentIds] = useState<string[]>(loadRecent);

  // Edit-before-add state
  const [editingGoal, setEditingGoal] = useState<{ id: string; text: string; bankCategory: string } | null>(null);
  const [editText, setEditText] = useState('');

  // Free-form state
  const [freeformText, setFreeformText] = useState('');
  const [freeformDate, setFreeformDate] = useState('');

  // Resolve favorites and recent to goal objects
  const favoriteGoals = useMemo(() => {
    return favorites.map(id => findGoalById(id)).filter(Boolean) as { goal: GoalBankItem; typeName: string; categoryName: string }[];
  }, [favorites]);

  const recentGoals = useMemo(() => {
    return recentIds
      .filter(id => !favorites.includes(id))
      .map(id => findGoalById(id))
      .filter(Boolean) as { goal: GoalBankItem; typeName: string; categoryName: string }[];
  }, [recentIds, favorites]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: { goal: GoalBankItem; typeName: string; categoryName: string }[] = [];
    for (const type of GOAL_BANK) {
      for (const cat of type.categories) {
        for (const goal of cat.goals) {
          const searchText = showSpanish && goal.textEs ? goal.textEs : goal.text;
          if (searchText.toLowerCase().includes(query) || goal.text.toLowerCase().includes(query)) {
            results.push({ goal, typeName: type.name, categoryName: cat.name });
          }
        }
      }
    }
    return results;
  }, [searchQuery, showSpanish]);

  const toggleFavorite = (goalId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId];
      saveFavorites(updated);
      return updated;
    });
  };

  const getDisplayText = (goal: GoalBankItem) => {
    return showSpanish && goal.textEs ? goal.textEs : goal.text;
  };

  const handleSelectGoal = (goalId: string, goalText: string, bankCategoryName: string) => {
    // Track as recently used
    addToRecent(goalId);

    // Check if the bank category matches the current category
    const currentCatLower = categoryName.toLowerCase();
    const bankCatLower = bankCategoryName.toLowerCase();
    const isMatch = currentCatLower.includes(bankCatLower) || bankCatLower.includes(currentCatLower)
      || currentCatLower === bankCatLower;

    if (!isMatch) {
      // Check if a matching category already exists
      const existingMatch = existingCategoryNames.find(n =>
        n.toLowerCase().includes(bankCatLower) || bankCatLower.includes(n.toLowerCase())
      );
      if (!existingMatch) {
        const createNew = confirm(
          `This goal is from "${bankCategoryName}" but you're adding to "${categoryName}".\n\n` +
          `Click OK to create a new "${bankCategoryName}" category and add the goal there.\n` +
          `Click Cancel to add it to "${categoryName}" anyway.`
        );
        if (createNew) {
          onAddGoalToNewCategory(bankCategoryName, goalText);
          setAddedGoalIds(prev => new Set([...prev, goalId]));
          return;
        }
      }
    }

    onAddGoal(goalText);
    setAddedGoalIds(prev => new Set([...prev, goalId]));
  };

  const handleEditGoal = (goalId: string, goalText: string, bankCategoryName: string) => {
    setEditingGoal({ id: goalId, text: goalText, bankCategory: bankCategoryName });
    setEditText(goalText);
  };

  const handleConfirmEdit = () => {
    if (!editingGoal || !editText.trim()) return;
    handleSelectGoal(editingGoal.id, editText.trim(), editingGoal.bankCategory);
    setEditingGoal(null);
    setEditText('');
  };

  const handleFreeformSubmit = () => {
    if (!freeformText.trim()) return;
    onAddGoal(freeformText.trim(), freeformDate || undefined);
    setFreeformText('');
    setFreeformDate('');
  };

  // Render a goal row (used in multiple places)
  const renderGoalRow = (goal: GoalBankItem, typeName: string, bankCatName: string, showBreadcrumb: boolean = false) => {
    const isAdded = addedGoalIds.has(goal.id);
    const isFav = favorites.includes(goal.id);
    const displayText = getDisplayText(goal);

    return (
      <div
        key={goal.id}
        className={`px-3 py-2 border-b border-[#E5E1D8]/30 last:border-b-0 ${
          isAdded ? 'bg-emerald-50/50' : 'hover:bg-[#0D7377]/[0.03]'
        }`}
      >
        {showBreadcrumb && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[9px] text-[#0D7377] font-medium uppercase">{typeName}</span>
            <span className="text-[9px] text-[#8B8B8B]">›</span>
            <span className="text-[9px] text-[#8B8B8B]">{bankCatName}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <button
            onClick={() => toggleFavorite(goal.id)}
            className={`p-0.5 mt-0.5 flex-shrink-0 rounded transition-colors ${isFav ? 'text-amber-500' : 'text-[#D4D0C8] hover:text-amber-400'}`}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <span className={`text-[11px] leading-relaxed flex-1 ${isAdded ? 'text-emerald-700' : 'text-[#4A4A4A]'}`}>
            {displayText}
          </span>
          {isAdded ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              <button
                onClick={() => handleEditGoal(goal.id, displayText, bankCatName)}
                className="p-0.5 rounded hover:bg-[#0D7377]/10 text-[#8B8B8B] hover:text-[#0D7377]"
                title="Edit before adding"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleSelectGoal(goal.id, displayText, bankCatName)}
                className="p-0.5 rounded hover:bg-[#0D7377]/10 text-[#0D7377]"
                title="Add goal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Edit overlay
  if (editingGoal) {
    return (
      <div className="px-4 py-3 border-t border-[#E5E1D8] bg-[#0D7377]/[0.02] space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#2C2C2C]">Edit goal before adding</p>
          <button onClick={() => setEditingGoal(null)} className="text-[#8B8B8B] hover:text-[#2C2C2C]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#8B8B8B]">Customize the wording (e.g., replace "client" with the child's name, adjust frequency)</p>
        <Textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={3}
          className="text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditingGoal(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirmEdit} disabled={!editText.trim()} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </Button>
        </div>
      </div>
    );
  }

  // Initial choice screen
  if (mode === 'choose') {
    return (
      <div className="px-4 py-3 border-t border-[#E5E1D8] bg-[#0D7377]/[0.02] space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#2C2C2C]">Add goal to <span className="font-bold">{categoryName}</span></p>
          <button onClick={onClose} className="text-[#8B8B8B] hover:text-[#2C2C2C]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('bank')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-[#E5E1D8] hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all group"
          >
            <BookOpen className="w-5 h-5 text-[#0D7377] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-[#2C2C2C]">Goal Bank</span>
            <span className="text-[10px] text-[#8B8B8B] text-center">Select from pre-set goals</span>
          </button>
          <button
            onClick={() => setMode('freeform')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-[#E5E1D8] hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all group"
          >
            <PenLine className="w-5 h-5 text-[#0D7377] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-[#2C2C2C]">Write Custom</span>
            <span className="text-[10px] text-[#8B8B8B] text-center">Type your own goal</span>
          </button>
        </div>
      </div>
    );
  }

  // Free-form mode
  if (mode === 'freeform') {
    return (
      <div className="px-4 py-3 border-t border-[#E5E1D8] bg-[#0D7377]/[0.02] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMode('choose')} className="text-[#8B8B8B] hover:text-[#0D7377] text-xs flex items-center gap-1">
              ← Back
            </button>
            <p className="text-xs font-medium text-[#2C2C2C]">Custom Goal</p>
          </div>
          <button onClick={onClose} className="text-[#8B8B8B] hover:text-[#2C2C2C]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <Label className="text-xs">Goal Description *</Label>
          <Textarea
            value={freeformText}
            onChange={e => setFreeformText(e.target.value)}
            placeholder="e.g., Client will demonstrate improved..."
            rows={2}
            className="mt-1 text-sm"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs">Target Date (optional)</Label>
          <Input
            type="date"
            value={freeformDate}
            onChange={e => setFreeformDate(e.target.value)}
            className="mt-1 w-48 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleFreeformSubmit} disabled={!freeformText.trim()} className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </Button>
        </div>
      </div>
    );
  }

  // Goal Bank browser mode
  return (
    <div className="px-4 py-3 border-t border-[#E5E1D8] bg-[#0D7377]/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('choose')} className="text-[#8B8B8B] hover:text-[#0D7377] text-xs flex items-center gap-1">
            ← Back
          </button>
          <p className="text-xs font-medium text-[#2C2C2C]">Goal Bank</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Spanish toggle */}
          <button
            onClick={() => setShowSpanish(!showSpanish)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              showSpanish
                ? 'bg-[#0D7377] text-white'
                : 'bg-[#E5E1D8]/50 text-[#8B8B8B] hover:text-[#0D7377] hover:bg-[#0D7377]/10'
            }`}
            title="Toggle Spanish for Feeding goals"
          >
            <Globe className="w-3 h-3" />
            ES
          </button>
          <button onClick={onClose} className="text-[#8B8B8B] hover:text-[#2C2C2C]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8B8B]" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={showSpanish ? "Buscar metas (ej: cuchara, masticación)..." : "Search goals (e.g., spoon, chewing, tripod)..."}
          className="pl-8 text-xs h-8"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B8B] hover:text-[#2C2C2C]"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchResults !== null ? (
        <div className="max-h-[350px] overflow-y-auto border border-[#E5E1D8] rounded-lg bg-white">
          {searchResults.length === 0 ? (
            <p className="px-4 py-6 text-xs text-[#8B8B8B] text-center italic">
              {showSpanish ? `No se encontraron metas para "${searchQuery}"` : `No goals match "${searchQuery}"`}
            </p>
          ) : (
            <div>
              <p className="px-3 py-1.5 text-[10px] text-[#8B8B8B] bg-slate-50 border-b border-[#E5E1D8] sticky top-0">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map(({ goal, typeName, categoryName: bankCatName }) =>
                renderGoalRow(goal, typeName, bankCatName, true)
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto border border-[#E5E1D8] rounded-lg bg-white">
          {/* Favorites section */}
          {favoriteGoals.length > 0 && (
            <div className="border-b border-[#E5E1D8]">
              <div className="px-3 py-2 bg-amber-50/50 border-b border-amber-100 flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Favorites</span>
                <span className="text-[10px] text-amber-500 ml-auto">{favoriteGoals.length}</span>
              </div>
              {favoriteGoals.map(({ goal, typeName, categoryName: bankCatName }) =>
                renderGoalRow(goal, typeName, bankCatName, true)
              )}
            </div>
          )}

          {/* Recently Used section */}
          {recentGoals.length > 0 && (
            <div className="border-b border-[#E5E1D8]">
              <div className="px-3 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Recently Used</span>
                <span className="text-[10px] text-blue-400 ml-auto">{recentGoals.length}</span>
              </div>
              {recentGoals.map(({ goal, typeName, categoryName: bankCatName }) =>
                renderGoalRow(goal, typeName, bankCatName, true)
              )}
            </div>
          )}

          {/* Hierarchical browser */}
          {GOAL_BANK.map((type: GoalBankType) => (
            <div key={type.id} className="border-b border-[#E5E1D8] last:border-b-0">
              {/* Type Header */}
              <button
                onClick={() => setExpandedType(expandedType === type.id ? null : type.id)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-bold text-[#0D7377] uppercase tracking-wide">{type.name}</span>
                {expandedType === type.id ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8B8B8B]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#8B8B8B]" />
                )}
              </button>

              {/* Categories within this type */}
              {expandedType === type.id && (
                <div className="border-t border-[#E5E1D8]">
                  {type.categories.map((cat: GoalBankCategory) => (
                    <div key={cat.id} className="border-b border-[#E5E1D8]/50 last:border-b-0">
                      {/* Category Header */}
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-[#0D7377]/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedCategory === cat.id ? (
                            <ChevronDown className="w-3 h-3 text-[#0D7377]" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[#8B8B8B]" />
                          )}
                          <span className="text-xs font-semibold text-[#2C2C2C]">
                            {showSpanish && cat.nameEs ? cat.nameEs : cat.name}
                          </span>
                          {showSpanish && cat.nameEs && (
                            <span className="text-[9px] text-[#8B8B8B] italic">({cat.name})</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8B8B8B]">{cat.goals.length} goals</span>
                      </button>

                      {/* Goals within this category */}
                      {expandedCategory === cat.id && (
                        <div className="bg-[#FAF9F6] border-t border-[#E5E1D8]/50">
                          {cat.goals.map(goal => renderGoalRow(goal, type.name, cat.name, false))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] text-[#8B8B8B]">
          {addedGoalIds.size > 0 && <span className="text-emerald-600 font-medium">{addedGoalIds.size} goal{addedGoalIds.size !== 1 ? 's' : ''} added</span>}
        </p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
