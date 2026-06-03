import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleAuthService } from '../../music/services/google-auth.service';
import { DriveService } from '../../music/services/drive.service';
import { HeaderComponent } from '../header/header.component';
import { DriveLoginComponent } from '../../music/components/drive-login/drive-login.component';
import { Tier, TierItem, TierList } from '../../models/tier.model';
import { DriveFile } from '../../music/models/drive.model';
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

  // Multi list & manual save properties
  tierLists: DriveFile[] = [];
  hasUnsavedChanges: boolean = false;

  // Custom modal states
  showCreateModal: boolean = false;
  newListName: string = '';

  showRenameModal: boolean = false;
  renameListName: string = '';
  listToRename: DriveFile | null = null;

  showDeleteModal: boolean = false;
  listToDelete: DriveFile | null = null;

  showResetModal: boolean = false;

  showDeleteTierModal: boolean = false;
  tierIdToDelete: string = '';

  showUnsavedModal: boolean = false;
  pendingListToSelect: DriveFile | null = null;
  pendingCreateAction: boolean = false;

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
      // Attempt background save on component teardown
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
      console.error('Failed to list tier lists:', error);
    }
  }

  async selectTierList(file: DriveFile) {
    if (file.id === this.currentTierListId) return;

    if (this.hasUnsavedChanges) {
      this.pendingListToSelect = file;
      this.pendingCreateAction = false;
      this.showUnsavedModal = true;
      return;
    }

    try {
      const content = await this.driveService.getMarkdownContent(file.id);
      this.tierList = JSON.parse(content);
      this.currentTierListId = file.id;
      this.hasUnsavedChanges = false;
    } catch (error) {
      console.error('Failed to load selected tier list:', error);
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
      console.error('Failed to save tier list:', error);
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
      console.error('Failed to save default tier list:', error);
    } finally {
      this.saving = false;
    }
  }

  // Modals management
  openCreateModal() {
    if (this.hasUnsavedChanges) {
      this.pendingListToSelect = null;
      this.pendingCreateAction = true;
      this.showUnsavedModal = true;
      return;
    }
    this.newListName = '';
    this.showCreateModal = true;
  }

  confirmCreate() {
    if (!this.newListName.trim()) return;
    this.createNewTierList(this.newListName.trim());
    this.showCreateModal = false;
  }

  openRenameModal(file: DriveFile) {
    this.listToRename = file;
    this.renameListName = file.name.replace('.json', '');
    this.showRenameModal = true;
  }

  async renameTierList() {
    if (!this.renameListName.trim() || !this.listToRename) return;
    try {
      const newFileName = `${this.renameListName.trim()}.json`;
      await this.driveService.rename(this.listToRename.id, newFileName);
      
      if (this.currentTierListId === this.listToRename.id && this.tierList) {
        this.tierList.name = this.renameListName.trim();
      }
      
      this.showRenameModal = false;
      this.listToRename = null;
      await this.loadAllTierLists();
    } catch (error) {
      console.error('Failed to rename tier list:', error);
    }
  }

  openDeleteConfirmModal(file: DriveFile) {
    this.listToDelete = file;
    this.showDeleteModal = true;
  }

  async deleteTierList() {
    if (!this.listToDelete) return;
    try {
      await this.driveService.delete(this.listToDelete.id);
      
      if (this.currentTierListId === this.listToDelete.id) {
        this.tierList = null;
        this.currentTierListId = '';
        this.hasUnsavedChanges = false;
      }
      
      this.showDeleteModal = false;
      this.listToDelete = null;
      await this.loadAllTierLists();

      if (!this.currentTierListId) {
        if (this.tierLists.length > 0) {
          await this.selectTierList(this.tierLists[0]);
        } else {
          await this.createNewTierList('My Tier List');
        }
      }
    } catch (error) {
      console.error('Failed to delete tier list:', error);
    }
  }

  openResetModal() {
    this.showResetModal = true;
  }

  confirmReset() {
    if (this.tierList) {
      this.tierList.tiers = JSON.parse(JSON.stringify(this.defaultTiers));
      this.hasUnsavedChanges = true;
    }
    this.showResetModal = false;
  }

  openDeleteTierModal(tierId: string) {
    this.tierIdToDelete = tierId;
    this.showDeleteTierModal = true;
  }

  confirmDeleteTier() {
    if (!this.tierList || !this.tierIdToDelete) return;
    this.tierList.tiers = this.tierList.tiers.filter(t => t.id !== this.tierIdToDelete);
    this.hasUnsavedChanges = true;
    this.showDeleteTierModal = false;
    this.tierIdToDelete = '';
  }

  async handleUnsavedSave() {
    await this.saveTierList();
    this.showUnsavedModal = false;
    
    if (this.pendingListToSelect) {
      const file = this.pendingListToSelect;
      this.pendingListToSelect = null;
      await this.selectTierList(file);
    } else if (this.pendingCreateAction) {
      this.pendingCreateAction = false;
      this.openCreateModal();
    }
  }

  async handleUnsavedDiscard() {
    this.hasUnsavedChanges = false;
    this.showUnsavedModal = false;

    if (this.pendingListToSelect) {
      const file = this.pendingListToSelect;
      this.pendingListToSelect = null;
      await this.selectTierList(file);
    } else if (this.pendingCreateAction) {
      this.pendingCreateAction = false;
      this.openCreateModal();
    }
  }

  handleUnsavedCancel() {
    this.showUnsavedModal = false;
    this.pendingListToSelect = null;
    this.pendingCreateAction = false;
  }

  // Mutator actions
  addTier() {
    if (!this.newTierName.trim()) return;
    
    this.tierList?.tiers.push({
      id: uuidv4(),
      name: this.newTierName,
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
      tier.name = this.editingTierName;
      this.hasUnsavedChanges = true;
    }
    this.editingTierId = null;
    this.editingTierName = '';
  }

  cancelTierEdit() {
    this.editingTierId = null;
    this.editingTierName = '';
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
      text: this.newItemText,
      imageUrl: this.newItemImageUrl || undefined,
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
      item.text = this.editingItemText;
      this.hasUnsavedChanges = true;
    }
    this.editingItemId = null;
    this.editingItemText = '';
  }

  cancelItemEdit() {
    this.editingItemId = null;
    this.editingItemText = '';
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