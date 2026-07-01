import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { DriveService } from '../../core/services/drive.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { DriveLoginComponent } from '../../shared/components/drive-login/drive-login.component';
import { Tier, TierItem, TierList } from './tierlist.model';
import { DriveFile } from '../../shared/models/drive.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-tierlist',
  imports: [CommonModule, FormsModule, HeaderComponent, DriveLoginComponent],
  templateUrl: './tierlist.component.html',
  styleUrl: './tierlist.component.scss'
})
export class TierlistComponent implements OnInit, OnDestroy {
  tierList: TierList | null = null;
  currentTierListId: string = '';
  newTierName: string = '';
  newItemText: string = '';
  newItemImageUrl: string = '';
  showImageInput: boolean = false;
  editingTierId: string | null = null;
  editingTierName: string = '';
  editingItemId: string | null = null;
  editingItemText: string = '';
  draggedItem: TierItem | null = null;
  dragOverTierId: string | null = null;
  saving: boolean = false;

  tierLists: DriveFile[] = [];
  hasUnsavedChanges: boolean = false;

  defaultTiers: Tier[] = [
    { id: uuidv4(), name: 'S', color: '#ff7f7f', items: [] },
    { id: uuidv4(), name: 'A', color: '#ffbf7f', items: [] },
    { id: uuidv4(), name: 'B', color: '#ffff7f', items: [] },
    { id: uuidv4(), name: 'C', color: '#bfff7f', items: [] },
    { id: uuidv4(), name: 'D', color: '#7fff7f', items: [] }
  ];

  constructor(
    public authService: GoogleAuthService,
    private driveService: DriveService
  ) {}

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return event.returnValue;
    }
    return true;
  }

  async ngOnInit() {
    if (this.authService.isAuthenticated) {
      await this.initModule();
    }
    this.authService.accessToken$.subscribe(async (token) => {
      if (token) {
        await this.initModule();
      }
    });
  }

  ngOnDestroy() {
    if (this.hasUnsavedChanges && this.tierList && this.authService.isAuthenticated) {
      this.saveTierList();
    }
  }

  async initModule() {
    await this.loadAllTierLists();
    if (this.tierLists.length > 0) {
      await this.selectTierList(this.tierLists[0]);
    } else {
      await this.createNewTierList('My Tier List');
    }
  }

  async loadAllTierLists() {
    try {
      const folderId = await this.driveService.resolveTierListsRoot();
      const files = await this.driveService.listFolder(folderId);
      this.tierLists = files.filter(f => f.name.endsWith('.json'));
    } catch (error) {
      console.error(error);
    }
  }

  async selectTierList(file: DriveFile) {
    if (file.id === this.currentTierListId) return;

    if (this.hasUnsavedChanges) {
      const ok = confirm('You have unsaved changes. Save before switching?');
      if (ok) {
        await this.saveTierList();
      }
    }

    try {
      const content = await this.driveService.getMarkdownContent(file.id);
      this.tierList = JSON.parse(content);
      this.currentTierListId = file.id;
      this.hasUnsavedChanges = false;
    } catch (error) {
      console.error(error);
    }
  }

  async createNewTierList(name: string) {
    const list: TierList = {
      id: uuidv4(),
      name: name,
      tiers: JSON.parse(JSON.stringify(this.defaultTiers)),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tierList = list;
    this.currentTierListId = '';
    
    await this.saveTierListImmediate(list);
    await this.loadAllTierLists();

    const found = this.tierLists.find(f => f.name === `${name}.json`);
    if (found) {
      this.currentTierListId = found.id;
    }
    this.hasUnsavedChanges = false;
  }

  async saveTierList() {
    if (!this.tierList || !this.authService.isAuthenticated || this.saving) return;
    
    this.saving = true;
    this.tierList.updatedAt = new Date();
    
    try {
      const content = JSON.stringify(this.tierList, null, 2);
      const rootId = await this.driveService.resolveTierListsRoot();
      const fileName = `${this.tierList.name}.json`;
      
      if (this.currentTierListId) {
        await this.driveService.updateMarkdownFile(this.currentTierListId, content);
      } else {
        const newFile = await this.driveService.createMarkdownFile(fileName, rootId, content);
        this.currentTierListId = newFile.id;
      }
      this.hasUnsavedChanges = false;
      await this.loadAllTierLists();
    } catch (error) {
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  private async saveTierListImmediate(list: TierList) {
    this.saving = true;
    try {
      const content = JSON.stringify(list, null, 2);
      const rootId = await this.driveService.resolveTierListsRoot();
      const fileName = `${list.name}.json`;
      const newFile = await this.driveService.createMarkdownFile(fileName, rootId, content);
      this.currentTierListId = newFile.id;
    } catch (error) {
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  openCreateDialog() {
    const name = prompt('Enter name for the new tier list:');
    if (name && name.trim()) {
      this.createNewTierList(name.trim());
    }
  }

  openRenameDialog(file: DriveFile) {
    const oldName = file.name.replace('.json', '');
    const name = prompt('Rename tier list:', oldName);
    if (name && name.trim() && name.trim() !== oldName) {
      this.renameList(file, name.trim());
    }
  }

  async renameList(file: DriveFile, newName: string) {
    try {
      const newFileName = `${newName}.json`;
      await this.driveService.rename(file.id, newFileName);
      if (this.currentTierListId === file.id && this.tierList) {
        this.tierList.name = newName;
      }
      await this.loadAllTierLists();
    } catch (error) {
      console.error(error);
    }
  }

  async deleteList(file: DriveFile) {
    const ok = confirm(`Are you sure you want to delete "${file.name.replace('.json', '')}"?`);
    if (!ok) return;

    try {
      await this.driveService.delete(file.id);
      if (this.currentTierListId === file.id) {
        this.tierList = null;
        this.currentTierListId = '';
        this.hasUnsavedChanges = false;
      }
      await this.loadAllTierLists();
      if (!this.currentTierListId) {
        if (this.tierLists.length > 0) {
          await this.selectTierList(this.tierLists[0]);
        } else {
          await this.createNewTierList('My Tier List');
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  confirmReset() {
    const ok = confirm('Reset this tier list? All items will be cleared.');
    if (!ok) return;

    if (this.tierList) {
      this.tierList.tiers = JSON.parse(JSON.stringify(this.defaultTiers));
      this.hasUnsavedChanges = true;
    }
  }

  confirmDeleteTier(tierId: string) {
    const ok = confirm('Delete this tier?');
    if (!ok) return;

    if (this.tierList) {
      this.tierList.tiers = this.tierList.tiers.filter(t => t.id !== tierId);
      this.hasUnsavedChanges = true;
    }
  }

  addTier() {
    if (!this.newTierName.trim()) return;
    this.tierList?.tiers.push({
      id: uuidv4(),
      name: this.newTierName.trim(),
      color: '#888888',
      items: []
    });
    this.newTierName = '';
    this.hasUnsavedChanges = true;
  }

  startEditTier(tier: Tier) {
    this.editingTierId = tier.id;
    this.editingTierName = tier.name;
  }

  saveTierEdit(tier: Tier) {
    if (this.editingTierName.trim() && tier.name !== this.editingTierName) {
      tier.name = this.editingTierName.trim();
      this.hasUnsavedChanges = true;
    }
    this.editingTierId = null;
  }

  cancelTierEdit() {
    this.editingTierId = null;
  }

  updateTierColor(tier: Tier, event: Event) {
    const input = event.target as HTMLInputElement;
    if (tier.color !== input.value) {
      tier.color = input.value;
      this.hasUnsavedChanges = true;
    }
  }

  addItem() {
    if (!this.newItemText.trim()) return;
    if (!this.tierList || this.tierList.tiers.length === 0) return;
    
    const firstTier = this.tierList.tiers[0];
    const newItem: TierItem = {
      id: uuidv4(),
      text: this.newItemText.trim(),
      imageUrl: this.newItemImageUrl.trim() || undefined,
      tierId: firstTier.id
    };
    
    firstTier.items.push(newItem);
    this.newItemText = '';
    this.newItemImageUrl = '';
    this.showImageInput = false;
    this.hasUnsavedChanges = true;
  }

  deleteItem(tierId: string, itemId: string) {
    const tier = this.tierList?.tiers.find(t => t.id === tierId);
    if (tier) {
      tier.items = tier.items.filter(i => i.id !== itemId);
      this.hasUnsavedChanges = true;
    }
  }

  startEditItem(item: TierItem) {
    this.editingItemId = item.id;
    this.editingItemText = item.text;
  }

  saveItemEdit(item: TierItem) {
    if (this.editingItemText.trim() && item.text !== this.editingItemText) {
      item.text = this.editingItemText.trim();
      this.hasUnsavedChanges = true;
    }
    this.editingItemId = null;
  }

  cancelItemEdit() {
    this.editingItemId = null;
  }

  onDragStart(item: TierItem) {
    this.draggedItem = item;
  }

  onDragOver(event: DragEvent, tierId: string) {
    event.preventDefault();
    this.dragOverTierId = tierId;
  }

  onDrop(event: DragEvent, targetTierId: string) {
    event.preventDefault();
    if (!this.draggedItem || !this.tierList) return;
    
    const sourceTier = this.tierList.tiers.find(t => t.id === this.draggedItem!.tierId);
    const targetTier = this.tierList.tiers.find(t => t.id === targetTierId);
    
    if (sourceTier && targetTier && sourceTier.id !== targetTier.id) {
      const itemIndex = sourceTier.items.findIndex(i => i.id === this.draggedItem!.id);
      if (itemIndex !== -1) {
        const [movedItem] = sourceTier.items.splice(itemIndex, 1);
        movedItem.tierId = targetTierId;
        targetTier.items.push(movedItem);
        this.hasUnsavedChanges = true;
      }
    }
    this.draggedItem = null;
    this.dragOverTierId = null;
  }

  onDragEnd() {
    this.draggedItem = null;
    this.dragOverTierId = null;
  }

  moveItemUp(tierId: string, itemIndex: number) {
    const tier = this.tierList?.tiers.find(t => t.id === tierId);
    if (tier && itemIndex > 0) {
      [tier.items[itemIndex], tier.items[itemIndex - 1]] = [tier.items[itemIndex - 1], tier.items[itemIndex]];
      this.hasUnsavedChanges = true;
    }
  }

  moveItemDown(tierId: string, itemIndex: number) {
    const tier = this.tierList?.tiers.find(t => t.id === tierId);
    if (tier && itemIndex < tier.items.length - 1) {
      [tier.items[itemIndex], tier.items[itemIndex + 1]] = [tier.items[itemIndex + 1], tier.items[itemIndex]];
      this.hasUnsavedChanges = true;
    }
  }

  moveTierUp(index: number) {
    if (!this.tierList || index === 0) return;
    [this.tierList.tiers[index], this.tierList.tiers[index - 1]] = [this.tierList.tiers[index - 1], this.tierList.tiers[index]];
    this.hasUnsavedChanges = true;
  }

  moveTierDown(index: number) {
    if (!this.tierList || index === this.tierList.tiers.length - 1) return;
    [this.tierList.tiers[index], this.tierList.tiers[index + 1]] = [this.tierList.tiers[index + 1], this.tierList.tiers[index]];
    this.hasUnsavedChanges = true;
  }

  exportAsJSON() {
    if (!this.tierList) return;
    const dataStr = JSON.stringify(this.tierList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.tierList.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}