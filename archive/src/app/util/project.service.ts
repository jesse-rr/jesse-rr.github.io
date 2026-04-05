import { Injectable } from '@angular/core';
import { Entry, EntryCategory } from '../models/entry.model';

@Injectable({ providedIn: 'root' })
export class EntryService {
    private entries: Entry[] = [
        {
            id: '1',
            title: 'Portfolio Website',
            category: 'Project',
            tags: ['Web'],
            route: '/entry/1'
        },
        {
            id: '2',
            title: 'Game Engine',
            category: 'Project',
            tags: ['Games'],
            route: '/entry/2'
        },
        {
            id: '3',
            title: 'Mobile App',
            category: 'Idea',
            tags: ['Mobile'],
            route: '/entry/3'
        },
        {
            id: '4',
            title: 'API Gateway Service',
            category: 'Project',
            tags: ['Backend'],
            route: '/entry/4'
        },
        {
            id: '5',
            title: 'Data Visualizer',
            category: 'Idea',
            tags: ['Web', 'Data'],
            route: '/entry/5'
        },
        {
            id: '6',
            title: 'CLI Toolchain',
            category: 'Undefined',
            tags: ['Tools'],
            route: '/entry/6'
        },
        {
            id: '7',
            title: 'Design System',
            category: 'Idea',
            tags: ['Web'],
            route: '/entry/7'
        },
        {
            id: '8',
            title: 'ML Pipeline',
            category: 'Undefined',
            tags: ['Data'],
            route: '/entry/8'
        },
    ];

    getAll(): Entry[] {
        return this.entries;
    }

    getCategories(): EntryCategory[] {
        return ['Project', 'Idea', 'Undefined'];
    }
}
