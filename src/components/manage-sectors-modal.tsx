'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sector } from '@/types';
import { StorageEngine } from '@/lib/storage';
import { SECTOR_COLORS, SECTOR_ICONS } from '@/lib/constants';
import { getSectorIcon } from '@/components/ui/sector-badge';
import { Plus, Trash2, ArrowUp, ArrowDown, Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManageSectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: Sector[];
  onSectorsChanged: () => void;
}

export function ManageSectorsModal({
  isOpen,
  onClose,
  sectors,
  onSectorsChanged,
}: ManageSectorsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(SECTOR_COLORS[0]!);
  const [editIcon, setEditIcon] = useState(SECTOR_ICONS[0]!);
  const [editDescription, setEditDescription] = useState('');

  // New Sector form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(SECTOR_COLORS[0]!);
  const [newIcon, setNewIcon] = useState(SECTOR_ICONS[0]!);
  const [newDescription, setNewDescription] = useState('');

  // Delete confirmation
  const [deleteCandidate, setDeleteCandidate] = useState<Sector | null>(null);

  const startEdit = (sector: Sector) => {
    setEditingId(sector.id);
    setEditName(sector.name);
    setEditColor(sector.color);
    setEditIcon(sector.icon);
    setEditDescription(sector.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (sector: Sector) => {
    if (!editName.trim()) return;
    StorageEngine.saveSector({
      id: sector.id,
      name: editName.trim(),
      color: editColor,
      icon: editIcon,
      description: editDescription,
    });
    setEditingId(null);
    onSectorsChanged();
  };

  const handleCreateSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    StorageEngine.saveSector({
      name: newName.trim(),
      color: newColor,
      icon: newIcon,
      description: newDescription,
    });
    setNewName('');
    setNewDescription('');
    setIsAdding(false);
    onSectorsChanged();
  };

  const moveSector = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sectors.length) return;

    const ids = sectors.map((s) => s.id);
    const temp = ids[index]!;
    ids[index] = ids[newIdx]!;
    ids[newIdx] = temp;

    StorageEngine.reorderSectors(ids);
    onSectorsChanged();
  };

  const confirmDelete = () => {
    if (deleteCandidate) {
      StorageEngine.deleteSector(deleteCandidate.id);
      setDeleteCandidate(null);
      onSectorsChanged();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Learning Sectors"
        description="Organize, rename, recolor, and configure your second brain knowledge domains"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Sectors List */}
          <div className="space-y-3">
            {sectors.map((sec, index) => {
              const isEditing = editingId === sec.id;
              const IconComp = getSectorIcon(sec.icon);

              return (
                <div
                  key={sec.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all',
                    isEditing
                      ? 'border-[#6658F5] bg-[#F6F8FC]'
                      : 'border-[#E6EAF2] bg-white hover:border-[#CBD5E1]'
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Sector Name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <Input
                          label="Description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>

                      {/* Color Palette Selector */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#718096] mb-2">
                          Accent Color
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SECTOR_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={cn(
                                'w-7 h-7 rounded-full border-2 transition-transform cursor-pointer',
                                editColor === c ? 'scale-110 border-[#17243D]' : 'border-transparent'
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Icon Selector */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#718096] mb-2">
                          Sector Icon
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-[#E6EAF2]">
                          {SECTOR_ICONS.map((iconName) => {
                            const Ico = getSectorIcon(iconName);
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => setEditIcon(iconName)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors cursor-pointer',
                                  editIcon === iconName
                                    ? 'bg-[#6658F5]/15 text-[#6658F5]'
                                    : 'text-[#718096] hover:bg-[#F6F8FC]'
                                )}
                              >
                                <Ico className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EAF2]">
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => saveEdit(sec)}>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${sec.color}18`,
                            color: sec.color,
                          }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#17243D]">{sec.name}</h4>
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sec.color }}
                            />
                          </div>
                          {sec.description && (
                            <p className="text-xs text-[#718096] line-clamp-1">{sec.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => moveSector(index, 'up')}
                          className="p-1.5 text-[#718096] hover:text-[#17243D] disabled:opacity-30 rounded-lg hover:bg-[#F0F2FA] cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === sectors.length - 1}
                          onClick={() => moveSector(index, 'down')}
                          className="p-1.5 text-[#718096] hover:text-[#17243D] disabled:opacity-30 rounded-lg hover:bg-[#F0F2FA] cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEdit(sec)}
                          className="p-1.5 text-[#718096] hover:text-[#6658F5] rounded-lg hover:bg-[#6658F5]/10 cursor-pointer"
                          title="Edit Sector"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(sec)}
                          className="p-1.5 text-[#718096] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Delete Sector"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Sector Form or Trigger */}
          {isAdding ? (
            <form onSubmit={handleCreateSector} className="p-4 bg-[#F6F8FC] border border-[#E6EAF2] rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-[#17243D]">Create New Sector</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Sector Name"
                  placeholder="e.g. Health & Fitness"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="Description"
                  placeholder="Nutrition, endurance, workout logs"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#718096] mb-2">
                  Accent Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer',
                        newColor === c ? 'scale-110 border-[#17243D]' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#718096] mb-2">
                  Sector Icon
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-[#E6EAF2]">
                  {SECTOR_ICONS.map((iconName) => {
                    const Ico = getSectorIcon(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setNewIcon(iconName)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors cursor-pointer',
                          newIcon === iconName ? 'bg-[#6658F5]/15 text-[#6658F5]' : 'text-[#718096] hover:bg-[#F6F8FC]'
                        )}
                      >
                        <Ico className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EAF2]">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Sector
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full border-dashed border-[#CBD5E1] hover:border-[#6658F5] text-[#6658F5]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Sector</span>
            </Button>
          )}
        </div>
      </Modal>

      {/* Explicit Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Sector Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-900">
                Are you sure you want to delete &ldquo;{deleteCandidate?.name}&rdquo;?
              </p>
              <p className="text-xs text-rose-700 mt-1">
                This action is permanent. Notes and tasks associated with this sector will remain archived in your vault.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteCandidate(null)}>
              Keep Sector
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Yes, Delete Sector
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
