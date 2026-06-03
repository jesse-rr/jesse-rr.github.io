// components/tierlist/tierlist.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleAuthService } from '../../music/services/google-auth.service';
import { DriveService } from '../../music/services/drive.service';
import { HeaderComponent } from '../header/header.component';
import { DriveLoginComponent } from '../../music/components/drive-login/drive-login.component';
import { Tier, TierItem, TierList } from '../../models/tier.model';
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
  autoSaveInterval: any;
  saving: boolean = false;

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

  async ngOnInit() {
    if (this.authService.isAuthenticated) {
      await this.loadTierList();
    }
    this.authService.accessToken$.subscribe(async (token) => {
      if (token) {
        await this.loadTierList();
      }
    });
    this.autoSaveInterval = setInterval(() => {
      if (this.tierList && this.authService.isAuthenticated) {
        this.saveTierList();
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.tierList && this.authService.isAuthenticated) {
      this.saveTierList();
    }
  }

  async loadTierList() {
    try {
      const rootId = await this.driveService.resolveNotesRoot();
      const files = await this.driveService.listFolder(rootId);
      const tierFile = files.find(f => f.name === 'tierlist.json');
      
      if (tierFile) {
        const content = await this.driveService.getMarkdownContent(tierFile.id);
        const savedData = JSON.parse(content);
        this.tierList = savedData;
        this.currentTierListId = tierFile.id;
      } else {
        this.createNewTierList();
      }
    } catch (error) {
      console.error('Failed to load tier list:', error);
      this.createNewTierList();
    }
  }

  createNewTierList() {
    this.tierList = {
      id: uuidv4(),
      name: 'My Tier List',
      tiers: JSON.parse(JSON.stringify(this.defaultTiers)),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.saveTierList();
  }

  async saveTierList() {
    if (!this.tierList || !this.authService.isAuthenticated || this.saving) return;
    
    this.saving = true;
    this.tierList.updatedAt = new Date();
    
    try {
      const content = JSON.stringify(this.tierList, null, 2);
      const rootId = await this.driveService.resolveNotesRoot();
      
      if (this.currentTierListId) {
        await this.driveService.updateMarkdownFile(this.currentTierListId, content);
      } else {
        const newFile = await this.driveService.createMarkdownFile('tierlist.json', rootId, content);
        this.currentTierListId = newFile.id;
      }
    } catch (error) {
      console.error('Failed to save tier list:', error);
    } finally {
      this.saving = false;
    }
  }

  addTier() {
    if (!this.newTierName.trim()) return;
    
    this.tierList?.tiers.push({
      id: uuidv4(),
      name: this.newTierName,
      color: '#888888',
      items: []
    });
    this.newTierName = '';
    this.saveTierList();
  }

  deleteTier(tierId: string) {
    if (!this.tierList) return;
    this.tierList.tiers = this.tierList.tiers.filter(t => t.id !== tierId);
    this.saveTierList();
  }

  startEditTier(tier: Tier) {
    this.editingTierId = tier.id;
    this.editingTierName = tier.name;
  }

  saveTierEdit(tier: Tier) {
    if (this.editingTierName.trim()) {
      tier.name = this.editingTierName;
    }
    this.editingTierId = null;
    this.editingTierName = '';
    this.saveTierList();
  }

  cancelTierEdit() {
    this.editingTierId = null;
    this.editingTierName = '';
  }

  updateTierColor(tier: Tier, event: Event) {
    const input = event.target as HTMLInputElement;
    tier.color = input.value;
    this.saveTierList();
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
    this.saveTierList();
  }

  deleteItem(tierId: string, itemId: string) {
    const tier = this.tierList?.tiers.find(t => t.id === tierId);
    if (tier) {
      tier.items = tier.items.filter(i => i.id !== itemId);
      this.saveTierList();
    }
  }

  startEditItem(item: TierItem) {
    this.editingItemId = item.id;
    this.editingItemText = item.text;
  }

  saveItemEdit(item: TierItem) {
    if (this.editingItemText.trim()) {
      item.text = this.editingItemText;
    }
    this.editingItemId = null;
    this.editingItemText = '';
    this.saveTierList();
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
    
    if (sourceTier && targetTier) {
      const itemIndex = sourceTier.items.findIndex(i => i.id === this.draggedItem!.id);
      if (itemIndex !== -1) {
        const [movedItem] = sourceTier.items.splice(itemIndex, 1);
        movedItem.tierId = targetTierId;
        targetTier.items.push(movedItem);
        this.saveTierList();
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
      this.saveTierList();
    }
  }

  moveItemDown(tierId: string, itemIndex: number) {
    const tier = this.tierList?.tiers.find(t => t.id === tierId);
    if (tier && itemIndex < tier.items.length - 1) {
      [tier.items[itemIndex], tier.items[itemIndex + 1]] = [tier.items[itemIndex + 1], tier.items[itemIndex]];
      this.saveTierList();
    }
  }

  moveTierUp(index: number) {
    if (!this.tierList || index === 0) return;
    [this.tierList.tiers[index], this.tierList.tiers[index - 1]] = [this.tierList.tiers[index - 1], this.tierList.tiers[index]];
    this.saveTierList();
  }

  moveTierDown(index: number) {
    if (!this.tierList || index === this.tierList.tiers.length - 1) return;
    [this.tierList.tiers[index], this.tierList.tiers[index + 1]] = [this.tierList.tiers[index + 1], this.tierList.tiers[index]];
    this.saveTierList();
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

  resetToDefault() {
    if (confirm('Reset all tiers and items to default?')) {
      this.tierList!.tiers = JSON.parse(JSON.stringify(this.defaultTiers));
      this.saveTierList();
    }
  }
}